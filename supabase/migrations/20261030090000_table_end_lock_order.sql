-- Faz 3 step 23.3, server: the table's end in rule 10's lock order (CTO review of
-- 20261029090000_table_end.sql). end_two_sided_room wrote the pairs to play_history before it
-- closed the room, and the close's rooms_close_members trigger then updated room_members: rooms →
-- play_history → room_members. Rule 10 is rooms → room_members → … → play_history.
--
-- Now the room closes first (the trigger closes the members' rows with left_at = now()), then the
-- pairs are written. write_pair_history's closing branch reads the phones whose rows are open or
-- were closed in this transaction (left_at = now()), so the phones at the table, the side's last
-- phone that has just left included, are the same as before. The last-phone road of leave_room
-- becomes room_members → rooms → room_members (the trigger) → play_history.
--
-- Table end stays off (private.table_end_on()); with it off nothing here runs (the window opens,
-- as before). Step 23.3's client PR turns it on.
create or replace function private.end_two_sided_room(target_room_id uuid, decision_seconds integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  if not private.table_end_on() then
    return private.start_reveal(target_room_id, decision_seconds);
  end if;
  update public.rooms set status = 'closed', closed_at = now(), last_activity_at = now()
  where id = target_room_id
  returning * into r;
  perform private.write_pair_history(target_room_id);
  return r;
end;
$$;

revoke all on function private.end_two_sided_room(uuid, integer) from public, anon, authenticated;
