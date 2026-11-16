-- Düzenlenen DM'in önceki hâlleri şikayet için saklanır (the owner's call, 16 Kasım;
-- docs/decisions/dm-ilk-hal.md, docs/SPEC_V4.md §4.X).
--
-- Every real edit (a new text) keeps the text it replaced as one version row: version 1 is the
-- first text, version n the text before the n-th edit. A message takes at most five real edits
-- (DM_EDIT_MAX in pure/dmManage.ts; a sixth answers edit_limit), so at most five rows. The same
-- text again is no edit: no row, no count. The window stays 15 minutes from the send
-- (dm_messages.created_at, which no edit changes).
--
-- Nobody reads the versions but a report: private.dm_snapshot copies them, from the server's own
-- rows, into reports.messages_snapshot. No answer, page, push or Realtime payload carries them;
-- the other member sees only the "düzenlendi" mark (edited_at). The table sits in the private
-- schema, which no client reaches; RLS is on with no policy (rule 2): only security definer
-- functions read and write it (rule 1).
--
-- Two lifetimes, each in one place (docs/decisions/dm-ilk-hal.md):
--   a version row: private.dm_versions_keep() (7 days), from saved_at (the edit), hourly job below;
--   a report's copy: 30 days from reports.created_at (the report), private.delete_old_reports.
-- Ending a friendship deletes the thread and its messages, the versions with them (cascade); an
-- account's deletion deletes its messages the same way. A report made before keeps its copy.
--
-- Lock order (rule 10): dm_message_versions comes after dm_messages: dm_threads → dm_messages →
-- dm_message_versions, dm_reactions, dm_reads, dm_thread_prefs. dm_edit writes it after the thread
-- and the message are locked, before the update; the hourly job picks its rows `skip locked`.

-- Table (rule 2: RLS on, no policy) --------------------------------------------------------------
-- The primary key starts with the foreign key's column: it is the foreign key's full index.
create table private.dm_message_versions (
  message_id uuid not null references public.dm_messages (id) on delete cascade,
  version smallint not null check (version between 1 and 5),
  body text not null,
  saved_at timestamptz not null default now(),
  primary key (message_id, version)
);
create index dm_message_versions_saved_at_idx on private.dm_message_versions (saved_at);

alter table private.dm_message_versions enable row level security;
revoke all on table private.dm_message_versions from public, anon, authenticated;

-- How long a version row is kept, from its saved_at. The only place the value is written.
create function private.dm_versions_keep()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '7 days';
$$;
revoke all on function private.dm_versions_keep() from public, anon, authenticated;

-- Edit (service role): as before, plus the replaced text kept and at most five real edits -------
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

revoke all on function public.dm_edit(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.dm_edit(uuid, uuid, text, integer) to service_role;

-- A DM report's copy, from the server's rows: the last 50 messages, and every other message of the
-- conversation that still has versions (an edited message older than the last 50; the report names
-- no message). Each as before, plus its earlier texts (versions: [{version, body, saved_at}], oldest
-- first; [] when never edited). Used by safety_report_dm, friends_remove's report and
-- safety_block_friend.
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
    select m.id from public.dm_messages m
    where m.thread_id = target_thread_id
      and exists (select 1 from private.dm_message_versions v where v.message_id = m.id)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'from', case when m.sender_user_id = reporter then 'reporter' else 'reported' end,
           'body', m.body,
           'created_at', m.created_at,
           'edited', m.edited_at is not null,
           'edited_at', m.edited_at,
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

-- Hourly: version rows older than dm_versions_keep(), from saved_at, a bounded batch, skipping
-- rows an edit holds (rule 10).
create function private.delete_old_dm_versions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from private.dm_message_versions
  where (message_id, version) in (
    select v.message_id, v.version from private.dm_message_versions v
    where v.saved_at <= now() - private.dm_versions_keep()
    order by v.saved_at
    limit 1000
    for update skip locked
  );
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function private.delete_old_dm_versions() from public, anon, authenticated;

select cron.schedule(
  'delete-old-dm-versions',
  '29 * * * *',
  $$select private.delete_old_dm_versions()$$
);
