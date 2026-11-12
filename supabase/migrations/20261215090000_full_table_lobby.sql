-- A full table cannot be opened to the lobby (docs/design/iskelet.md → 6, no. 2): nobody could
-- join it. rooms/set-visibility answers table_full when the table already has the most phones a
-- table seats; a table that fills while it is in the lobby stays as it is (its "Katıl" answers
-- table_full already), and "Lobiden çek" is never refused.
-- Locks (rule 10): as before, the room alone (private.owned_open_room), then its join requests.
create or replace function public.rooms_set_visibility(
  target_user_id uuid,
  target_room_id uuid,
  in_lobby boolean,
  new_intent text default null,
  new_game_tag text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  if (r.visibility = 'open') = in_lobby
     and (not in_lobby
          or (r.intent is not distinct from new_intent
              and r.game_tag is not distinct from new_game_tag)) then
    return r;
  end if;
  if in_lobby and r.visibility <> 'open' and r.phones >= private.max_table_phones() then
    raise exception using errcode = 'P0001', message = 'table_full';
  end if;
  update public.rooms
  set visibility = case when in_lobby then 'open' else 'private' end,
      waiting_since = case when in_lobby and r.visibility <> 'open' then now() else waiting_since end,
      intent = case when in_lobby then new_intent end,
      game_tag = case when in_lobby then new_game_tag end
  where id = r.id
  returning * into r;
  update public.join_requests set status = 'declined', responded_at = now()
  where room_id = r.id and status = 'pending' and as_member = in_lobby;
  return r;
end;
$$;

revoke all on function public.rooms_set_visibility(uuid, uuid, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.rooms_set_visibility(uuid, uuid, boolean, text, text)
  to service_role;
