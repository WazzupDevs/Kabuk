-- The table chat's held message (docs/SPEC_V4.md §4.T): "Bildir" on another's message, "Sil" on
-- one's own.
--
-- Report: a row in public.reports (target_type 'room_message') with the message's id and its copy
-- (alias, body, time) in messages_snapshot, the reported account by the message's check-in. The
-- copy outlives the message (the id is set null when it goes). Only a phone at the table now that
-- could read the message (since it sat down; RLS of public.messages), never one's own; anything
-- else writes nothing and answers the same.
-- Delete: the sender's own message, while it is at the table. The row goes (its reactions with it,
-- a reply to it then says "Mesaj artık yok"); the function sends a data-free broadcast on
-- messages:{room_id} and the table reads its page again (rule 9: no new channel).
--
-- Lock order (rule 10): the delete takes the caller's check-in (for no key update) → rooms (for
-- update; private.room_phone) → the message (delete) → its reactions (cascade). The report takes
-- no lock: it reads the seat and the message unlocked and only inserts the report.
-- Both are service role only (rule 1).

alter table public.reports drop constraint reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
    check (target_type in ('room', 'dm', 'profile', 'history', 'venue_chat', 'room_message')),
  add column room_message_id uuid references public.messages (id) on delete set null;
create index reports_room_message_idx on public.reports (room_message_id)
  where room_message_id is not null;

create function public.safety_report_room_message(
  target_user_id uuid,
  target_message_id uuid,
  new_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.messages;
  seat public.room_members;
  sender uuid;
begin
  select * into m from public.messages where id = target_message_id;
  if m.id is null then
    return false;
  end if;
  select rm.* into seat
  from public.room_members rm
  join public.table_sessions ts on ts.id = rm.session_id
  where rm.room_id = m.room_id and rm.left_at is null and ts.user_id = target_user_id
  limit 1;
  if seat.session_id is null or m.created_at < seat.joined_at or m.session_id = seat.session_id then
    return false;
  end if;
  select user_id into sender from public.table_sessions where id = m.session_id;
  if sender is null or sender = target_user_id then
    return false;
  end if;

  insert into public.reports (reporter_id, reported_user_id, room_id, reason, target_type,
                              room_message_id, messages_snapshot)
  values (target_user_id, sender, m.room_id, new_reason, 'room_message', m.id,
          jsonb_build_array(jsonb_build_object(
            'alias', m.sender_alias,
            'body', m.body,
            'created_at', m.created_at,
            'reported', true
          )));
  return true;
end;
$$;

create function public.chat_delete(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.messages;
  p record;
begin
  -- Unlocked first (the room comes before the message in the lock order), then the check-in and
  -- the room, then the message again under them.
  select * into m from public.messages where id = target_message_id;
  if m.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into p from private.room_phone(target_user_id, m.room_id);
  delete from public.messages
  where id = target_message_id and session_id = p.session_id
  returning * into m;
  if m.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  return m.room_id;
end;
$$;

revoke all on function public.safety_report_room_message(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.safety_report_room_message(uuid, uuid, text) to service_role;
revoke all on function public.chat_delete(uuid, uuid) from public, anon, authenticated;
grant execute on function public.chat_delete(uuid, uuid) to service_role;
