-- Faz 4 step 4.6.1 (docs/SPEC_V4.md §4.F "Adım 4.6.1", §4.H, §4.K): Kapsül Anlat, the table's
-- person-based Tabu. Mor ('a') and Pembe ('b') take turns, six turns of 60 seconds with 3 passes;
-- within a team the describer goes round in the order the game froze at its start (game_players).
-- The roles are the server's (rule 3):
-- - the describer presses Doğru and Pas; the other team presses Yasak! (−1 for the describing team,
--   the card is passed; the first press wins);
-- - the card list goes to the describer, the other team and the watchers (tabu/turn-cards), never to
--   the describer's teammates nor to a player who left the game;
-- - rooms.game_state carries the open roles (the teams, the describer), the clocks and the scores,
--   never the card being played; a card's word reaches the table only once it closes (its
--   card_closed event and the turn's summary).
-- The refereed and cooperative modes of the side model are gone with it (their functions are
-- replaced here; private.tabu_mode and the side columns leave in 4.8).
--
-- The frame gets two things every game of 4.6 uses:
-- - game_state.left: the players who left the running game ("Oyundan çık" or leaving the table), so
--   every phone shows who still plays;
-- - private.end_game takes the finished game's result for lastGame.
--
-- Lock order (rule 10): check-in → rooms (private.room_phone) → game_players → tabu_turns →
-- room_used_cards, game_events. game_players is only read under the table's lock (every road that
-- changes it holds the table); a finishing game updates it before it would lock a turn.

-- 1. The rules ---------------------------------------------------------------------------------
-- pure/kapsulAnlat.ts → KAPSUL_ANLAT.
create function private.kapsul_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'totalTurns', 6, 'turnSeconds', 60, 'maxPasses', 3, 'cardsPerTurn', 40, 'readySeconds', 10,
    'countdownSeconds', 3, 'nextSeconds', 15
  );
$$;

revoke all on function private.kapsul_config() from public, anon, authenticated;

-- 2. The frame: who left the running game, and the result of a finished one -----------------------
-- A player of the running game leaves it: the table's phones read it from game_state.left. The
-- caller holds the table.
create function private.game_player_left(target_room_id uuid, target_session_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.rooms
  set game_state = jsonb_set(
        game_state, '{left}',
        coalesce(game_state -> 'left', '[]'::jsonb) || to_jsonb(target_session_id::text)
      )
  where id = target_room_id
    and concept is not null
    and not coalesce(game_state -> 'left', '[]'::jsonb) ? target_session_id::text;
$$;

revoke all on function private.game_player_left(uuid, uuid) from public, anon, authenticated;

-- As in 20261106090000_game_frame.sql, and the leaving player is named in game_state.left.
create or replace function private.leave_table_game(target_room_id uuid, target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.table_votes
  where room_id = target_room_id and session_id = target_session_id;
  update public.game_players set left_at = now()
  where room_id = target_room_id and session_id = target_session_id and left_at is null;
  if found then
    perform private.game_player_left(target_room_id, target_session_id);
  end if;
  update public.rooms
  set game_state = game_state #- array['pregame', 'picks', target_session_id::text]
  where id = target_room_id and game_state ? 'pregame';
end;
$$;

-- As in 20261106090000_game_frame.sql, and the leaving player is named in game_state.left.
create or replace function public.rooms_leave_game(target_user_id uuid, target_room_id uuid)
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
  if r.concept is null then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  update public.game_players set left_at = now()
  where room_id = r.id and game_no = private.current_game_no(r.game_state)
    and session_id = p.session_id and left_at is null;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  perform private.game_player_left(r.id, p.session_id);
  update public.rooms set last_activity_at = now() where id = r.id returning * into r;
  return r;
end;
$$;

-- As in 20261106090000_game_frame.sql; a game that reaches its end passes its result, which goes to
-- lastGame next to the concept (the end screen reads it).
drop function private.end_game(uuid, boolean);
create function private.end_game(target_room_id uuid, abandoned boolean, result jsonb default null)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms where id = target_room_id;
  if r.concept is null then
    update public.rooms
    set game_state = game_state - 'pregame', last_activity_at = now()
    where id = r.id and game_state ? 'pregame';
    select * into r from public.rooms where id = target_room_id;
    return r;
  end if;
  update public.game_players set left_at = now()
  where room_id = r.id and game_no = private.current_game_no(r.game_state) and left_at is null;
  if abandoned then
    insert into public.game_events (room_id, type, payload)
    values (r.id, 'game_abandoned', jsonb_build_object('concept', r.concept));
  end if;
  update public.rooms
  set concept = null, last_activity_at = now(),
      game_state = private.between_games(
        game_state,
        jsonb_build_object('concept', r.concept, 'abandoned', abandoned)
          || coalesce(result, '{}'::jsonb)
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

revoke all on function private.end_game(uuid, boolean, jsonb) from public, anon, authenticated;

-- As in 20261106090000_game_frame.sql, but the temporary table is emptied with a WHERE clause:
-- PostgREST's sessions load pg_safeupdate, which refuses a DELETE without one, so a game's start
-- through the API (every `<game>/start`) failed there.
create or replace function private.start_game(target_user_id uuid, target_room_id uuid, target_concept text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  g public.games;
  next_no integer;
  picks jsonb;
  team_a integer;
  team_b integer;
  players integer;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  g := private.playable_game(target_concept);
  if g.pregame then
    if r.game_state -> 'pregame' ->> 'concept' is distinct from g.id then
      raise exception using errcode = 'P0001', message = 'no_game';
    end if;
  elsif r.concept is not null or r.game_state ? 'pregame' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  picks := coalesce(r.game_state -> 'pregame' -> 'picks', '{}'::jsonb);

  create temporary table if not exists pg_temp.starting_players (
    session_id uuid primary key, team text
  ) on commit drop;
  delete from pg_temp.starting_players where true;
  insert into pg_temp.starting_players (session_id, team)
  select rm.session_id,
         case when g.teams then picks ->> rm.session_id::text else null end
  from public.room_members rm
  join public.table_sessions ts on ts.id = rm.session_id and ts.status = 'active'
  where rm.room_id = r.id and rm.left_at is null
    and case
      when g.teams then picks ->> rm.session_id::text in ('a', 'b')
      else coalesce(picks ->> rm.session_id::text, '') <> 'obs'
    end;

  select count(*) filter (where team = 'a'), count(*) filter (where team = 'b'), count(*)
  into team_a, team_b, players
  from pg_temp.starting_players;
  if (g.teams and (team_a < 2 or team_b < 2)) or players < g.min_players
    or players > g.max_players
  then
    raise exception using errcode = 'P0001', message = 'not_enough_players';
  end if;

  next_no := private.current_game_no(r.game_state) + 1;
  delete from public.table_votes where room_id = r.id;
  insert into public.game_players (room_id, game_no, session_id, team, seat_order)
  select r.id, next_no, s.session_id, s.team,
         (row_number() over (order by random()))::smallint
  from pg_temp.starting_players s;
  update public.rooms
  set concept = g.id, last_activity_at = now(),
      game_state = jsonb_build_object('gameNo', next_no)
  where id = r.id;
  return next_no;
end;
$$;

-- 3. Kapsül Anlat's helpers ------------------------------------------------------------------------
-- The side model's Tabu helpers go; the new ones below take their place.
drop function private.tabu_playing_room(uuid, uuid);
drop function private.open_turn(public.rooms, integer, integer);

-- The caller at a table playing Kapsül Anlat: the table (held), the caller's table session, whether
-- the caller owns the table, and the caller's role in the current turn (pure/kapsulAnlat.ts →
-- roleOf): 'describer', 'guesser' (the describer's teammates), 'opponent' (the other team),
-- 'observer' (not a player of the game: watching, no pick, or sat down during it) or 'left'.
create function private.kapsul_room(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  gp public.game_players;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'tabu' or r.game_state ->> 'phase' is distinct from 'playing' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select * into gp from public.game_players g
  where g.room_id = r.id and g.game_no = private.current_game_no(r.game_state)
    and g.session_id = p.session_id;
  return query select r, p.session_id, p.is_leader::boolean,
    case
      when gp.session_id is null then 'observer'
      when gp.left_at is not null then 'left'
      when gp.team is distinct from r.game_state ->> 'describingTeam' then 'opponent'
      when p.session_id::text = r.game_state ->> 'describer' then 'describer'
      else 'guesser'
    end;
end;
$$;

revoke all on function private.kapsul_room(uuid, uuid) from public, anon, authenticated;

-- A team's players still in the game, in the order frozen at its start.
create function private.kapsul_still_playing(
  target_room_id uuid,
  game_number integer,
  target_team text
)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(gp.session_id order by gp.seat_order), '{}')
  from public.game_players gp
  where gp.room_id = target_room_id and gp.game_no = game_number and gp.team = target_team
    and gp.left_at is null;
$$;

revoke all on function private.kapsul_still_playing(uuid, integer, text) from public, anon, authenticated;

-- The describer of a turn (pure/kapsulAnlat.ts → describerFor): the team's n-th turn goes to its
-- n-th person still playing, round again; null for a team with nobody left.
create function private.kapsul_describer(target_room_id uuid, game_number integer, turn_number integer)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  players uuid[];
begin
  players := private.kapsul_still_playing(
    target_room_id, game_number, case when turn_number % 2 = 1 then 'a' else 'b' end
  );
  if cardinality(players) = 0 then
    return null;
  end if;
  return players[((ceil(turn_number / 2.0)::integer - 1) % cardinality(players)) + 1];
end;
$$;

revoke all on function private.kapsul_describer(uuid, integer, integer) from public, anon, authenticated;

-- Opens turn `turn_number` ready: its describer, a fresh card list (private.deal_turn) and the ready
-- clock. Returns the game_state keys of the ready turn, or null when the describing team has nobody
-- left (the caller ends the game).
create function private.kapsul_open_turn(r public.rooms, turn_number integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := private.kapsul_config();
  game_number integer := private.current_game_no(r.game_state);
  describer uuid;
  ids uuid[];
  ready timestamptz;
begin
  describer := private.kapsul_describer(r.id, game_number, turn_number);
  if describer is null then
    return null;
  end if;
  ids := private.deal_turn(r.id, (cfg ->> 'cardsPerTurn')::integer);
  ready := now() + make_interval(secs => (cfg ->> 'readySeconds')::integer);
  insert into public.tabu_turns
    (room_id, game_no, turn_no, describer_session_id, card_id, card_ids, card_index, ends_at,
     ready_ends_at)
  values (r.id, game_number, turn_number, describer, ids[1], ids, 0, null, ready);
  return jsonb_build_object(
    'turnNo', turn_number,
    'describingTeam', case when turn_number % 2 = 1 then 'a' else 'b' end,
    'describer', describer,
    'turnPhase', 'ready', 'readyEndsAt', ready,
    'cardIndex', 0, 'passesUsed', 0,
    'counts', jsonb_build_object('correct', 0, 'pass', 0, 'taboo', 0)
  );
end;
$$;

revoke all on function private.kapsul_open_turn(public.rooms, integer) from public, anon, authenticated;

-- The game reached its end: every player still in it gets a result with the team's score (won:
-- the team scored more; a draw is no win), and lastGame gets the scores, the winner and the
-- highlights (pure/kapsulAnlat.ts → highlight): "En çok bildiren anlatıcı", the most Doğru, and
-- "Yasak avcısı", the most Yasak! other than that describer; a tie goes to the earlier seat. Only
-- players still in the game are shown.
create function private.kapsul_finish(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  game_number integer := private.current_game_no(r.game_state);
  a_score integer := (r.game_state -> 'scores' ->> 'a')::integer;
  b_score integer := (r.game_state -> 'scores' ->> 'b')::integer;
  best jsonb;
  hunter jsonb;
begin
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ts.user_id, r.id, 'tabu', 'voice',
         case when gp.team = 'a' then a_score else b_score end,
         case when gp.team = 'a' then a_score > b_score else b_score > a_score end
  from public.game_players gp
  join public.table_sessions ts on ts.id = gp.session_id
  where gp.room_id = r.id and gp.game_no = game_number and gp.left_at is null;

  select jsonb_build_object('sessionId', gp.session_id, 'count', count(*)) into best
  from public.game_events e
  join public.tabu_turns t on t.id = e.turn_id
  join public.game_players gp
    on gp.room_id = r.id and gp.game_no = game_number and gp.session_id = e.session_id
  where t.room_id = r.id and t.game_no = game_number and e.type = 'correct'
    and gp.left_at is null
  group by gp.session_id, gp.seat_order
  order by count(*) desc, gp.seat_order
  limit 1;

  select jsonb_build_object('sessionId', gp.session_id, 'count', count(*)) into hunter
  from public.game_events e
  join public.tabu_turns t on t.id = e.turn_id
  join public.game_players gp
    on gp.room_id = r.id and gp.game_no = game_number and gp.session_id = e.session_id
  where t.room_id = r.id and t.game_no = game_number and e.type = 'taboo'
    and gp.left_at is null
    and gp.session_id::text is distinct from best ->> 'sessionId'
  group by gp.session_id, gp.seat_order
  order by count(*) desc, gp.seat_order
  limit 1;

  insert into public.game_events (room_id, type, payload)
  values (r.id, 'game_completed', jsonb_build_object('scores', r.game_state -> 'scores'));

  return private.end_game(r.id, false, jsonb_build_object(
    'scores', r.game_state -> 'scores',
    'winner', case when a_score > b_score then 'a' when b_score > a_score then 'b' end,
    'teams', r.game_state -> 'teams',
    'bestDescriber', best,
    'tabooHunter', hunter
  ));
end;
$$;

revoke all on function private.kapsul_finish(public.rooms) from public, anon, authenticated;

-- 4. The actions ---------------------------------------------------------------------------------
-- tabu/start: the owner, from the pre-game page (private.start_game: Mor and Pembe of at least two
-- each; who chose nothing or to watch watches). Mor describes the first turn; it opens ready.
create function public.tabu_start(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := private.kapsul_config();
  game_number integer;
  r public.rooms;
  teams jsonb;
  ready jsonb;
begin
  game_number := private.start_game(target_user_id, target_room_id, 'tabu');
  select * into r from public.rooms where id = target_room_id;
  select jsonb_build_object(
           'a', coalesce(jsonb_agg(gp.session_id order by gp.seat_order)
                           filter (where gp.team = 'a'), '[]'::jsonb),
           'b', coalesce(jsonb_agg(gp.session_id order by gp.seat_order)
                           filter (where gp.team = 'b'), '[]'::jsonb)
         )
  into teams
  from public.game_players gp
  where gp.room_id = r.id and gp.game_no = game_number;

  r.game_state := jsonb_build_object(
    'gameNo', game_number, 'phase', 'playing',
    'totalTurns', cfg -> 'totalTurns', 'turnSeconds', cfg -> 'turnSeconds',
    'maxPasses', cfg -> 'maxPasses', 'cardsPerTurn', cfg -> 'cardsPerTurn',
    'countdownSeconds', cfg -> 'countdownSeconds',
    'teams', teams, 'left', '[]'::jsonb, 'scores', jsonb_build_object('a', 0, 'b', 0)
  );
  ready := private.kapsul_open_turn(r, 1);
  update public.rooms
  set game_started_at = now(), last_activity_at = now(), game_state = r.game_state || ready
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/begin-turn ("Turu başlat"): the describer at any time; anyone at the table once readyEndsAt
-- has passed. The clock is set at once: the marks open after the countdown (startsAt) and close at
-- endsAt. A describer who left while the turn waited is replaced by the next of the team still
-- playing; a team with nobody left ends the game. Anything else leaves the table as it is, so the
-- first press wins.
create or replace function public.tabu_begin_turn(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := private.kapsul_config();
  p record;
  r public.rooms;
  t public.tabu_turns;
  describer uuid;
  starts timestamptz;
  ends timestamptz;
begin
  select * into p from private.kapsul_room(target_user_id, target_room_id);
  r := p.room;
  if r.game_state ->> 'turnPhase' is distinct from 'ready' then
    return r;
  end if;
  if p.role <> 'describer' and now() < (r.game_state ->> 'readyEndsAt')::timestamptz then
    return r;
  end if;
  describer := (r.game_state ->> 'describer')::uuid;
  if not exists (
    select 1 from public.game_players gp
    where gp.room_id = r.id and gp.game_no = private.current_game_no(r.game_state)
      and gp.session_id = describer and gp.left_at is null
  ) then
    describer := private.kapsul_describer(
      r.id, private.current_game_no(r.game_state), (r.game_state ->> 'turnNo')::integer
    );
    if describer is null then
      return private.end_game(r.id, true);
    end if;
  end if;

  select * into t from public.tabu_turns
  where room_id = r.id
    and game_no = private.current_game_no(r.game_state)
    and turn_no = (r.game_state ->> 'turnNo')::integer
  for update;
  starts := now() + make_interval(secs => (cfg ->> 'countdownSeconds')::integer);
  ends := starts + make_interval(secs => (r.game_state ->> 'turnSeconds')::integer);
  update public.tabu_turns
  set describer_session_id = describer, started_at = starts, ends_at = ends
  where id = t.id;
  perform private.use_card(r.id, t.card_ids[1]);
  insert into public.game_events (room_id, turn_id, session_id, type, payload)
  values (r.id, t.id, describer, 'turn_started', jsonb_build_object('turnNo', t.turn_no));

  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'readyEndsAt') || jsonb_build_object(
        'turnPhase', 'running', 'startsAt', starts, 'endsAt', ends, 'describer', describer
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/turn-cards: the running turn's ordered card list, for the describer, the other team and the
-- watchers. The describer's teammates: not_describer; a player who left the game: not_player.
-- Before the turn starts: turn_not_started; on its end screen: turn_over.
create or replace function public.tabu_turn_cards(target_user_id uuid, target_room_id uuid)
returns table (turn_no integer, card_index integer, word text, forbidden text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  t public.tabu_turns;
begin
  select * into p from private.kapsul_room(target_user_id, target_room_id);
  if p.role = 'left' then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if p.role = 'guesser' then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if (p.room).game_state ->> 'turnPhase' = 'ready' then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if (p.room).game_state ->> 'turnPhase' = 'over' then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  select * into t from public.tabu_turns tt
  where tt.room_id = (p.room).id
    and tt.game_no = private.current_game_no((p.room).game_state)
    and tt.turn_no = ((p.room).game_state ->> 'turnNo')::integer;
  return query
    select t.turn_no, (ord - 1)::integer, c.word, c.forbidden
    from unnest(t.card_ids) with ordinality as list(card_id, ord)
    join public.cards c on c.id = list.card_id
    order by ord;
end;
$$;

-- tabu/mark: Doğru ('correct') and Pas ('pass') from the describer (anyone else: not_describer),
-- Yasak! ('taboo') from the other team (anyone else: not_judge); a watcher or a player who left:
-- not_player. Every press names its turn and card: another turn, a closed card, one ahead or past
-- the list is ignored, so the first press on a card wins. Before the countdown ends:
-- turn_not_started; once the clock ran out: turn_over; Pas past the third: no_passes_left. A
-- describer who left leaves the turn without presses until it runs out. Doğru +1 and Yasak! −1 for
-- the describing team.
create or replace function public.tabu_mark(
  target_user_id uuid,
  target_room_id uuid,
  turn_number integer,
  index integer,
  result text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  t public.tabu_turns;
  team text;
  delta integer;
  closed_word text;
begin
  if result not in ('correct', 'pass', 'taboo') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into p from private.kapsul_room(target_user_id, target_room_id);
  r := p.room;
  if p.role in ('observer', 'left') then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if result = 'taboo' and p.role <> 'opponent' then
    raise exception using errcode = 'P0001', message = 'not_judge';
  end if;
  if result <> 'taboo' and p.role <> 'describer' then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if r.game_state ->> 'turnPhase' = 'ready' then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if r.game_state ->> 'turnPhase' = 'over' then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;

  select * into t from public.tabu_turns
  where room_id = r.id
    and game_no = private.current_game_no(r.game_state)
    and turn_no = (r.game_state ->> 'turnNo')::integer
  for update;
  if t.turn_no <> turn_number or t.card_index <> index
     or index >= coalesce(array_length(t.card_ids, 1), 0) then
    return r;
  end if;
  if now() < t.started_at then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if now() >= t.ends_at then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  -- Yasak! needs someone describing; the describer's own presses need it present (its role).
  if result = 'taboo' and exists (
    select 1 from public.game_players gp
    where gp.room_id = r.id and gp.game_no = t.game_no
      and gp.session_id = t.describer_session_id and gp.left_at is not null
  ) then
    return r;
  end if;
  if result = 'pass' and t.passes_used >= (r.game_state ->> 'maxPasses')::integer then
    raise exception using errcode = 'P0001', message = 'no_passes_left';
  end if;

  team := r.game_state ->> 'describingTeam';
  delta := case result when 'correct' then 1 when 'taboo' then -1 else 0 end;
  -- The closed card's word goes to the table (game_events) only now, after the press.
  select word into closed_word from public.cards where id = t.card_ids[index + 1];
  insert into public.game_events (room_id, turn_id, session_id, type, payload)
  values (r.id, t.id, p.session_id, result, jsonb_build_object('cardIndex', index)),
         (r.id, t.id, null, 'card_closed',
          jsonb_build_object('cardIndex', index, 'word', closed_word, 'result', result));
  update public.tabu_turns
  set score = score + delta,
      passes_used = passes_used + case when result = 'pass' then 1 else 0 end,
      card_index = index + 1,
      card_id = coalesce(card_ids[index + 2], card_id)
  where id = t.id;
  perform private.use_card(r.id, t.card_ids[index + 2]);

  update public.rooms
  set last_activity_at = now(),
      game_state = game_state || jsonb_build_object(
        'scores', jsonb_set(game_state -> 'scores', array[team],
                            to_jsonb((game_state -> 'scores' ->> team)::integer + delta)),
        'passesUsed', t.passes_used + case when result = 'pass' then 1 else 0 end,
        'cardIndex', index + 1,
        'counts', jsonb_set(game_state -> 'counts', array[result],
                            to_jsonb((game_state -> 'counts' ->> result)::integer + 1))
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/end-turn: anyone at the table once the clock has run out; idempotent. The turn's end screen
-- ("Tur sonu"): its closed cards with how they closed, its score and counts, and the next team and
-- describer (none after the last turn). The owner moves on at once (tabu/advance), anyone after
-- nextAt.
create or replace function public.tabu_end_turn(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := private.kapsul_config();
  p record;
  r public.rooms;
  t public.tabu_turns;
  game_number integer;
  summary jsonb;
  upcoming jsonb := null;
  next_no integer;
begin
  select * into p from private.kapsul_room(target_user_id, target_room_id);
  r := p.room;
  if r.game_state ->> 'turnPhase' is distinct from 'running'
     or now() < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  game_number := private.current_game_no(r.game_state);
  select * into t from public.tabu_turns
  where room_id = r.id and game_no = game_number
    and turn_no = (r.game_state ->> 'turnNo')::integer;

  select jsonb_build_object(
           'turnNo', t.turn_no,
           'team', r.game_state ->> 'describingTeam',
           'describer', t.describer_session_id,
           'score', t.score,
           'counts', r.game_state -> 'counts',
           'cards', coalesce(
             jsonb_agg(jsonb_build_object('word', e.payload ->> 'word',
                                          'result', e.payload ->> 'result')
                       order by (e.payload ->> 'cardIndex')::integer)
               filter (where e.id is not null),
             '[]'::jsonb)
         )
  into summary
  from (select 1) one
  left join public.game_events e on e.turn_id = t.id and e.type = 'card_closed';

  next_no := t.turn_no + 1;
  if next_no <= (r.game_state ->> 'totalTurns')::integer then
    upcoming := jsonb_build_object(
      'team', case when next_no % 2 = 1 then 'a' else 'b' end,
      'describer', private.kapsul_describer(r.id, game_number, next_no)
    );
  end if;

  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'startsAt' - 'endsAt') || jsonb_build_object(
        'turnPhase', 'over',
        'nextAt', now() + make_interval(secs => (cfg ->> 'nextSeconds')::integer),
        'lastTurn', summary,
        'next', upcoming
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/advance ("Sonraki tura geç", "Sonuçları gör"): the owner on the turn's end screen at once,
-- anyone at the table after nextAt; idempotent. The next turn opens ready; after the last one the
-- game ends with its results (private.kapsul_finish). A team with nobody left ends the game.
create function public.tabu_advance(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  ready jsonb;
begin
  select * into p from private.kapsul_room(target_user_id, target_room_id);
  r := p.room;
  if r.game_state ->> 'turnPhase' is distinct from 'over' then
    return r;
  end if;
  if not p.is_owner and now() < (r.game_state ->> 'nextAt')::timestamptz then
    return r;
  end if;
  if (r.game_state ->> 'turnNo')::integer >= (r.game_state ->> 'totalTurns')::integer then
    return private.kapsul_finish(r);
  end if;
  ready := private.kapsul_open_turn(r, (r.game_state ->> 'turnNo')::integer + 1);
  if ready is null then
    return private.end_game(r.id, true);
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'nextAt' - 'lastTurn' - 'next') || ready
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- 5. Grants --------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.tabu_start(uuid, uuid)',
    'public.tabu_begin_turn(uuid, uuid)',
    'public.tabu_turn_cards(uuid, uuid)',
    'public.tabu_mark(uuid, uuid, integer, integer, text)',
    'public.tabu_end_turn(uuid, uuid)',
    'public.tabu_advance(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
