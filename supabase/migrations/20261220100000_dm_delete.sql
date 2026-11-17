-- DM'de mesaj silme (the owner's call, 17 Kasım; docs/decisions/yeni-tuval.md → g,
-- docs/SPEC_V4.md §4.X).
--
-- The sender deletes its own message, for both members, at any time (the edit's 15 minutes do not
-- bind it). The row stays as a trace ("Mesaj silindi"): deleted_at set, body emptied, its reactions
-- gone. The text is kept only for a report: as the message's last version row
-- (private.dm_message_versions), 7 days from the delete (dm_versions_keep, the hourly job), and in
-- a report's own copy (private.dm_snapshot). No page, inbox row, quote, push or Realtime payload
-- carries a deleted message's text: the page answers it with an empty body and `deleted`, so the
-- phone's DM cache drops the text it held.
--
-- A deleted message takes no edit, no reaction and no reply (not_found, reply_unavailable); a
-- quote of it reads as gone. Deleting twice changes nothing and answers the same.
--
-- Lock order (rule 10), as dm_edit: dm_threads → dm_messages → dm_message_versions, dm_reactions.

alter table public.dm_messages add column deleted_at timestamptz;
alter table public.dm_messages drop constraint dm_messages_body_check;
alter table public.dm_messages add constraint dm_messages_body_check check (
  (deleted_at is null and char_length(body) between 1 and 500)
  or (deleted_at is not null and body = '')
);

-- Five edits and the delete: the text a delete removes is the sixth version at most.
alter table private.dm_message_versions drop constraint dm_message_versions_version_check;
alter table private.dm_message_versions
  add constraint dm_message_versions_version_check check (version between 1 and 6);

-- Delete (service role) ---------------------------------------------------------------------------
create function public.dm_delete(target_user_id uuid, target_message_id uuid)
returns table (thread_id uuid, other_user_id uuid, changed boolean, is_last boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.dm_messages;
  t public.dm_threads;
  other uuid;
  done smallint;
  last boolean;
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
  last := not exists (select 1 from public.dm_messages m
                      where m.thread_id = t.id and m.created_at > msg.created_at);
  if msg.deleted_at is not null then
    return query select t.id, other, false, last;
    return;
  end if;

  select coalesce(max(v.version), 0) into done
  from private.dm_message_versions v where v.message_id = msg.id;
  insert into private.dm_message_versions (message_id, version, body)
  values (msg.id, done + 1, msg.body);
  delete from public.dm_reactions where message_id = msg.id;
  update public.dm_messages set body = '', deleted_at = now() where id = msg.id;
  return query select t.id, other, true, last;
end;
$$;

revoke all on function public.dm_delete(uuid, uuid) from public, anon, authenticated;
grant execute on function public.dm_delete(uuid, uuid) to service_role;

-- Edit: as before; a deleted message is not there to edit.
create or replace function public.dm_edit(
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
  done smallint;
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
    or msg.deleted_at is not null
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
  -- From the send: an edit never moves created_at, so it never lengthens the window.
  if now() - msg.created_at > make_interval(secs => window_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'edit_expired';
  end if;
  -- At most five real edits (DM_EDIT_MAX). The rows outlive the window, so the count holds.
  select coalesce(max(v.version), 0) into done
  from private.dm_message_versions v where v.message_id = msg.id;
  if done >= 5 then
    raise exception using errcode = 'P0001', message = 'edit_limit';
  end if;

  insert into private.dm_message_versions (message_id, version, body)
  values (msg.id, done + 1, msg.body);
  update public.dm_messages set body = new_body, edited_at = now() where id = msg.id;
  return query select t.id, other, true,
    not exists (select 1 from public.dm_messages m
                where m.thread_id = t.id and m.created_at > msg.created_at),
    now();
end;
$$;

-- Reaction: as before; none on a deleted message.
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
    or msg.deleted_at is not null
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

-- Send: as before; no reply to a deleted message.
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
    where id = reply_to and thread_id = t.id and deleted_at is null
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

-- A quote of a deleted message is gone, like one the reader cleared away.
create or replace function private.dm_quote(viewer uuid, m public.dm_messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null or q.deleted_at is not null or q.created_at <= private.dm_cleared_at(m.thread_id, viewer)
      then jsonb_build_object('gone', true)
    else jsonb_build_object('id', q.id, 'body', left(q.body, 80), 'from_me', q.sender_user_id = viewer)
  end
  from (select 1) one
  left join public.dm_messages q on q.id = m.reply_to_id and q.thread_id = m.thread_id;
$$;

-- A report's copy: as before, plus whether and when the message was deleted. Its text is in its
-- last version row while that is kept.
create or replace function private.dm_snapshot(target_thread_id uuid, reporter uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with picked as (
    (select m.id from public.dm_messages m
     where m.thread_id = target_thread_id
     order by m.created_at desc
     limit 50)
    union
    (select m.id from public.dm_messages m
     where m.thread_id = target_thread_id
       and exists (select 1 from private.dm_message_versions v where v.message_id = m.id)
     order by m.created_at desc
     limit 200)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'from', case when m.sender_user_id = reporter then 'reporter' else 'reported' end,
           'body', m.body,
           'created_at', m.created_at,
           'edited', m.edited_at is not null,
           'edited_at', m.edited_at,
           'deleted', m.deleted_at is not null,
           'deleted_at', m.deleted_at,
           'versions', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'version', v.version, 'body', v.body, 'saved_at', v.saved_at
                    ) order by v.version)
             from private.dm_message_versions v where v.message_id = m.id
           ), '[]'::jsonb)
         ) order by m.created_at), '[]'::jsonb)
  from picked p
  join public.dm_messages m on m.id = p.id;
$$;

revoke all on function private.dm_snapshot(uuid, uuid) from public, anon, authenticated;

-- Mesajlar: as before, plus whether the last message is a deleted one (its preview is empty).
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
  archived boolean,
  last_deleted boolean
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
         pr.archived_at is not null,
         coalesce(last.deleted_at is not null, false)
  from public.friendships f
  join public.profiles p on p.id = case when f.user_a = viewer then f.user_b else f.user_a end
  left join public.dm_threads t on t.user_a = f.user_a and t.user_b = f.user_b
  left join public.dm_thread_prefs pr on pr.thread_id = t.id and pr.user_id = viewer
  left join lateral (
    select m.body, m.sender_user_id, m.created_at, m.deleted_at from public.dm_messages m
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

-- The DM page: as before, plus `deleted` (the body of a deleted message is empty).
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
  edited_at timestamptz,
  deleted boolean
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
         m.edited_at,
         m.deleted_at is not null
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

-- The hourly job: as before, but the batch is picked once. With the pick inside `in (…)` the
-- planner may run the limited subquery again for each row it checks, and a batch then deletes
-- more than `batch` rows (seen once the version check above was replaced). A materialized CTE is
-- read once, so a batch is at most `batch` rows whatever the plan.
create or replace function private.delete_old_dm_versions(batch integer default 1000, max_batches integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  total integer := 0;
begin
  for i in 1..max_batches loop
    with picked as materialized (
      select v.message_id, v.version from private.dm_message_versions v
      where v.saved_at <= now() - private.dm_versions_keep()
      order by v.saved_at
      limit batch
      for update skip locked
    )
    delete from private.dm_message_versions d
    using picked p
    where d.message_id = p.message_id and d.version = p.version;
    get diagnostics n = row_count;
    total := total + n;
    exit when n < batch;
  end loop;
  return total;
end;
$$;

revoke all on function private.delete_old_dm_versions(integer, integer) from public, anon, authenticated;
