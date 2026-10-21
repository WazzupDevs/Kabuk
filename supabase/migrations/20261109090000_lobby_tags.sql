-- Step 4.5b (docs/SPEC_V4.md §4.E): "Masanı lobiye aç" keeps its intent and game tag (SPEC_V3
-- §23.C, aynen). A table is created first and opened to the lobby later, so the tags go with
-- rooms/set-visibility: opening sets them (none: no tag), leaving the lobby clears them. The
-- columns' own checks (rooms.intent, rooms.game_tag) refuse anything else.

drop function public.rooms_set_visibility(uuid, uuid, boolean);

-- rooms/set-visibility (§4.E): only the owner. Requests of the other road end as a decline does
-- (rule 5): "Katıl" goes with the lobby, "Bu masadayım" with the running tables.
create function public.rooms_set_visibility(
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
