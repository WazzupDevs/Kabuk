-- DM send limit (25 Kasım): instead of one message per second, at most window_max messages per
-- sender in any window_seconds (60 a minute). The proje sahibi wants messages sent one after another
-- as fast as they are typed, as in Telegram and WhatsApp; the per-minute window still stops a flood.
-- Same checks, lock order and writes as before (docs/SPEC_V4.md §4.X); only the limit changes.

drop function public.dm_send_message(uuid, uuid, text, integer, uuid);
drop function public.dm_send(uuid, uuid, text, integer, uuid);

create function public.dm_send(
  target_user_id uuid,
  target_thread_id uuid,
  new_body text,
  window_seconds integer,
  window_max integer,
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
  -- window_max messages per sender in any window_seconds (the owner's call, 25 Kasım: messages
  -- go out one after another as fast as they are typed; the one-per-second rule went).
  if (
    select count(*) from public.dm_messages
    where sender_user_id = target_user_id
      and created_at > now() - make_interval(secs => window_seconds)
  ) >= window_max then
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
create function public.dm_send_message(
  target_user_id uuid,
  target_thread_id uuid,
  new_body text,
  window_seconds integer,
  window_max integer,
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
  other := public.dm_send(
    target_user_id, target_thread_id, new_body, window_seconds, window_max, reply_to
  );
  return query
    select other, m.id, m.created_at
    from public.dm_messages m
    where m.thread_id = target_thread_id
      and m.sender_user_id = target_user_id
    order by m.created_at desc, m.id
    limit 1;
end;
$$;

revoke all on function public.dm_send(uuid, uuid, text, integer, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.dm_send(uuid, uuid, text, integer, integer, uuid) to service_role;
revoke all on function public.dm_send_message(uuid, uuid, text, integer, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.dm_send_message(uuid, uuid, text, integer, integer, uuid)
  to service_role;
