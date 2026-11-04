-- Faz 4 step 4.6.1 (docs/SPEC_V4.md §4.F "Adım 4.6.1: Kapsül Anlat", K-5): Tabu at a table of
-- people. Mor ('a') and Pembe ('b'), at least two each, from the frame's pre-game page; 6 turns of
-- 60 s, 3 passes a turn. Turns go Mor, Pembe, Mor…; on its team's k-th turn the team's k-th player
-- (in the game's seat order) describes. A turn: Tur öncesi (ready: the describer presses "Turu
-- başlat", or after 10 s it starts anyway) → 3-2-1 (startsAt) → the clock (endsAt) → Tur sonu
-- (summary: the owner presses "Sonraki tura geç", or after 15 s any phone's advance moves on). After
-- the last turn the game ends: the winning team, "En çok bildiren anlatıcı" and "Yasak avcısı".
--
-- Who presses what: the describer Doğru (+1) and Pas (0, three a turn); every player of the other
-- team Yasak! (−1 for the describing team, the card is passed; the first press wins); the
-- describer's team guesses aloud and presses nothing; watchers press nothing.
--
-- Where what lives:
-- - tabu_turns: each turn's dealt card list (card_ids) and how far it got; closed to clients. Only
--   tabu/turn-cards answers from it, to the describer, the other team and the watchers (rule 3);
--   the describer's team and whoever left the game never get it.
-- - rooms.game_state, open to the table: the phase, its step and clock, the teams in seat order,
--   who left (gone), the describer, the scores, the turn's presses (counts) and its closed cards'
--   words (a word opens only once its card is closed), the turn just played (lastTurn) and the
--   presses per person (stats: Doğru by describer, Yasak! by presser). The end moves to
--   game_state.lastGame.tabu.
--
-- Leaving: a player who leaves the game or the table is gone. A describer who leaves in Tur öncesi
-- hands the turn to the team's next player; one who leaves while the clock runs leaves the turn to
-- run out with nobody to press Doğru or Pas (§4.F). A team of one describes every turn; a team left
-- with nobody ends the game at the next advance (technical decision, docs/decisions/kapsul-anlat.md).
--
-- Locks (rule 10): check-in → rooms (private.room_phone) → game_players → tabu_turns →
-- room_used_cards. A player leaving stamps game_players.left_at while the table is held; the
-- trigger here updates the turn and game_state without a new lock.
--
-- The side model's Tabu goes: its begin-turn, mark, end-turn and turn-cards, and the helpers only
-- they called. private.deal_turn and private.use_card stay and deal this game's cards.

-- 1. Rules -------------------------------------------------------------------------------------
-- pure/tabuGame.ts → TABU_GAME (tabuGame.test.ts reads the numbers here).
create function private.tabu_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'turnSeconds', 60, 'totalTurns', 6, 'maxPasses', 3, 'readySeconds', 10,
    'countdownSeconds', 3, 'summarySeconds', 15, 'cardsPerTurn', 40, 'minPlayers', 4,
    'maxPlayers', 12
  );
$$;

create function private.tabu_seconds(name text)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => (private.tabu_config() ->> name)::integer);
$$;

-- 2. The side model's Tabu goes ----------------------------------------------------------------
drop function public.tabu_begin_turn(uuid, uuid);
drop function public.tabu_end_turn(uuid, uuid);
drop function public.tabu_mark(uuid, uuid, integer, integer, text);
drop function public.tabu_turn_cards(uuid, uuid);
drop function private.tabu_playing_room(uuid, uuid);
drop function private.start_voice_tabu(public.rooms, integer, integer, integer, integer);
drop function private.open_turn(public.rooms, integer, integer);
drop function private.tabu_ready_seconds();

-- 3. Helpers -----------------------------------------------------------------------------------
-- The team that describes turn `turn_no`: Mor, Pembe, Mor… (pure/tabuGame.ts → teamOfTurn).
create function private.tabu_team_of(turn_no integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when turn_no % 2 = 1 then 'a' else 'b' end;
$$;

-- The team's players still in the game, in seat order.
create function private.tabu_members(st jsonb, team text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(m.sid order by m.n), '{}'::text[])
  from jsonb_array_elements_text(coalesce(st -> 'teams' -> team, '[]'::jsonb))
    with ordinality as m (sid, n)
  where not coalesce(st -> 'gone', '[]'::jsonb) ? m.sid;
$$;

-- Turn `turn_no`'s describer: on its team's k-th turn the team's k-th player still in the game,
-- round again when the team is shorter; null when nobody is left (pure/tabuGame.ts → describerOf).
create function private.tabu_describer(st jsonb, turn_no integer)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when cardinality(t.m) = 0 then null
              else (t.m)[(((turn_no + 1) / 2 - 1) % cardinality(t.m)) + 1]::uuid end
  from (select private.tabu_members(st, private.tabu_team_of(turn_no)) as m) t;
$$;

-- A team with nobody left in the game ends it.
create function private.tabu_team_empty(st jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(private.tabu_members(st, 'a')) = 0
      or cardinality(private.tabu_members(st, 'b')) = 0;
$$;

-- The turn `st` is on (locked).
create function private.tabu_turn(target_room_id uuid, st jsonb)
returns public.tabu_turns
language sql
security definer
set search_path = ''
as $$
  select * from public.tabu_turns
  where room_id = target_room_id
    and game_no = private.current_game_no(st)
    and turn_no = (st ->> 'turnNo')::integer
  for update;
$$;

-- The most presses in a stats map ({sid: n}), the earlier seat first on a tie; null when empty.
create function private.tabu_top(counts jsonb, seats jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('sid', c.key, 'count', c.value::integer)
  from jsonb_each_text(coalesce(counts, '{}'::jsonb)) as c (key, value)
  left join jsonb_array_elements_text(coalesce(seats, '[]'::jsonb)) with ordinality as s (sid, n)
    on s.sid = c.key
  where c.value::integer > 0
  order by c.value::integer desc, s.n nulls last
  limit 1;
$$;

-- 4. The phases --------------------------------------------------------------------------------
-- Tur öncesi of turn `turn_no`: a fresh card list, the describer, the ready clock; the turn's
-- presses start over.
create function private.tabu_open_turn(target_room_id uuid, st jsonb, turn_no integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids uuid[];
  describer uuid := private.tabu_describer(st, turn_no);
  ready_ends timestamptz := now() + private.tabu_seconds('readySeconds');
  r public.rooms;
begin
  ids := private.deal_turn(target_room_id, (private.tabu_config() ->> 'cardsPerTurn')::integer);
  insert into public.tabu_turns
    (room_id, game_no, turn_no, describer_session_id, card_id, card_ids, card_index, ends_at,
     ready_ends_at)
  values (target_room_id, private.current_game_no(st), turn_no, describer, ids[1], ids, 0, null,
          ready_ends);
  update public.rooms
  set last_activity_at = now(),
      game_state = (st - 'startsAt' - 'lastTurn')
        || jsonb_build_object(
          'phase', 'ready',
          'step', coalesce((st ->> 'step')::integer, 0) + 1,
          'endsAt', ready_ends,
          'turnNo', turn_no,
          'describer', describer,
          'cardIndex', 0,
          'passesUsed', 0,
          'counts', jsonb_build_object('correct', 0, 'pass', 0, 'taboo', 0),
          'words', '[]'::jsonb
        )
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- The clock of the ready turn: the 3-2-1, then the turn's 60 s. Its first card counts as used.
create function private.tabu_run_turn(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  t public.tabu_turns := private.tabu_turn(r.id, r.game_state);
  starts timestamptz := now() + private.tabu_seconds('countdownSeconds');
  ends timestamptz := now() + private.tabu_seconds('countdownSeconds')
    + private.tabu_seconds('turnSeconds');
begin
  update public.tabu_turns
  set started_at = starts, ends_at = ends, ready_ends_at = null
  where id = t.id;
  perform private.use_card(r.id, t.card_ids[1]);
  update public.rooms
  set last_activity_at = now(),
      game_state = st || jsonb_build_object(
        'phase', 'turn',
        'step', (st ->> 'step')::integer + 1,
        'startsAt', starts,
        'endsAt', ends
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- The end: a result for every player still in the game (their team's score; won, lost, or a draw
-- as null), then the frame's end (private.end_game) and what the end screen shows in
-- lastGame.tabu. The win counts toward the win badge as Sesli Tabu's did (mode 'voice', §4.F).
create function private.tabu_finish(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  score_a integer := coalesce((r.game_state -> 'scores' ->> 'a')::integer, 0);
  score_b integer := coalesce((r.game_state -> 'scores' ->> 'b')::integer, 0);
  winner text := case when score_a > score_b then 'a' when score_b > score_a then 'b' end;
  result jsonb;
  done public.rooms;
begin
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ts.user_id, r.id, 'tabu', 'voice',
         case gp.team when 'a' then score_a else score_b end,
         case when winner is null then null else gp.team = winner end
  from public.game_players gp
  join public.table_sessions ts on ts.id = gp.session_id
  where gp.room_id = r.id and gp.game_no = no and gp.left_at is null
    and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text;

  result := jsonb_build_object(
    'scores', coalesce(st -> 'scores', '{}'::jsonb),
    'winner', winner,
    'seats', coalesce(st -> 'seats', '[]'::jsonb),
    'teams', coalesce(st -> 'teams', '{}'::jsonb),
    'gone', coalesce(st -> 'gone', '[]'::jsonb),
    'lastTurn', st -> 'lastTurn',
    'topDescriber', private.tabu_top(st -> 'stats' -> 'correct', st -> 'seats'),
    'tabooHunter', private.tabu_top(st -> 'stats' -> 'taboo', st -> 'seats')
  );
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,tabu}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- The turn's clock ran out: what it scored goes to lastTurn; after the last turn the game ends,
-- otherwise Tur sonu.
create function private.tabu_summarize(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  counts jsonb := coalesce(r.game_state -> 'counts', '{}'::jsonb);
  summary jsonb;
begin
  summary := jsonb_build_object(
    'turnNo', (st ->> 'turnNo')::integer,
    'team', private.tabu_team_of((st ->> 'turnNo')::integer),
    'describer', st -> 'describer',
    'score', coalesce((counts ->> 'correct')::integer, 0) - coalesce((counts ->> 'taboo')::integer, 0),
    'counts', counts,
    'words', coalesce(st -> 'words', '[]'::jsonb)
  );
  st := (st - 'startsAt') || jsonb_build_object('lastTurn', summary);
  if (st ->> 'turnNo')::integer >= (st ->> 'totalTurns')::integer
     or private.tabu_team_empty(st) then
    r.game_state := st;
    return private.tabu_finish(r);
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = st || jsonb_build_object(
        'phase', 'summary',
        'step', (st ->> 'step')::integer + 1,
        'endsAt', now() + private.tabu_seconds('summarySeconds')
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- One step on from the phase `r` is in: its time ran out, or the describer or the owner pressed.
-- A team with nobody left ends the game.
create function private.tabu_step(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  phase text := r.game_state ->> 'phase';
begin
  if phase = 'turn' then
    return private.tabu_summarize(r);
  end if;
  if private.tabu_team_empty(r.game_state) then
    return private.tabu_finish(r);
  end if;
  if phase = 'ready' then
    return private.tabu_run_turn(r);
  elsif phase = 'summary' then
    return private.tabu_open_turn(r.id, r.game_state, (r.game_state ->> 'turnNo')::integer + 1);
  end if;
  return r;
end;
$$;

-- The caller at a running game: the table (locked), whether the caller is its owner, the caller's
-- team (null: watching or gone) and whether the caller was dealt into this game at all.
create function private.tabu_seat(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, team text, dealt boolean)
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
  if r.concept is distinct from 'tabu' or not (r.game_state ? 'phase') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select * into gp from public.game_players g
  where g.room_id = r.id and g.game_no = private.current_game_no(r.game_state)
    and g.session_id = p.session_id;
  return query select r, p.session_id, p.is_leader,
    case when gp.left_at is null
              and not coalesce(r.game_state -> 'gone', '[]'::jsonb) ? p.session_id::text
         then gp.team end,
    gp.session_id is not null;
end;
$$;

-- 5. The actions -------------------------------------------------------------------------------
-- tabu/start: the owner, from the pre-game page (private.start_game: Mor and Pembe of at least two
-- each; who chose nothing or to watch watches). Turn 1 opens in Tur öncesi.
create function public.tabu_start(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  no integer;
  seats jsonb;
  team_a jsonb;
  team_b jsonb;
begin
  no := private.start_game(target_user_id, target_room_id, 'tabu');
  select coalesce(jsonb_agg(session_id::text order by seat_order), '[]'::jsonb),
         coalesce(jsonb_agg(session_id::text order by seat_order) filter (where team = 'a'),
                  '[]'::jsonb),
         coalesce(jsonb_agg(session_id::text order by seat_order) filter (where team = 'b'),
                  '[]'::jsonb)
  into seats, team_a, team_b
  from public.game_players where room_id = target_room_id and game_no = no;
  return private.tabu_open_turn(
    target_room_id,
    jsonb_build_object(
      'gameNo', no,
      'step', 0,
      'totalTurns', (private.tabu_config() ->> 'totalTurns')::integer,
      'maxPasses', (private.tabu_config() ->> 'maxPasses')::integer,
      'seats', seats,
      'teams', jsonb_build_object('a', team_a, 'b', team_b),
      'gone', '[]'::jsonb,
      'scores', jsonb_build_object('a', 0, 'b', 0),
      'stats', jsonb_build_object('correct', '{}'::jsonb, 'taboo', '{}'::jsonb)
    ),
    1
  );
end;
$$;

-- tabu/begin-turn: the describer in Tur öncesi ("Turu başlat"); another step changes nothing.
create function public.tabu_begin_turn(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.tabu_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'ready' or (st ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  if seat.team is null or st ->> 'describer' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  return private.tabu_step(seat.room);
end;
$$;

-- tabu/turn-cards: the running turn's card list (from the 3-2-1 on), for the describer, every player
-- of the other team and the watchers; the describer's team and whoever left the game hear
-- not_describer (rule 3). Before the turn runs: turn_not_started.
create function public.tabu_turn_cards(target_user_id uuid, target_room_id uuid)
returns table (turn_no integer, card_index integer, word text, forbidden text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
  t public.tabu_turns;
begin
  select * into seat from private.tabu_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if not (
    (seat.team is not null and st ->> 'describer' = seat.session_id::text)
    or (seat.team is not null
        and seat.team <> private.tabu_team_of((st ->> 'turnNo')::integer))
    or not seat.dealt
  ) then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if st ->> 'phase' <> 'turn' then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  select * into t from public.tabu_turns tt
  where tt.room_id = (seat.room).id
    and tt.game_no = private.current_game_no(st)
    and tt.turn_no = (st ->> 'turnNo')::integer;
  return query
    select t.turn_no, (list.ord - 1)::integer, c.word, c.forbidden
    from unnest(t.card_ids) with ordinality as list (card_id, ord)
    join public.cards c on c.id = list.card_id
    order by list.ord;
end;
$$;

-- tabu/mark: a press on card `index` of the turn at `at_step`. Doğru and Pas: the describer (Pas
-- three a turn: no_passes_left); Yasak!: a player of the other team (not_judge). Only while the
-- clock runs: before startsAt turn_not_started, from endsAt turn_over. Another step or another card
-- (already closed, or two phones on the same one) changes nothing: the first press wins.
create function public.tabu_mark(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  index integer,
  result text
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
  t public.tabu_turns;
  team text;
  delta integer;
  closed_word text;
  stat_key text;
  stat_of text;
begin
  if result not in ('correct', 'pass', 'taboo') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into seat from private.tabu_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if st ->> 'phase' <> 'turn' or (st ->> 'step')::integer <> at_step then
    return r;
  end if;
  team := private.tabu_team_of((st ->> 'turnNo')::integer);
  if result = 'taboo' then
    if seat.team is null or seat.team = team then
      raise exception using errcode = 'P0001', message = 'not_judge';
    end if;
  elsif seat.team is null or st ->> 'describer' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if now() < (st ->> 'startsAt')::timestamptz then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if now() >= (st ->> 'endsAt')::timestamptz then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  t := private.tabu_turn(r.id, st);
  if (st ->> 'cardIndex')::integer <> index or t.card_index <> index
     or index >= coalesce(array_length(t.card_ids, 1), 0) then
    return r;
  end if;
  if result = 'pass' and t.passes_used >= (st ->> 'maxPasses')::integer then
    raise exception using errcode = 'P0001', message = 'no_passes_left';
  end if;

  delta := case result when 'correct' then 1 when 'taboo' then -1 else 0 end;
  -- The closed card's word opens to the table only now, after the press.
  select c.word into closed_word from public.cards c where c.id = t.card_ids[index + 1];
  update public.tabu_turns
  set score = score + delta,
      passes_used = passes_used + case when result = 'pass' then 1 else 0 end,
      card_index = index + 1,
      card_id = coalesce(card_ids[index + 2], card_id)
  where id = t.id;
  perform private.use_card(r.id, t.card_ids[index + 2]);

  st := jsonb_set(st, array['scores', team],
                  to_jsonb(coalesce((st -> 'scores' ->> team)::integer, 0) + delta));
  st := jsonb_set(st, array['counts', result],
                  to_jsonb(coalesce((st -> 'counts' ->> result)::integer, 0) + 1));
  st := jsonb_set(st, '{words}', coalesce(st -> 'words', '[]'::jsonb)
                  || jsonb_build_array(jsonb_build_object('word', closed_word, 'result', result)));
  st := st || jsonb_build_object(
    'cardIndex', index + 1,
    'passesUsed', t.passes_used + case when result = 'pass' then 1 else 0 end
  );
  if result <> 'pass' then
    stat_key := case result when 'correct' then 'correct' else 'taboo' end;
    stat_of := seat.session_id::text;
    st := jsonb_set(
      st, array['stats', stat_key, stat_of],
      to_jsonb(coalesce((st -> 'stats' -> stat_key ->> stat_of)::integer, 0) + 1)
    );
  end if;
  update public.rooms set game_state = st, last_activity_at = now()
  where id = r.id returning * into r;
  return r;
end;
$$;

-- tabu/next: the owner in Tur sonu ("Sonraki tura geç"); another step changes nothing.
create function public.tabu_next(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.tabu_seat(target_user_id, target_room_id);
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'summary' or (st ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  return private.tabu_step(seat.room);
end;
$$;

-- tabu/advance: anyone at the table once the phase's time is up (a second of slack for the phones'
-- clocks); idempotent: early, it changes nothing.
create function public.tabu_advance(target_user_id uuid, target_room_id uuid)
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
  if r.concept is distinct from 'tabu' or not (r.game_state ? 'phase')
     or now() + interval '1 second' < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.tabu_step(r);
end;
$$;

-- 6. Leaving -----------------------------------------------------------------------------------
-- A player who leaves the game or the table (any road stamps game_players.left_at while holding the
-- table) is gone. In Tur öncesi a leaving describer hands the turn to the team's next player; a team
-- left with nobody runs its phase out now, and the next advance ends the game.
create function private.tabu_on_player_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  st jsonb;
  sid text := new.session_id::text;
  next_describer uuid;
begin
  select * into r from public.rooms where id = new.room_id;
  if r.concept is distinct from 'tabu' or not (r.game_state ? 'phase')
     or private.current_game_no(r.game_state) <> new.game_no
     or coalesce(r.game_state -> 'gone', '[]'::jsonb) ? sid then
    return new;
  end if;
  st := jsonb_set(r.game_state, '{gone}', coalesce(r.game_state -> 'gone', '[]'::jsonb) || to_jsonb(sid));
  if st ->> 'phase' = 'ready' and st ->> 'describer' = sid then
    next_describer := private.tabu_describer(st, (st ->> 'turnNo')::integer);
    st := jsonb_set(st, '{describer}', coalesce(to_jsonb(next_describer), 'null'::jsonb));
    update public.tabu_turns
    set describer_session_id = next_describer
    where room_id = r.id and game_no = new.game_no and turn_no = (st ->> 'turnNo')::integer;
  end if;
  if private.tabu_team_empty(st) then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;
  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  return new;
end;
$$;

revoke all on function private.tabu_on_player_left() from public, anon, authenticated;

create trigger game_players_tabu_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.tabu_on_player_left();

-- 7. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.tabu_start(uuid, uuid)',
    'public.tabu_begin_turn(uuid, uuid, integer)',
    'public.tabu_turn_cards(uuid, uuid)',
    'public.tabu_mark(uuid, uuid, integer, integer, text)',
    'public.tabu_next(uuid, uuid, integer)',
    'public.tabu_advance(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.tabu_config()',
    'private.tabu_seconds(text)',
    'private.tabu_team_of(integer)',
    'private.tabu_members(jsonb, text)',
    'private.tabu_describer(jsonb, integer)',
    'private.tabu_team_empty(jsonb)',
    'private.tabu_turn(uuid, jsonb)',
    'private.tabu_top(jsonb, jsonb)',
    'private.tabu_open_turn(uuid, jsonb, integer)',
    'private.tabu_run_turn(public.rooms)',
    'private.tabu_finish(public.rooms)',
    'private.tabu_summarize(public.rooms)',
    'private.tabu_step(public.rooms)',
    'private.tabu_seat(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
