-- Faz 4 step 4.6.9 (docs/SPEC_V4.md §4.F "Adım 4.6.9: Kibrit", K-86), from the scenario analysis
-- (docs/decisions/senaryo-kibrit.md):
-- - H-1: kibrit/advance moves a phase on only once its time is up. A second of slack let a phone
--   whose clock ran ahead close the write or the vote early, dropping a revision sent inside the
--   time (rule 3's exception: a revision counts while endsAt has not passed). The phones ask again
--   every 2.5 seconds, so the slack bought nothing.
-- - D-1: a vote for someone who has just left the game is not an error (the voter could not have
--   known): it changes nothing and the voter's own view comes back, as for a closed phase; the
--   grid opens again to choose. A target that never sat in the game is still bad_request.

create or replace function public.kibrit_vote(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  at_rev integer,
  target_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  r public.rooms;
  st jsonb;
  no integer;
  kv public.kibrit_votes;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if at_rev < 1 then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  -- A revision counts only while the phase is open and its time is not up (rule 3's exception).
  if st ->> 'phase' <> 'vote' or (st ->> 'step')::integer <> at_step
     or now() >= (st ->> 'endsAt')::timestamptz then
    return private.kibrit_view_of(r, seat.session_id);
  end if;
  -- Someone who sat in the game and has left: nothing changes, the voter's own view comes back.
  if not coalesce(st -> 'seats', '[]'::jsonb) ? target_session_id::text then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if not target_session_id = any (private.kibrit_active(st)) then
    return private.kibrit_view_of(r, seat.session_id);
  end if;
  no := private.current_game_no(st);
  select * into kv from public.kibrit_votes
  where room_id = r.id and game_no = no and step = at_step and voter_session_id = seat.session_id
  for update;
  if kv.voter_session_id is null then
    insert into public.kibrit_votes (room_id, game_no, step, voter_session_id, target_session_id, rev)
    values (r.id, no, at_step, seat.session_id, target_session_id, at_rev);
  elsif at_rev > kv.rev and kv.revisions < private.kibrit_n('maxRevisions') then
    update public.kibrit_votes
    set target_session_id = kibrit_vote.target_session_id, rev = at_rev,
        revisions = revisions + 1
    where room_id = r.id and game_no = no and step = at_step
      and voter_session_id = seat.session_id;
  else
    return private.kibrit_view_of(r, seat.session_id);
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(st, '{voted}', to_jsonb(private.kibrit_voted(r.id, st)))
  where id = r.id
  returning * into r;
  if private.kibrit_complete(r.id, r.game_state) then
    r := private.kibrit_step(r);
  end if;
  return private.kibrit_view_of(r, seat.session_id);
end;
$$;

create or replace function public.kibrit_advance(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'kibrit' or not (r.game_state ? 'phase')
     or r.game_state ->> 'phase' = 'over'
     or now() < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.kibrit_step(r);
end;
$$;
