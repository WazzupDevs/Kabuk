-- Faz 4 step 4.6.9 (docs/SPEC_V4.md §4.F "Adım 4.6.9: Kibrit", K-86): the table writes nameless
-- questions, the papers go into the jar; each round one is drawn and everyone gives a secret vote to
-- whom it fits best. No score, no winner, no game_results.
--
-- Where what lives:
-- - public.kibrit_papers: each player's one paper (its author, its text, its place in the jar, drawn
--   or skipped, reported). Closed to every client (RLS on, no policy); the author never leaves the
--   server (rule 3). A reported paper's text and author are copied into public.reports.
-- - public.kibrit_votes: who voted for whom in the open vote, with the person's revision number.
--   Closed to every client; reduced to counts and deleted when the vote closes.
-- - rooms.game_state, open to the table (and so to Realtime): the phase and its clock (phase, step,
--   endsAt), the seats in their order, who left (gone), the round limit and the rounds, how many
--   wrote (written, a count, never who), how many papers are in the jar, who draws, the open paper
--   (its id and text, never its author), how many voted (voted, a count), the round's result (only
--   who got the most below five players; every count from five), who is ready, and the finished
--   rounds (past). The end goes to game_state.lastGame.kibrit (the summary without skipped and
--   reported papers); it leaves with the table's next game or its closing.
--
-- Rule 3's one exception: kibrit_write and kibrit_vote take a person's later call in the same step
-- in place of the earlier one while the phase is open, when its revision number (rev) is greater;
-- a call with a rev not greater than the kept one, or past the 20th revision, changes nothing.
--
-- Locks (rule 10): check-in → rooms (private.room_phone) → game_players → kibrit_papers →
-- kibrit_votes. A player leaving the game or the table stamps game_players.left_at while the table
-- is held; the trigger here updates the papers, the votes and game_state without a new lock on
-- anything before them. The report locks the table, then the paper.

-- 1. The game ----------------------------------------------------------------------------------
-- In the list before the seed (content/games.json) makes it playable, so rooms.concept can name it.
insert into public.games (id, name, min_players, max_players, teams, pregame)
values ('kibrit', 'Kibrit', 3, 12, false, true)
on conflict (id) do nothing;

-- A table's pair history names the game played there (private.write_pair_history).
alter table public.play_history drop constraint play_history_concept_check;
alter table public.play_history
  add constraint play_history_concept_check
  check (
    concept in (
      'tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre', 'vampir', 'signum', 'sprengja',
      'kibrit', 'chat'
    )
  );

-- A reported paper (safety/report target 'kibrit_paper'): its copy in messages_snapshot.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
    check (target_type in (
      'room', 'dm', 'profile', 'history', 'venue_chat', 'room_message', 'kibrit_paper'
    ));

create unique index reports_kibrit_once on public.reports (reporter_id, (messages_snapshot ->> 'paperId'))
  where target_type = 'kibrit_paper';

-- 2. The secrets -------------------------------------------------------------------------------
create table public.kibrit_papers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  game_no integer not null,
  author_session_id uuid not null references public.table_sessions (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 80),
  rev integer not null default 1,
  revisions integer not null default 1,
  position integer,
  status text not null default 'in' check (status in ('in', 'drawn', 'skipped')),
  drawn_step integer,
  reported boolean not null default false,
  unique (room_id, game_no, author_session_id)
);

alter table public.kibrit_papers enable row level security;
revoke all on table public.kibrit_papers from anon, authenticated;

create table public.kibrit_votes (
  room_id uuid not null references public.rooms (id) on delete cascade,
  game_no integer not null,
  step integer not null,
  voter_session_id uuid not null references public.table_sessions (id) on delete cascade,
  target_session_id uuid not null references public.table_sessions (id) on delete cascade,
  rev integer not null default 1,
  revisions integer not null default 1,
  primary key (room_id, game_no, step, voter_session_id)
);

alter table public.kibrit_votes enable row level security;
revoke all on table public.kibrit_votes from anon, authenticated;

-- 3. Rules -------------------------------------------------------------------------------------
-- pure/kibrit.ts → KIBRIT (kibrit.test.ts reads the numbers here).
create function private.kibrit_config()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'writeSeconds', 60, 'jarSeconds', 3, 'drawSeconds', 15, 'openSeconds', 10,
    'voteSeconds', 20, 'resultSeconds', 120, 'regraceSeconds', 8, 'minPlayers', 3,
    'maxPlayers', 12, 'defaultRounds', 5, 'minAuthors', 3, 'maxLength', 80,
    'maxRevisions', 20, 'countsFrom', 5
  );
$$;

create function private.kibrit_n(name text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (private.kibrit_config() ->> name)::integer;
$$;

create function private.kibrit_seconds(name text)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => private.kibrit_n(name));
$$;

-- 4. Helpers -----------------------------------------------------------------------------------
-- The seats still in the game, in seat order.
create function private.kibrit_active(st jsonb)
returns uuid[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(seat.sid::uuid order by seat.n), '{}'::uuid[])
  from jsonb_array_elements_text(coalesce(st -> 'seats', '[]'::jsonb)) with ordinality
    as seat (sid, n)
  where not coalesce(st -> 'gone', '[]'::jsonb) ? seat.sid;
$$;

-- The next one in the game after `after` in seat order (the first when `after` is null), round the
-- table.
create function private.kibrit_next_seat(st jsonb, after uuid)
returns uuid
language sql
immutable
set search_path = ''
as $$
  with seats as (
    select seat.sid::uuid as sid, seat.n
    from jsonb_array_elements_text(coalesce(st -> 'seats', '[]'::jsonb)) with ordinality
      as seat (sid, n)
  ),
  mark as (
    select coalesce((select n from seats where sid = after), 0) as n
  )
  select s.sid from seats s, mark m
  where not coalesce(st -> 'gone', '[]'::jsonb) ? s.sid::text
  order by (s.n <= m.n), s.n
  limit 1;
$$;

-- How many papers the players still in the game wrote this game.
create function private.kibrit_written(target_room_id uuid, st jsonb)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.kibrit_papers kp
  where kp.room_id = target_room_id and kp.game_no = private.current_game_no(st)
    and kp.author_session_id = any (private.kibrit_active(st));
$$;

-- How many players still in the game voted in this step (the table's count). A vote for someone
-- who left still counts here, so a leaving player's count of votes never shows; it does not count
-- in the result, and its voter may choose again.
create function private.kibrit_voted(target_room_id uuid, st jsonb)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.kibrit_votes kv
  where kv.room_id = target_room_id and kv.game_no = private.current_game_no(st)
    and kv.step = (st ->> 'step')::integer
    and kv.voter_session_id = any (private.kibrit_active(st));
$$;

-- How many players still in the game voted for someone still in it (the vote is complete).
create function private.kibrit_valid_votes(target_room_id uuid, st jsonb)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.kibrit_votes kv
  where kv.room_id = target_room_id and kv.game_no = private.current_game_no(st)
    and kv.step = (st ->> 'step')::integer
    and kv.voter_session_id = any (private.kibrit_active(st))
    and kv.target_session_id = any (private.kibrit_active(st));
$$;

-- Has the phase all it waits for: everyone in the game wrote, voted, or is ready.
create function private.kibrit_complete(target_room_id uuid, st jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  active integer := cardinality(private.kibrit_active(st));
begin
  if st ->> 'phase' = 'write' then
    return private.kibrit_written(target_room_id, st) >= active;
  elsif st ->> 'phase' = 'vote' then
    -- After someone left during this vote it closes only by its clock: an early end would tell
    -- that votes had gone to the leaver, and whose change completed it.
    if st ? 'leftInVote' then
      return false;
    end if;
    return private.kibrit_valid_votes(target_room_id, st) >= active;
  elsif st ->> 'phase' = 'result' then
    return not exists (
      select 1 from unnest(private.kibrit_active(st)) a(sid)
      where not coalesce(st -> 'ready', '[]'::jsonb) ? a.sid::text
    );
  end if;
  return false;
end;
$$;

-- The next phase: a new step and a new clock; what belonged to the phase before goes.
create function private.kibrit_enter(
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
      game_state = (st - 'written' - 'voted' - 'result' - 'ready' - 'leftInVote')
        || jsonb_build_object(
          'phase', new_phase,
          'step', coalesce((st ->> 'step')::integer, 0) + 1,
          'endsAt', now() + private.kibrit_seconds(clock)
        )
        || extra
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- The end: what the end screen shows in lastGame.kibrit (the rounds played, the summary without
-- reported papers, how many played), then the frame's end. Every paper and vote of the game goes
-- (kibrit_on_game_over); a reported paper lives on only in its report.
create function private.kibrit_finish(r public.rooms, not_enough boolean)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  past jsonb;
  result jsonb;
  done public.rooms;
begin
  select coalesce(jsonb_agg(p.value order by p.n), '[]'::jsonb) into past
  from jsonb_array_elements(coalesce(st -> 'past', '[]'::jsonb)) with ordinality as p (value, n)
  where not exists (
    select 1 from public.kibrit_papers kp
    where kp.room_id = r.id and kp.game_no = no and kp.reported
      and kp.id::text = p.value ->> 'paperId'
  );
  result := jsonb_build_object(
    'notEnough', not_enough,
    'rounds', jsonb_array_length(past),
    'players', jsonb_array_length(coalesce(st -> 'seats', '[]'::jsonb)),
    'past', past
  );
  -- Over: the players' leaving below (end_game) is not a player leaving a running game.
  update public.rooms set game_state = game_state || '{"phase": "over"}'::jsonb where id = r.id;
  done := private.end_game(r.id, false);
  update public.rooms
  set game_state = jsonb_set(game_state, '{lastGame,kibrit}', result)
  where id = done.id
  returning * into done;
  return done;
end;
$$;

-- Write → jar: the papers of those still in the game count. Fewer than three authors: "Yeterli
-- kâğıt yok", the game ends before any vote. Otherwise the jar is shuffled and the rounds are set.
create function private.kibrit_to_jar(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  papers integer;
begin
  delete from public.kibrit_papers
  where room_id = r.id and game_no = no
    and not author_session_id = any (private.kibrit_active(st));
  select count(*)::integer into papers
  from public.kibrit_papers where room_id = r.id and game_no = no;
  if papers < private.kibrit_n('minAuthors') then
    return private.kibrit_finish(r, true);
  end if;
  update public.kibrit_papers kp
  set position = shuffled.n
  from (
    select id, (row_number() over (order by random()))::integer as n
    from public.kibrit_papers where room_id = r.id and game_no = no
  ) shuffled
  where kp.id = shuffled.id;
  return private.kibrit_enter(
    r.id, st, 'jar', 'jarSeconds',
    jsonb_build_object(
      'papers', papers,
      'rounds', least(coalesce((st ->> 'limit')::integer, 1), papers)
    )
  );
end;
$$;

-- Draw: the drawer's turn to press, with a clock.
create function private.kibrit_to_draw(r public.rooms, drawer uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.kibrit_enter(
    r.id, r.game_state - 'paper', 'draw', 'drawSeconds',
    jsonb_build_object('drawer', drawer::text)
  );
end;
$$;

-- Open: the next paper in the jar comes out, its text to everyone, its author to no one. An empty
-- jar ends the game.
create function private.kibrit_open(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  kp public.kibrit_papers;
begin
  select * into kp from public.kibrit_papers
  where room_id = r.id and game_no = no and status = 'in'
  order by position
  limit 1
  for update;
  if kp.id is null then
    return private.kibrit_finish(r, false);
  end if;
  update public.kibrit_papers
  set status = 'drawn', drawn_step = coalesce((st ->> 'step')::integer, 0) + 1
  where id = kp.id;
  return private.kibrit_enter(
    r.id, st, 'open', 'openSeconds',
    jsonb_build_object('paper', jsonb_build_object('id', kp.id::text, 'text', kp.body))
  );
end;
$$;

-- The vote's result, from the votes of those still in the game for those still in it: who got the
-- most (all of them in a tie; none when nobody voted), every count from five players, how many
-- voted. The round joins the summary; the vote rows go.
create function private.kibrit_reveal(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  active uuid[] := private.kibrit_active(r.game_state);
  counts jsonb;
  voters integer;
  most integer;
  top jsonb;
  shown boolean := cardinality(active) >= private.kibrit_n('countsFrom');
  result jsonb;
begin
  select coalesce(jsonb_object_agg(a.sid::text, coalesce(c.n, 0)), '{}'::jsonb),
         coalesce(max(coalesce(c.n, 0)), 0)::integer
  into counts, most
  from unnest(active) with ordinality as a (sid, ord)
  left join (
    select kv.target_session_id as sid, count(*)::integer as n
    from public.kibrit_votes kv
    where kv.room_id = r.id and kv.game_no = no and kv.step = (st ->> 'step')::integer
      and kv.voter_session_id = any (active) and kv.target_session_id = any (active)
    group by kv.target_session_id
  ) c on c.sid = a.sid;

  -- The same measure as the table's count during the vote (every vote of a player still in it).
  voters := private.kibrit_voted(r.id, st);

  select coalesce(jsonb_agg(a.sid::text order by a.ord), '[]'::jsonb) into top
  from unnest(active) with ordinality as a (sid, ord)
  where most > 0 and (counts ->> a.sid::text)::integer = most;

  delete from public.kibrit_votes where room_id = r.id and game_no = no;

  result := jsonb_build_object(
    'paperId', st -> 'paper' -> 'id',
    'text', st -> 'paper' -> 'text',
    'players', cardinality(active),
    'voters', voters,
    'top', top
  );
  if shown then
    result := result || jsonb_build_object('counts', counts);
  end if;
  return private.kibrit_enter(
    r.id, st, 'result', 'resultSeconds',
    jsonb_build_object(
      'result', result,
      'ready', '[]'::jsonb,
      'done', coalesce((st ->> 'done')::integer, 0) + 1,
      'past', coalesce(st -> 'past', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'paperId', st -> 'paper' -> 'id',
        'text', st -> 'paper' -> 'text',
        'top', top,
        'votes', case when shown and most > 0 then to_jsonb(most) else 'null'::jsonb end
      ))
    )
  );
end;
$$;

-- One step on from the phase `r` is in: its time ran out or it has all it waited for. Fewer than
-- three left in the game ends it with the summary so far.
create function private.kibrit_step(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  phase text := r.game_state ->> 'phase';
  st jsonb := r.game_state;
begin
  if cardinality(private.kibrit_active(st)) < private.kibrit_n('minPlayers') then
    return private.kibrit_finish(r, phase = 'write');
  end if;
  if phase = 'write' then
    return private.kibrit_to_jar(r);
  elsif phase = 'jar' then
    return private.kibrit_to_draw(r, private.kibrit_next_seat(st, null));
  elsif phase = 'draw' then
    return private.kibrit_open(r);
  elsif phase = 'open' then
    return private.kibrit_enter(r.id, st, 'vote', 'voteSeconds', '{"voted": 0}'::jsonb);
  elsif phase = 'vote' then
    return private.kibrit_reveal(r);
  elsif phase = 'result' then
    -- The rounds are played, or the jar is empty (a skipped paper is no round).
    if coalesce((st ->> 'done')::integer, 0) >= coalesce((st ->> 'rounds')::integer, 0)
       or not exists (
         select 1 from public.kibrit_papers kp
         where kp.room_id = r.id and kp.game_no = private.current_game_no(st) and kp.status = 'in'
       ) then
      return private.kibrit_finish(r, false);
    end if;
    return private.kibrit_to_draw(
      r, private.kibrit_next_seat(st, nullif(st ->> 'drawer', '')::uuid)
    );
  end if;
  return r;
end;
$$;

-- The caller at a running game: the table (locked), the caller's seat, owner or not, and whether
-- the caller plays (in the game and not gone; a watcher or someone gone does not).
create function private.kibrit_seat(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, is_owner boolean, playing boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  plays boolean;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'kibrit' or not (r.game_state ? 'phase')
     or r.game_state ->> 'phase' = 'over' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select exists (
    select 1 from public.game_players gp
    where gp.room_id = r.id and gp.game_no = private.current_game_no(r.game_state)
      and gp.session_id = p.session_id and gp.left_at is null
  ) and p.session_id = any (private.kibrit_active(r.game_state)) into plays;
  return query select r, p.session_id, p.is_leader, plays;
end;
$$;

-- What the caller's own phone may know (rule 3): its own paper while the table writes, its own vote
-- while the table votes; nothing of anyone else's.
create function private.kibrit_view_of(r public.rooms, me uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  st jsonb := r.game_state;
  no integer := private.current_game_no(r.game_state);
  kp public.kibrit_papers;
  kv public.kibrit_votes;
begin
  if st ->> 'phase' = 'write' then
    select * into kp from public.kibrit_papers
    where room_id = r.id and game_no = no and author_session_id = me;
  elsif st ->> 'phase' = 'vote' then
    select * into kv from public.kibrit_votes
    where room_id = r.id and game_no = no and step = (st ->> 'step')::integer
      and voter_session_id = me;
  end if;
  return jsonb_build_object(
    'paper', kp.body,
    'paperRev', coalesce(kp.rev, 0),
    'vote', kv.target_session_id::text,
    'voteRev', coalesce(kv.rev, 0)
  );
end;
$$;

-- 5. The actions -------------------------------------------------------------------------------
-- kibrit/start: the owner, from the pre-game page (private.start_game: 3 to 12 players, the rest
-- watch). The round limit is 1 to the players, min(5, players) when not given.
create function public.kibrit_start(
  target_user_id uuid,
  target_room_id uuid,
  round_limit integer default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  no integer;
  players integer;
  seats jsonb;
  r public.rooms;
begin
  no := private.start_game(target_user_id, target_room_id, 'kibrit');
  select count(*)::integer, coalesce(jsonb_agg(session_id::text order by seat_order), '[]'::jsonb)
  into players, seats
  from public.game_players where room_id = target_room_id and game_no = no;
  delete from public.kibrit_papers where room_id = target_room_id;
  delete from public.kibrit_votes where room_id = target_room_id;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_build_object(
        'gameNo', no,
        'phase', 'write',
        'step', 1,
        'endsAt', now() + private.kibrit_seconds('writeSeconds'),
        'seats', seats,
        'gone', '[]'::jsonb,
        'limit', least(
          greatest(coalesce(round_limit, private.kibrit_n('defaultRounds')), 1), players
        ),
        'rounds', 0,
        'done', 0,
        'written', 0,
        'papers', 0,
        'past', '[]'::jsonb
      )
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

-- kibrit/view: anyone at the table; what their own phone may know.
create function public.kibrit_view(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  return private.kibrit_view_of(seat.room, seat.session_id);
end;
$$;

-- kibrit/write: a player's one paper, 1 to 80 characters (the function checked the words, rule 7).
-- A later call with a greater rev replaces it while the table writes (rule 3's exception); the
-- table sees only how many wrote. When everyone in the game wrote, the jar comes.
create function public.kibrit_write(
  target_user_id uuid,
  target_room_id uuid,
  at_step integer,
  at_rev integer,
  new_body text
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
  kp public.kibrit_papers;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if new_body is null or char_length(new_body) not between 1 and private.kibrit_n('maxLength')
     or at_rev < 1 then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  -- A revision counts only while the phase is open and its time is not up (rule 3's exception).
  if st ->> 'phase' <> 'write' or (st ->> 'step')::integer <> at_step
     or now() >= (st ->> 'endsAt')::timestamptz then
    return private.kibrit_view_of(r, seat.session_id);
  end if;
  no := private.current_game_no(st);
  select * into kp from public.kibrit_papers
  where room_id = r.id and game_no = no and author_session_id = seat.session_id
  for update;
  if kp.id is null then
    insert into public.kibrit_papers (room_id, game_no, author_session_id, body, rev)
    values (r.id, no, seat.session_id, new_body, at_rev);
  elsif at_rev > kp.rev and kp.revisions < private.kibrit_n('maxRevisions') then
    update public.kibrit_papers
    set body = new_body, rev = at_rev, revisions = revisions + 1
    where id = kp.id;
  else
    return private.kibrit_view_of(r, seat.session_id);
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(st, '{written}', to_jsonb(private.kibrit_written(r.id, st)))
  where id = r.id
  returning * into r;
  if private.kibrit_complete(r.id, r.game_state) then
    r := private.kibrit_step(r);
  end if;
  return private.kibrit_view_of(r, seat.session_id);
end;
$$;

-- kibrit/draw: only the drawer, once; the next paper in the jar opens.
create function public.kibrit_draw(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'draw' or (st ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  if not seat.playing or st ->> 'drawer' is distinct from seat.session_id::text then
    raise exception using errcode = 'P0001', message = 'not_your_seat';
  end if;
  return private.kibrit_step(seat.room);
end;
$$;

-- kibrit/to-vote: the drawer or the owner, once the paper is open.
create function public.kibrit_to_vote(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  st jsonb;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  st := (seat.room).game_state;
  if st ->> 'phase' <> 'open' or (st ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  if not seat.is_owner
     and not (seat.playing and st ->> 'drawer' = seat.session_id::text) then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  return private.kibrit_step(seat.room);
end;
$$;

-- kibrit/vote: a player's one secret vote for anyone still in the game, themselves too. A later
-- call with a greater rev replaces it while the vote is open (rule 3's exception); the table sees
-- only how many voted. When everyone in the game voted, the result opens.
create function public.kibrit_vote(
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
  if not target_session_id = any (private.kibrit_active(st)) then
    raise exception using errcode = 'P0001', message = 'bad_request';
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

-- kibrit/skip: the owner, while the paper is open or voted on: the paper never opens again and is
-- no round; the votes of the step go; the same drawer draws again.
create function public.kibrit_skip(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
  r public.rooms;
  st jsonb;
  no integer;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if st ->> 'phase' not in ('open', 'vote') or (st ->> 'step')::integer <> at_step then
    return r;
  end if;
  no := private.current_game_no(st);
  update public.kibrit_papers set status = 'skipped'
  where room_id = r.id and game_no = no and id::text = st -> 'paper' ->> 'id';
  delete from public.kibrit_votes where room_id = r.id and game_no = no;
  if not exists (
    select 1 from public.kibrit_papers where room_id = r.id and game_no = no and status = 'in'
  ) then
    return private.kibrit_finish(r, false);
  end if;
  -- The same drawer, unless they left; then the next one.
  if st ->> 'drawer' is not null and private.kibrit_active(st) @> array[(st ->> 'drawer')::uuid] then
    return private.kibrit_to_draw(r, (st ->> 'drawer')::uuid);
  end if;
  return private.kibrit_to_draw(
    r, private.kibrit_next_seat(st, nullif(st ->> 'drawer', '')::uuid)
  );
end;
$$;

-- kibrit/ready: a player on the result. When everyone in the game is ready, the next round.
create function public.kibrit_ready(target_user_id uuid, target_room_id uuid, at_step integer)
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
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  r := seat.room;
  st := r.game_state;
  if not seat.playing then
    raise exception using errcode = 'P0001', message = 'not_player';
  end if;
  if st ->> 'phase' <> 'result' or (st ->> 'step')::integer <> at_step
     or coalesce(st -> 'ready', '[]'::jsonb) ? seat.session_id::text then
    return r;
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(
        st, '{ready}', coalesce(st -> 'ready', '[]'::jsonb) || to_jsonb(seat.session_id::text)
      )
  where id = r.id
  returning * into r;
  if private.kibrit_complete(r.id, r.game_state) then
    return private.kibrit_step(r);
  end if;
  return r;
end;
$$;

-- kibrit/next: the owner's "Sonraki kâğıt" on the result.
create function public.kibrit_next(target_user_id uuid, target_room_id uuid, at_step integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.kibrit_seat(target_user_id, target_room_id);
  if not seat.is_owner then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if (seat.room).game_state ->> 'phase' <> 'result'
     or ((seat.room).game_state ->> 'step')::integer <> at_step then
    return seat.room;
  end if;
  return private.kibrit_step(seat.room);
end;
$$;

-- kibrit/advance: anyone at the table once the phase's time is up (a second of slack for the
-- phones' clocks); idempotent: early, it changes nothing.
create function public.kibrit_advance(target_user_id uuid, target_room_id uuid)
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
     or now() + interval '1 second' < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.kibrit_step(r);
end;
$$;

-- 6. Reporting ---------------------------------------------------------------------------------
-- safety/report target 'kibrit_paper': anyone sitting at the table now, on a paper of the running
-- game that has been opened. A row in public.reports with the paper's copy (text, game, step) in
-- messages_snapshot and its author as the reported account; the paper leaves the summary. One's own
-- paper, an unopened or unknown paper, another table's, a second report by the same person: nothing
-- is written, and the answer is the same (the function answers { ok: true }). The author never
-- leaves the server.
create function public.safety_report_kibrit_paper(
  target_user_id uuid,
  target_room_id uuid,
  target_paper_id uuid,
  new_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat public.room_members;
  r public.rooms;
  kp public.kibrit_papers;
  author uuid;
begin
  -- The table first, then the paper (rule 10: rooms → kibrit_papers; the report's foreign key on
  -- rooms would otherwise come after the paper's lock).
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.concept is distinct from 'kibrit' then
    return false;
  end if;
  select rm.* into seat
  from public.room_members rm
  join public.table_sessions ts on ts.id = rm.session_id and ts.status = 'active'
  where rm.room_id = r.id and rm.left_at is null and ts.user_id = target_user_id
  limit 1;
  if seat.session_id is null then
    return false;
  end if;
  select * into kp from public.kibrit_papers
  where id = target_paper_id and room_id = r.id
    and game_no = private.current_game_no(r.game_state) and status in ('drawn', 'skipped')
  for update;
  if kp.id is null or kp.author_session_id = seat.session_id then
    return false;
  end if;
  select user_id into author from public.table_sessions where id = kp.author_session_id;
  if author is null or author = target_user_id then
    return false;
  end if;
  -- Once per person and paper (reports_kibrit_once; the paper's lock above orders two at once).
  insert into public.reports (reporter_id, reported_user_id, room_id, reason, target_type,
                              messages_snapshot)
  values (
    target_user_id, author, r.id, new_reason, 'kibrit_paper',
    jsonb_build_object(
      'paperId', kp.id::text, 'text', kp.body, 'gameNo', kp.game_no, 'step', kp.drawn_step
    )
  )
  on conflict do nothing;
  update public.kibrit_papers set reported = true where id = kp.id;
  return true;
end;
$$;

-- 7. Leaving and the game's end ---------------------------------------------------------------
-- A player who leaves the game or the table (any road stamps game_players.left_at while holding the
-- table) is gone. While the table writes, their paper goes (it is not valid); after the jar it stays
-- in the jar, since its going would tell its author. While the table votes, their own vote goes and
-- the votes for them no longer count; those voters may choose again, with at least 8 seconds. A gone drawer passes
-- the draw to the next one. A finished round never changes. If the phase now has all it waits for, or
-- fewer than three are left, its time runs out now and the next advance settles it.
create function private.kibrit_on_player_left()
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
  -- The frame ending the game (private.end_game) stamps every player at once: no one is leaving a
  -- running game, and no row in between may reach the table (its gone order and counts would tell
  -- who voted or wrote).
  if current_setting('masa.ending_game', true) = new.room_id::text then
    return new;
  end if;
  select * into r from public.rooms where id = new.room_id;
  if r.concept is distinct from 'kibrit' or not (r.game_state ? 'phase')
     or r.game_state ->> 'phase' = 'over'
     or private.current_game_no(r.game_state) <> new.game_no
     or coalesce(r.game_state -> 'gone', '[]'::jsonb) ? sid then
    return new;
  end if;
  st := jsonb_set(r.game_state, '{gone}', coalesce(r.game_state -> 'gone', '[]'::jsonb) || to_jsonb(sid));
  if st ->> 'phase' = 'write' then
    delete from public.kibrit_papers
    where room_id = r.id and game_no = new.game_no and author_session_id = new.session_id;
    st := jsonb_set(st, '{written}', to_jsonb(private.kibrit_written(r.id, st)));
  elsif st ->> 'phase' = 'vote' then
    -- Their own vote goes; the votes for them stay but no longer count, and their voters may choose
    -- again. The table's count drops only by the leaver's own vote, and every leaving gives at
    -- least 8 seconds, so nothing tells how many votes the leaver had.
    delete from public.kibrit_votes
    where room_id = r.id and game_no = new.game_no and voter_session_id = new.session_id;
    st := jsonb_set(st, '{voted}', to_jsonb(private.kibrit_voted(r.id, st)))
      || '{"leftInVote": true}'::jsonb;
    if (st ->> 'endsAt')::timestamptz < now() + private.kibrit_seconds('regraceSeconds') then
      st := jsonb_set(st, '{endsAt}', to_jsonb(now() + private.kibrit_seconds('regraceSeconds')));
    end if;
  elsif st ->> 'phase' = 'draw' and st ->> 'drawer' = sid then
    st := jsonb_set(st, '{drawer}', to_jsonb(private.kibrit_next_seat(st, new.session_id)::text));
    st := jsonb_set(st, '{endsAt}', to_jsonb(now() + private.kibrit_seconds('drawSeconds')));
  elsif st ->> 'phase' = 'result' then
    st := jsonb_set(st, '{ready}', coalesce((
      select jsonb_agg(x) from jsonb_array_elements_text(st -> 'ready') as x where x <> sid
    ), '[]'::jsonb));
  end if;
  if cardinality(private.kibrit_active(st)) < private.kibrit_n('minPlayers')
     or private.kibrit_complete(r.id, st) then
    st := jsonb_set(st, '{endsAt}', to_jsonb(now()));
  end if;
  update public.rooms set game_state = st, last_activity_at = now() where id = r.id;
  return new;
end;
$$;

create trigger game_players_kibrit_left
  after update of left_at on public.game_players
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.kibrit_on_player_left();

-- The game over by any road (its end, "Oyunu bitir", the table closing or moving into another):
-- every paper and vote of the table goes; a reported paper lives on only in its report. No column
-- list: a closing table's concept is cleared by the BEFORE trigger rooms_closing_game, which a
-- column trigger would not see.
create function private.kibrit_on_game_over()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.kibrit_papers where room_id = new.id;
  delete from public.kibrit_votes where room_id = new.id;
  return new;
end;
$$;

-- Named to run before rooms_close_members (AFTER triggers run in name order): on a closing table
-- the papers and votes go before the seats close.
create trigger rooms_clean_kibrit
  after update on public.rooms
  for each row
  when (old.concept = 'kibrit' and new.concept is distinct from 'kibrit')
  execute function private.kibrit_on_game_over();

-- The summary's questions leave with the table: a closing table drops lastGame.kibrit.
create function private.kibrit_on_room_closed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.game_state := new.game_state #- '{lastGame,kibrit}';
  return new;
end;
$$;

create trigger rooms_kibrit_closed
  before update of status on public.rooms
  for each row
  when (new.status = 'closed' and old.status is distinct from 'closed'
        and new.game_state -> 'lastGame' ? 'kibrit')
  execute function private.kibrit_on_room_closed();

-- 8. Grants ------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.kibrit_start(uuid, uuid, integer)',
    'public.kibrit_view(uuid, uuid)',
    'public.kibrit_write(uuid, uuid, integer, integer, text)',
    'public.kibrit_draw(uuid, uuid, integer)',
    'public.kibrit_to_vote(uuid, uuid, integer)',
    'public.kibrit_vote(uuid, uuid, integer, integer, uuid)',
    'public.kibrit_skip(uuid, uuid, integer)',
    'public.kibrit_ready(uuid, uuid, integer)',
    'public.kibrit_next(uuid, uuid, integer)',
    'public.kibrit_advance(uuid, uuid)',
    'public.safety_report_kibrit_paper(uuid, uuid, uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.kibrit_config()',
    'private.kibrit_n(text)',
    'private.kibrit_seconds(text)',
    'private.kibrit_active(jsonb)',
    'private.kibrit_next_seat(jsonb, uuid)',
    'private.kibrit_written(uuid, jsonb)',
    'private.kibrit_voted(uuid, jsonb)',
    'private.kibrit_valid_votes(uuid, jsonb)',
    'private.kibrit_complete(uuid, jsonb)',
    'private.kibrit_enter(uuid, jsonb, text, text, jsonb)',
    'private.kibrit_finish(public.rooms, boolean)',
    'private.kibrit_to_jar(public.rooms)',
    'private.kibrit_to_draw(public.rooms, uuid)',
    'private.kibrit_open(public.rooms)',
    'private.kibrit_reveal(public.rooms)',
    'private.kibrit_step(public.rooms)',
    'private.kibrit_seat(uuid, uuid)',
    'private.kibrit_view_of(public.rooms, uuid)',
    'private.kibrit_on_player_left()',
    'private.kibrit_on_game_over()',
    'private.kibrit_on_room_closed()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
