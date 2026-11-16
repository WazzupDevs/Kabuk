-- Düzenlenen DM'in ilk hâli şikayet için saklanır (the owner's call, 16 Kasım;
-- docs/decisions/dm-ilk-hal.md, docs/SPEC_V4.md §4.X).
--
-- The first edit of a message keeps the text it replaced: one row per message, never overwritten
-- (later edits keep only the newest text in dm_messages, as before). Nobody reads it but a report:
-- private.dm_snapshot adds it to the copy of an edited message (original_body), and the copy stays
-- in reports.messages_snapshot. No answer, page, push or Realtime payload carries it; the other
-- member sees only the "düzenlendi" mark.
--
-- The table sits in the private schema, which no client reaches; RLS is on with no policy
-- (rule 2): only security definer functions read and write it (rule 1).
--
-- It lives as long as a report does (30 days, delete_old_reports): private.delete_old_dm_originals,
-- hourly. Ending a friendship deletes the thread and its messages, the first texts with them
-- (cascade); an account's deletion deletes its threads the same way. "Çıkar + bildir" and the
-- friend block take the report's copy before the thread goes, in the same transaction.
--
-- Lock order (rule 10): dm_message_originals comes after dm_messages: dm_threads → dm_messages →
-- dm_message_originals, dm_reactions, dm_reads, dm_thread_prefs. dm_edit writes it after the thread
-- and the message are locked, before the update; the hourly job picks its rows `skip locked`.

-- Table (rule 2: RLS on, no policy: only the service role and security definer functions) ---------
create table private.dm_message_originals (
  message_id uuid primary key references public.dm_messages (id) on delete cascade,
  body text not null,
  saved_at timestamptz not null default now()
);
create index dm_message_originals_saved_at_idx on private.dm_message_originals (saved_at);

alter table private.dm_message_originals enable row level security;
revoke all on table private.dm_message_originals from public, anon, authenticated;

-- Edit (service role): as before, plus the first text kept on the first real change --------------
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

  -- The text before the first edit, for a report only (a later edit keeps the first).
  insert into private.dm_message_originals (message_id, body)
  values (msg.id, msg.body)
  on conflict (message_id) do nothing;

  update public.dm_messages set body = new_body, edited_at = now() where id = msg.id;
  return query select t.id, other, true,
    not exists (select 1 from public.dm_messages m
                where m.thread_id = t.id and m.created_at > msg.created_at),
    now();
end;
$$;

revoke all on function public.dm_edit(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.dm_edit(uuid, uuid, text, integer) to service_role;

-- A DM report's copy of the last 50 messages: as before, plus an edited message's first text
-- (original_body; null when it was never edited). Used by safety_report_dm, friends_remove's
-- report and safety_block_friend.
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
           'edited_at', last50.edited_at,
           'original_body', last50.original_body
         ) order by last50.created_at), '[]'::jsonb)
  from (
    select m.sender_user_id, m.body, m.created_at, m.edited_at,
           case when m.edited_at is not null then o.body end as original_body
    from public.dm_messages m
    left join private.dm_message_originals o on o.message_id = m.id
    where m.thread_id = target_thread_id
    order by m.created_at desc
    limit 50
  ) last50;
$$;

revoke all on function private.dm_snapshot(uuid, uuid) from public, anon, authenticated;

-- Hourly: first texts older than a report lives (30 days), a bounded batch, skipping rows an edit
-- holds (rule 10).
create function private.delete_old_dm_originals()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from private.dm_message_originals
  where message_id in (
    select o.message_id from private.dm_message_originals o
    where o.saved_at <= now() - interval '30 days'
    order by o.saved_at
    limit 1000
    for update skip locked
  );
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function private.delete_old_dm_originals() from public, anon, authenticated;

select cron.schedule(
  'delete-old-dm-originals',
  '0 * * * *',
  $$select private.delete_old_dm_originals()$$
);
