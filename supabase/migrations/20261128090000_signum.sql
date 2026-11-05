-- Faz 4 step 4.6.7 (docs/SPEC_V4.md §4.F "Adım 4.6.7: Signum"): the server of Signum, a clue game
-- of Mor ('a') and Pembe ('b') on 25 word tiles. The game's decisions are made by
-- _shared/pure/signum.ts in the signum Edge Function (the owner's B-1, 5 Kasım): it reads the game
-- here without a lock (signum_read), decides, and writes back through signum_commit, which under the
-- table's lock checks that nothing changed since the read, that the caller still plays with the
-- same team and role, and that the phase's time has not run out while the locks were waited for
-- (clock_timestamp()). When anything changed the commit writes nothing and the function reads and
-- decides again (three tries in all, then a "busy" answer: B-2).
--
-- Where what lives:
-- - rooms.game_state, open to the table (and so to Realtime): the words, the opened tiles, whose turn,
--   the clue, the clock; the key only once the game is over (A-7). signum_commit refuses a state with
--   a closed tile's kind in it.
-- - game_secrets.secret, closed to clients: the key, each guesser's mark ({ tile, seq, sent }), every
--   applied clue, reveal and end-turn by its actionId, the teams' channel ids and the write version
--   (rev). Only the Edge Function reads it, and only signum_read gives it out (to the service role).
-- - rooms.game_state.pregame.signum, open: candidates, offers and approved captains (A-14).
--
-- Who plays is read from the database at every call, never from the phone or the open state:
-- an active check-in, a seat at the table (room_members.left_at is null) and a game_players row of
-- the running game with left_at null; its team and role (captain, guesser) come from that row.
--
-- Leaving: a captain who leaves the game or the table ends the game with no result (A-5); so does a
-- team left with no guesser. Either is recorded in game_events (captain_left, team_empty, with the
-- team and whether the game or the table was left). Anyone of a team leaving gives that team a new
-- channel id: the server broadcasts only to the new topic, so a subscription the leaver still holds
-- hears nothing more (B-3). The trigger is per statement: when the frame ends the whole game
-- (end_game stamps every player at once) nobody plays on afterwards and the trigger leaves it to
-- the frame.
--
-- Locks (rule 10): check-in → rooms → game_players → game_secrets. signum_commit takes the check-in
-- and the table (private.room_phone), then the game's game_secrets row; the leaving trigger runs while
-- whoever stamps game_players.left_at holds the table, and then takes game_secrets.

-- 1. What the game may write ---------------------------------------------------------------------
alter table public.game_secrets drop constraint game_secrets_concept_check;
alter table public.game_secrets
  add constraint game_secrets_concept_check
  check (concept in ('sahtekar', 'ibre', 'vampir', 'signum'));

alter table public.game_results drop constraint game_results_concept_check;
alter table public.game_results
  add constraint game_results_concept_check
  check (concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum'));
alter table public.game_results drop constraint game_results_mode_check;
alter table public.game_results
  add constraint game_results_mode_check
  check (
    mode in ('voice', 'text', 'cooperative', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum')
  );
-- A table's pair history names the game played there (private.write_pair_history).
alter table public.play_history drop constraint play_history_concept_check;
alter table public.play_history
  add constraint play_history_concept_check
  check (
    concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum', 'chat')
  );

-- The word pool: one word a card (no seed yet; the content step brings content/signum-words.json).
alter table public.cards drop constraint cards_deck_check;
alter table public.cards
  add constraint cards_deck_check
  check (deck in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'signum'));
alter table public.cards drop constraint cards_check;
alter table public.cards
  add constraint cards_check check (
    (deck = 'tabu' and word is not null and cardinality(forbidden) = 5 and prompt is null)
    or (deck = 'sohbet' and prompt is not null and theme is not null and word is null)
    or (deck = 'sahtekar' and word is not null and theme is not null and prompt is not null
        and forbidden is null)
    or (deck = 'harf' and prompt is not null and theme is not null and word is null
        and forbidden is null)
    or (deck = 'sarki' and word is not null and prompt is null and forbidden is null)
    or (deck = 'ibre' and word is not null and prompt is not null and theme is null
        and forbidden is null)
    or (deck = 'signum' and word is not null and prompt is null and theme is null
        and forbidden is null)
  );

alter table public.game_events drop constraint game_events_type_check;
alter table public.game_events
  add constraint game_events_type_check check (
    type in (
      'correct', 'taboo', 'pass', 'card_closed', 'turn_started', 'game_completed', 'game_abandoned',
      'captain_left', 'team_empty'
    )
  );

-- 2. Rules ---------------------------------------------------------------------------------------
-- pure/signum.ts → SIGNUM (signum.test.ts in supabase/tests reads the numbers here).
create function private.signum_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'tiles', 25, 'starterTiles', 9, 'otherTiles', 8, 'neutralTiles', 7, 'blackTiles', 1,
    'roleSeconds', 30, 'clueSeconds', 90, 'guessSeconds', 60, 'minPool', 200,
    'minPlayers', 4, 'maxPlayers', 12, 'minTeamSize', 2
  );
$$;

-- 3. Who asks ------------------------------------------------------------------------------------
-- The caller's seat, read without a lock (signum_read, signum/view, the Realtime check): an active
-- check-in at the table, and its game_players row of the running Signum game. No check-in:
-- no_active_table; not at the table: not_in_room. team and role are null for a watcher.
create function private.signum_seat_read(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, team text, role text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
  gp public.game_players;
begin
  select * into s from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now();
  if s.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;
  select * into r from public.rooms where id = target_room_id;
  if r.id is null or r.status = 'closed' or not exists (
    select 1 from public.room_members rm
    where rm.room_id = r.id and rm.session_id = s.id and rm.left_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if r.concept = 'signum' then
    select * into gp from public.game_players g
    where g.room_id = r.id and g.game_no = private.current_game_no(r.game_state)
      and g.session_id = s.id and g.left_at is null;
  end if;
  return query select r, s.id, s.id = r.owner_session_id, gp.team, gp.role;
end;
$$;

-- The same seat under the lock signum_commit holds (rooms is locked; game_players is only read).
create function private.signum_seat_locked(target_room public.rooms, target_session_id uuid)
returns table (team text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select g.team, g.role from public.game_players g
  where g.room_id = target_room.id and g.game_no = private.current_game_no(target_room.game_state)
    and g.session_id = target_session_id and g.left_at is null;
$$;

-- 4. Reading and writing a running game -----------------------------------------------------------
-- What the Edge Function decides from: the open state, the secret and its version, the caller's
-- seat and the database's clock. Service role only (the secret is in it).
create function public.signum_read(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  seat record;
  sec jsonb;
begin
  select * into seat from private.signum_seat_read(target_user_id, target_room_id);
  if (seat.room).concept is distinct from 'signum' or not ((seat.room).game_state ? 'phase') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select gs.secret into sec from public.game_secrets gs
  where gs.room_id = target_room_id
    and gs.game_no = private.current_game_no((seat.room).game_state);
  if sec is null then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  return jsonb_build_object(
    'state', (seat.room).game_state,
    'secret', sec,
    'rev', coalesce((sec ->> 'rev')::integer, 0),
    'sessionId', seat.session_id,
    'isOwner', seat.is_owner,
    'seat', case when seat.role is null then null
                 else jsonb_build_object('team', seat.team, 'role', seat.role) end,
    'now', clock_timestamp()
  );
end;
$$;

-- Clears every mark's tile and keeps its seq (pure/signum.ts → clearMarks).
create function private.signum_clear_marks(sec jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_set(sec, '{marks}', jsonb_build_object(
    'a', coalesce((select jsonb_object_agg(k, v || '{"tile": null}'::jsonb)
                   from jsonb_each(sec -> 'marks' -> 'a') e (k, v)), '{}'::jsonb),
    'b', coalesce((select jsonb_object_agg(k, v || '{"tile": null}'::jsonb)
                   from jsonb_each(sec -> 'marks' -> 'b') e (k, v)), '{}'::jsonb)
  ));
$$;

-- A last guard before anything reaches the open state: 25 tiles, a tile's kind only once it is open
-- and then the key's, the whole key only once the game is over, and nothing of the secret's.
create function private.signum_check_write(st jsonb, sec jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  i integer;
begin
  if jsonb_typeof(st -> 'board') is distinct from 'array' or jsonb_array_length(st -> 'board') <> 25
     or jsonb_typeof(sec -> 'key') is distinct from 'array' or jsonb_array_length(sec -> 'key') <> 25
     or st ?| array['marks', 'actions', 'channels', 'secret', 'rev'] then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  for i in 0..24 loop
    if (st -> 'board' -> i -> 'open') is distinct from 'null'::jsonb
       and (st -> 'board' -> i -> 'open') is distinct from (sec -> 'key' -> i) then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
  end loop;
  if st ->> 'phase' = 'over' then
    if (st -> 'key') is distinct from (sec -> 'key') then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
  elsif (st -> 'key') is distinct from 'null'::jsonb then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
end;
$$;

-- The game is over (the open state says why): the players still in it at the end get their result
-- when a team won (game_results; who left got none), and the frame ends the game. A captain who
-- left or an empty team ends it with no result, as abandoned (A-5). The over state stays for the
-- result screen in game_state.lastGame.signum.
create function private.signum_finish(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  won_game boolean := st ->> 'reason' in ('cards', 'black');
  done public.rooms;
begin
  if won_game then
    insert into public.game_results (user_id, room_id, concept, mode, score, won)
    select ts.user_id, r.id, 'signum', 'signum',
           (select count(*)::integer from jsonb_array_elements(st -> 'board') t
            where t ->> 'open' = gp.team),
           gp.team = st ->> 'winner'
    from public.game_players gp
    join public.table_sessions ts on ts.id = gp.session_id
    where gp.room_id = r.id and gp.game_no = no and gp.left_at is null;
  end if;
  done := private.end_game(r.id, not won_game);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,signum}', st)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- The write of a decision. Under the check-in's and the table's locks (private.room_phone) and the
-- game's secret row: the open state and the secret's version must be the ones the decision was made
-- from, the caller must still hold the seat it was made for, and a player's action must still be
-- inside its phase's time by clock_timestamp() (now() is the transaction's start, before any lock
-- was waited for). Any of these changed: { ok: false }, nothing written, and the function decides
-- again. `player_action` is false for what only moves a clock that ran out (advance, phase_expired).
create function public.signum_commit(
  target_user_id uuid,
  target_room_id uuid,
  read_state jsonb,
  read_rev integer,
  seat_team text,
  seat_role text,
  player_action boolean,
  new_state jsonb,
  new_secret jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  sec jsonb;
  seat record;
  ends timestamptz;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'signum' or r.game_state is distinct from read_state then
    return jsonb_build_object('ok', false);
  end if;
  select gs.secret into sec from public.game_secrets gs
  where gs.room_id = r.id and gs.game_no = private.current_game_no(r.game_state)
  for update;
  if sec is null or coalesce((sec ->> 'rev')::integer, 0) <> read_rev then
    return jsonb_build_object('ok', false);
  end if;
  select * into seat from private.signum_seat_locked(r, p.session_id);
  -- A watcher's seat comes as '' and ''.
  if coalesce(seat.team, '') <> seat_team or coalesce(seat.role, '') <> seat_role then
    return jsonb_build_object('ok', false);
  end if;
  ends := (read_state ->> 'endsAt')::timestamptz;
  if player_action and ends is not null and clock_timestamp() >= ends then
    return jsonb_build_object('ok', false);
  end if;
  if not player_action and (ends is null or clock_timestamp() < ends) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if (new_state ->> 'gameNo')::integer is distinct from private.current_game_no(r.game_state) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  perform private.signum_check_write(new_state, new_secret);

  update public.game_secrets
  set secret = (new_secret - 'rev') || jsonb_build_object('rev', read_rev + 1)
  where room_id = r.id and game_no = private.current_game_no(r.game_state);
  -- A mark changes only the secret: the table's row stays as it is, so no change of it reaches the
  -- other team or the watchers over Realtime (the timing of a team's marks is the team's).
  if new_state is distinct from r.game_state then
    update public.rooms set game_state = new_state, last_activity_at = now()
    where id = r.id
    returning * into r;
  end if;
  if new_state ->> 'phase' = 'over' then
    perform private.signum_finish(r);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- 5. The pre-game page ----------------------------------------------------------------------------
-- What a pre-game decision reads, without a lock: the page (the frame's picks and Signum's
-- captains), who is at the table now, the caller and whether they own the table.
create function public.signum_pregame_read(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.signum_seat_read(target_user_id, target_room_id);
  if (seat.room).game_state -> 'pregame' ->> 'concept' is distinct from 'signum' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  return jsonb_build_object(
    'pregame', (seat.room).game_state -> 'pregame',
    'gameNo', private.current_game_no((seat.room).game_state),
    'members', (
      select coalesce(jsonb_agg(rm.session_id::text order by rm.session_id), '[]'::jsonb)
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = target_room_id and rm.left_at is null
        and ts.status = 'active' and ts.expires_at > now()
    ),
    'sessionId', seat.session_id,
    'isOwner', seat.is_owner,
    'now', clock_timestamp()
  );
end;
$$;

-- A pre-game decision's write: the page must be as it was read and the caller's ownership the same.
create function public.signum_pregame_commit(
  target_user_id uuid,
  target_room_id uuid,
  read_pregame jsonb,
  read_is_owner boolean,
  new_signum jsonb
)
returns jsonb
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
  if r.game_state -> 'pregame' is distinct from read_pregame or p.is_leader <> read_is_owner then
    return jsonb_build_object('ok', false);
  end if;
  update public.rooms
  set game_state = jsonb_set(game_state, '{pregame,signum}', new_signum),
      last_activity_at = now()
  where id = r.id;
  return jsonb_build_object('ok', true);
end;
$$;

-- signum/start: the owner, with the first state and secret the Edge Function dealt (pure/signum.ts →
-- startGame, from the page read here). The frame freezes the players (private.start_game: Mor and
-- Pembe of two or more each; who chose nothing or to watch watches); they must be the dealt seats,
-- each team's captain the page's approved one, every word an active card of the pool, the key 9/8/7/1.
create function public.signum_start(
  target_user_id uuid,
  target_room_id uuid,
  read_pregame jsonb,
  new_state jsonb,
  new_secret jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  no integer;
  starter text := new_state ->> 'starter';
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.game_state -> 'pregame' is distinct from read_pregame then
    return jsonb_build_object('ok', false);
  end if;
  no := private.start_game(target_user_id, target_room_id, 'signum');

  if no is distinct from (new_state ->> 'gameNo')::integer
     or new_state ->> 'phase' is distinct from 'role'
     or starter not in ('a', 'b')
     -- The dealt seats are the frozen players, with their teams.
     or exists (
       (select session_id::text, team from public.game_players
        where room_id = r.id and game_no = no)
       except
       (select s ->> 'sid', s ->> 'team' from jsonb_array_elements(new_state -> 'seats') s)
     )
     or exists (
       (select s ->> 'sid', s ->> 'team' from jsonb_array_elements(new_state -> 'seats') s)
       except
       (select session_id::text, team from public.game_players
        where room_id = r.id and game_no = no)
     )
     -- One captain a team, the one the owner approved.
     or (select count(*) from jsonb_array_elements(new_state -> 'seats') s
         where s ->> 'role' = 'captain') <> 2
     or exists (
       select 1 from jsonb_array_elements(new_state -> 'seats') s
       where s ->> 'role' not in ('captain', 'guesser')
          or (s ->> 'role' = 'captain'
              and s ->> 'sid' is distinct from read_pregame -> 'signum' -> 'captains' ->> (s ->> 'team'))
     )
     -- 25 words of the active pool, 9 tiles to the starter, 8, 7 neutral and the black card.
     or exists (
       select 1 from jsonb_array_elements(new_state -> 'board') t
       where not exists (
         select 1 from public.cards c
         where c.deck = 'signum' and c.is_active and c.word = t ->> 'word'
       )
     )
     or (select count(*) from jsonb_array_elements_text(new_secret -> 'key') k where k = starter) <> 9
     or (select count(*) from jsonb_array_elements_text(new_secret -> 'key') k
         where k = case starter when 'a' then 'b' else 'a' end) <> 8
     or (select count(*) from jsonb_array_elements_text(new_secret -> 'key') k where k = 'n') <> 7
     or (select count(*) from jsonb_array_elements_text(new_secret -> 'key') k where k = 'x') <> 1
     or (new_secret -> 'channels' ->> 'a') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or (new_secret -> 'channels' ->> 'b') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or (new_secret -> 'channels' ->> 'a') = (new_secret -> 'channels' ->> 'b')
  then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  perform private.signum_check_write(new_state, new_secret);

  update public.game_players gp
  set role = s ->> 'role'
  from jsonb_array_elements(new_state -> 'seats') s
  where gp.room_id = r.id and gp.game_no = no and gp.session_id::text = s ->> 'sid';
  update public.rooms set game_state = new_state, last_activity_at = now() where id = r.id;
  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (r.id, no, 'signum', (new_secret - 'rev') || '{"rev": 0}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;

-- 6. Leaving -------------------------------------------------------------------------------------
-- pure/signum.ts → leaveGame, for everyone one statement takes out of the running game: off the
-- seats and the ready list, their mark's tile cleared (its seq kept), their team's channel renewed.
-- A captain, or a team's last guesser, ends the game with no result (A-5), recorded in game_events.
-- When the statement leaves nobody playing, the frame is ending the game itself: nothing to do.
create function private.signum_on_players_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  r public.rooms;
  st jsonb;
  sec jsonb;
  no integer;
  gone uuid;
  seat jsonb;
  seat_team text;
  via text;
  ev_type text;
  ev_session uuid;
  ev_team text;
  ev_via text;
begin
  for rid in
    select distinct n.room_id
    from new_rows n
    join old_rows o using (room_id, game_no, session_id)
    where o.left_at is null and n.left_at is not null
  loop
    select * into r from public.rooms where id = rid;
    st := r.game_state;
    no := private.current_game_no(st);
    continue when r.concept is distinct from 'signum' or not (st ? 'phase')
      or st ->> 'phase' = 'over';
    continue when not exists (
      select 1 from public.game_players
      where room_id = rid and game_no = no and left_at is null
    );
    select gs.secret into sec from public.game_secrets gs
    where gs.room_id = rid and gs.game_no = no
    for update;
    continue when sec is null;

    ev_type := null;
    for gone in
      select n.session_id
      from new_rows n
      join old_rows o using (room_id, game_no, session_id)
      where o.left_at is null and n.left_at is not null and n.room_id = rid and n.game_no = no
      order by n.session_id
    loop
      seat := null;
      select s into seat from jsonb_array_elements(st -> 'seats') s
      where s ->> 'sid' = gone::text;
      continue when seat is null;
      seat_team := seat ->> 'team';
      via := case when exists (
        select 1 from public.room_members rm
        where rm.room_id = rid and rm.session_id = gone and rm.left_at is null
      ) then 'game' else 'table' end;

      st := jsonb_set(st, '{seats}', coalesce(
        (select jsonb_agg(s) from jsonb_array_elements(st -> 'seats') s
         where s ->> 'sid' <> gone::text), '[]'::jsonb));
      st := jsonb_set(st, '{ready}', coalesce(
        (select jsonb_agg(x) from jsonb_array_elements(st -> 'ready') x
         where x #>> '{}' <> gone::text), '[]'::jsonb));
      if (sec -> 'marks' -> seat_team) ? gone::text then
        sec := jsonb_set(sec, array['marks', seat_team, gone::text, 'tile'], 'null'::jsonb);
      end if;
      sec := jsonb_set(sec, array['channels', seat_team], to_jsonb(gen_random_uuid()::text));

      if seat ->> 'role' = 'captain' then
        ev_type := 'captain_left';
      elsif not exists (
        select 1 from jsonb_array_elements(st -> 'seats') s
        where s ->> 'team' = seat_team and s ->> 'role' = 'guesser'
      ) then
        ev_type := 'team_empty';
      end if;
      if ev_type is not null then
        ev_session := gone;
        ev_team := seat_team;
        ev_via := via;
        sec := private.signum_clear_marks(sec);
        st := st || jsonb_build_object(
          'phase', 'over', 'step', (st ->> 'step')::integer + 1, 'endsAt', null, 'clue', null,
          'guessesLeft', null, 'winner', null, 'reason', ev_type, 'key', sec -> 'key'
        );
        exit;
      end if;
    end loop;

    -- The last one not ready left the role cards: the clues begin (pure/signum.ts → beginClues).
    if ev_type is null and st ->> 'phase' = 'role' and not exists (
      select 1 from jsonb_array_elements(st -> 'seats') s
      where not ((st -> 'ready') ? (s ->> 'sid'))
    ) then
      st := st || jsonb_build_object(
        'phase', 'clue', 'step', (st ->> 'step')::integer + 1,
        'endsAt', now() + make_interval(secs => (private.signum_config() ->> 'clueSeconds')::integer),
        'turn', st -> 'starter', 'ready', '[]'::jsonb
      );
    end if;

    update public.game_secrets
    set secret = (sec - 'rev') || jsonb_build_object('rev', coalesce((sec ->> 'rev')::integer, 0) + 1)
    where room_id = rid and game_no = no;
    update public.rooms set game_state = st, last_activity_at = now()
    where id = rid
    returning * into r;
    if ev_type is not null then
      insert into public.game_events (room_id, session_id, type, payload)
      values (rid, ev_session, ev_type, jsonb_build_object('team', ev_team, 'via', ev_via));
      perform private.signum_finish(r);
    end if;
  end loop;
  return null;
end;
$$;

create trigger game_players_signum_left
  after update on public.game_players
  referencing old table as old_rows new table as new_rows
  for each statement
  execute function private.signum_on_players_left();

-- 7. The team channel (rule 9) -------------------------------------------------------------------
-- game_team:{channel id}: the id is in the team's views only and is renewed when someone of the team
-- leaves; whoever subscribes must be, now, a player of that team in the running game, at the table
-- with an active check-in. Read without a lock.
create function private.signum_team_member(channel uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.game_secrets gs
    join public.rooms r
      on r.id = gs.room_id and r.concept = 'signum'
      and private.current_game_no(r.game_state) = gs.game_no
      and r.game_state ->> 'phase' is distinct from 'over'
    join public.game_players gp
      on gp.room_id = r.id and gp.game_no = gs.game_no and gp.left_at is null
      and gs.secret -> 'channels' ->> gp.team = channel::text
    join public.table_sessions ts
      on ts.id = gp.session_id and ts.user_id = (select auth.uid())
      and ts.status = 'active' and ts.expires_at > now()
    join public.room_members rm
      on rm.room_id = r.id and rm.session_id = gp.session_id and rm.left_at is null
    where gs.concept = 'signum'
      and (gs.secret -> 'channels' ->> 'a' = channel::text
           or gs.secret -> 'channels' ->> 'b' = channel::text)
  );
$$;

create or replace function private.realtime_topic_allowed(channel_topic text, sending boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kind text := split_part(channel_topic, ':', 1);
  target text := substr(channel_topic, length(kind) + 2);
  target_id uuid;
begin
  if target !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target_id := target::uuid;

  if kind = 'venue' then
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id and status = 'active'
    );
  elsif kind = 'venue_chat' then
    -- Only the own venue's topic (a campus of a university included): the server sends every venue
    -- chat broadcast to each campus's topic, and nobody listens on another campus's.
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id
        and status = 'active' and expires_at > now()
    );
  elsif kind = 'session' then
    return not sending and exists (
      select 1 from public.table_sessions
      where id = target_id and user_id = (select auth.uid())
    );
  elsif kind in ('room', 'messages', 'game', 'presence') then
    return private.is_room_member(target_id);
  elsif kind = 'game_team' then
    -- Signum's team channel: only the server sends (data-free), only the team's players listen.
    return not sending and private.signum_team_member(target_id);
  elsif kind = 'inbox' then
    return not sending and target_id = (select auth.uid());
  elsif kind = 'dm' then
    return not sending and exists (
      select 1 from public.dm_threads
      where id = target_id and (select auth.uid()) in (user_a, user_b)
    );
  elsif kind = 'dm_typing' then
    return exists (
      select 1 from public.dm_threads t
      where t.id = target_id and (select auth.uid()) in (t.user_a, t.user_b)
        and not private.is_blocked_between(t.user_a, t.user_b)
    );
  end if;
  return false;
end;
$$;

-- 8. Grants --------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.signum_read(uuid, uuid)',
    'public.signum_commit(uuid, uuid, jsonb, integer, text, text, boolean, jsonb, jsonb)',
    'public.signum_pregame_read(uuid, uuid)',
    'public.signum_pregame_commit(uuid, uuid, jsonb, boolean, jsonb)',
    'public.signum_start(uuid, uuid, jsonb, jsonb, jsonb)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.signum_config()',
    'private.signum_seat_read(uuid, uuid)',
    'private.signum_seat_locked(public.rooms, uuid)',
    'private.signum_clear_marks(jsonb)',
    'private.signum_check_write(jsonb, jsonb)',
    'private.signum_finish(public.rooms)',
    'private.signum_on_players_left()',
    'private.signum_team_member(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
