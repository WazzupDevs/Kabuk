-- Faz 4 step 4.6.10 (docs/SPEC_V4.md §4.F "Adım 4.6.10: Kaupholl", K-87; rules and plan
-- docs/decisions/kaupholl.md v3.1): five questions, everyone writes a number, the guesses go on a
-- board, everyone puts two coins on the guesses they think win. "Cevabı geçmeyen en büyük tahmin
-- kazanır."
--
-- The game's decisions are made by _shared/pure/kaupholl.ts in the kaupholl Edge Function, as in
-- Signum: it reads the game here without a lock (kaupholl_read), decides, and writes back through
-- kaupholl_commit, which under the table's lock checks that nothing changed since the read, that the
-- caller still holds the same check-in, and that a guess or a bet is still inside its phase's time
-- by clock_timestamp() (now() is the transaction's start, before any lock was waited for). When
-- anything changed the commit writes nothing and the function decides again (three tries, then a
-- "busy" answer).
--
-- Where what lives:
-- - public.kaupholl_questions: the deck (question, unit, decimals, answer, note, labels, the kind of
--   check it passed). Never in this repo (the content step's private repos; docs/OPS.md → Gizli
--   içerik kapısı); only `pnpm admin:kaupholl-import` writes it. Closed to every client.
-- - public.kaupholl_question_stats: counts and sums a question's games add up (§4 "Kişisel olmayan
--   soru istatistiği"): no person, table, venue, game or time. Closed to every client; only
--   `pnpm admin:kaupholl-stats` reads it.
-- - public.kaupholl_used_questions: the questions a table has had; a table never gets one twice.
-- - public.kaupholl_counters: how many starts found no valid five (`questions_exhausted`).
-- - rooms.game_state, open to the table (and so to Realtime): pure/kaupholl.ts → KauphollState. The
--   question only once its card is open; each player's guess as a chip (none, written, locked),
--   never the number, until the board is built; the answer and its note only from the answer phase.
-- - game_secrets.secret, closed to clients: the game's five questions with their answers, every
--   player's guess with its seq, and the write version (rev). Only kaupholl_read gives it out (to the
--   service role); a phone gets only its own guess, through kaupholl/view and its own answers.
--
-- Leaving: pure/kaupholl.ts → leaveGame, in the trigger below. Fewer than two players left: the game
-- is abandoned (no winner, no game_results; the frame's end).
--
-- Locks (rule 10): check-in → rooms → game_players → game_secrets → kaupholl_used_questions →
-- kaupholl_question_stats. kaupholl_commit and kaupholl_start take the check-in and the table
-- (private.room_phone); the start writes game_players (private.start_game), game_secrets and the
-- table's used questions; a commit takes the game's game_secrets row and, when a question's answer
-- opens, its statistics row. The leaving trigger runs while whoever stamps game_players.left_at holds
-- the table, and then takes game_secrets. kaupholl_counters is taken alone, with no other lock held.

-- 1. The game ----------------------------------------------------------------------------------
-- In the list before the seed (content/games.json) makes it known, so rooms.concept can name it.
insert into public.games (id, name, min_players, max_players, teams, pregame)
values ('kaupholl', 'Kaupholl', 3, 6, false, true)
on conflict (id) do nothing;

alter table public.game_secrets drop constraint game_secrets_concept_check;
alter table public.game_secrets
  add constraint game_secrets_concept_check
  check (concept in ('sahtekar', 'ibre', 'vampir', 'signum', 'sprengja', 'kaupholl'));

alter table public.game_results drop constraint game_results_concept_check;
alter table public.game_results
  add constraint game_results_concept_check
  check (
    concept in (
      'tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum', 'sprengja',
      'kaupholl'
    )
  );
alter table public.game_results drop constraint game_results_mode_check;
alter table public.game_results
  add constraint game_results_mode_check
  check (
    mode in (
      'voice', 'text', 'cooperative', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum',
      'sprengja', 'kaupholl'
    )
  );
-- A table's pair history names the game played there (private.write_pair_history).
alter table public.play_history drop constraint play_history_concept_check;
alter table public.play_history
  add constraint play_history_concept_check
  check (
    concept in (
      'tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum', 'sprengja',
      'kibrit', 'kaupholl', 'chat'
    )
  );

-- 2. The deck and its counts ---------------------------------------------------------------------
-- A row's rules (§4 "Satır kuralları"): a unit always; 0 to 999.999,9, one decimal at most (none
-- when `decimals` is 0); difficulty, leaning and category. `verification`: blind or independent
-- (§4 "Bağımsız doğrulama"); the import takes no row without one.
create table public.kaupholl_questions (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  body text not null check (char_length(body) between 1 and 200),
  unit text not null check (char_length(unit) between 1 and 40),
  decimals smallint not null check (decimals in (0, 1)),
  answer numeric(7, 1) not null check (answer >= 0 and answer <= 999999.9),
  note text not null check (char_length(note) between 1 and 400),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  bias text not null check (bias in ('under', 'neutral', 'over')),
  category text not null check (char_length(category) between 1 and 40),
  verification text not null check (verification in ('blind', 'independent')),
  active boolean not null default true,
  check (decimals = 1 or answer = trunc(answer))
);

alter table public.kaupholl_questions enable row level security;
revoke all on table public.kaupholl_questions from anon, authenticated;

-- win_bucket: where the winning slice stood (pure/kaupholl.ts → winBucket): Hepsinden küçük, the
-- lowest guess, below the middle, the middle, above it, the largest guess.
create table public.kaupholl_question_stats (
  question_id text primary key references public.kaupholl_questions (id) on delete cascade,
  games integer not null default 0,
  guesses integer not null default 0,
  no_guess integer not null default 0,
  smaller_wins integer not null default 0,
  win_bucket integer[] not null default '{0,0,0,0,0,0}' check (cardinality(win_bucket) = 6),
  sum_abs_log_err double precision not null default 0
);

alter table public.kaupholl_question_stats enable row level security;
revoke all on table public.kaupholl_question_stats from anon, authenticated;

-- The table's own ban on repeats (§4 "Tekrar ve havuz büyüklüğü"): written when a game starts, gone
-- with the table. A new table sees the whole deck.
create table public.kaupholl_used_questions (
  room_id uuid not null references public.rooms (id) on delete cascade,
  question_id text not null references public.kaupholl_questions (id) on delete cascade,
  primary key (room_id, question_id)
);

alter table public.kaupholl_used_questions enable row level security;
revoke all on table public.kaupholl_used_questions from anon, authenticated;

create table public.kaupholl_counters (
  name text primary key check (name in ('exhausted')),
  n bigint not null default 0
);

alter table public.kaupholl_counters enable row level security;
revoke all on table public.kaupholl_counters from anon, authenticated;

insert into public.kaupholl_counters (name) values ('exhausted');

-- 3. Rules ---------------------------------------------------------------------------------------
-- pure/kaupholl.ts → KAUPHOLL (kaupholl.test.ts in supabase/tests reads the numbers here).
create function private.kaupholl_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'minPlayers', 3, 'maxPlayers', 6, 'abandonBelow', 2, 'questions', 5, 'coins', 2,
    'winnerBonus', 3, 'cardSeconds', 10, 'guessSeconds', 45, 'betSeconds', 20, 'pauseSeconds', 10
  );
$$;

-- 4. Who asks ------------------------------------------------------------------------------------
-- The caller's check-in at the table, read without a lock. No check-in: no_active_table; not at the
-- table: not_in_room. Who plays is the open state's seats and gone, which the leaving trigger keeps
-- with game_players under the table's lock.
create function private.kaupholl_seat_read(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
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
  return query select r, s.id, s.id = r.owner_session_id;
end;
$$;

-- 5. Reading and writing a running game -----------------------------------------------------------
-- What the Edge Function decides from: the open state, the secret and its version, the caller's
-- check-in and the database's clock. Service role only (the secret is in it).
create function public.kaupholl_read(target_user_id uuid, target_room_id uuid)
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
  select * into seat from private.kaupholl_seat_read(target_user_id, target_room_id);
  if (seat.room).concept is distinct from 'kaupholl' or not ((seat.room).game_state ? 'phase') then
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
    'now', clock_timestamp()
  );
end;
$$;

-- A last guard before anything reaches the open state: nothing of the secret's by name, the question
-- only once its card is open and then the secret's, no board before the guesses close, the answer
-- only from its phase and then the secret's, chips that carry no number.
create function private.kaupholl_check_write(st jsonb, sec jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  phase text := st ->> 'phase';
  q jsonb;
begin
  if st ?| array['questions', 'guesses', 'secret', 'rev']
     or coalesce(phase, '') not in ('card', 'guess', 'board', 'answer', 'summary', 'over')
     or jsonb_typeof(st -> 'round') is distinct from 'number'
     or jsonb_typeof(sec -> 'questions') is distinct from 'array'
     or jsonb_array_length(sec -> 'questions') <> 5
     or jsonb_typeof(st -> 'chips') is distinct from 'object'
     or exists (
       select 1 from jsonb_each(st -> 'chips') c
       where c.value not in ('"none"'::jsonb, '"written"'::jsonb, '"locked"'::jsonb)
     ) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if phase <> 'over' and (st -> 'winners') is distinct from 'null'::jsonb
     or jsonb_typeof(st -> 'endsAt') is distinct from 'string' then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  q := sec -> 'questions' -> ((st ->> 'round')::integer);
  if q is null then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if phase = 'card' then
    if (st -> 'card') is distinct from 'null'::jsonb then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
  elsif (st -> 'card' -> 'text') is distinct from (q -> 'text')
     or (st -> 'card' -> 'unit') is distinct from (q -> 'unit') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if phase in ('card', 'guess') and (st -> 'board') is distinct from 'null'::jsonb then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if phase in ('card', 'guess', 'board') then
    -- Nothing of the answer before its phase: not the winning slice, not a point.
    if (st -> 'answer') is distinct from 'null'::jsonb
       or (st -> 'winner') is distinct from 'null'::jsonb
       or (st -> 'points') is distinct from '{}'::jsonb
       or (st -> 'noGuesses') is distinct from 'false'::jsonb then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
  elsif (st -> 'answer' -> 'value') is distinct from (q -> 'answer')
     or (st -> 'answer' -> 'note') is distinct from (q -> 'note') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
end;
$$;

-- A question's answer opened: its counts (pure/kaupholl.ts → roundStats) are added. Under the
-- table's lock, after the game's secret.
create function private.kaupholl_count_round(question text, stats jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket integer := (stats ->> 'bucket')::integer;
  guesses integer := coalesce((stats ->> 'guesses')::integer, 0);
  err double precision := coalesce((stats ->> 'sumAbsLogErr')::double precision, 0);
  no_guess integer := case when (stats ->> 'noGuess')::boolean then 1 else 0 end;
  smaller integer := case when (stats ->> 'smallerWin')::boolean then 1 else 0 end;
begin
  if guesses < 0 or err < 0 or (bucket is not null and bucket not between 0 and 5) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  insert into public.kaupholl_question_stats as t (
    question_id, games, guesses, no_guess, smaller_wins, win_bucket, sum_abs_log_err
  )
  values (
    question, 1, guesses, no_guess, smaller,
    array(select case when i - 1 = bucket then 1 else 0 end from generate_series(1, 6) i),
    err
  )
  on conflict (question_id) do update
  set games = t.games + 1,
      guesses = t.guesses + excluded.guesses,
      no_guess = t.no_guess + excluded.no_guess,
      smaller_wins = t.smaller_wins + excluded.smaller_wins,
      win_bucket = array(
        select w + coalesce(excluded.win_bucket[i], 0)
        from unnest(t.win_bucket) with ordinality u (w, i)
        order by i
      ),
      sum_abs_log_err = t.sum_abs_log_err + excluded.sum_abs_log_err;
end;
$$;

-- The game is over: the players still in it get their result (game_results; who left got none;
-- equal points share the win), and the frame ends the game. The over state stays for the result
-- screen in game_state.lastGame.kaupholl.
create function private.kaupholl_finish(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  done public.rooms;
begin
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ts.user_id, r.id, 'kaupholl', 'kaupholl',
         coalesce((st -> 'scores' ->> gp.session_id::text)::integer, 0),
         coalesce(st -> 'winners', '[]'::jsonb) ? gp.session_id::text
  from public.game_players gp
  join public.table_sessions ts on ts.id = gp.session_id
  where gp.room_id = r.id and gp.game_no = no and gp.left_at is null;
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,kaupholl}', st)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- The write of a decision. Under the check-in's and the table's locks (private.room_phone) and the
-- game's secret row: the open state and the secret's version must be the ones the decision was made
-- from, and the caller's check-in the one it was made for. `clock`: 'before' for a guess or a bet
-- (still inside its phase's time by clock_timestamp(), else nothing is written and the function
-- decides again), 'after' for an advance (its time ran out), 'any' for the card and Hazırım. Any of
-- these changed: { ok: false }, nothing written. `round_stats` comes with the step that opens a
-- question's answer.
create function public.kaupholl_commit(
  target_user_id uuid,
  target_room_id uuid,
  read_state jsonb,
  read_rev integer,
  read_session_id uuid,
  clock text,
  new_state jsonb,
  new_secret jsonb,
  round_stats jsonb
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
  no integer;
  ends timestamptz;
  st jsonb;
begin
  if clock not in ('before', 'after', 'any') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'kaupholl' or r.game_state is distinct from read_state
     or p.session_id <> read_session_id then
    return jsonb_build_object('ok', false);
  end if;
  no := private.current_game_no(r.game_state);
  select gs.secret into sec from public.game_secrets gs
  where gs.room_id = r.id and gs.game_no = no
  for update;
  if sec is null or coalesce((sec ->> 'rev')::integer, 0) <> read_rev then
    return jsonb_build_object('ok', false);
  end if;
  ends := (read_state ->> 'endsAt')::timestamptz;
  if ends is null then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if clock = 'before' and clock_timestamp() >= ends then
    return jsonb_build_object('ok', false);
  end if;
  if clock = 'after' and clock_timestamp() < ends then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  -- The decision is made on the open state; the frame's game number is the database's.
  st := (new_state - 'gameNo') || jsonb_build_object('gameNo', no);
  if (st -> 'seats') is distinct from (read_state -> 'seats')
     or (sec -> 'questions') is distinct from (new_secret -> 'questions') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  perform private.kaupholl_check_write(st, new_secret);

  update public.game_secrets
  set secret = (new_secret - 'rev') || jsonb_build_object('rev', read_rev + 1)
  where room_id = r.id and game_no = no;
  if st ->> 'phase' = 'answer' and read_state ->> 'phase' is distinct from 'answer' then
    if round_stats is null or jsonb_typeof(round_stats) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
    perform private.kaupholl_count_round(
      sec -> 'questions' -> ((st ->> 'round')::integer) ->> 'id', round_stats
    );
  end if;
  if st is distinct from r.game_state then
    update public.rooms set game_state = st, last_activity_at = now()
    where id = r.id
    returning * into r;
  end if;
  if st ->> 'phase' = 'over' then
    perform private.kaupholl_finish(r);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- 6. The pre-game page and the start -------------------------------------------------------------
-- What the start decides from, without a lock: the page, who would play (at the table with an
-- active check-in, not "Gözlemci ol"), the caller, the table's used questions and the active deck's
-- labels and game counts (no text, no answer: pure/kaupholl.ts → KauphollCandidate).
create function public.kaupholl_pregame_read(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  seat record;
  picks jsonb;
begin
  select * into seat from private.kaupholl_seat_read(target_user_id, target_room_id);
  if (seat.room).game_state -> 'pregame' ->> 'concept' is distinct from 'kaupholl' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  picks := coalesce((seat.room).game_state -> 'pregame' -> 'picks', '{}'::jsonb);
  return jsonb_build_object(
    'pregame', (seat.room).game_state -> 'pregame',
    'players', (
      select coalesce(jsonb_agg(rm.session_id::text order by rm.session_id), '[]'::jsonb)
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = target_room_id and rm.left_at is null and ts.status = 'active'
        and coalesce(picks ->> rm.session_id::text, '') <> 'obs'
    ),
    'sessionId', seat.session_id,
    'isOwner', seat.is_owner,
    'used', (
      select coalesce(jsonb_agg(u.question_id order by u.question_id), '[]'::jsonb)
      from public.kaupholl_used_questions u where u.room_id = target_room_id
    ),
    'pool', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'difficulty', q.difficulty, 'bias', q.bias, 'category', q.category,
        'active', q.active, 'games', coalesce(s.games, 0)
      ) order by q.id), '[]'::jsonb)
      from public.kaupholl_questions q
      left join public.kaupholl_question_stats s on s.question_id = q.id
      where q.active
    ),
    'now', clock_timestamp()
  );
end;
$$;

-- The five chosen questions as the game's secret keeps them (pure/kaupholl.ts → KauphollQuestion),
-- in the given order; fewer rows than ids when one is missing or not active.
create function private.kaupholl_questions_of(ids text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'text', q.body, 'unit', q.unit, 'decimals', q.decimals, 'answer', q.answer,
    'note', q.note, 'difficulty', q.difficulty
  ) order by o.n), '[]'::jsonb)
  from unnest(ids) with ordinality o (id, n)
  join public.kaupholl_questions q on q.id = o.id and q.active;
$$;

-- kaupholl/start: the owner, with the first state and secret the Edge Function dealt
-- (pure/kaupholl.ts → selectQuestions, startGame) from the read above. Under the table's lock the
-- page and the players must be as read, the five questions active, different, never used at this
-- table, their texts and answers the deck's, the fifth not hard; the frame then freezes the players
-- (private.start_game: 3 to 6). Changed since the read: { ok: false } and the function decides again.
create function public.kaupholl_start(
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
  picks jsonb;
  ids text[];
  st jsonb;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if r.game_state -> 'pregame' is distinct from read_pregame then
    return jsonb_build_object('ok', false);
  end if;
  picks := coalesce(read_pregame -> 'picks', '{}'::jsonb);
  -- The players the state was dealt for are the ones the frame will freeze (nobody joins or leaves
  -- the table while it is held).
  if jsonb_typeof(new_state -> 'seats') is distinct from 'array' or exists (
       (select rm.session_id::text from public.room_members rm
        join public.table_sessions ts on ts.id = rm.session_id
        where rm.room_id = r.id and rm.left_at is null and ts.status = 'active'
          and coalesce(picks ->> rm.session_id::text, '') <> 'obs')
       except
       (select s from jsonb_array_elements_text(new_state -> 'seats') s)
     ) or exists (
       (select s from jsonb_array_elements_text(new_state -> 'seats') s)
       except
       (select rm.session_id::text from public.room_members rm
        join public.table_sessions ts on ts.id = rm.session_id
        where rm.room_id = r.id and rm.left_at is null and ts.status = 'active'
          and coalesce(picks ->> rm.session_id::text, '') <> 'obs')
     ) then
    return jsonb_build_object('ok', false);
  end if;
  if jsonb_typeof(new_secret -> 'questions') is distinct from 'array' then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  ids := array(
    select q ->> 'id' from jsonb_array_elements(new_secret -> 'questions') with ordinality e (q, n)
    order by n
  );
  -- A question taken out of the deck, or given to this table, since the read: decide again.
  if jsonb_array_length(private.kaupholl_questions_of(ids)) <> cardinality(ids)
     or exists (
       select 1 from public.kaupholl_used_questions u
       where u.room_id = r.id and u.question_id = any (ids)
     ) then
    return jsonb_build_object('ok', false);
  end if;

  no := private.start_game(target_user_id, target_room_id, 'kaupholl');
  st := (new_state - 'gameNo') || jsonb_build_object('gameNo', no);

  -- `is not false`: a missing or malformed field makes a check null, and null refuses too.
  if (cardinality(ids) <> 5
     or (select count(distinct x) from unnest(ids) x) <> 5
     or (new_secret -> 'questions') is distinct from private.kaupholl_questions_of(ids)
     or new_secret -> 'questions' -> 4 ->> 'difficulty' = 'hard'
     or (new_secret -> 'guesses') is distinct from '{}'::jsonb
     or st ->> 'phase' is distinct from 'card'
     or (st -> 'step') is distinct from '1'::jsonb
     or (st -> 'round') is distinct from '0'::jsonb
     or (st -> 'rounds') is distinct from '5'::jsonb
     or (st -> 'gone') is distinct from '[]'::jsonb
     or (st -> 'ready') is distinct from '[]'::jsonb
     or (st -> 'chips') is distinct from '{}'::jsonb
     or (st -> 'bets') is distinct from '{}'::jsonb
     or (st -> 'board') is distinct from 'null'::jsonb
     or (st -> 'winners') is distinct from 'null'::jsonb
     or jsonb_typeof(st -> 'endsAt') is distinct from 'string'
     or (st ->> 'endsAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$'
     or (select count(distinct s) from jsonb_array_elements_text(st -> 'seats') s)
        <> jsonb_array_length(st -> 'seats')
     or exists (
       (select session_id::text from public.game_players where room_id = r.id and game_no = no)
       except (select s from jsonb_array_elements_text(st -> 'seats') s)
     )
     or exists (
       (select s from jsonb_array_elements_text(st -> 'seats') s)
       except (select session_id::text from public.game_players where room_id = r.id and game_no = no)
     )
     or (st -> 'scores') is distinct from (
       select jsonb_object_agg(s, 0) from jsonb_array_elements_text(st -> 'seats') s
     )
  ) is not false then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  perform private.kaupholl_check_write(st, new_secret);

  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (r.id, no, 'kaupholl', (new_secret - 'rev') || '{"rev": 0}'::jsonb);
  insert into public.kaupholl_used_questions (room_id, question_id)
  select r.id, x from unnest(ids) x;
  return jsonb_build_object('ok', true);
end;
$$;

-- kaupholl/pool: the owner only, on the pre-game page; how many active questions this table has not
-- had. Only for the "az soru" warning: it does not say whether a game can start.
create function public.kaupholl_pool(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.kaupholl_seat_read(target_user_id, target_room_id);
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if (seat.room).game_state -> 'pregame' ->> 'concept' is distinct from 'kaupholl' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  return jsonb_build_object('unused', (
    select count(*)::integer from public.kaupholl_questions q
    where q.active and not exists (
      select 1 from public.kaupholl_used_questions u
      where u.room_id = target_room_id and u.question_id = q.id
    )
  ));
end;
$$;

-- A start that found no valid five: one more in the counter (no table, no time). No other lock held.
create function public.kaupholl_note_exhausted()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.kaupholl_counters set n = n + 1 where name = 'exhausted';
$$;

-- 7. Leaving -------------------------------------------------------------------------------------
-- pure/kaupholl.ts → leaveGame, for a player who leaves the game or the table (any road stamps
-- game_players.left_at while holding the table). Fewer than two left: the game is abandoned (no
-- winner, no game_results). Otherwise the leaver is gone: in the card or guess phase their guess
-- drops; once the board is built their slice stays and their coins go; off the ready list. When the
-- phase waited only for them, its time ends now (the next advance moves on).
create function private.kaupholl_on_player_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  st jsonb;
  sec jsonb;
  sid text := new.session_id::text;
  phase text;
  active text[];
  done boolean;
begin
  -- The frame is ending this game (private.end_game): nobody is leaving a running one.
  if current_setting('masa.ending_game', true) = new.room_id::text then
    return new;
  end if;
  select * into r from public.rooms where id = new.room_id;
  st := r.game_state;
  if r.concept is distinct from 'kaupholl' or not (st ? 'phase') or st ->> 'phase' = 'over'
     or private.current_game_no(st) <> new.game_no
     or not coalesce(st -> 'seats', '[]'::jsonb) ? sid
     or coalesce(st -> 'gone', '[]'::jsonb) ? sid then
    return new;
  end if;
  st := jsonb_set(st, '{gone}', coalesce(st -> 'gone', '[]'::jsonb) || to_jsonb(sid));
  if jsonb_array_length(st -> 'seats') - jsonb_array_length(st -> 'gone')
     < (private.kaupholl_config() ->> 'abandonBelow')::integer then
    perform private.end_game(r.id, true);
    return new;
  end if;

  phase := st ->> 'phase';
  select gs.secret into sec from public.game_secrets gs
  where gs.room_id = r.id and gs.game_no = new.game_no
  for update;
  st := jsonb_set(st, '{chips}', coalesce(st -> 'chips', '{}'::jsonb) - sid);
  if phase = 'board' then
    st := jsonb_set(st, '{bets}', coalesce(st -> 'bets', '{}'::jsonb) - sid);
  end if;
  if phase in ('card', 'guess') and sec is not null then
    sec := jsonb_set(sec, '{guesses}', coalesce(sec -> 'guesses', '{}'::jsonb) - sid);
  end if;
  st := jsonb_set(st, '{ready}', coalesce(
    (select jsonb_agg(x) from jsonb_array_elements(st -> 'ready') x where x #>> '{}' <> sid),
    '[]'::jsonb));

  active := array(
    select s from jsonb_array_elements_text(st -> 'seats') s where not (st -> 'gone') ? s
  );
  done := case
    when phase = 'guess' then not exists (
      select 1 from unnest(active) a where st -> 'chips' ->> a is distinct from 'locked'
    )
    when phase = 'board' then not exists (
      select 1 from unnest(active) a where st -> 'bets' -> a ->> 'locked' is distinct from 'true'
    )
    when phase in ('answer', 'summary') then not exists (
      select 1 from unnest(active) a where not (st -> 'ready') ? a
    )
    else false
  end;
  if done and now() < (st ->> 'endsAt')::timestamptz then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;

  if sec is not null then
    update public.game_secrets
    set secret = (sec - 'rev') || jsonb_build_object('rev', coalesce((sec ->> 'rev')::integer, 0) + 1)
    where room_id = r.id and game_no = new.game_no;
  end if;
  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  return new;
end;
$$;

create trigger game_players_kaupholl_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.kaupholl_on_player_left();

-- 8. Grants --------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.kaupholl_read(uuid, uuid)',
    'public.kaupholl_commit(uuid, uuid, jsonb, integer, uuid, text, jsonb, jsonb, jsonb)',
    'public.kaupholl_pregame_read(uuid, uuid)',
    'public.kaupholl_start(uuid, uuid, jsonb, jsonb, jsonb)',
    'public.kaupholl_pool(uuid, uuid)',
    'public.kaupholl_note_exhausted()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.kaupholl_config()',
    'private.kaupholl_seat_read(uuid, uuid)',
    'private.kaupholl_check_write(jsonb, jsonb)',
    'private.kaupholl_count_round(text, jsonb)',
    'private.kaupholl_finish(public.rooms)',
    'private.kaupholl_questions_of(text[])',
    'private.kaupholl_on_player_left()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
