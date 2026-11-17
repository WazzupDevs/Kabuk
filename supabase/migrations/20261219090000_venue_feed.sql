-- Venue feed (docs/SPEC_V4.md §4.Y; the project owner's decision, 17 Kasım,
-- docs/decisions/mekan-akisi.md): next to the tables, a venue has a feed of short posts. Everyone
-- writes with their profile (a profile photo is required, whatever the check-in's identity); a
-- post lives a day; a reply answers a post, never another reply; a like is counted, never named.
-- A post carries no table (rule 4: the feed never ties a person to a table).
--
-- Reads go through venue_feed_page_for and venue_feed_replies_for (service role, read only);
-- writes through the venue-feed Edge Function (service role). Numbers come from
-- pure/venueFeed.ts as parameters.
--
-- Privacy (rules 4, 5 and 9):
-- - Who reads: an account with a live check-in in the feed's scope, which is the venue chat's
--   (private.venue_chat_scope: every campus of a university shares one feed, §4.Q). A row is
--   written under the author's own venue and nothing a reader receives names it.
-- - A post shows its author's display name and photo to those readers; no account id, no
--   public_id, no capsule and no nick leave the server.
-- - Likes: the count and whether the reader liked; never who.
-- - The identities a reader muted are shared with the venue and district chats
--   (venue_chat_mutes, the profiled identity); the muted person never learns of it.
-- - Realtime: a data-free `venue_post` broadcast on the existing venue_chat:{venue_id} topics
--   (every campus of the scope); no new channel kind, the policy is unchanged.
--
-- Lock order (rule 10): table_sessions → venue_post_rate → venue_post_like_rate → venue_posts →
-- venue_post_likes → reports → venue_post_reports. A mute writes venue_chat_mutes alone. The
-- hourly delete picks its rows with skip locked.

-- 1. Tables ---------------------------------------------------------------------------------------
create table public.venue_posts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  -- A reply's post; null for a post. A reply never has replies (venue_feed_post_once).
  parent_id uuid references public.venue_posts (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  -- The app's own id for this post: sent again, it is the same post.
  client_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  hidden_at timestamptz,
  unique (author_user_id, client_id)
);

create index venue_posts_venue_idx on public.venue_posts (venue_id, created_at desc);
create index venue_posts_parent_idx on public.venue_posts (parent_id, created_at desc);
create index venue_posts_session_idx on public.venue_posts (session_id);
create index venue_posts_created_idx on public.venue_posts (created_at);

alter table public.venue_posts enable row level security;
revoke all on table public.venue_posts from anon, authenticated;

create table public.venue_post_likes (
  post_id uuid not null references public.venue_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index venue_post_likes_user_idx on public.venue_post_likes (user_id);

alter table public.venue_post_likes enable row level security;
revoke all on table public.venue_post_likes from anon, authenticated;

create table public.venue_post_reports (
  post_id uuid not null references public.venue_posts (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, reporter_user_id)
);

create index venue_post_reports_reporter_idx on public.venue_post_reports (reporter_user_id);

alter table public.venue_post_reports enable row level security;
revoke all on table public.venue_post_reports from anon, authenticated;

-- Posts and replies of one account.
create table public.venue_post_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null,
  last_sent_at timestamptz not null
);

alter table public.venue_post_rate enable row level security;
revoke all on table public.venue_post_rate from anon, authenticated;

-- Likes and their takebacks of one account.
create table public.venue_post_like_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null
);

alter table public.venue_post_like_rate enable row level security;
revoke all on table public.venue_post_like_rate from anon, authenticated;

-- A report keeps its copy after the post's delete.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
    check (target_type in (
      'room', 'dm', 'profile', 'history', 'venue_chat', 'room_message', 'kibrit_paper',
      'district_chat', 'venue_post'
    )),
  add column venue_post_id uuid references public.venue_posts (id) on delete set null;

create index reports_venue_post_id_idx on public.reports (venue_post_id);

-- 2. Helpers --------------------------------------------------------------------------------------
-- A post or reply the reader may see now: it exists, it was not deleted, the reader has a live
-- check-in in its feed, there is no block either way, and it is not hidden (its author still
-- sees it). A reply is seen only while its post is.
create function private.visible_venue_post(target_user_id uuid, target_post_id uuid)
returns public.venue_posts
language sql
stable
security definer
set search_path = ''
as $$
  select p.* from public.venue_posts p
  left join public.venue_posts parent on parent.id = p.parent_id
  where p.id = target_post_id
    and p.deleted_at is null
    and (private.venue_chat_session(target_user_id, p.venue_id)).id is not null
    and not private.is_blocked_between(target_user_id, p.author_user_id)
    and (p.hidden_at is null or p.author_user_id = target_user_id)
    and (
      p.parent_id is null
      or (
        parent.deleted_at is null
        and not private.is_blocked_between(target_user_id, parent.author_user_id)
        and (parent.hidden_at is null or parent.author_user_id = target_user_id)
      )
    );
$$;

revoke all on function private.visible_venue_post(uuid, uuid) from public, anon, authenticated;

-- A row of a page: as above without the check-in (the page checks it once), and never an
-- identity the reader muted.
create function private.venue_post_listed(target_user_id uuid, p public.venue_posts)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p.deleted_at is null
    and (p.hidden_at is null or p.author_user_id = target_user_id)
    and not private.is_blocked_between(target_user_id, p.author_user_id)
    and not exists (
      select 1 from public.venue_chat_mutes mu
      where mu.user_id = target_user_id and mu.muted_user_id = p.author_user_id and mu.profiled
    );
$$;

revoke all on function private.venue_post_listed(uuid, public.venue_posts)
  from public, anon, authenticated;

-- 3. Write (service role) -------------------------------------------------------------------------
-- The body is trimmed and filtered in the Edge Function (pure/venueFeed.ts, pure/profanity.ts).
create function public.venue_feed_post_once(
  target_user_id uuid,
  target_venue_id uuid,
  new_body text,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  reply_to uuid default null,
  new_client_id uuid default null
)
returns table (post_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  rate public.venue_post_rate;
  prior public.venue_posts;
  parent public.venue_posts;
  p public.profiles;
  made public.venue_posts;
begin
  select * into ts from public.table_sessions s
  where s.user_id = target_user_id and s.venue_id = target_venue_id
    and s.status = 'active' and s.expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;

  -- Sent before (its answer lost): the same post, nothing new. Read after the check-in's lock, so
  -- a send running at the same time has finished.
  if new_client_id is not null then
    select * into prior from public.venue_posts x
    where x.author_user_id = target_user_id and x.client_id = new_client_id;
    if prior.id is not null then
      if prior.session_id <> ts.id or prior.body <> new_body
        or prior.parent_id is distinct from reply_to then
        raise exception using errcode = 'P0001', message = 'client_id_reused';
      end if;
      post_id := prior.id;
      replayed := true;
      return next;
      return;
    end if;
  end if;

  -- Everyone writes with their profile, whatever the check-in's identity.
  select * into p from public.profiles where id = target_user_id;
  if p.display_name is null then
    raise exception using errcode = 'P0001', message = 'onboarding_required';
  end if;
  if not public.has_profile_photo(target_user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;

  -- A reply answers a post of the same feed the writer sees, never another reply.
  if reply_to is not null then
    parent := private.visible_venue_post(target_user_id, reply_to);
    if parent.id is null or parent.parent_id is not null
      or private.venue_chat_scope(parent.venue_id)
        is distinct from private.venue_chat_scope(target_venue_id) then
      raise exception using errcode = 'P0001', message = 'reply_unavailable';
    end if;
  end if;

  insert into public.venue_post_rate (user_id, window_started_at, count, last_sent_at)
  values (target_user_id, '-infinity', 0, '-infinity')
  on conflict (user_id) do nothing;
  select * into rate from public.venue_post_rate r where r.user_id = target_user_id for update;
  if now() - rate.last_sent_at < make_interval(secs => min_interval_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'too_soon';
  end if;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.venue_post_rate r
    set window_started_at = now(), count = 1, last_sent_at = now()
    where r.user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.venue_post_rate r
    set count = r.count + 1, last_sent_at = now()
    where r.user_id = target_user_id;
  end if;

  insert into public.venue_posts
    (venue_id, session_id, author_user_id, parent_id, body, client_id)
  values (target_venue_id, ts.id, target_user_id, reply_to, new_body, new_client_id)
  returning * into made;
  post_id := made.id;
  replayed := false;
  return next;
end;
$$;

-- The author's own post or reply, gone for everyone (a post takes its replies with it: they are
-- no longer listed). The report copies keep it. Returns the venue for the broadcast.
create function public.venue_feed_delete(target_user_id uuid, target_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_venue uuid;
begin
  update public.venue_posts p
  set deleted_at = now()
  where p.id = target_post_id and p.author_user_id = target_user_id and p.deleted_at is null
  returning p.venue_id into deleted_venue;
  if deleted_venue is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  return deleted_venue;
end;
$$;

-- The reader's like on a visible post or reply: set or taken back. The same call again changes
-- nothing. Returns the post's venue and whether anything changed (the broadcast).
create function public.venue_feed_like(
  target_user_id uuid,
  target_post_id uuid,
  liked boolean,
  window_seconds integer,
  window_max integer
)
returns table (post_venue_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  rate public.venue_post_like_rate;
  p public.venue_posts;
  moved integer;
begin
  p := private.visible_venue_post(target_user_id, target_post_id);
  if p.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into ts from public.table_sessions s
  where s.id = (private.venue_chat_session(target_user_id, p.venue_id)).id
    and s.status = 'active' and s.expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;

  insert into public.venue_post_like_rate (user_id, window_started_at, count)
  values (target_user_id, '-infinity', 0)
  on conflict (user_id) do nothing;
  select * into rate from public.venue_post_like_rate r where r.user_id = target_user_id
  for update;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.venue_post_like_rate r
    set window_started_at = now(), count = 1
    where r.user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.venue_post_like_rate r set count = r.count + 1 where r.user_id = target_user_id;
  end if;

  select * into p from public.venue_posts x
  where x.id = target_post_id and x.deleted_at is null
  for key share;
  if p.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  if liked then
    insert into public.venue_post_likes (post_id, user_id)
    values (p.id, target_user_id)
    on conflict do nothing;
  else
    delete from public.venue_post_likes l where l.post_id = p.id and l.user_id = target_user_id;
  end if;
  get diagnostics moved = row_count;
  post_venue_id := p.venue_id;
  changed := moved > 0;
  return next;
end;
$$;

-- The profiled identity of a visible post's author, muted in the feed and in both chats. The
-- muted person never learns of it (rule 5).
create function public.venue_feed_mute(target_user_id uuid, target_post_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.venue_posts;
  mute_id uuid;
begin
  p := private.visible_venue_post(target_user_id, target_post_id);
  if p.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  if p.author_user_id = target_user_id then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  insert into public.venue_chat_mutes (user_id, muted_user_id, profiled, label, look)
  values (
    target_user_id, p.author_user_id, true,
    (select display_name from public.profiles where id = p.author_user_id),
    null
  )
  on conflict (user_id, muted_user_id, profiled) do update set label = public.venue_chat_mutes.label
  returning id into mute_id;
  return mute_id;
end;
$$;

-- A report of a visible post or reply of another. The copy holds the reported text and, for a
-- reply, its post. Returns true when this report hid it (hide_after different reporters).
create function public.safety_report_venue_post(
  target_user_id uuid,
  target_post_id uuid,
  new_reason text,
  hide_after integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  p public.venue_posts;
  snapshot jsonb;
  added integer;
  reporters integer;
begin
  p := private.visible_venue_post(target_user_id, target_post_id);
  if p.id is null or p.author_user_id = target_user_id then
    return false;
  end if;
  select * into ts from public.table_sessions s
  where s.id = (private.venue_chat_session(target_user_id, p.venue_id)).id
  for no key update;
  select * into p from public.venue_posts x
  where x.id = target_post_id and x.deleted_at is null
  for update;
  if p.id is null then
    return false;
  end if;

  select coalesce(jsonb_agg(row order by row ->> 'created_at'), '[]'::jsonb) into snapshot
  from (
    select jsonb_build_object(
      'display_name', pr.display_name,
      'body', x.body,
      'created_at', x.created_at,
      'reported', x.id = p.id
    ) as row
    from public.venue_posts x
    left join public.profiles pr on pr.id = x.author_user_id
    where x.id in (p.id, p.parent_id)
  ) rows;

  insert into public.reports (reporter_id, reported_user_id, reason, target_type, venue_post_id,
                              messages_snapshot)
  values (target_user_id, p.author_user_id, new_reason, 'venue_post', p.id, snapshot);

  insert into public.venue_post_reports (post_id, reporter_user_id)
  values (p.id, target_user_id)
  on conflict do nothing;
  get diagnostics added = row_count;
  if added = 0 or p.hidden_at is not null then
    return false;
  end if;
  select count(*) into reporters from public.venue_post_reports r
  where r.post_id = p.id and r.reporter_user_id <> p.author_user_id;
  if reporters >= hide_after then
    update public.venue_posts x set hidden_at = now() where x.id = p.id;
    return true;
  end if;
  return false;
end;
$$;

-- 4. Read (service role) --------------------------------------------------------------------------
-- One page of posts, newest first. Empty without a live check-in in the feed. The counts are
-- what this reader would see: a reply of a blocked or muted person is not counted.
create function public.venue_feed_page_for(
  target_user_id uuid,
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 30
)
returns table (
  id uuid,
  display_name text,
  photo_path text,
  body text,
  created_at timestamptz,
  from_me boolean,
  likes integer,
  liked boolean,
  replies integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, pr.display_name,
         case when pr.photo_hidden_at is null then pr.photo_path else null end,
         p.body, p.created_at, p.author_user_id = target_user_id,
         (select count(*)::integer from public.venue_post_likes l where l.post_id = p.id),
         exists (
           select 1 from public.venue_post_likes l
           where l.post_id = p.id and l.user_id = target_user_id
         ),
         (select count(*)::integer from public.venue_posts r
          where r.parent_id = p.id and private.venue_post_listed(target_user_id, r))
  from public.venue_posts p
  join public.profiles pr on pr.id = p.author_user_id
  where p.venue_id in (select private.venue_chat_venues(target_venue_id))
    and (private.venue_chat_session(target_user_id, target_venue_id)).id is not null
    and p.parent_id is null
    and (before is null or p.created_at < before)
    and private.venue_post_listed(target_user_id, p)
  order by p.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

-- One page of a visible post's replies, newest first (the app shows them oldest first). Empty
-- when the reader cannot see the post.
create function public.venue_feed_replies_for(
  target_user_id uuid,
  target_post_id uuid,
  before timestamptz default null,
  page_size integer default 30
)
returns table (
  id uuid,
  display_name text,
  photo_path text,
  body text,
  created_at timestamptz,
  from_me boolean,
  likes integer,
  liked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, pr.display_name,
         case when pr.photo_hidden_at is null then pr.photo_path else null end,
         r.body, r.created_at, r.author_user_id = target_user_id,
         (select count(*)::integer from public.venue_post_likes l where l.post_id = r.id),
         exists (
           select 1 from public.venue_post_likes l
           where l.post_id = r.id and l.user_id = target_user_id
         )
  from public.venue_posts r
  join public.profiles pr on pr.id = r.author_user_id
  where r.parent_id = target_post_id
    and (private.visible_venue_post(target_user_id, target_post_id)).id is not null
    and not exists (
      select 1 from public.venue_posts parent
      join public.venue_chat_mutes mu
        on mu.user_id = target_user_id and mu.muted_user_id = parent.author_user_id
        and mu.profiled
      where parent.id = target_post_id
    )
    and (before is null or r.created_at < before)
    and private.venue_post_listed(target_user_id, r)
  order by r.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

-- 5. Posts last a day; the report copies stay (their 30-day job) -----------------------------------
create function private.delete_old_venue_posts(keep_hours integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted integer;
begin
  -- A post takes its replies and the likes with it (cascade); a reply on a younger post goes at
  -- its own age.
  delete from public.venue_posts
  where id in (
    select x.id from public.venue_posts x
    where x.created_at < now() - make_interval(hours => keep_hours)
    for update skip locked
  );
  get diagnostics deleted = row_count;
  delete from public.venue_post_rate
  where last_sent_at < now() - make_interval(hours => keep_hours);
  delete from public.venue_post_like_rate
  where window_started_at < now() - make_interval(hours => keep_hours);
  return deleted;
end;
$$;

revoke all on function private.delete_old_venue_posts(integer) from public, anon, authenticated;

select cron.schedule('delete-old-venue-posts', '19 * * * *', 'select private.delete_old_venue_posts(24)');

-- 6. Grants: service role only ---------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.venue_feed_post_once(uuid, uuid, text, integer, integer, integer, uuid, uuid)',
    'public.venue_feed_delete(uuid, uuid)',
    'public.venue_feed_like(uuid, uuid, boolean, integer, integer)',
    'public.venue_feed_mute(uuid, uuid)',
    'public.safety_report_venue_post(uuid, uuid, text, integer)',
    'public.venue_feed_page_for(uuid, uuid, timestamptz, integer)',
    'public.venue_feed_replies_for(uuid, uuid, timestamptz, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
