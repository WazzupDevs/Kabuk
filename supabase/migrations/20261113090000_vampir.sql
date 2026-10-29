-- Faz 4 step 4.6.6 (docs/SPEC_V4.md §4.F "Adım 4.6.6: Vampir Köylü", K-77, K-78): the first game
-- of the table's new six. The phone is the narrator: at night everyone at the table makes a choice
-- on their own phone (the vampires bite, the doctor protects, the seer looks, the others make a
-- choice that only hides them), by day the table talks out loud and votes someone out.
--
-- Where what lives:
-- - game_players.role: each player's role, dealt at the start (vampir, doktor, gozcu, soytari,
--   koylu); closed to clients like the whole table.
-- - game_secrets.secret (concept 'vampir'): tonight's choices {picks: {session: target}}, whom the
--   doctor protected last night (lastSave) and what the seer learned (seen: [{by, sid, vampire,
--   round}]). Only vampir_view and vampir_pick answer from it, each to the phone it belongs to
--   (rule 3).
-- - rooms.game_state, open to the table (and so to Realtime): the phase and its clock (phase, step,
--   endsAt, round), the seats in their order, the dead with their roles (revealed), who left the
--   game (gone; roles never revealed, K-78), who is ready, how many chose tonight (acted: a count,
--   never who) and the day's votes (open, K-78: who voted for whom). The end of a game moves to
--   game_state.lastGame.vampir: the winner, the roles of those still in the game, the dead and the
--   gone.
--
-- Locks (rule 10): check-in → rooms (private.room_phone) → game_players → game_secrets. A player
-- leaving the game or the table stamps game_players.left_at while the table is held; the trigger
-- here updates game_state without a new lock.

-- 1. The game ----------------------------------------------------------------------------------
-- In the list before the seed (content/games.json) makes it playable, so rooms.concept can name it.
insert into public.games (id, name, min_players, max_players, teams, pregame)
values ('vampir', 'Vampir Köylü', 5, 12, false, true)
on conflict (id) do nothing;

alter table public.game_secrets drop constraint game_secrets_concept_check;
alter table public.game_secrets
  add constraint game_secrets_concept_check check (concept in ('sahtekar', 'ibre', 'vampir'));

alter table public.game_results drop constraint game_results_concept_check;
alter table public.game_results
  add constraint game_results_concept_check
  check (concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir'));
-- A table's pair history names the game played there (private.write_pair_history: rooms.concept or
-- lastGame.concept).
alter table public.play_history drop constraint play_history_concept_check;
alter table public.play_history
  add constraint play_history_concept_check
  check (concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'chat'));
alter table public.game_results drop constraint game_results_mode_check;
alter table public.game_results
  add constraint game_results_mode_check
  check (mode in ('voice', 'text', 'cooperative', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir'));

-- 2. Rules -------------------------------------------------------------------------------------
-- pure/vampir.ts → VAMPIR (vampir.test.ts reads the numbers here).
create function private.vampir_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'roleSeconds', 30, 'nightSeconds', 30, 'morningSeconds', 6, 'daySeconds', 120,
    'voteSeconds', 45, 'verdictSeconds', 6, 'minPlayers', 5, 'maxPlayers', 12
  );
$$;

create function private.vampir_seconds(name text)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => (private.vampir_config() ->> name)::integer);
$$;

-- pure/vampir.ts → roleDeck: the roles for `players` players. Vampires 1 (5–6), 2 (7–9), 3
-- (10–12); a doctor and a seer; a jester from 6; villagers for the rest.
create function private.vampir_deck(players integer)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  deck text[];
begin
  deck := array_fill(
    'vampir'::text,
    array[case when players <= 6 then 1 when players <= 9 then 2 else 3 end]
  ) || array['doktor', 'gozcu']::text[];
  if players >= 6 then
    deck := deck || array['soytari']::text[];
  end if;
  return deck || array_fill('koylu'::text, array[greatest(players - cardinality(deck), 0)]);
end;
$$;

-- 3. Helpers -----------------------------------------------------------------------------------
-- The seats still in the game and alive: not dead, not gone.
create function private.vampir_alive(st jsonb)
returns uuid[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(seat.sid::uuid order by seat.n), '{}'::uuid[])
  from jsonb_array_elements_text(coalesce(st -> 'seats', '[]'::jsonb)) with ordinality
    as seat (sid, n)
  where not coalesce(st -> 'gone', '[]'::jsonb) ? seat.sid
    and not exists (
      select 1 from jsonb_array_elements(coalesce(st -> 'dead', '[]'::jsonb)) d
      where d ->> 'sid' = seat.sid
    );
$$;

revoke all on function private.vampir_alive(jsonb) from public, anon, authenticated;

create function private.vampir_role(target_room_id uuid, st jsonb, target_session_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select gp.role from public.game_players gp
  where gp.room_id = target_room_id
    and gp.game_no = private.current_game_no(st)
    and gp.session_id = target_session_id;
$$;

revoke all on function private.vampir_role(uuid, jsonb, uuid) from public, anon, authenticated;

-- Who has won, from those alive: no vampire left, the villagers ('k'); the vampires as many as the
-- others or more, the vampires ('v'); else no one yet. The jester's win is the vote's (verdict).
create function private.vampir_winner(target_room_id uuid, st jsonb)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  vamps integer;
  others integer;
begin
  select count(*) filter (where gp.role = 'vampir'), count(*) filter (where gp.role <> 'vampir')
  into vamps, others
  from public.game_players gp
  where gp.room_id = target_room_id
    and gp.game_no = private.current_game_no(st)
    and gp.session_id = any (private.vampir_alive(st));
  if vamps = 0 then
    return 'k';
  elsif vamps >= others then
    return 'v';
  end if;
  return null;
end;
$$;

revoke all on function private.vampir_winner(uuid, jsonb) from public, anon, authenticated;

create function private.vampir_secret(target_room_id uuid, st jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select gs.secret from public.game_secrets gs
  where gs.room_id = target_room_id and gs.game_no = private.current_game_no(st);
$$;

revoke all on function private.vampir_secret(uuid, jsonb) from public, anon, authenticated;

-- The next phase: a new step and a new clock; what belonged to the phase before goes.
create function private.vampir_enter(
  target_room_id uuid,
  st jsonb,
  new_phase text,
  clock text,
  extra jsonb default '{}'::jsonb
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  update public.rooms
  set last_activity_at = now(),
      game_state = (st - 'ready' - 'acted' - 'votes' - 'victim' - 'out' - 'winner')
        || jsonb_build_object(
          'phase', new_phase,
          'step', coalesce((st ->> 'step')::integer, 0) + 1,
          'endsAt', now() + private.vampir_seconds(clock)
        )
        || extra
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

revoke all on function private.vampir_enter(uuid, jsonb, text, text, jsonb)
  from public, anon, authenticated;

-- Has the phase all it waits for: everyone in the game ready, everyone alive chose, everyone alive
-- voted.
create function private.vampir_complete(target_room_id uuid, st jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  alive uuid[] := private.vampir_alive(st);
  picks jsonb;
begin
  if st ->> 'phase' = 'role' then
    return not exists (
      select 1 from unnest(alive) a(sid)
      where not coalesce(st -> 'ready', '[]'::jsonb) ? a.sid::text
    );
  elsif st ->> 'phase' = 'night' then
    picks := coalesce(private.vampir_secret(target_room_id, st) -> 'picks', '{}'::jsonb);
    return not exists (select 1 from unnest(alive) a(sid) where not picks ? a.sid::text);
  elsif st ->> 'phase' = 'vote' then
    return not exists (
      select 1 from unnest(alive) a(sid)
      where not coalesce(st -> 'votes', '{}'::jsonb) ? a.sid::text
    );
  end if;
  return false;
end;
$$;

revoke all on function private.vampir_complete(uuid, jsonb) from public, anon, authenticated;

-- 4. The phases --------------------------------------------------------------------------------
-- Night: tonight's choices start empty.
create function private.vampir_night(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_secrets
  set secret = jsonb_set(secret, '{picks}', '{}'::jsonb)
  where room_id = r.id and game_no = private.current_game_no(r.game_state);
  return private.vampir_enter(
    r.id, r.game_state, 'night', 'nightSeconds',
    jsonb_build_object('round', coalesce((r.game_state ->> 'round')::integer, 0) + 1, 'acted', 0)
  );
end;
$$;

revoke all on function private.vampir_night(public.rooms) from public, anon, authenticated;

-- Morning: the vampires' choice (the most chosen by the living vampires; a tie by lot) dies unless
-- the living doctor protected that person tonight; the dead person's role opens to the table. The
-- doctor's choice is remembered for the next night. Nobody is told someone was saved.
create function private.vampir_morning(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  alive uuid[] := private.vampir_alive(r.game_state);
  sec jsonb := private.vampir_secret(r.id, r.game_state);
  picks jsonb := coalesce(sec -> 'picks', '{}'::jsonb);
  bitten uuid;
  saved uuid;
  victim uuid;
begin
  select (p.value #>> '{}')::uuid into bitten
  from public.game_players gp
  join jsonb_each(picks) p on p.key = gp.session_id::text
  where gp.room_id = r.id and gp.game_no = no and gp.role = 'vampir'
    and gp.session_id = any (alive)
  group by p.value #>> '{}'
  order by count(*) desc, random()
  limit 1;

  select (picks ->> gp.session_id::text)::uuid into saved
  from public.game_players gp
  where gp.room_id = r.id and gp.game_no = no and gp.role = 'doktor'
    and gp.session_id = any (alive);

  update public.game_secrets
  set secret = jsonb_set(secret, '{lastSave}', coalesce(to_jsonb(saved::text), 'null'::jsonb))
  where room_id = r.id and game_no = no;

  if bitten is not null and bitten is distinct from saved and bitten = any (alive) then
    victim := bitten;
    st := jsonb_set(
      st, '{dead}',
      coalesce(st -> 'dead', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'sid', victim::text,
        'role', private.vampir_role(r.id, st, victim),
        'when', 'night',
        'round', coalesce((st ->> 'round')::integer, 1)
      ))
    );
  end if;
  return private.vampir_enter(
    r.id, st, 'morning', 'morningSeconds',
    jsonb_build_object('victim', coalesce(to_jsonb(victim::text), 'null'::jsonb))
      || jsonb_strip_nulls(jsonb_build_object('winner', private.vampir_winner(r.id, st)))
  );
end;
$$;

revoke all on function private.vampir_morning(public.rooms) from public, anon, authenticated;

-- The vote's result: the one with the most votes from the living goes out; a tie or no vote, nobody.
-- The jester voted out wins alone; else the game may be won.
create function private.vampir_verdict(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  alive uuid[] := private.vampir_alive(r.game_state);
  top_sid text;
  top_votes integer;
  next_votes integer;
  out_role text;
  winner text;
begin
  select v.target, count(*)::integer into top_sid, top_votes
  from jsonb_each_text(coalesce(st -> 'votes', '{}'::jsonb)) as v (voter, target)
  where v.voter::uuid = any (alive) and v.target::uuid = any (alive)
  group by v.target
  order by count(*) desc, v.target
  limit 1;

  select count(*)::integer into next_votes
  from jsonb_each_text(coalesce(st -> 'votes', '{}'::jsonb)) as v (voter, target)
  where v.voter::uuid = any (alive) and v.target::uuid = any (alive) and v.target <> top_sid
  group by v.target
  order by count(*) desc
  limit 1;

  if top_sid is not null and top_votes > coalesce(next_votes, 0) then
    out_role := private.vampir_role(r.id, st, top_sid::uuid);
    st := jsonb_set(
      st, '{dead}',
      coalesce(st -> 'dead', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'sid', top_sid, 'role', out_role, 'when', 'vote',
        'round', coalesce((st ->> 'round')::integer, 1)
      ))
    );
  else
    top_sid := null;
  end if;
  winner := case when out_role = 'soytari' then 'j' else private.vampir_winner(r.id, st) end;
  return private.vampir_enter(
    r.id, st, 'verdict', 'verdictSeconds',
    jsonb_build_object('out', coalesce(to_jsonb(top_sid), 'null'::jsonb))
      || jsonb_strip_nulls(jsonb_build_object('winner', winner))
  );
end;
$$;

revoke all on function private.vampir_verdict(public.rooms) from public, anon, authenticated;

-- The end: a result for every player still in the game (their side won or lost; the jester alone),
-- then the frame's end (private.end_game) and what the end screen shows in lastGame.vampir: the
-- winner, the roles of those still in the game, the dead, the gone and the seats.
create function private.vampir_finish(r public.rooms, winner text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  roles jsonb;
  result jsonb;
  done public.rooms;
begin
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ts.user_id, r.id, 'vampir', 'vampir', null,
         case winner
           when 'j' then gp.role = 'soytari'
           when 'v' then gp.role = 'vampir'
           else gp.role not in ('vampir', 'soytari')
         end
  from public.game_players gp
  join public.table_sessions ts on ts.id = gp.session_id
  where gp.room_id = r.id and gp.game_no = no and gp.left_at is null
    and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text;

  select coalesce(jsonb_object_agg(gp.session_id::text, gp.role), '{}'::jsonb) into roles
  from public.game_players gp
  where gp.room_id = r.id and gp.game_no = no
    and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text
    and gp.left_at is null;

  result := jsonb_build_object(
    'winner', winner,
    'roles', roles,
    'seats', coalesce(st -> 'seats', '[]'::jsonb),
    'dead', coalesce(st -> 'dead', '[]'::jsonb),
    'gone', coalesce(st -> 'gone', '[]'::jsonb),
    'round', coalesce((st ->> 'round')::integer, 0)
  );
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,vampir}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

revoke all on function private.vampir_finish(public.rooms, text) from public, anon, authenticated;

-- One step on from the phase `r` is in: its time ran out or it has all it waited for. The winner a
-- morning or a verdict showed ends the game; so does one that came without them (someone left).
create function private.vampir_step(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  phase text := r.game_state ->> 'phase';
  won text := coalesce(r.game_state ->> 'winner', private.vampir_winner(r.id, r.game_state));
begin
  if won is not null then
    return private.vampir_finish(r, won);
  end if;
  if phase = 'role' then
    return private.vampir_night(r);
  elsif phase = 'night' then
    return private.vampir_morning(r);
  elsif phase = 'morning' then
    return private.vampir_enter(r.id, r.game_state, 'day', 'daySeconds');
  elsif phase = 'day' then
    return private.vampir_enter(
      r.id, r.game_state, 'vote', 'voteSeconds', jsonb_build_object('votes', '{}'::jsonb)
    );
  elsif phase = 'vote' then
    return private.vampir_verdict(r);
  elsif phase = 'verdict' then
    return private.vampir_night(r);
  end if;
  return r;
end;
$$;

revoke all on function private.vampir_step(public.rooms) from public, anon, authenticated;

-- The caller at a running game: the table (locked), the phase and the caller's seat in the game
-- (null: watching; gone counts as watching).
create function private.vampir_seat(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, role text, alive boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  my_role text;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'vampir' or not (r.game_state ? 'phase') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select gp.role into my_role from public.game_players gp
  where gp.room_id = r.id and gp.game_no = private.current_game_no(r.game_state)
    and gp.session_id = p.session_id and gp.left_at is null;
  if coalesce(r.game_state -> 'gone', '[]'::jsonb) ? p.session_id::text then
    my_role := null;
  end if;
  return query select r, p.session_id, p.is_leader, my_role,
    my_role is not null and p.session_id = any (private.vampir_alive(r.game_state));
end;
$$;

revoke all on function private.vampir_seat(uuid, uuid) from public, anon, authenticated;

-- What the caller's own phone may know (rule 3): the role, the other vampires (a vampire),
-- tonight's own choice, the seer's findings, the other vampires' choices tonight (a vampire at
-- night) and whom the doctor protected last night (the doctor). A watcher gets no role.
create function private.vampir_view_of(
  r public.rooms,
  me uuid,
  my_role text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  sec jsonb := private.vampir_secret(r.id, r.game_state);
  picks jsonb := coalesce(sec -> 'picks', '{}'::jsonb);
  mates jsonb := '[]'::jsonb;
  mate_picks jsonb := '{}'::jsonb;
  seen jsonb := '[]'::jsonb;
begin
  if my_role is null then
    return jsonb_build_object('role', null);
  end if;
  if my_role = 'vampir' then
    select coalesce(jsonb_agg(gp.session_id::text order by gp.seat_order), '[]'::jsonb) into mates
    from public.game_players gp
    where gp.room_id = r.id and gp.game_no = no and gp.role = 'vampir' and gp.session_id <> me;
    if st ->> 'phase' = 'night' then
      select coalesce(jsonb_object_agg(p.key, p.value), '{}'::jsonb) into mate_picks
      from jsonb_each(picks) p
      where p.key in (select jsonb_array_elements_text(mates));
    end if;
  end if;
  if my_role = 'gozcu' then
    select coalesce(jsonb_agg(s - 'by' order by (s ->> 'round')::integer), '[]'::jsonb) into seen
    from jsonb_array_elements(coalesce(sec -> 'seen', '[]'::jsonb)) s
    where s ->> 'by' = me::text;
  end if;
  return jsonb_build_object(
    'role', my_role,
    'mates', mates,
    'pick', case when st ->> 'phase' = 'night' then picks -> me::text else null end,
    'matePicks', mate_picks,
    'seen', seen,
    'lastSave', case when my_role = 'doktor' then sec -> 'lastSave' else null end
  );
end;
$$;

revoke all on function private.vampir_view_of(public.rooms, uuid, text)
  from public, anon, authenticated;

-- 5. The actions -------------------------------------------------------------------------------
-- vampir/start: the owner, from the pre-game page (private.start_game: 5 to 12 players, the rest
-- watch). The roles are dealt at random; the role card's clock starts.
create function public.vampir_start(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  no integer;
  players integer;
  deck text[];
  seats jsonb;
  r public.rooms;
begin
  no := private.start_game(target_user_id, target_room_id, 'vampir');
  select count(*)::integer into players
  from public.game_players where room_id = target_room_id and game_no = no;
  deck := private.vampir_deck(players);
  update public.game_players gp
  set role = dealt.role
  from (
    select s.session_id, d.role
    from (
      select session_id, row_number() over (order by random()) as n
      from public.game_players where room_id = target_room_id and game_no = no
    ) s
    join (
      select role, row_number() over (order by random()) as n from unnest(deck) as role
    ) d on d.n = s.n
  ) dealt
  where gp.room_id = target_room_id and gp.game_no = no and gp.session_id = dealt.session_id;

  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (
    target_room_id, no, 'vampir',
    jsonb_build_object('picks', '{}'::jsonb, 'lastSave', null, 'seen', '[]'::jsonb)
  );

  select coalesce(jsonb_agg(session_id::text order by seat_order), '[]'::jsonb) into seats
  from public.game_players where room_id = target_room_id and game_no = no;

  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_build_object(
        'gameNo', no,
        'phase', 'role',
        'step', 1,
        'endsAt', now() + private.vampir_seconds('roleSeconds'),
        'round', 0,
        'seats', seats,
        'dead', '[]'::jsonb,
        'gone', '[]'::jsonb,
        'ready', '[]'::jsonb
      )
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- vampir/view: anyone at the table; what their own phone may know.
create function public.vampir_view(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  return private.vampir_view_of(seat.room, seat.session_id, seat.role);
end;
$$;

-- vampir/ready: a player on the role card. When everyone in the game is ready, the night starts.
create function public.vampir_ready(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  r public.rooms;
  st jsonb;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  r := seat.room;
  if seat.role is null then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  st := r.game_state;
  if st ->> 'phase' <> 'role' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'ready', '[]'::jsonb) ? seat.session_id::text then
    return r;
  end if;
  st := jsonb_set(
    st, '{ready}', coalesce(st -> 'ready', '[]'::jsonb) || to_jsonb(seat.session_id::text)
  );
  update public.rooms set game_state = st, last_activity_at = now()
  where id = r.id returning * into r;
  if private.vampir_complete(r.id, r.game_state) then
    return private.vampir_step(r);
  end if;
  return r;
end;
$$;

-- vampir/begin: the owner starts the night before everyone is ready (K-78).
create function public.vampir_begin(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if (seat.room).game_state ->> 'phase' <> 'role'
     or ((seat.room).game_state ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  return private.vampir_step(seat.room);
end;
$$;

-- vampir/pick: a living player at night chooses once; the answer is the caller's view (the seer's
-- finding comes with it). The vampires choose among the living who are not vampires, the doctor
-- among the living but last night's protected one, everyone else among the living but themselves.
-- When everyone alive has chosen, the night is over.
create function public.vampir_pick(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
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
  sec jsonb;
  target_role text;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if seat.role is null or not seat.alive then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  sec := private.vampir_secret(r.id, st);
  if st ->> 'phase' <> 'night' or (st ->> 'step')::integer <> at_step
     or coalesce(sec -> 'picks', '{}'::jsonb) ? seat.session_id::text then
    return private.vampir_view_of(r, seat.session_id, seat.role);
  end if;
  target_role := private.vampir_role(r.id, st, target_session_id);
  if not target_session_id = any (private.vampir_alive(st))
     or (seat.role = 'vampir' and target_role = 'vampir')
     or (seat.role = 'doktor' and target_session_id::text is not distinct from sec ->> 'lastSave')
     or (seat.role <> 'doktor' and target_session_id = seat.session_id) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  sec := jsonb_set(sec, array['picks', seat.session_id::text], to_jsonb(target_session_id::text));
  if seat.role = 'gozcu' then
    sec := jsonb_set(
      sec, '{seen}',
      coalesce(sec -> 'seen', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'by', seat.session_id::text,
        'sid', target_session_id::text,
        'vampire', target_role = 'vampir',
        'round', coalesce((st ->> 'round')::integer, 1)
      ))
    );
  end if;
  update public.game_secrets set secret = sec
  where room_id = r.id and game_no = private.current_game_no(st);
  -- The table sees only that one more chose (the vampires read their view again).
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(st, '{acted}', to_jsonb(coalesce((st ->> 'acted')::integer, 0) + 1))
  where id = r.id
  returning * into r;
  if private.vampir_complete(r.id, r.game_state) then
    r := private.vampir_step(r);
  end if;
  return private.vampir_view_of(r, seat.session_id, seat.role);
end;
$$;

-- vampir/to-vote: the owner ends the day's talk.
create function public.vampir_to_vote(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if (seat.room).game_state ->> 'phase' <> 'day'
     or ((seat.room).game_state ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  return private.vampir_step(seat.room);
end;
$$;

-- vampir/vote: a living player votes once for another living player; the votes are open (K-78).
-- When everyone alive has voted, the vote is counted.
create function public.vampir_vote(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  target_session_id uuid
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  r public.rooms;
  st jsonb;
begin
  select * into seat from private.vampir_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if seat.role is null or not seat.alive then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if st ->> 'phase' <> 'vote' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'votes', '{}'::jsonb) ? seat.session_id::text then
    return r;
  end if;
  if target_session_id = seat.session_id
     or not target_session_id = any (private.vampir_alive(st)) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(
        st, array['votes', seat.session_id::text], to_jsonb(target_session_id::text)
      )
  where id = r.id
  returning * into r;
  if private.vampir_complete(r.id, r.game_state) then
    return private.vampir_step(r);
  end if;
  return r;
end;
$$;

-- vampir/advance: anyone at the table once the phase's time is up (a second of slack for the
-- phones' clocks); idempotent: early, it changes nothing.
create function public.vampir_advance(target_user_id uuid, target_room_id uuid)
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
  if r.concept is distinct from 'vampir' or not (r.game_state ? 'phase')
     or now() + interval '1 second' < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.vampir_step(r);
end;
$$;

-- 6. Leaving -----------------------------------------------------------------------------------
-- A player who leaves the game or the table (any road stamps game_players.left_at while holding the
-- table) counts as dead without a role (K-78): gone. Their votes, given and taken, go. If the phase
-- now has all it waits for, or the game is won, its time runs out now and the next advance settles
-- it.
create function private.vampir_on_player_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  st jsonb;
  sid text := new.session_id::text;
begin
  select * into r from public.rooms where id = new.room_id;
  if r.concept is distinct from 'vampir' or not (r.game_state ? 'phase')
     or private.current_game_no(r.game_state) <> new.game_no
     or coalesce(r.game_state -> 'gone', '[]'::jsonb) ? sid then
    return new;
  end if;
  st := jsonb_set(r.game_state, '{gone}', coalesce(r.game_state -> 'gone', '[]'::jsonb) || to_jsonb(sid));
  if st ? 'votes' then
    st := jsonb_set(st, '{votes}', coalesce((
      select jsonb_object_agg(v.voter, v.target)
      from jsonb_each_text(st -> 'votes') as v (voter, target)
      where v.voter <> sid and v.target <> sid
    ), '{}'::jsonb));
  end if;
  if private.vampir_complete(r.id, st) or private.vampir_winner(r.id, st) is not null then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;
  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  return new;
end;
$$;

revoke all on function private.vampir_on_player_left() from public, anon, authenticated;

create trigger game_players_vampir_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.vampir_on_player_left();

-- 7. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.vampir_start(uuid, uuid)',
    'public.vampir_view(uuid, uuid)',
    'public.vampir_ready(uuid, uuid, integer)',
    'public.vampir_begin(uuid, uuid, integer)',
    'public.vampir_pick(uuid, uuid, integer, uuid)',
    'public.vampir_to_vote(uuid, uuid, integer)',
    'public.vampir_vote(uuid, uuid, integer, uuid)',
    'public.vampir_advance(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

revoke all on function private.vampir_config() from public, anon, authenticated;
revoke all on function private.vampir_seconds(text) from public, anon, authenticated;
revoke all on function private.vampir_deck(integer) from public, anon, authenticated;
