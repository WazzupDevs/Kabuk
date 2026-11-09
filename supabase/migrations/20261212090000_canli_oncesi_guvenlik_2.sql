-- Canlı öncesi denetim, güvenlik 2 (docs/PROGRESS.md → B2, B3, B4).

-- B2: upload paths ----------------------------------------------------------------------------------
-- A signed upload URL stays valid for two hours after the next one replaced it, so an earlier URL
-- can still put a file at a path the profile no longer names. Every path photo-upload-url and
-- cover-upload-url issues is kept here as { path, at } while its URL may still be used; the next
-- issue names the expired ones that are neither the current file nor a pending upload; the profile
-- function removes their files and then drops them here (profile_upload_forget), so a failed
-- removal keeps them; account deletion and a ban remove all of them (_shared/photos.ts, scripts/admin/photos.ts). At most
-- max_open URLs are open per account (photo and cover together): beyond that, rate_limited.
-- Closed to the client like the photo's path (no column grant); written only through this
-- function (service role, rule 1).
alter table public.profiles add column upload_paths jsonb not null default '[]'::jsonb;

-- Lock order (rule 10): only the account's own profile row (for no key update: rows of many tables
-- reference profiles, and their foreign key checks take key share).
create function public.profile_upload_issue(
  target_user_id uuid,
  upload_kind text,
  new_path text,
  url_seconds integer,
  max_open integer
)
returns table (limited boolean, previous_path text, expired_paths text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  cutoff timestamptz := now() - make_interval(secs => url_seconds);
  open_entries jsonb;
  kept_entries jsonb;
  expired text[];
  previous text;
begin
  if upload_kind not in ('photo', 'cover') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into p from public.profiles where id = target_user_id for no key update;
  if p.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  select coalesce(jsonb_agg(e), '[]'::jsonb) into open_entries
  from jsonb_array_elements(p.upload_paths) e
  where (e ->> 'at')::timestamptz > cutoff;
  if jsonb_array_length(open_entries) >= max_open then
    return query select true, null::text, '{}'::text[];
    return;
  end if;

  -- Kept until profile_upload_forget: the open ones and the expired ones still to be removed.
  select coalesce(jsonb_agg(e), '[]'::jsonb) into kept_entries
  from jsonb_array_elements(p.upload_paths) e
  where (e ->> 'at')::timestamptz > cutoff
    or not (
      (e ->> 'path') = any (array_remove(
        array[p.photo_path, p.cover_path, p.photo_pending_path, p.cover_pending_path],
        null
      ))
    );

  select coalesce(array_agg(e ->> 'path'), '{}') into expired
  from jsonb_array_elements(p.upload_paths) e
  where (e ->> 'at')::timestamptz <= cutoff
    and not (
      (e ->> 'path') = any (array_remove(
        array[p.photo_path, p.cover_path, p.photo_pending_path, p.cover_pending_path],
        null
      ))
    );

  if upload_kind = 'photo' then
    previous := p.photo_pending_path;
    update public.profiles
    set photo_pending_path = new_path,
        upload_paths = kept_entries || jsonb_build_array(jsonb_build_object('path', new_path, 'at', now()))
    where id = target_user_id;
  else
    previous := p.cover_pending_path;
    update public.profiles
    set cover_pending_path = new_path,
        upload_paths = kept_entries || jsonb_build_array(jsonb_build_object('path', new_path, 'at', now()))
    where id = target_user_id;
  end if;
  return query select false, previous, expired;
end;
$$;

-- The expired paths whose files the profile function removed leave the list. Lock order (rule 10):
-- only the account's own profile row.
create function public.profile_upload_forget(target_user_id uuid, gone_paths text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set upload_paths = (
    select coalesce(jsonb_agg(e), '[]'::jsonb)
    from jsonb_array_elements(upload_paths) e
    where not ((e ->> 'path') = any (gone_paths))
  )
  where id = target_user_id;
end;
$$;

-- B3: PostHog person deletion queue --------------------------------------------------------------
-- The account function deletes the PostHog person of a deleted account after the account is gone.
-- The id is written here before the account goes and removed once PostHog confirmed the deletion
-- (or no PostHog key is set); a failed attempt stays and is tried again by the next account
-- deletion, for at most 30 days (delete_old_analytics_deletions; PostHog itself keeps no person
-- longer than its own retention). admin:delete and admin:ban take it off once they deleted the
-- person. Only the random account id: no foreign key (the account no longer exists), nothing
-- else about the person. No client access at all.
-- Lock order (rule 10): written alone, no other lock held.
create table public.analytics_deletions (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.analytics_deletions enable row level security;
revoke all on table public.analytics_deletions from anon, authenticated;

-- Rule 10: a scheduled job picks its rows with skip locked.
create function private.delete_old_analytics_deletions()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.analytics_deletions
  where user_id in (
    select user_id from public.analytics_deletions
    where created_at < now() - interval '30 days'
    for update skip locked
  );
$$;
revoke all on function private.delete_old_analytics_deletions() from public, anon, authenticated;
select cron.schedule(
  'delete-old-analytics-deletions',
  '41 3 * * *',
  $$select private.delete_old_analytics_deletions()$$
);

-- B4: reaction limit for the table chat and DMs --------------------------------------------------
-- The venue and district chats limit reactions (venue_chat_reaction_rate); the table chat and DMs
-- did not, and every changed reaction is a broadcast. One budget per account for both: window_max
-- reactions per window. The edge function asks before chat_react / dm_react, in its own call.
-- Lock order (rule 10): written alone, no other lock held.
create table public.reaction_rate (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  count integer not null
);
alter table public.reaction_rate enable row level security;
revoke all on table public.reaction_rate from anon, authenticated;

create function public.reaction_rate_hit(
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
  rate public.reaction_rate;
begin
  insert into public.reaction_rate (user_id, window_started_at, count)
  values (target_user_id, '-infinity', 0)
  on conflict (user_id) do nothing;
  select * into rate from public.reaction_rate where user_id = target_user_id for update;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.reaction_rate set window_started_at = now(), count = 1
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.reaction_rate set count = count + 1 where user_id = target_user_id;
  end if;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.profile_upload_issue(uuid, text, text, integer, integer)',
    'public.profile_upload_forget(uuid, text[])',
    'public.reaction_rate_hit(uuid, integer, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
