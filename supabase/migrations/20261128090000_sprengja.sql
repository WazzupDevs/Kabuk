-- Faz 4 step 4.6.7 (docs/SPEC_V4.md §4.F "Adım 4.6.7: Sprengja", K-77, K-85): the bomb goes from
-- hand to hand. 3–8 players in a throwing order (clockwise); every round the starter opens a card
-- with a letter group and lights the fuse; whoever holds the bomb says a word with the group aloud
-- and throws it to the next player; when the hidden fuse runs out, the one holding it loses a point.
-- The fewest blasts win, together on a tie (K-85 O-5).
--
-- Where what lives:
-- - game_secrets.secret (concept 'sprengja'): the moment this round's bomb goes off (explodesAt),
--   only while it burns. No answer, no event, no Realtime payload and no log carries it (rule 3,
--   K-85 O-4); the Edge Function never sees it: it is drawn here.
-- - rooms.game_state, open to the table: the phase and step, the round, the order, who left (gone),
--   the starter, the holder, the throws, the letter group, the blasts (hits), the last blast, who
--   is ready, Tur sonu's clock (endsAt; never the fuse's) and how often phones poll (poll). The end
--   moves to game_state.lastGame.sprengja.
-- - game_events, open to the table: sp_lit, sp_pass, sp_explode with the round and the session ids
--   (rule 4). Replaying a round's events gives game_state's holder and throws (pure/sprengja.ts →
--   replayRound; sprengja.test.ts checks it after every race).
-- - public.cards, deck 'sprengja': the letter groups (word) and their tier (theme: kolay, orta,
--   zor). The content and its seed come in their own pull request (K-85 O-12); until then no game
--   starts (no_cards).
--
-- The clock (docs/decisions/4.6.7-sprengja.md): every decision is taken after the table's row is locked,
-- at clock_timestamp() (now() is the transaction's start and stands still while a lock is awaited).
-- A throw that gets the lock at or after the fuse's moment blows up in its thrower's hands. Who
-- decides first: whoever gets the lock; the throws, the poll, the job and a leaving player all
-- decide the same way.
--
-- Who notices the fuse ran out: the job sprengja-explode (pg_cron, every second; created switched
-- off, turned on by hand after the dev checks, K-85 O-14), any phone's sprengja/poll, the holder's
-- late throw, a leaving holder, any phone's advance. game_state.poll tells the phones how often to
-- poll: rarely while the job is on, more while it is off.
--
-- Locks (rule 10): check-in → rooms (private.room_phone) → game_players → game_secrets; the events
-- are inserts. The job locks rooms alone with skip locked, then game_secrets. A player leaving the
-- game or the table stamps game_players.left_at while the table is held; the trigger here updates
-- game_state and game_secrets without a new lock on the table.

-- 1. The game ----------------------------------------------------------------------------------
-- In the list before the seed (content/games.json) makes it known, so rooms.concept can name it.
insert into public.games (id, name, min_players, max_players, teams, pregame)
values ('sprengja', 'Sprengja', 3, 8, false, true)
on conflict (id) do nothing;

alter table public.game_secrets drop constraint game_secrets_concept_check;
alter table public.game_secrets
  add constraint game_secrets_concept_check
  check (concept in ('sahtekar', 'ibre', 'vampir', 'sprengja'));

alter table public.game_results drop constraint game_results_concept_check;
alter table public.game_results
  add constraint game_results_concept_check
  check (concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'sprengja'));
alter table public.game_results drop constraint game_results_mode_check;
alter table public.game_results
  add constraint game_results_mode_check
  check (
    mode in ('voice', 'text', 'cooperative', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'sprengja')
  );
alter table public.play_history drop constraint play_history_concept_check;
alter table public.play_history
  add constraint play_history_concept_check
  check (
    concept in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'sprengja', 'chat')
  );

alter table public.game_events drop constraint game_events_type_check;
alter table public.game_events
  add constraint game_events_type_check check (
    type in (
      'correct', 'taboo', 'pass', 'card_closed', 'turn_started', 'game_completed', 'game_abandoned',
      'sp_lit', 'sp_pass', 'sp_explode'
    )
  );

-- The letter groups: the group in word, its tier in theme.
alter table public.cards drop constraint cards_deck_check;
alter table public.cards
  add constraint cards_deck_check
  check (deck in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'sprengja'));
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
    or (deck = 'sprengja' and word is not null and theme in ('kolay', 'orta', 'zor')
        and prompt is null and forbidden is null)
  );

-- The job's search for a burning fuse reads only the rows that have one.
create index game_secrets_sprengja_fuse on public.game_secrets (room_id)
  where concept = 'sprengja' and secret ? 'explodesAt';

-- 2. Rules -------------------------------------------------------------------------------------
-- pure/sprengja.ts → SPRENGJA (sprengja.test.ts reads the numbers here).
create function private.sprengja_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'minPlayers', 3, 'maxPlayers', 8, 'minRounds', 5, 'maxRounds', 8,
    'lowBaseMs', 8000, 'lowPerPlayerMs', 1500, 'highBaseMs', 18000, 'highPerPlayerMs', 3500,
    'hardFrom', 6, 'summarySeconds', 15,
    'holderPollMs', 1000, 'nextPollMs', 3000, 'othersPollMs', 10000, 'cronHolderPollMs', 2000
  );
$$;

create function private.sprengja_num(name text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (private.sprengja_config() ->> name)::integer;
$$;

-- pure/sprengja.ts → roundsFor.
create function private.sprengja_rounds(players integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select least(
    private.sprengja_num('maxRounds'), greatest(private.sprengja_num('minRounds'), players)
  );
$$;

-- The hidden fuse (pure/sprengja.ts → fuseMs): uniform in the range for `players`, drawn from
-- pgcrypto's random bytes.
create function private.sprengja_fuse(players integer)
returns interval
language plpgsql
volatile
set search_path = ''
as $$
declare
  low integer := private.sprengja_num('lowBaseMs') + players * private.sprengja_num('lowPerPlayerMs');
  high integer :=
    private.sprengja_num('highBaseMs') + players * private.sprengja_num('highPerPlayerMs');
  u double precision;
begin
  u := ('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint / 4294967296.0;
  return make_interval(secs => floor(low + (high - low) * u) / 1000.0);
end;
$$;

-- 3. Helpers -----------------------------------------------------------------------------------
-- The players still in the game, in the throwing order.
create function private.sprengja_active(st jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(o.sid order by o.n), '{}'::text[])
  from jsonb_array_elements_text(coalesce(st -> 'order', '[]'::jsonb)) with ordinality as o (sid, n)
  where not coalesce(st -> 'gone', '[]'::jsonb) ? o.sid;
$$;

-- The next player still in the game after `from_sid`, clockwise (pure/sprengja.ts → nextActive).
create function private.sprengja_next(st jsonb, from_sid text)
returns text
language sql
immutable
set search_path = ''
as $$
  with o as (
    select sid, (n - 1)::integer as i, count(*) over ()::integer as total
    from jsonb_array_elements_text(coalesce(st -> 'order', '[]'::jsonb)) with ordinality as x (sid, n)
  ),
  me as (select i from o where sid = from_sid)
  select o.sid
  from o, me
  where o.sid <> from_sid and not coalesce(st -> 'gone', '[]'::jsonb) ? o.sid
  order by (o.i - me.i + o.total) % o.total
  limit 1;
$$;

-- Is the job on (K-85 O-14: created off, turned on by hand after the dev checks)?
create function private.sprengja_cron_on()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (select 1 from cron.job where jobname = 'sprengja-explode' and active);
exception when others then
  return false;
end;
$$;

-- How often the phones poll (pure/sprengja.ts → pollCadence).
create function private.sprengja_poll()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when private.sprengja_cron_on()
    then jsonb_build_object(
      'holderMs', private.sprengja_num('cronHolderPollMs'), 'nextMs', 0, 'othersMs', 0
    )
    else jsonb_build_object(
      'holderMs', private.sprengja_num('holderPollMs'),
      'nextMs', private.sprengja_num('nextPollMs'),
      'othersMs', private.sprengja_num('othersPollMs')
    )
  end;
$$;

create function private.sprengja_write(target_room_id uuid, st jsonb)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  update public.rooms set game_state = st, last_activity_at = now()
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- The caller at a running game: the table (locked), the caller's seat and whether the caller plays
-- it (in the order and not gone).
create function private.sprengja_seat(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, playing boolean)
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
  if r.concept is distinct from 'sprengja' or not (r.game_state ? 'phase') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  return query select r, p.session_id, p.is_leader,
    coalesce(r.game_state -> 'order', '[]'::jsonb) ? p.session_id::text
      and not coalesce(r.game_state -> 'gone', '[]'::jsonb) ? p.session_id::text;
end;
$$;

-- 4. The round ---------------------------------------------------------------------------------
-- The bomb goes off in the holder's hands: a blast for the holder (none if the holder left the
-- game), Tur sonu with its clock, and the next round's starter (the holder, or the next player
-- still in the game, K-85 O-6). The fuse leaves the secrets; the event names the holder, never
-- the moment.
create function private.sprengja_explode(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  holder text := r.game_state ->> 'holder';
  holder_gone boolean := coalesce(r.game_state -> 'gone', '[]'::jsonb) ? (r.game_state ->> 'holder');
  rnd integer := (r.game_state ->> 'round')::integer;
begin
  if not holder_gone then
    st := jsonb_set(
      st, array['hits', holder],
      to_jsonb(coalesce((st -> 'hits' ->> holder)::integer, 0) + 1)
    );
  end if;
  st := st || jsonb_build_object(
    'phase', 'summary',
    'step', (st ->> 'step')::integer + 1,
    'lastBlast', jsonb_build_object('round', rnd, 'holder', holder, 'gone', holder_gone),
    'starter', case when holder_gone then private.sprengja_next(st, holder) else holder end,
    'ready', '[]'::jsonb,
    'endsAt', clock_timestamp() + make_interval(secs => private.sprengja_num('summarySeconds'))
  );
  update public.game_secrets set secret = secret - 'explodesAt'
  where room_id = r.id and game_no = private.current_game_no(r.game_state);
  insert into public.game_events (room_id, type, payload)
  values (r.id, 'sp_explode', jsonb_build_object('round', rnd, 'holder', holder));
  return private.sprengja_write(r.id, st);
end;
$$;

-- Has the fuse run out? Then the bomb goes off now. The caller holds the table.
create function private.sprengja_settle(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  fuse timestamptz;
begin
  if r.concept is distinct from 'sprengja' or r.game_state ->> 'phase' is distinct from 'lit' then
    return r;
  end if;
  select (gs.secret ->> 'explodesAt')::timestamptz into fuse
  from public.game_secrets gs
  where gs.room_id = r.id and gs.game_no = private.current_game_no(r.game_state);
  if fuse is not null and clock_timestamp() >= fuse then
    return private.sprengja_explode(r);
  end if;
  return r;
end;
$$;

-- The end: a result for every player still in the game (the fewest blasts won), then the frame's
-- end (private.end_game) and what the end screen shows in lastGame.sprengja. Abandoned (fewer than
-- three left, K-85 O-10): the scores, no winner and no result.
create function private.sprengja_finish(r public.rooms, abandoned boolean)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  active text[] := private.sprengja_active(r.game_state);
  least_hits integer;
  winners jsonb := '[]'::jsonb;
  result jsonb;
  done public.rooms;
begin
  if not abandoned and cardinality(active) > 0 then
    select min(coalesce((st -> 'hits' ->> a.sid)::integer, 0)) into least_hits
    from unnest(active) a (sid);
    select coalesce(jsonb_agg(a.sid order by a.n), '[]'::jsonb) into winners
    from unnest(active) with ordinality a (sid, n)
    where coalesce((st -> 'hits' ->> a.sid)::integer, 0) = least_hits;

    insert into public.game_results (user_id, room_id, concept, mode, score, won)
    select ts.user_id, r.id, 'sprengja', 'sprengja',
           -coalesce((st -> 'hits' ->> gp.session_id::text)::integer, 0),
           winners ? gp.session_id::text
    from public.game_players gp
    join public.table_sessions ts on ts.id = gp.session_id
    where gp.room_id = r.id and gp.game_no = no and gp.left_at is null
      and gp.session_id::text = any (active);
  end if;

  result := jsonb_build_object(
    'order', coalesce(st -> 'order', '[]'::jsonb),
    'gone', coalesce(st -> 'gone', '[]'::jsonb),
    'hits', coalesce(st -> 'hits', '{}'::jsonb),
    'round', coalesce((st ->> 'round')::integer, 0),
    'rounds', coalesce((st ->> 'rounds')::integer, 0),
    'winners', winners
  );
  update public.game_secrets set secret = secret - 'explodesAt'
  where room_id = r.id and game_no = no;
  done := private.end_game(r.id, abandoned);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,sprengja}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- After Tur sonu: the next round's closed card, or the end after the last round.
create function private.sprengja_next_round(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
begin
  if (st ->> 'round')::integer >= (st ->> 'rounds')::integer then
    return private.sprengja_finish(r, false);
  end if;
  return private.sprengja_write(r.id, st || jsonb_build_object(
    'phase', 'card',
    'step', (st ->> 'step')::integer + 1,
    'round', (st ->> 'round')::integer + 1,
    'holder', null,
    'passes', 0,
    'letters', null,
    'ready', '[]'::jsonb,
    'endsAt', null
  ));
end;
$$;

-- 5. The actions -------------------------------------------------------------------------------
-- sprengja/shuffle: the owner, on the game's pre-game page: the throwing order at random, of
-- everyone at the table who does not watch. Without it the order is the order they came in.
create function public.sprengja_shuffle(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  picked jsonb;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  select * into r from public.rooms where id = target_room_id;
  if r.concept is not null or r.game_state -> 'pregame' ->> 'concept' is distinct from 'sprengja' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  picked := coalesce(r.game_state -> 'pregame' -> 'picks', '{}'::jsonb);
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(game_state, '{pregame,order}', coalesce((
        select jsonb_agg(rm.session_id::text order by random())
        from public.room_members rm
        where rm.room_id = r.id and rm.left_at is null
          and coalesce(picked ->> rm.session_id::text, '') <> 'obs'
      ), '[]'::jsonb))
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- sprengja/start: the owner, from the pre-game page (private.start_game: 3 to 8 players, the rest
-- watch). The order is the page's shuffled order, then the order they came in. The deck must hold
-- a letter group for every round (no_cards).
create function public.sprengja_start(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  shuffled jsonb;
  no integer;
  players integer;
  rounds integer;
  seats jsonb;
begin
  -- The table first (rule 10), so the page's order is read under its lock.
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  shuffled := coalesce(r.game_state -> 'pregame' -> 'order', '[]'::jsonb);
  no := private.start_game(target_user_id, target_room_id, 'sprengja');

  select count(*)::integer into players
  from public.game_players where room_id = target_room_id and game_no = no;
  rounds := private.sprengja_rounds(players);
  if (
    select count(distinct c.word) from public.cards c
    where c.deck = 'sprengja' and c.is_active
      and (c.theme <> 'zor' or players >= private.sprengja_num('hardFrom'))
  ) < rounds then
    raise exception using errcode = 'P0001', message = 'no_cards';
  end if;

  update public.game_players gp
  set seat_order = ranked.k
  from (
    select g.session_id,
           (row_number() over (
             order by coalesce(s.n, 1000000), rm.joined_at, g.session_id
           ))::smallint as k
    from public.game_players g
    join public.room_members rm
      on rm.room_id = g.room_id and rm.session_id = g.session_id and rm.left_at is null
    left join jsonb_array_elements_text(shuffled) with ordinality as s (sid, n)
      on s.sid = g.session_id::text
    where g.room_id = target_room_id and g.game_no = no
  ) ranked
  where gp.room_id = target_room_id and gp.game_no = no and gp.session_id = ranked.session_id;

  select coalesce(jsonb_agg(session_id::text order by seat_order), '[]'::jsonb) into seats
  from public.game_players where room_id = target_room_id and game_no = no;

  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (target_room_id, no, 'sprengja', '{}'::jsonb);

  return private.sprengja_write(target_room_id, jsonb_build_object(
    'gameNo', no,
    'phase', 'card',
    'step', 1,
    'round', 1,
    'rounds', rounds,
    'players', players,
    'order', seats,
    'gone', '[]'::jsonb,
    'starter', seats ->> 0,
    'holder', null,
    'passes', 0,
    'letters', null,
    'used', '[]'::jsonb,
    'hits', '{}'::jsonb,
    'lastBlast', null,
    'ready', '[]'::jsonb,
    'endsAt', null,
    'poll', private.sprengja_poll()
  ));
end;
$$;

-- sprengja/reveal: the round's starter opens the card; the letter group is open to the table. A
-- group not used this game, the hard ones from six players. A press for another round or after
-- the card is open changes nothing.
create function public.sprengja_reveal(target_user_id uuid, target_room_id uuid, at_round integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
  picked text;
begin
  select * into seat from private.sprengja_seat(target_user_id, target_room_id);
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'card' or (st ->> 'round')::integer <> at_round then
    return seat.room;
  end if;
  if st ->> 'starter' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_starter';
  end if;
  select c.word into picked
  from public.cards c
  where c.deck = 'sprengja' and c.is_active
    and (c.theme <> 'zor' or (st ->> 'players')::integer >= private.sprengja_num('hardFrom'))
    and not coalesce(st -> 'used', '[]'::jsonb) ? c.word
  order by random()
  limit 1;
  if picked is null then
    raise exception using errcode = 'P0001', message = 'no_cards';
  end if;
  return private.sprengja_write((seat.room).id, st || jsonb_build_object(
    'phase', 'letters',
    'step', (st ->> 'step')::integer + 1,
    'letters', picked,
    'used', coalesce(st -> 'used', '[]'::jsonb) || to_jsonb(picked)
  ));
end;
$$;

-- sprengja/light: the starter lights the fuse; the bomb is in the starter's hands. The moment it
-- goes off is drawn here and goes only to game_secrets.
create function public.sprengja_light(target_user_id uuid, target_room_id uuid, at_round integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
  v_at timestamptz;
  rnd integer;
begin
  select * into seat from private.sprengja_seat(target_user_id, target_room_id);
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  st := (seat.room).game_state;
  rnd := (st ->> 'round')::integer;
  if st ->> 'phase' <> 'letters' or rnd <> at_round then
    return seat.room;
  end if;
  if st ->> 'starter' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_starter';
  end if;
  v_at := clock_timestamp();
  update public.game_secrets
  set secret = secret || jsonb_build_object(
    'explodesAt', v_at + private.sprengja_fuse((st ->> 'players')::integer),
    'round', rnd
  )
  where room_id = (seat.room).id and game_no = private.current_game_no(st);
  insert into public.game_events (room_id, type, payload, created_at)
  values (
    (seat.room).id, 'sp_lit',
    jsonb_build_object('round', rnd, 'holder', seat.session_id::text), v_at
  );
  return private.sprengja_write((seat.room).id, st || jsonb_build_object(
    'phase', 'lit',
    'step', (st ->> 'step')::integer + 1,
    'holder', seat.session_id::text,
    'passes', 0,
    'poll', private.sprengja_poll()
  ));
end;
$$;

-- sprengja/pass: the holder throws the bomb to the next player still in the game. The answer says
-- only what the table can already see once this call ends: 'passed' (the bomb moved), 'ignored'
-- (a press for a state already gone: a second press of the same throw, an old round) or 'over'
-- (this round's bomb has gone off, in this call or before it). It never tells how long the fuse
-- has left (K-85 O-4). A throw that gets the table at or after the fuse's moment blows up in the
-- thrower's hands, and that blast is kept: the answer is a value, not an error, so nothing rolls
-- back.
create function public.sprengja_pass(
  target_user_id uuid,
  target_room_id uuid,
  at_round integer,
  at_step integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  r public.rooms;
  st jsonb;
  v_at timestamptz;
  fuse timestamptz;
  me text;
  receiver text;
  rnd integer;
begin
  select * into seat from private.sprengja_seat(target_user_id, target_room_id);
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  r := seat.room;
  st := r.game_state;
  me := seat.session_id::text;
  rnd := (st ->> 'round')::integer;
  if rnd <> at_round then
    return 'ignored';
  end if;
  if st ->> 'phase' <> 'lit' then
    return case when st ->> 'phase' in ('summary', 'halted') then 'over' else 'ignored' end;
  end if;

  v_at := clock_timestamp();
  select (gs.secret ->> 'explodesAt')::timestamptz into fuse
  from public.game_secrets gs
  where gs.room_id = r.id and gs.game_no = private.current_game_no(st);
  if fuse is not null and v_at >= fuse then
    perform private.sprengja_explode(r);
    return 'over';
  end if;
  if (st ->> 'step')::integer <> at_step then
    return 'ignored';
  end if;
  if st ->> 'holder' is distinct from me then
    raise exception using errcode = 'P0001', message = 'not_holder';
  end if;

  receiver := private.sprengja_next(st, me);
  st := st || jsonb_build_object(
    'step', (st ->> 'step')::integer + 1,
    'holder', receiver,
    'passes', coalesce((st ->> 'passes')::integer, 0) + 1
  );
  insert into public.game_events (room_id, type, payload, created_at)
  values (
    r.id, 'sp_pass',
    jsonb_build_object('round', rnd, 'step', (st ->> 'step')::integer, 'from', me, 'to', receiver),
    v_at
  );
  perform private.sprengja_write(r.id, st);
  return 'passed';
end;
$$;

-- sprengja/poll: anyone at the table, while the fuse burns, as often as game_state.poll says. If
-- the fuse ran out, the bomb goes off now; else nothing. It reads the fuse without a lock and takes
-- the table only when it ran out; the answer is the same either way.
create function public.sprengja_poll(target_user_id uuid, target_room_id uuid, at_round integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  if not exists (
    select 1
    from public.table_sessions ts
    join public.room_members rm on rm.session_id = ts.id and rm.left_at is null
    where ts.user_id = target_user_id and ts.status = 'active' and rm.room_id = target_room_id
  ) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if not exists (
    select 1
    from public.rooms r
    join public.game_secrets gs
      on gs.room_id = r.id and gs.game_no = private.current_game_no(r.game_state)
    where r.id = target_room_id and r.concept = 'sprengja'
      and r.game_state ->> 'phase' = 'lit' and (r.game_state ->> 'round')::integer = at_round
      and gs.secret ? 'explodesAt'
      and (gs.secret ->> 'explodesAt')::timestamptz <= clock_timestamp()
  ) then
    return;
  end if;
  select * into seat from private.sprengja_seat(target_user_id, target_room_id);
  perform private.sprengja_settle(seat.room);
end;
$$;

-- sprengja/ready: a player on Tur sonu. When everyone still in the game is ready, the next round.
create function public.sprengja_ready(target_user_id uuid, target_room_id uuid, at_step integer)
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
  select * into seat from private.sprengja_seat(target_user_id, target_room_id);
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'summary' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'ready', '[]'::jsonb) ? seat.session_id::text then
    return seat.room;
  end if;
  st := jsonb_set(
    st, '{ready}', coalesce(st -> 'ready', '[]'::jsonb) || to_jsonb(seat.session_id::text)
  );
  r := private.sprengja_write((seat.room).id, st);
  if not exists (
    select 1 from unnest(private.sprengja_active(st)) a (sid)
    where not st -> 'ready' ? a.sid
  ) then
    return private.sprengja_next_round(r);
  end if;
  return r;
end;
$$;

-- sprengja/advance: anyone at the table; idempotent. A burning fuse that ran out goes off; Tur
-- sonu whose time is up (a second of slack for the phones' clocks) moves on; a halted game ends,
-- abandoned. Early, it changes nothing.
create function public.sprengja_advance(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  phase text;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'sprengja' or not (r.game_state ? 'phase') then
    return r;
  end if;
  phase := r.game_state ->> 'phase';
  if phase = 'lit' then
    return private.sprengja_settle(r);
  elsif phase = 'summary'
     and clock_timestamp() + interval '1 second' >= (r.game_state ->> 'endsAt')::timestamptz then
    return private.sprengja_next_round(r);
  elsif phase = 'halted' then
    return private.sprengja_finish(r, true);
  end if;
  return r;
end;
$$;

-- 6. The job -----------------------------------------------------------------------------------
-- Every burning fuse that ran out goes off: each table locked alone, skipping one a person's call
-- holds (that call settles it itself). A fuse left behind by a game that ended or moved on is
-- dropped. Returns how many tables it looked at.
create function private.sprengja_explode_due()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  due record;
  r public.rooms;
  seen integer := 0;
begin
  for due in
    select gs.room_id, gs.game_no
    from public.game_secrets gs
    where gs.concept = 'sprengja' and gs.secret ? 'explodesAt'
      and (gs.secret ->> 'explodesAt')::timestamptz <= clock_timestamp()
  loop
    select * into r from public.rooms where id = due.room_id for update skip locked;
    continue when r.id is null;
    if r.concept is distinct from 'sprengja' or private.current_game_no(r.game_state) <> due.game_no
       or r.game_state ->> 'phase' is distinct from 'lit' then
      update public.game_secrets set secret = secret - 'explodesAt'
      where room_id = due.room_id and game_no = due.game_no;
    else
      perform private.sprengja_settle(r);
    end if;
    seen := seen + 1;
  end loop;
  return seen;
end;
$$;

-- pg_cron runs a job every second from 1.5 on. Created switched off (K-85 O-14): the phones poll
-- more often until it is turned on (docs/decisions/4.6.7-sprengja.md → "Patlamayı kim görür"). The
-- seconds job's run log is trimmed every hour. Without pg_cron 1.5 there is no job, and the phones'
-- polls carry the game.
do $do$
declare
  version integer[];
begin
  select (string_to_array(split_part(extversion, '-', 1), '.'))[1:2]::integer[] into version
  from pg_extension where extname = 'pg_cron';
  if version is null or version < array[1, 5] then
    raise notice 'pg_cron % has no seconds jobs: sprengja-explode is not scheduled', version;
    return;
  end if;
  perform cron.schedule('sprengja-explode', '1 seconds', 'select private.sprengja_explode_due()');
  perform cron.alter_job(job_id => jobid, active => false)
  from cron.job where jobname = 'sprengja-explode';
  perform cron.schedule(
    'sprengja-explode-log',
    '41 * * * *',
    $job$
      delete from cron.job_run_details d
      using cron.job j
      where d.jobid = j.jobid and j.jobname = 'sprengja-explode'
        and d.end_time < now() - interval '1 hour'
    $job$
  );
end;
$do$;

-- 7. Leaving -----------------------------------------------------------------------------------
-- A player who leaves the game or the table (any road stamps game_players.left_at while holding
-- the table) is gone. Fewer than three left: the game halts and the next advance ends it,
-- abandoned (K-85 O-10). A starter who leaves hands the card to the next player. A holder who
-- leaves hands the bomb on, unless the fuse has already run out: then it goes off with the one who
-- left, and nobody loses a point. On Tur sonu, the rest being ready moves on at the next advance.
create function private.sprengja_on_player_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  st jsonb;
  left_sid text := new.session_id::text;
  phase text;
  fuse timestamptz;
  v_at timestamptz;
  receiver text;
begin
  select * into r from public.rooms where id = new.room_id;
  if r.concept is distinct from 'sprengja' or not (r.game_state ? 'phase')
     or private.current_game_no(r.game_state) <> new.game_no
     or not coalesce(r.game_state -> 'order', '[]'::jsonb) ? left_sid
     or coalesce(r.game_state -> 'gone', '[]'::jsonb) ? left_sid then
    return new;
  end if;
  st := jsonb_set(
    r.game_state, '{gone}', coalesce(r.game_state -> 'gone', '[]'::jsonb) || to_jsonb(left_sid)
  );
  phase := st ->> 'phase';

  if cardinality(private.sprengja_active(st)) < 3 then
    update public.game_secrets set secret = secret - 'explodesAt'
    where room_id = r.id and game_no = new.game_no;
    perform private.sprengja_write(r.id, st || jsonb_build_object(
      'phase', 'halted',
      'step', (st ->> 'step')::integer + 1,
      'ready', '[]'::jsonb,
      'endsAt', clock_timestamp()
    ));
    return new;
  end if;

  if phase in ('card', 'letters', 'summary') and st ->> 'starter' = left_sid then
    st := jsonb_set(st, '{starter}', to_jsonb(private.sprengja_next(st, left_sid)));
  end if;

  if phase = 'summary' then
    st := jsonb_set(st, '{ready}', coalesce(st -> 'ready', '[]'::jsonb) - left_sid);
    if not exists (
      select 1 from unnest(private.sprengja_active(st)) a (sid)
      where not coalesce(st -> 'ready', '[]'::jsonb) ? a.sid
    ) then
      st := jsonb_set(st, '{endsAt}', to_jsonb(clock_timestamp()));
    end if;
  end if;

  if phase = 'lit' and st ->> 'holder' = left_sid then
    v_at := clock_timestamp();
    select (gs.secret ->> 'explodesAt')::timestamptz into fuse
    from public.game_secrets gs
    where gs.room_id = r.id and gs.game_no = new.game_no;
    if fuse is not null and v_at >= fuse then
      r := private.sprengja_write(r.id, st);
      perform private.sprengja_explode(r);
      return new;
    end if;
    receiver := private.sprengja_next(st, left_sid);
    st := st || jsonb_build_object('step', (st ->> 'step')::integer + 1, 'holder', receiver);
    insert into public.game_events (room_id, type, payload, created_at)
    values (
      r.id, 'sp_pass',
      jsonb_build_object(
        'round', (st ->> 'round')::integer, 'step', (st ->> 'step')::integer,
        'from', left_sid, 'to', receiver, 'reason', 'left'
      ),
      v_at
    );
  end if;

  perform private.sprengja_write(r.id, st);
  return new;
end;
$$;

create trigger game_players_sprengja_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.sprengja_on_player_left();

-- 8. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.sprengja_shuffle(uuid, uuid)',
    'public.sprengja_start(uuid, uuid)',
    'public.sprengja_reveal(uuid, uuid, integer)',
    'public.sprengja_light(uuid, uuid, integer)',
    'public.sprengja_pass(uuid, uuid, integer, integer)',
    'public.sprengja_poll(uuid, uuid, integer)',
    'public.sprengja_ready(uuid, uuid, integer)',
    'public.sprengja_advance(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.sprengja_config()',
    'private.sprengja_num(text)',
    'private.sprengja_rounds(integer)',
    'private.sprengja_fuse(integer)',
    'private.sprengja_active(jsonb)',
    'private.sprengja_next(jsonb, text)',
    'private.sprengja_cron_on()',
    'private.sprengja_poll()',
    'private.sprengja_write(uuid, jsonb)',
    'private.sprengja_seat(uuid, uuid)',
    'private.sprengja_explode(public.rooms)',
    'private.sprengja_settle(public.rooms)',
    'private.sprengja_finish(public.rooms, boolean)',
    'private.sprengja_next_round(public.rooms)',
    'private.sprengja_explode_due()',
    'private.sprengja_on_player_left()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
