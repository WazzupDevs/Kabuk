-- Faz 4 step 4.6.3 (docs/SPEC_V4.md §4.F "Adım 4.6.3: Sahtekar", K-71): Krot at a table of people.
-- Everyone plays on their own phone. One impostor; from 7 players two, who do not know each other.
-- The players see the word, the impostors only its category. Rol kartı (everyone presses Hazırım, or
-- 30 s) → two clue rounds in seat order, 30 s a speaker who presses Söyledim → Oylama, 90 s, everyone
-- votes for as many players as there are impostors → Sonuç, 15 s: the most voted are accused, a tie
-- across the last place leaves it empty → Son şans, 15 s: the caught impostors' one written guess →
-- the end. The table wins only when every impostor is caught and the guess misses; it scores one for
-- each impostor caught (K-71).
--
-- Where what lives:
-- - game_players.role: 'impostor' or 'player', dealt at the start; closed to clients.
-- - game_secrets.secret (concept 'sahtekar'): the word, its card and the ballots ({voter:
--   [targets]}). Only sahtekar_view answers from it, to the phone the role belongs to (rule 3); the
--   word reaches sahtekar_guess_word only for the Edge Function, which compares the written guess
--   with pure/trText.ts (rule 7) and never sends the word on. The guess is never kept (§4.F).
-- - rooms.game_state, open to the table (and so to Realtime): the phase, its step and clock, the
--   seats in their order, who left (gone), how many impostors, the category (every role knows it),
--   who is ready, the clue position with its speaker and the next one, who voted (never for whom).
--   From Sonuç: the votes each player got (tally), the accused, the caught and the escaped
--   impostors. The end moves to game_state.lastGame.sahtekar with the word and "Doğru oy verenler".
--
-- Leaving: a player who leaves the game or the table is gone; their ballot goes. A speaker who
-- leaves hands the turn on at the next advance (the phase's clock runs out now). An impostor who
-- leaves ends the game at the next advance: "Sahtekar oyundan çıktı", nobody scores (§4.F).
--
-- Locks (rule 10): check-in → rooms (private.room_phone) → game_players → room_used_cards (the
-- deck starts over) → game_secrets (a new row at the start, the ballots after). A player leaving stamps game_players.left_at while the table is held; the trigger
-- here updates game_state without a new lock.
--
-- The seat model goes (§4.F "Sunucu"): every sahtekar_* function of the two-table game and its
-- one-phone deck.

-- 1. The seat model goes -----------------------------------------------------------------------
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and (p.proname like 'sahtekar\_%' or p.proname = 'start_sahtekar')
  loop
    execute format('drop function %s', fn.sig);
  end loop;
end;
$$;

-- 2. Rules -------------------------------------------------------------------------------------
-- pure/sahtekarGame.ts → SAHTEKAR_GAME (sahtekarGame.test.ts reads the numbers here).
create function private.sahtekar_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'roleSeconds', 30, 'clueSeconds', 30, 'clueRounds', 2, 'voteSeconds', 90,
    'resultSeconds', 15, 'guessSeconds', 15, 'twoImpostorsFrom', 7, 'minPlayers', 3,
    'maxPlayers', 12
  );
$$;

create function private.sahtekar_seconds(name text)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => (private.sahtekar_config() ->> name)::integer);
$$;

-- 3. Helpers -----------------------------------------------------------------------------------
-- The seats still in the game, in seat order.
create function private.sahtekar_open(st jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(s.sid order by s.n), '{}'::text[])
  from jsonb_array_elements_text(coalesce(st -> 'seats', '[]'::jsonb)) with ordinality as s (sid, n)
  where not coalesce(st -> 'gone', '[]'::jsonb) ? s.sid;
$$;

-- The first clue position from `from_pos` on whose seat is still in the game; null after the last.
-- Position p is seat p mod n of round p / n + 1 (0-based, n seats).
create function private.sahtekar_position(st jsonb, from_pos integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select min(p)
  from generate_series(
    greatest(from_pos, 0),
    jsonb_array_length(st -> 'seats') * (private.sahtekar_config() ->> 'clueRounds')::integer - 1
  ) as p
  where not coalesce(st -> 'gone', '[]'::jsonb)
    ? (st -> 'seats' ->> (p % jsonb_array_length(st -> 'seats')));
$$;

-- The seat at clue position `pos`; null for none.
create function private.sahtekar_seat_at(st jsonb, pos integer)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case when pos is null then 'null'::jsonb
              else st -> 'seats' -> (pos % jsonb_array_length(st -> 'seats')) end;
$$;

-- The accused (pure/sahtekarGame.ts → accusedOf): the most voted, as many as there are impostors;
-- a count shared across the last place leaves it empty; nobody without a vote.
create function private.sahtekar_accused(tally jsonb, places integer)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  grp record;
  accused text[] := '{}';
begin
  for grp in
    select t.value::integer as n, array_agg(t.key order by t.key) as sids
    from jsonb_each_text(coalesce(tally, '{}'::jsonb)) as t (key, value)
    where t.value::integer > 0
    group by t.value::integer
    order by t.value::integer desc
  loop
    exit when cardinality(accused) + cardinality(grp.sids) > places;
    accused := accused || grp.sids;
  end loop;
  return accused;
end;
$$;

create function private.sahtekar_secret(target_room_id uuid, st jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select gs.secret from public.game_secrets gs
  where gs.room_id = target_room_id and gs.game_no = private.current_game_no(st);
$$;

-- The game's impostors, in seat order.
create function private.sahtekar_impostors(target_room_id uuid, st jsonb)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(gp.session_id::text order by gp.seat_order), '{}'::text[])
  from public.game_players gp
  where gp.room_id = target_room_id and gp.game_no = private.current_game_no(st)
    and gp.role = 'impostor';
$$;

-- The next phase: a new step and a new clock; what belonged to the phase before goes.
create function private.sahtekar_enter(
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
      game_state = (st - 'ready' - 'pos' - 'round' - 'speaker' - 'next' - 'voted')
        || jsonb_build_object(
          'phase', new_phase,
          'step', coalesce((st ->> 'step')::integer, 0) + 1,
          'endsAt', now() + private.sahtekar_seconds(clock)
        )
        || extra
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- Has the phase all it waits for: everyone still in the game ready, everyone still in it voted.
create function private.sahtekar_complete(st jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case st ->> 'phase'
    when 'role' then not exists (
      select 1 from unnest(private.sahtekar_open(st)) o (sid)
      where not coalesce(st -> 'ready', '[]'::jsonb) ? o.sid
    )
    when 'vote' then not exists (
      select 1 from unnest(private.sahtekar_open(st)) o (sid)
      where not coalesce(st -> 'voted', '[]'::jsonb) ? o.sid
    )
    else false
  end;
$$;

-- 4. The phases --------------------------------------------------------------------------------
-- The clue turn at position `pos` (the first one still in the game from there); after the last,
-- Oylama.
create function private.sahtekar_clue_at(r public.rooms, from_pos integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  pos integer := private.sahtekar_position(r.game_state, from_pos);
begin
  if pos is null then
    return private.sahtekar_enter(r.id, st, 'vote', 'voteSeconds', jsonb_build_object('voted', '[]'::jsonb));
  end if;
  return private.sahtekar_enter(
    r.id, st, 'clue', 'clueSeconds',
    jsonb_build_object(
      'pos', pos,
      'round', pos / jsonb_array_length(st -> 'seats') + 1,
      'speaker', private.sahtekar_seat_at(st, pos),
      'next', private.sahtekar_seat_at(st, private.sahtekar_position(st, pos + 1))
    )
  );
end;
$$;

-- Sonuç: the ballots counted. Votes for whoever left do not count.
create function private.sahtekar_count(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  ballots jsonb := coalesce(private.sahtekar_secret(r.id, r.game_state) -> 'votes', '{}'::jsonb);
  impostors text[] := private.sahtekar_impostors(r.id, r.game_state);
  tally jsonb;
  accused text[];
begin
  select coalesce(jsonb_object_agg(t.sid, t.n), '{}'::jsonb) into tally
  from (
    select v.target as sid, count(*)::integer as n
    from jsonb_each(ballots) as b (voter, targets),
         jsonb_array_elements_text(b.targets) as v (target)
    where not coalesce(st -> 'gone', '[]'::jsonb) ? v.target
    group by v.target
  ) t;
  accused := private.sahtekar_accused(tally, (st ->> 'impostors')::integer);
  return private.sahtekar_enter(
    r.id, st, 'result', 'resultSeconds',
    jsonb_build_object(
      'tally', tally,
      'accused', to_jsonb(accused),
      'caught', to_jsonb(array(select a from unnest(accused) a where a = any (impostors))),
      'escaped', to_jsonb(array(select i from unnest(impostors) i where not i = any (accused)))
    )
  );
end;
$$;

-- The end: a result for every player still in the game (the players score one for each impostor
-- caught and win when the table wins; the impostors win otherwise), then the frame's end
-- (private.end_game) and what the end screen shows in lastGame.sahtekar. An impostor who left ends
-- it without results.
create function private.sahtekar_finish(r public.rooms, winner text, guessed_right boolean)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  sec jsonb := private.sahtekar_secret(r.id, r.game_state);
  impostors text[] := private.sahtekar_impostors(r.id, r.game_state);
  caught integer := jsonb_array_length(coalesce(r.game_state -> 'caught', '[]'::jsonb));
  right_voters jsonb;
  result jsonb;
  done public.rooms;
begin
  if winner <> 'impostor_left' then
    insert into public.game_results (user_id, room_id, concept, mode, score, won)
    select ts.user_id, r.id, 'sahtekar', 'sahtekar',
           case when gp.role = 'impostor' then null else caught end,
           case when gp.role = 'impostor' then winner = 'impostors' else winner = 'table' end
    from public.game_players gp
    join public.table_sessions ts on ts.id = gp.session_id
    where gp.room_id = r.id and gp.game_no = no and gp.left_at is null
      and not coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text;
  end if;

  select coalesce(jsonb_agg(s.sid order by s.n), '[]'::jsonb) into right_voters
  from jsonb_array_elements_text(coalesce(st -> 'seats', '[]'::jsonb)) with ordinality as s (sid, n)
  where exists (
    select 1 from jsonb_array_elements_text(coalesce(sec -> 'votes' -> s.sid, '[]'::jsonb)) v (t)
    where v.t = any (impostors)
  );

  result := jsonb_build_object(
    'winner', winner,
    'word', sec ->> 'word',
    'category', st ->> 'category',
    'seats', coalesce(st -> 'seats', '[]'::jsonb),
    'gone', coalesce(st -> 'gone', '[]'::jsonb),
    -- Who left keeps their role hidden, also at the end (as K-80 for Vampir Köylü).
    'impostorSeats', to_jsonb(array(
      select i from unnest(impostors) i where not coalesce(st -> 'gone', '[]'::jsonb) ? i
    )),
    'tally', coalesce(st -> 'tally', '{}'::jsonb),
    'accused', coalesce(st -> 'accused', '[]'::jsonb),
    'caught', coalesce(st -> 'caught', '[]'::jsonb),
    'guessedRight', to_jsonb(guessed_right),
    'rightVoters', right_voters
  );
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,sahtekar}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- One step on from the phase `r` is in: its time ran out, or it has all it waited for. An impostor
-- who left ends the game (read from game_players: the open state never names an impostor).
create function private.sahtekar_step(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  phase text := r.game_state ->> 'phase';
begin
  if exists (
    select 1 from public.game_players gp
    where gp.room_id = r.id and gp.game_no = private.current_game_no(st)
      and gp.role = 'impostor'
      and (gp.left_at is not null or coalesce(st -> 'gone', '[]'::jsonb) ? gp.session_id::text)
  ) then
    return private.sahtekar_finish(r, 'impostor_left', null);
  end if;
  if phase = 'role' then
    return private.sahtekar_clue_at(r, 0);
  elsif phase = 'clue' then
    return private.sahtekar_clue_at(r, (st ->> 'pos')::integer + 1);
  elsif phase = 'vote' then
    return private.sahtekar_count(r);
  elsif phase = 'result' then
    if jsonb_array_length(coalesce(st -> 'caught', '[]'::jsonb)) = 0 then
      return private.sahtekar_finish(r, 'impostors', null);
    end if;
    return private.sahtekar_enter(r.id, st, 'guess', 'guessSeconds');
  elsif phase = 'guess' then
    return private.sahtekar_finish(
      r,
      case when jsonb_array_length(st -> 'caught') >= (st ->> 'impostors')::integer
           then 'table' else 'impostors' end,
      null
    );
  end if;
  return r;
end;
$$;

-- The caller at a running game: the table (locked), whether the caller is its owner, the caller's
-- role (null: watching or gone) and whether the caller's account was dealt into this game at all.
create function private.sahtekar_seat(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, role text, dealt boolean)
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
  if r.concept is distinct from 'sahtekar' or not (r.game_state ? 'phase') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  -- By account, not by check-in: a player who left and comes back with a new check-in is still
  -- gone, never a watcher (rule 3).
  select g.* into gp from public.game_players g
  join public.table_sessions ts on ts.id = g.session_id
  where g.room_id = r.id and g.game_no = private.current_game_no(r.game_state)
    and ts.user_id = target_user_id
  order by g.session_id = p.session_id desc
  limit 1;
  return query select r, p.session_id, p.is_leader,
    case when gp.session_id = p.session_id and gp.left_at is null
              and not coalesce(r.game_state -> 'gone', '[]'::jsonb) ? p.session_id::text
         then gp.role end,
    gp.session_id is not null;
end;
$$;

-- 5. The actions -------------------------------------------------------------------------------
-- sahtekar/start: the owner, from the pre-game page (private.start_game: 3 to 12 players, the rest
-- watch). A word the table has not used yet (the deck starts over when every word was used), one
-- impostor, two from 7 players, dealt at random; the role card's clock starts.
create function public.sahtekar_start(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  no integer;
  players integer;
  impostors integer;
  seats jsonb;
  picked public.cards;
  r public.rooms;
begin
  no := private.start_game(target_user_id, target_room_id, 'sahtekar');
  select count(*)::integer into players
  from public.game_players where room_id = target_room_id and game_no = no;
  impostors := case when players >= (private.sahtekar_config() ->> 'twoImpostorsFrom')::integer
                    then 2 else 1 end;
  update public.game_players gp
  set role = case when dealt.n <= impostors then 'impostor' else 'player' end
  from (
    select session_id, row_number() over (order by random()) as n
    from public.game_players where room_id = target_room_id and game_no = no
  ) dealt
  where gp.room_id = target_room_id and gp.game_no = no and gp.session_id = dealt.session_id;

  select c.* into picked from public.cards c
  where c.deck = 'sahtekar' and c.is_active
    and not exists (
      select 1 from public.room_used_cards u where u.room_id = target_room_id and u.card_id = c.id
    )
  order by random() limit 1;
  if picked.id is null then
    delete from public.room_used_cards u
    using public.cards c
    where u.room_id = target_room_id and u.card_id = c.id and c.deck = 'sahtekar';
    select c.* into picked from public.cards c
    where c.deck = 'sahtekar' and c.is_active order by random() limit 1;
  end if;
  if picked.id is null then
    raise exception using errcode = 'P0001', message = 'no_cards';
  end if;

  perform private.use_card(target_room_id, picked.id);
  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (
    target_room_id, no, 'sahtekar',
    jsonb_build_object('cardId', picked.id, 'word', picked.word, 'votes', '{}'::jsonb)
  );

  select coalesce(jsonb_agg(session_id::text order by seat_order), '[]'::jsonb) into seats
  from public.game_players where room_id = target_room_id and game_no = no;

  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_build_object(
        'gameNo', no,
        'phase', 'role',
        'step', 1,
        'endsAt', now() + private.sahtekar_seconds('roleSeconds'),
        'seats', seats,
        'gone', '[]'::jsonb,
        'impostors', impostors,
        'category', picked.prompt,
        'ready', '[]'::jsonb
      )
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- sahtekar/view: anyone at the table; what their own phone may know (rule 3). A player: the word;
-- an impostor: the category only (never the other impostor); a watcher (not dealt into this game):
-- the word and the impostors; whoever left the game: nothing.
create function public.sahtekar_view(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
  sec jsonb;
begin
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if seat.role = 'impostor' then
    return jsonb_build_object('role', 'impostor', 'category', st ->> 'category');
  end if;
  if seat.role is null and seat.dealt then
    return jsonb_build_object('role', null);
  end if;
  sec := private.sahtekar_secret((seat.room).id, st);
  if seat.role = 'player' then
    return jsonb_build_object('role', 'player', 'category', st ->> 'category', 'word', sec ->> 'word');
  end if;
  return jsonb_build_object(
    'role', 'watcher',
    'category', st ->> 'category',
    'word', sec ->> 'word',
    'impostorSeats', to_jsonb(private.sahtekar_impostors((seat.room).id, st))
  );
end;
$$;

-- sahtekar/ready: a player on the role card (Hazırım). When everyone still in the game is ready,
-- the clues start.
create function public.sahtekar_ready(target_user_id uuid, target_room_id uuid, at_step integer)
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
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  r := seat.room;
  if seat.role is null then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  st := r.game_state;
  if st ->> 'phase' <> 'role' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'ready', '[]'::jsonb) ? seat.session_id::text then
    return r;
  end if;
  st := jsonb_set(st, '{ready}', coalesce(st -> 'ready', '[]'::jsonb) || to_jsonb(seat.session_id::text));
  update public.rooms set game_state = st, last_activity_at = now()
  where id = r.id returning * into r;
  if private.sahtekar_complete(r.game_state) then
    return private.sahtekar_step(r);
  end if;
  return r;
end;
$$;

-- sahtekar/said: the speaker's Söyledim; the turn passes on. Another step changes nothing.
create function public.sahtekar_said(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'clue' or (st ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  if seat.role is null or st ->> 'speaker' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_your_seat';
  end if;
  return private.sahtekar_step(seat.room);
end;
$$;

-- sahtekar/vote: a player votes once for as many others still in the game as there are impostors
-- (pure/sahtekarGame.ts → mayVote). Only that they voted opens to the table; the ballot stays in
-- game_secrets until Sonuç. When everyone still in the game voted, the votes are counted.
create function public.sahtekar_vote(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  target_session_ids uuid[]
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
  open text[];
  targets text[] := array(select t::text from unnest(target_session_ids) t);
begin
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if seat.role is null then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if st ->> 'phase' <> 'vote' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'voted', '[]'::jsonb) ? seat.session_id::text then
    return r;
  end if;
  open := private.sahtekar_open(st);
  if coalesce(cardinality(targets), 0) <> (st ->> 'impostors')::integer
     or (select count(distinct t) from unnest(targets) t) <> cardinality(targets)
     or seat.session_id::text = any (targets)
     or exists (select 1 from unnest(targets) t where not t = any (open)) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  update public.game_secrets
  set secret = jsonb_set(secret, array['votes', seat.session_id::text], to_jsonb(targets))
  where room_id = r.id and game_no = private.current_game_no(st);
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(
        st, '{voted}', coalesce(st -> 'voted', '[]'::jsonb) || to_jsonb(seat.session_id::text)
      )
  where id = r.id
  returning * into r;
  if private.sahtekar_complete(r.game_state) then
    return private.sahtekar_step(r);
  end if;
  return r;
end;
$$;

-- Son şans: may the caller guess at `at_step`? A caught impostor still in the game, while the clock
-- runs. False: another step, nothing to do.
create function private.sahtekar_may_guess(st jsonb, my_role text, me uuid, at_step integer)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  if st ->> 'phase' <> 'guess' or (st ->> 'step')::integer <> at_step then
    return false;
  end if;
  if my_role is distinct from 'impostor' or not coalesce(st -> 'caught', '[]'::jsonb) ? me::text then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if now() >= (st ->> 'endsAt')::timestamptz then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  return true;
end;
$$;

-- For the sahtekar Edge Function only (service role): the word to compare a caught impostor's
-- guess with (pure/trText.ts, rule 7). Null: another step. The word never goes to the phone.
create function public.sahtekar_guess_word(target_user_id uuid, target_room_id uuid, at_step integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  if not private.sahtekar_may_guess((seat.room).game_state, seat.role, seat.session_id, at_step) then
    return null;
  end if;
  return private.sahtekar_secret((seat.room).id, (seat.room).game_state) ->> 'word';
end;
$$;

-- sahtekar/guess: the caught impostors' one shared guess; the first ends the game. `guessed_right`
-- is the Edge Function's comparison; the guess itself is never kept (§4.F).
create function public.sahtekar_guess(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  guessed_right boolean
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.sahtekar_seat(target_user_id, target_room_id);
  if not private.sahtekar_may_guess((seat.room).game_state, seat.role, seat.session_id, at_step) then
    return seat.room;
  end if;
  st := (seat.room).game_state;
  return private.sahtekar_finish(
    seat.room,
    case when not guessed_right
              and jsonb_array_length(st -> 'caught') >= (st ->> 'impostors')::integer
         then 'table' else 'impostors' end,
    guessed_right
  );
end;
$$;

-- sahtekar/advance: anyone at the table once the phase's time is up (a second of slack for the
-- phones' clocks); idempotent: early, it changes nothing.
create function public.sahtekar_advance(target_user_id uuid, target_room_id uuid)
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
  if r.concept is distinct from 'sahtekar' or not (r.game_state ? 'phase')
     or now() + interval '1 second' < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.sahtekar_step(r);
end;
$$;

-- 6. Leaving -----------------------------------------------------------------------------------
-- A player who leaves the game or the table (any road stamps game_players.left_at while holding the
-- table) is gone; their ballot goes. An impostor ends the game; a speaker's turn, and a phase that
-- now has all it waits for, run out now. The next advance settles it.
create function private.sahtekar_on_player_left()
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
  if r.concept is distinct from 'sahtekar' or not (r.game_state ? 'phase')
     or private.current_game_no(r.game_state) <> new.game_no
     or coalesce(r.game_state -> 'gone', '[]'::jsonb) ? sid then
    return new;
  end if;
  st := jsonb_set(r.game_state, '{gone}', coalesce(r.game_state -> 'gone', '[]'::jsonb) || to_jsonb(sid));
  -- An impostor ends the game; the open state does not say so before the end (rule 3).
  if new.role = 'impostor' then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;
  if st ->> 'phase' = 'vote' then
    update public.game_secrets set secret = secret #- array['votes', sid]
    where room_id = r.id and game_no = new.game_no;
    st := jsonb_set(st, '{voted}', coalesce((
      select jsonb_agg(v) from jsonb_array_elements_text(st -> 'voted') v where v <> sid
    ), '[]'::jsonb));
  end if;
  if st ->> 'phase' = 'clue' then
    st := jsonb_set(st, '{next}',
      private.sahtekar_seat_at(st, private.sahtekar_position(st, (st ->> 'pos')::integer + 1)));
    if st ->> 'speaker' = sid then
      st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
    end if;
  end if;
  if private.sahtekar_complete(st) then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;
  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  return new;
end;
$$;

revoke all on function private.sahtekar_on_player_left() from public, anon, authenticated;

create trigger game_players_sahtekar_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.sahtekar_on_player_left();

-- 7. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.sahtekar_start(uuid, uuid)',
    'public.sahtekar_view(uuid, uuid)',
    'public.sahtekar_ready(uuid, uuid, integer)',
    'public.sahtekar_said(uuid, uuid, integer)',
    'public.sahtekar_vote(uuid, uuid, integer, uuid[])',
    'public.sahtekar_guess_word(uuid, uuid, integer)',
    'public.sahtekar_guess(uuid, uuid, integer, boolean)',
    'public.sahtekar_advance(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.sahtekar_config()',
    'private.sahtekar_seconds(text)',
    'private.sahtekar_open(jsonb)',
    'private.sahtekar_position(jsonb, integer)',
    'private.sahtekar_seat_at(jsonb, integer)',
    'private.sahtekar_accused(jsonb, integer)',
    'private.sahtekar_secret(uuid, jsonb)',
    'private.sahtekar_impostors(uuid, jsonb)',
    'private.sahtekar_enter(uuid, jsonb, text, text, jsonb)',
    'private.sahtekar_complete(jsonb)',
    'private.sahtekar_clue_at(public.rooms, integer)',
    'private.sahtekar_count(public.rooms)',
    'private.sahtekar_finish(public.rooms, text, boolean)',
    'private.sahtekar_step(public.rooms)',
    'private.sahtekar_seat(uuid, uuid)',
    'private.sahtekar_may_guess(jsonb, text, uuid, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
