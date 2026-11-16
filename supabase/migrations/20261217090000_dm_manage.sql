-- DM yönetimi (docs/SPEC_V4.md §4.X; docs/decisions/yeni-tuval.md → ürün kararları c, d, e):
-- pinning, archiving and clearing a conversation, and editing one's own message.
--
-- Pin, archive and clear belong to the account (one dm_thread_prefs row per member and thread);
-- the other member never sees them: no answer, page or Realtime payload carries the other member's
-- row. Clearing is "everything up to the newest message I saw is hidden from me": the clearer's
-- inbox drops the
-- conversation until a newer message comes, the page and the quotes stop at the mark, and only
-- messages after it count as unread. Nothing is deleted; the other side, the friendship and the
-- reports stay as they are (a DM report keeps its own copy of the messages, dm_snapshot).
--
-- Editing: one's own message, within the window the dm function passes (15 minutes, by the server's
-- clock); the old text is not kept; edited_at marks it. No push.
--
-- dm_send now writes each message's time under the thread's lock, later than the one before, so no
-- send can land under a clear mark it was not part of. The edit limit (dm_edit_rate) is asked in
-- its own call, written alone.
--
-- Lock order (rule 10): dm_thread_prefs comes after dm_reads: dm_threads → dm_messages →
-- dm_reactions, dm_reads, dm_thread_prefs. A pin, archive or clear holds the thread `for key share`
-- (the foreign key's own lock), then the caller's pin lock (an advisory lock per account, so two
-- pins at once count each other), then its own dm_thread_prefs row; nothing else. An edit locks
-- the thread, then the message (as dm_react). Ending a friendship deletes the thread, its prefs
-- with it (cascade).

-- Table (rule 2: RLS on, policy in the same migration) ---------------------------------------------
create table public.dm_thread_prefs (
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pinned_at timestamptz,
  archived_at timestamptz,
  -- Messages at or before this moment are hidden from this member.
  cleared_at timestamptz,
  primary key (thread_id, user_id),
  -- An archived conversation is never pinned (archiving takes the pin off).
  check (pinned_at is null or archived_at is null)
);
create index dm_thread_prefs_user_idx on public.dm_thread_prefs (user_id) where pinned_at is not null;

alter table public.dm_thread_prefs enable row level security;
revoke all on table public.dm_thread_prefs from anon, authenticated;
-- Each account reads its own rows only; writes go through the dm function (rule 1).
grant select on table public.dm_thread_prefs to authenticated;
create policy "dm_thread_prefs: own rows"
  on public.dm_thread_prefs for select to authenticated
  using (user_id = (select auth.uid()));

alter table public.dm_messages add column edited_at timestamptz;

-- Helpers (private) -------------------------------------------------------------------------------
-- The viewer's clear mark of a thread; -infinity when nothing is cleared.
create function private.dm_cleared_at(target_thread_id uuid, viewer uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select cleared_at from public.dm_thread_prefs
     where thread_id = target_thread_id and user_id = viewer),
    '-infinity'::timestamptz
  );
$$;

revoke all on function private.dm_cleared_at(uuid, uuid) from public, anon, authenticated;

-- A quote the reader cleared away is gone for that reader, like a deleted one.
create or replace function private.dm_quote(viewer uuid, m public.dm_messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null or q.created_at <= private.dm_cleared_at(m.thread_id, viewer)
      then jsonb_build_object('gone', true)
    else jsonb_build_object('id', q.id, 'body', left(q.body, 80), 'from_me', q.sender_user_id = viewer)
  end
  from (select 1) one
  left join public.dm_messages q on q.id = m.reply_to_id and q.thread_id = m.thread_id;
$$;

-- Pin, archive, clear (service role) --------------------------------------------------------------
-- change: pin | unpin | archive | unarchive | clear. Each is idempotent: the same change twice
-- leaves the same row. pin keeps an existing pin's time; a sixth pin answers pin_limit and an
-- archived conversation thread_archived. archive takes the pin off. clear takes the pin and the
-- archive off and moves the mark up to up_to, the newest message the caller saw (not_found when it
-- is not of this conversation), or to -infinity when it saw none; never back, and never past what
-- the caller saw: a message that came meanwhile, or between a call and its repeat, stays visible.
create function public.dm_thread_pref(
  target_user_id uuid,
  target_thread_id uuid,
  change text,
  max_pins integer,
  up_to uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.dm_threads;
  p public.dm_thread_prefs;
  mark timestamptz := '-infinity';
begin
  select * into t from public.dm_threads
  where id = target_thread_id and target_user_id in (user_a, user_b)
  for key share;
  if t.id is null or private.is_blocked_between(t.user_a, t.user_b) then
    raise exception using errcode = 'P0001', message = 'not_friends';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('dm_pins:' || target_user_id::text, 0));
  insert into public.dm_thread_prefs (thread_id, user_id) values (t.id, target_user_id)
  on conflict (thread_id, user_id) do nothing;
  select * into p from public.dm_thread_prefs
  where thread_id = t.id and user_id = target_user_id
  for update;

  if change = 'pin' then
    if p.archived_at is not null then
      raise exception using errcode = 'P0001', message = 'thread_archived';
    end if;
    if p.pinned_at is null then
      if (
        select count(*) from public.dm_thread_prefs
        where user_id = target_user_id and pinned_at is not null
      ) >= max_pins then
        raise exception using errcode = 'P0001', message = 'pin_limit';
      end if;
      update public.dm_thread_prefs set pinned_at = clock_timestamp()
      where thread_id = t.id and user_id = target_user_id;
    end if;
  elsif change = 'unpin' then
    update public.dm_thread_prefs set pinned_at = null
    where thread_id = t.id and user_id = target_user_id and pinned_at is not null;
  elsif change = 'archive' then
    update public.dm_thread_prefs
    set archived_at = coalesce(archived_at, now()), pinned_at = null
    where thread_id = t.id and user_id = target_user_id;
  elsif change = 'unarchive' then
    update public.dm_thread_prefs set archived_at = null
    where thread_id = t.id and user_id = target_user_id and archived_at is not null;
  elsif change = 'clear' then
    if up_to is not null then
      select m.created_at into mark from public.dm_messages m
      where m.id = up_to and m.thread_id = t.id;
      if mark is null then
        raise exception using errcode = 'P0001', message = 'not_found';
      end if;
    end if;
    update public.dm_thread_prefs
    set cleared_at = greatest(cleared_at, mark),
        pinned_at = null,
        archived_at = null
    where thread_id = t.id and user_id = target_user_id;
  else
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
end;
$$;

-- The edit limit (§4.X): per account, window_max edits per window, as reaction_rate. The dm
-- function asks before dm_edit, in its own call (rule 10: written alone, no other lock held).
create table public.dm_edit_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null
);
alter table public.dm_edit_rate enable row level security;
revoke all on table public.dm_edit_rate from anon, authenticated;

create function public.dm_edit_rate_hit(
  target_user_id uuid,
  window_seconds integer,
  window_max integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rate public.dm_edit_rate;
begin
  insert into public.dm_edit_rate (user_id, window_started_at, count)
  values (target_user_id, '-infinity', 0)
  on conflict (user_id) do nothing;
  select * into rate from public.dm_edit_rate where user_id = target_user_id for update;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.dm_edit_rate set window_started_at = now(), count = 1
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.dm_edit_rate set count = count + 1 where user_id = target_user_id;
  end if;
end;
$$;

-- Edit (service role) -----------------------------------------------------------------------------
-- The caller's own message of a conversation it is in, not cleared away from it: the same text again
-- changes nothing (and answers as before, even after the window); a new text within window_ms of
-- the sending replaces the old one, which is not kept, and stamps edited_at. Gone, the other
-- member's or cleared away: not_found; a block between them: not_friends (as dm_send); too late:
-- edit_expired. Returns the thread, the other member, whether it changed, whether it is the
-- thread's newest message (the other member's Mesajlar preview) and edited_at.
create function public.dm_edit(
  target_user_id uuid,
  target_message_id uuid,
  new_body text,
  window_ms integer
)
returns table (
  thread_id uuid,
  other_user_id uuid,
  changed boolean,
  is_last boolean,
  edited_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.dm_messages;
  t public.dm_threads;
  other uuid;
begin
  -- Read unlocked first (rule 10: the thread locks before its messages).
  select * into msg from public.dm_messages where id = target_message_id;
  if msg.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into t from public.dm_threads
  where id = msg.thread_id and target_user_id in (user_a, user_b)
  for update;
  if t.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  other := case when t.user_a = target_user_id then t.user_b else t.user_a end;
  if private.is_blocked_between(target_user_id, other) then
    raise exception using errcode = 'P0001', message = 'not_friends';
  end if;

  select * into msg from public.dm_messages where id = target_message_id for update;
  if msg.id is null
    or msg.sender_user_id <> target_user_id
    or msg.created_at <= private.dm_cleared_at(t.id, target_user_id) then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  if msg.body = new_body then
    return query select t.id, other, false,
      not exists (select 1 from public.dm_messages m
                  where m.thread_id = t.id and m.created_at > msg.created_at),
      msg.edited_at;
    return;
  end if;
  if now() - msg.created_at > make_interval(secs => window_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'edit_expired';
  end if;

  update public.dm_messages set body = new_body, edited_at = now() where id = msg.id;
  return query select t.id, other, true,
    not exists (select 1 from public.dm_messages m
                where m.thread_id = t.id and m.created_at > msg.created_at),
    now();
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.dm_thread_pref(uuid, uuid, text, integer, uuid)',
    'public.dm_edit_rate_hit(uuid, integer, integer)',
    'public.dm_edit(uuid, uuid, text, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

-- A DM report's copy of the last 50 messages, as before plus whether and when each was edited
-- (the text is the one at the report; an earlier text is not kept, §4.X).
create or replace function private.dm_snapshot(target_thread_id uuid, reporter uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'from', case when last50.sender_user_id = reporter then 'reporter' else 'reported' end,
           'body', last50.body,
           'created_at', last50.created_at,
           'edited', last50.edited_at is not null,
           'edited_at', last50.edited_at
         ) order by last50.created_at), '[]'::jsonb)
  from (
    select sender_user_id, body, created_at, edited_at from public.dm_messages
    where thread_id = target_thread_id
    order by created_at desc
    limit 50
  ) last50;
$$;

-- Send and react: a message cleared away from the caller cannot be quoted or reacted to ----------
create or replace function public.dm_send(
  target_user_id uuid,
  target_thread_id uuid,
  new_body text,
  min_interval_ms integer,
  reply_to uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.dm_threads;
  other uuid;
  sent_at timestamptz;
begin
  select * into t from public.dm_threads
  where id = target_thread_id and target_user_id in (user_a, user_b)
  for update;
  if t.id is null then
    raise exception using errcode = 'P0001', message = 'not_friends';
  end if;
  other := case when t.user_a = target_user_id then t.user_b else t.user_a end;
  if private.is_blocked_between(target_user_id, other) then
    raise exception using errcode = 'P0001', message = 'not_friends';
  end if;
  -- Under the thread's lock, each message is later than the one before (docs/SPEC_V4.md §4.X): a
  -- send that began before another, or waited for the lock behind a clear, still lands after
  -- every message a clear mark can name.
  sent_at := greatest(now(), t.last_message_at + interval '1 microsecond');
  if reply_to is not null and not exists (
    select 1 from public.dm_messages
    where id = reply_to and thread_id = t.id
      and created_at > private.dm_cleared_at(t.id, target_user_id)
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;
  if exists (
    select 1 from public.dm_messages
    where sender_user_id = target_user_id
      and created_at > now() - make_interval(secs => min_interval_ms / 1000.0)
  ) then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.dm_messages
    (thread_id, sender_user_id, body, reply_to_id, replied, created_at)
  values (t.id, target_user_id, new_body, reply_to, reply_to is not null, sent_at);
  update public.dm_threads set last_message_at = sent_at where id = t.id;
  insert into public.dm_reads (thread_id, user_id, last_read_at)
  values (t.id, target_user_id, sent_at)
  on conflict (thread_id, user_id) do update
    set last_read_at = greatest(public.dm_reads.last_read_at, excluded.last_read_at);
  return other;
end;
$$;

-- The row dm_send just wrote: the caller's newest in the thread, whose lock this transaction holds.
create or replace function public.dm_send_message(
  target_user_id uuid,
  target_thread_id uuid,
  new_body text,
  min_interval_ms integer,
  reply_to uuid default null
)
returns table (other_user_id uuid, message_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  other uuid;
begin
  other := public.dm_send(target_user_id, target_thread_id, new_body, min_interval_ms, reply_to);
  return query
    select other, m.id, m.created_at
    from public.dm_messages m
    where m.thread_id = target_thread_id
      and m.sender_user_id = target_user_id
    order by m.created_at desc, m.id
    limit 1;
end;
$$;

create or replace function public.dm_react(
  target_user_id uuid,
  target_message_id uuid,
  new_emoji text
)
returns table (thread_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.dm_messages;
  t public.dm_threads;
  before_emoji text;
begin
  select * into msg from public.dm_messages where id = target_message_id;
  if msg.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into t from public.dm_threads
  where id = msg.thread_id and target_user_id in (user_a, user_b)
  for update;
  if t.id is null or private.is_blocked_between(t.user_a, t.user_b)
    or msg.created_at <= private.dm_cleared_at(t.id, target_user_id) then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  select emoji into before_emoji from public.dm_reactions
  where message_id = msg.id and user_id = target_user_id;
  if new_emoji is null then
    delete from public.dm_reactions where message_id = msg.id and user_id = target_user_id;
  else
    insert into public.dm_reactions (message_id, user_id, emoji)
    values (msg.id, target_user_id, new_emoji)
    on conflict (message_id, user_id) do update set emoji = excluded.emoji, created_at = now()
    where public.dm_reactions.emoji <> excluded.emoji;
  end if;
  return query select t.id, before_emoji is distinct from new_emoji;
end;
$$;

-- Mesajlar (service role) -------------------------------------------------------------------------
-- As before, plus the caller's own pinned_at and archived (never the other member's), and the clear
-- mark: only messages after it are the preview and the unread count, and a cleared conversation
-- without a newer message is left out. The dm function puts the pinned first.
drop function public.dm_inbox(uuid);

create function public.dm_inbox(viewer uuid)
returns table (
  thread_id uuid,
  public_id uuid,
  display_name text,
  photo_path text,
  last_body text,
  last_from_me boolean,
  last_message_at timestamptz,
  unread_count integer,
  last_status text,
  pinned_at timestamptz,
  archived boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, p.public_id, p.display_name,
         case when p.photo_hidden_at is null then p.photo_path end,
         left(last.body, 80),
         last.sender_user_id = viewer,
         last.created_at,
         coalesce((
           select count(*)::integer from public.dm_messages m
           left join public.dm_reads r on r.thread_id = t.id and r.user_id = viewer
           where m.thread_id = t.id and m.sender_user_id <> viewer
             and m.created_at > greatest(coalesce(r.last_read_at, '-infinity'),
                                         coalesce(pr.cleared_at, '-infinity'))
         ), 0),
         case when last.sender_user_id = viewer
           then private.dm_status(t.id, viewer, last.created_at)
         end,
         pr.pinned_at,
         pr.archived_at is not null
  from public.friendships f
  join public.profiles p on p.id = case when f.user_a = viewer then f.user_b else f.user_a end
  left join public.dm_threads t on t.user_a = f.user_a and t.user_b = f.user_b
  left join public.dm_thread_prefs pr on pr.thread_id = t.id and pr.user_id = viewer
  left join lateral (
    select m.body, m.sender_user_id, m.created_at from public.dm_messages m
    where m.thread_id = t.id and m.created_at > coalesce(pr.cleared_at, '-infinity')
    order by m.created_at desc
    limit 1
  ) last on true
  where viewer in (f.user_a, f.user_b)
    and not private.is_blocked_between(f.user_a, f.user_b)
    and (pr.cleared_at is null or last.created_at is not null)
  order by coalesce(last.created_at, f.created_at) desc;
$$;

revoke all on function public.dm_inbox(uuid) from public, anon, authenticated;
grant execute on function public.dm_inbox(uuid) to service_role;

-- Arkadaşlar: unread and the last message time from after the caller's clear mark only.
create or replace function public.friends_of(viewer uuid)
returns table (
  public_id uuid,
  display_name text,
  photo_path text,
  since timestamptz,
  thread_id uuid,
  last_message_at timestamptz,
  unread boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.public_id, p.display_name,
         case when p.photo_hidden_at is null then p.photo_path end,
         f.created_at, t.id,
         case when t.last_message_at > coalesce(pr.cleared_at, '-infinity')
           then t.last_message_at
         end,
         exists (
           select 1 from public.dm_messages m
           left join public.dm_reads r on r.thread_id = t.id and r.user_id = viewer
           where m.thread_id = t.id and m.sender_user_id <> viewer
             and m.created_at > greatest(coalesce(r.last_read_at, '-infinity'),
                                         coalesce(pr.cleared_at, '-infinity'))
         )
  from public.friendships f
  join public.profiles p on p.id = case when f.user_a = viewer then f.user_b else f.user_a end
  left join public.dm_threads t on t.user_a = f.user_a and t.user_b = f.user_b
  left join public.dm_thread_prefs pr on pr.thread_id = t.id and pr.user_id = viewer
  where viewer in (f.user_a, f.user_b)
    and not private.is_blocked_between(f.user_a, f.user_b)
  order by coalesce(t.last_message_at, f.created_at) desc;
$$;

-- The DM page: as before plus edited_at, and only messages after the caller's clear mark.
drop function public.dm_messages_page(uuid, timestamptz);

create function public.dm_messages_page(target_thread_id uuid, before timestamptz default null)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  from_me boolean,
  status text,
  reply_to jsonb,
  reactions jsonb,
  edited_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.body, m.created_at, m.sender_user_id = (select auth.uid()),
         case when m.sender_user_id = (select auth.uid())
           then private.dm_status(t.id, m.sender_user_id, m.created_at)
         end,
         private.dm_quote((select auth.uid()), m),
         private.dm_reaction_list((select auth.uid()), m.id),
         m.edited_at
  from public.dm_messages m
  join public.dm_threads t on t.id = m.thread_id
  where t.id = target_thread_id
    and (select auth.uid()) in (t.user_a, t.user_b)
    and m.created_at > private.dm_cleared_at(t.id, (select auth.uid()))
    and (before is null or m.created_at < before)
  order by m.created_at desc
  limit 50;
$$;

revoke all on function public.dm_messages_page(uuid, timestamptz) from public, anon;
grant execute on function public.dm_messages_page(uuid, timestamptz) to authenticated;
