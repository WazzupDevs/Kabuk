-- Faz 4 step 4.5a-3 (docs/SPEC_V4.md §4.F "Çerçeve", §4.H, §4.K): the frame every game of the
-- table plays in. Its parts:
-- - public.games: the games as data (content/games.json → seed). rooms.concept and
--   table_votes.concept reference it, so a new game is a JSON entry and its own function; the frame
--   does not change.
-- - Voting (rooms/vote, table_vote_counts): one vote per person, a suggestion; only the owner opens
--   a game.
-- - The pre-game page (rooms/open-game → rooms.game_state.pregame): everyone picks a team or to
--   watch (rooms/pick), the owner may shuffle the teams (rooms/shuffle).
-- - private.start_game: what each game's `<game>/start` (step 4.6) calls first in its transaction:
--   the owner only; it freezes the players (game_players) and clears the votes.
-- - Ending: the owner ends the game for everyone (rooms/end-game); a player leaves it
--   (rooms/leave-game), and so does a person leaving the table. A table moved to another by its
--   owner's "Katıl" abandons its game (game_abandoned).
-- No game can be played yet: every game is "Yakında" until its step of 4.6 (games.is_available).

-- 1. The games ---------------------------------------------------------------------------------
create table public.games (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  min_players smallint not null check (min_players between 1 and 12),
  max_players smallint not null check (max_players between min_players and 12),
  teams boolean not null,
  pregame boolean not null,
  is_available boolean not null default false,
  sort_order smallint not null default 0
);

alter table public.games enable row level security;
revoke all on table public.games from anon, authenticated;

-- The six games of today's concepts, so rooms.concept can reference the table now; the seed
-- (content/games.json) fills in the rest. Old rooms are closed and keep their concept.
insert into public.games (id, name, min_players, max_players, teams, pregame)
values
  ('tabu', 'Kapsül Anlat', 4, 12, true, true),
  ('ibre', 'İbre', 4, 12, true, true),
  ('sahtekar', 'Sahtekar', 3, 12, false, true),
  ('harf', 'Harf Kapmaca', 2, 12, false, true),
  ('sarki', 'Şarkıda Geçsin', 2, 12, false, true),
  ('sohbet', 'Sohbet kartları', 1, 12, false, false)
on conflict (id) do nothing;

alter table public.rooms drop constraint rooms_concept_check;
-- A game is never deleted (one left out of the JSON is only not available); were it, its tables
-- would keep no concept and its votes would go.
alter table public.rooms
  add constraint rooms_concept_fkey foreign key (concept) references public.games (id)
  on delete set null;

-- A game that leaves the table writes its own event (§4.F, WazzupDevs/Kabuk#183).
alter table public.game_events drop constraint game_events_type_check;
alter table public.game_events
  add constraint game_events_type_check check (
    type in (
      'correct', 'taboo', 'pass', 'card_closed', 'turn_started', 'game_completed', 'game_abandoned'
    )
  );

-- 2. Votes and players ------------------------------------------------------------------------
-- table_votes: one vote per person at the table, for a game it may change or take back. Read only
-- as counts (table_vote_counts), by the table's people; who voted for what is never read.
create table public.table_votes (
  room_id uuid not null references public.rooms (id) on delete cascade,
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  concept text not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, session_id)
);

alter table public.table_votes enable row level security;
revoke all on table public.table_votes from anon, authenticated;

-- game_players: who plays a game of the table, frozen at its start. A role can be secret (step
-- 4.6: the impostor), so the table is closed to clients; open roles are in rooms.game_state. A
-- player who leaves the game or the table gets left_at and does not play that game again.
create table public.game_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  game_no integer not null check (game_no >= 1),
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  role text not null default 'player' check (role ~ '^[a-z_]+$'),
  team text check (team in ('a', 'b')),
  seat_order smallint not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, game_no, session_id)
);

create index game_players_session_idx on public.game_players (session_id) where left_at is null;

alter table public.game_players enable row level security;
revoke all on table public.game_players from anon, authenticated;

-- 3. Helpers ----------------------------------------------------------------------------------
-- The table's game number now: the running game's, or the last one's between games.
create function private.current_game_no(state jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce((state ->> 'gameNo')::integer, 0);
$$;

revoke all on function private.current_game_no(jsonb) from public, anon, authenticated;

-- A game the table can vote for or open: in the list and playable now.
create function private.playable_game(target_concept text)
returns public.games
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  g public.games;
begin
  select * into g from public.games where id = target_concept and is_available;
  if g.id is null then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  return g;
end;
$$;

revoke all on function private.playable_game(text) from public, anon, authenticated;

-- Ends the table's running game, or closes its pre-game page. The caller holds the table. The
-- players of a running game leave it; the game's end screen reads lastGame (abandoned: it did not
-- reach its end, and writes game_abandoned).
create function private.end_game(target_room_id uuid, abandoned boolean)
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
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

revoke all on function private.end_game(uuid, boolean) from public, anon, authenticated;

-- A person leaving the table (any road) leaves its game too: no longer a player of the running game,
-- no pick on the pre-game page, no vote. The caller holds the table.
create function private.leave_table_game(target_room_id uuid, target_session_id uuid)
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
  update public.rooms
  set game_state = game_state #- array['pregame', 'picks', target_session_id::text]
  where id = target_room_id and game_state ? 'pregame';
end;
$$;

revoke all on function private.leave_table_game(uuid, uuid) from public, anon, authenticated;

-- 4. Voting -----------------------------------------------------------------------------------
-- rooms/vote: anyone at the table, while no game and no pre-game page is open; a vote for another
-- game replaces it, null takes it back. A dimmed poster (fewer phones than the game needs) can be
-- voted for (K-17); a "Yakında" one cannot. The table's row changes (its quiet clock), so its
-- people read the counts again.
create function public.rooms_vote(
  target_user_id uuid,
  target_room_id uuid,
  new_concept text default null
)
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
  if r.concept is not null or r.game_state ? 'pregame' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  if new_concept is null then
    delete from public.table_votes where room_id = r.id and session_id = p.session_id;
  else
    perform private.playable_game(new_concept);
    insert into public.table_votes (room_id, session_id, concept)
    values (r.id, p.session_id, new_concept)
    on conflict (room_id, session_id) do update set concept = excluded.concept, created_at = now();
  end if;
  update public.rooms set last_activity_at = now() where id = r.id returning * into r;
  return r;
end;
$$;

-- The votes of the caller's table: how many per game and the caller's own; never who.
create function public.table_vote_counts(target_room_id uuid)
returns table (concept text, votes integer, mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select v.concept, count(*)::integer,
         bool_or(ts.user_id = (select auth.uid()))
  from public.table_votes v
  join public.table_sessions ts on ts.id = v.session_id
  where v.room_id = target_room_id and private.is_room_member(target_room_id)
  group by v.concept
  order by v.concept;
$$;

-- 5. The pre-game page ------------------------------------------------------------------------
-- rooms/open-game: the owner only (not_owner), a playable game with a pre-game page, a table with
-- at least the game's lower limit of phones (K-17: not_enough_players), no game or page open. The
-- page is rooms.game_state.pregame: the game and each person's pick by table session id (rule 4).
-- "Yeniden oyna" (same_picks, §4.F "Oyun sonu"): the game just played, with its picks: its players
-- in their teams, those at the table who watched it watching; who came after its start picks anew.
create function public.rooms_open_game(
  target_user_id uuid,
  target_room_id uuid,
  new_concept text,
  same_picks boolean default false
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  g public.games;
  last_no integer;
  started timestamptz;
  picks jsonb := '{}'::jsonb;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  g := private.playable_game(new_concept);
  if not g.pregame then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if r.concept is not null or r.game_state ? 'pregame' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  if r.phones < g.min_players then
    raise exception using errcode = 'P0001', message = 'not_enough_players';
  end if;
  if same_picks then
    if r.game_state -> 'lastGame' ->> 'concept' is distinct from g.id then
      raise exception using errcode = 'P0001', message = 'bad_request';
    end if;
    last_no := private.current_game_no(r.game_state);
    select min(gp.joined_at) into started
    from public.game_players gp
    where gp.room_id = r.id and gp.game_no = last_no;
    select coalesce(jsonb_object_agg(seat.session_id::text, seat.pick), '{}'::jsonb) into picks
    from (
      select rm.session_id,
             case
               when gp.session_id is not null then case when g.teams then gp.team end
               when rm.joined_at <= started then 'obs'
             end as pick
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id and ts.status = 'active'
      left join public.game_players gp
        on gp.room_id = r.id and gp.game_no = last_no and gp.session_id = rm.session_id
      where rm.room_id = r.id and rm.left_at is null
    ) seat
    where seat.pick is not null;
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'lastGame')
        || jsonb_build_object('pregame', jsonb_build_object('concept', g.id, 'picks', picks))
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- rooms/pick: anyone at the table, on the open page. A team game: 'a' (Mor), 'b' (Pembe), 'obs'
-- (watch) or null (not chosen yet). Any other game: 'obs' or null (a player by default).
create function public.rooms_pick(
  target_user_id uuid,
  target_room_id uuid,
  new_pick text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  g public.games;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not (r.game_state ? 'pregame') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select * into g from public.games where id = r.game_state -> 'pregame' ->> 'concept';
  if new_pick is not null and not (
    new_pick = 'obs' or (g.teams and new_pick in ('a', 'b'))
  ) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = case
        when new_pick is null then game_state #- array['pregame', 'picks', p.session_id::text]
        else jsonb_set(game_state, array['pregame', 'picks', p.session_id::text], to_jsonb(new_pick))
      end
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- rooms/shuffle: the owner, a team game's page. Everyone at the table who does not watch goes to a
-- team at random, the two as even as can be; the watchers stay watching.
create function public.rooms_shuffle(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  g public.games;
  picks jsonb;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if not (r.game_state ? 'pregame') then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select * into g from public.games where id = r.game_state -> 'pregame' ->> 'concept';
  if not g.teams then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  -- The players in a random order, alternately to Mor and Pembe; the watchers kept.
  select coalesce(jsonb_object_agg(sid, pick), '{}'::jsonb) into picks
  from (
    select sid, case when watched then 'obs' when n % 2 = 0 then 'a' else 'b' end as pick
    from (
      select rm.session_id::text as sid,
             coalesce(r.game_state -> 'pregame' -> 'picks' ->> rm.session_id::text, '') = 'obs'
               as watched,
             row_number() over (
               partition by coalesce(
                 r.game_state -> 'pregame' -> 'picks' ->> rm.session_id::text, ''
               ) = 'obs'
               order by random()
             ) as n
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id and ts.status = 'active'
      where rm.room_id = r.id and rm.left_at is null
    ) ranked
  ) dealt;
  update public.rooms
  set last_activity_at = now(),
      game_state = jsonb_set(game_state, array['pregame', 'picks'], picks)
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- 6. Starting, ending and leaving -------------------------------------------------------------
-- What a game's `<game>/start { roomId }` (step 4.6) calls first, in its transaction: the owner only
-- (not_owner), the game playable now. A game with a pre-game page starts from its page; a team game
-- needs Mor and Pembe of at least two each, and who chose nothing or to watch watches; any other
-- game: everyone who does not watch plays, at least the game's lower limit. A game without one
-- (Sohbet kartları) starts with no game open and everyone at the table playing. The votes are
-- cleared, the players go to game_players in a random seat order (roles are the game's own) and the
-- running game is rooms.concept with its number in game_state; the game adds the rest. Returns the
-- game's number. Locks: check-in → table (private.room_phone) → table_votes → game_players.
create function private.start_game(target_user_id uuid, target_room_id uuid, target_concept text)
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
  delete from pg_temp.starting_players;
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

revoke all on function private.start_game(uuid, uuid, text) from public, anon, authenticated;

-- rooms/end-game: the owner only (not_owner); the game ends for everyone and the table goes back to
-- choosing (§4.F). Ended before its end, it is abandoned (no results; a game that reaches its end
-- calls private.end_game itself, step 4.6). The pre-game page closes the same way. Nothing open:
-- nothing changes.
create or replace function public.rooms_end_game(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  return private.end_game(target_room_id, true);
end;
$$;

-- rooms/leave-game: a player of the running game leaves it; the game goes on for the others and
-- the person stays at the table, watching. One who does not play it: not_player.
create function public.rooms_leave_game(target_user_id uuid, target_room_id uuid)
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
  update public.rooms set last_activity_at = now() where id = r.id returning * into r;
  return r;
end;
$$;

-- 7. The table's roads ------------------------------------------------------------------------
-- A person leaving the table by any road (Masadan ayrıl, Mekandan ayrıl, a new check-in, a block,
-- expiry, account deletion, a table moved by its owner's "Katıl") leaves its game too: no longer a
-- player of the running game, no pick on the pre-game page, no vote. Every road to an open table
-- stamps the seat's left_at while holding the table, so the trigger takes no new lock on it (rule
-- 10); a stale seat of a closed table (close_stale_member_rows) has nothing left to take out.
create function private.on_seat_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.leave_table_game(new.room_id, new.session_id);
  return new;
end;
$$;

revoke all on function private.on_seat_left() from public, anon, authenticated;

create trigger room_members_left_game
  after update of left_at on public.room_members
  for each row
  when (old.left_at is null and new.left_at is not null)
  execute function private.on_seat_left();

-- A table closing by any road (its owner's end, its last person, quiet, a move into another table)
-- ends its game with it: abandoned, since the table did not wait for its end (WazzupDevs/Kabuk#183).
-- Its pre-game page goes too. The players and the votes go with the seats: rooms_close_members
-- stamps every seat's left_at after this, and room_members_left_game takes each one out of the game
-- (rule 10: rooms → room_members → table_votes → game_players; the event is an insert).
create function private.on_room_closing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.concept is not null then
    insert into public.game_events (room_id, type, payload)
    values (new.id, 'game_abandoned', jsonb_build_object('concept', old.concept));
    new.concept := null;
    new.game_state := private.between_games(
      old.game_state,
      jsonb_build_object('concept', old.concept, 'abandoned', true)
    );
  elsif new.game_state ? 'pregame' then
    new.game_state := new.game_state - 'pregame';
  end if;
  return new;
end;
$$;

revoke all on function private.on_room_closing() from public, anon, authenticated;

create trigger rooms_closing_game
  before update of status on public.rooms
  for each row
  when (old.status <> 'closed' and new.status = 'closed')
  execute function private.on_room_closing();

-- 8. Grants -----------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.rooms_vote(uuid, uuid, text)',
    'public.rooms_open_game(uuid, uuid, text, boolean)',
    'public.rooms_pick(uuid, uuid, text)',
    'public.rooms_shuffle(uuid, uuid)',
    'public.rooms_end_game(uuid, uuid)',
    'public.rooms_leave_game(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

revoke all on function public.table_vote_counts(uuid) from public, anon;
grant execute on function public.table_vote_counts(uuid) to authenticated;
