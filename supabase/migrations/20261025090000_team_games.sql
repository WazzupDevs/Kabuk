-- Faz 2 step 22.3: games for teams (docs/SPEC_V3.md §22.E, §22.H, §22.J, §22.K, §22.M).
--
-- A game's authority belongs to a side, not to its leader: every phone on the side may use it. The
-- game functions take the caller through private.room_phone (22.2: the phone's side and whether it
-- leads) instead of private.room_membership, which now serves only "Tanışalım mı?" (22.4 moves it).
--
-- The phone that starts a turn describes it: tabu_turns.describer_session_id and game_state.describer
-- (Tabu), game_secrets and game_state.describer (İbre). When the ready time runs out and the turn
-- starts without the describing side, the side's leader describes. Secrets (Tabu's card list, İbre's
-- target) go to the describer and, in refereed Tabu, to every phone on the judging side; never to the
-- describer's teammates. Sahtekar's seats stay on the leader's phone (not_your_seat for members).
-- Tabu's mode and Sahtekar's seats come from the sides' headcounts when the game starts
-- (private.side_headcount: declared or phones, the larger) and stay until it ends. A finished game's
-- result goes to every phone that was in the room when it started (rooms.game_started_at) and still
-- is.
--
-- Old apps: a room without members has one phone a side, its leader, and every function below
-- answers it exactly as before (the existing integration tests run unchanged, §22.M).
--
-- Lock order (rule 10), as before: table_sessions → rooms → game_proposals → tabu_turns,
-- game_secrets → room_used_cards, game_results, game_events. room_members is only read here.

-- Columns -------------------------------------------------------------------------------------------
-- When the room's two-sided game started: with room_members it tells who was in the room then (§22.E).
-- Not in game_state: Tabu's game_state keys are fixed (the existing tests list them).
alter table public.rooms add column game_started_at timestamptz;

comment on column public.rooms.game_started_at is
  'Start of the running (or last) two-sided game; its result goes to the phones in the room then and '
  'at its end (docs/SPEC_V3.md §22.E).';

-- The side a proposal belongs to: it stays the side's when the proposing phone leaves (§22.E). Any
-- phone on the other side answers it.
alter table public.game_proposals
  add column proposer_side text check (proposer_side in ('owner', 'guest'));

update public.game_proposals p
set proposer_side = private.phone_side(p.room_id, p.proposer_session_id);
delete from public.game_proposals where proposer_side is null;
alter table public.game_proposals alter column proposer_side set not null;

-- The proposer's Sahtekar count is now what the proposing phone gave, or null: without it the side's
-- headcount is taken when the game starts (§22.E), as the acceptor's is.
comment on column public.game_proposals.proposer_players is
  'Sahtekar: the count the proposing phone gave; null = the side''s headcount at the start.';

-- A describer whose account goes (it leaves the room first) leaves the turn without a describer: the
-- turn runs out as when it leaves (§22.E), instead of the cascade taking the turn's row with it.
alter table public.tabu_turns alter column describer_session_id drop not null;
alter table public.tabu_turns drop constraint tabu_turns_describer_session_id_fkey;
alter table public.tabu_turns
  add constraint tabu_turns_describer_session_id_fkey
  foreign key (describer_session_id) references public.table_sessions (id) on delete set null;

comment on column public.tabu_turns.describer_session_id is
  'The side''s leader while the turn is ready; the phone that starts it (or the leader when the ready '
  'time runs out) from tabu/begin-turn on (docs/SPEC_V3.md §22.E).';

-- Helpers -------------------------------------------------------------------------------------------
-- A side's leader.
create function private.side_leader(r public.rooms, side text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case side when 'owner' then r.owner_session_id else r.guest_session_id end;
$$;

-- A side's headcount now (§22.B): what it declared or its phones, whichever is larger.
create function private.room_side_headcount(r public.rooms, side text)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case side
    when 'owner' then private.side_headcount(r.owner_headcount, r.owner_phones)
    else private.side_headcount(r.guest_headcount, r.guest_phones)
  end;
$$;

-- The accounts a finished game's result goes to, with their sides (§22.E): every phone in the room
-- now that was also in it when the game started (rooms.game_started_at; one of its room_members
-- intervals covers that moment). A phone that came in during the game gets none. A game without a
-- start time (none after this migration) counts every phone in the room.
create function private.game_result_phones(r public.rooms)
returns table (user_id uuid, side text)
language sql
stable
security definer
set search_path = ''
as $$
  select ts.user_id, now_in.side
  from public.room_members now_in
  join public.table_sessions ts on ts.id = now_in.session_id
  where now_in.room_id = r.id
    and now_in.left_at is null
    and exists (
      select 1 from public.room_members at_start
      where at_start.room_id = r.id
        and at_start.session_id = now_in.session_id
        and at_start.joined_at <= coalesce(r.game_started_at, 'infinity')
        and (at_start.left_at is null
             or at_start.left_at > coalesce(r.game_started_at, 'infinity'))
    );
$$;

revoke all on function private.side_leader(public.rooms, text) from public, anon, authenticated;
revoke all on function private.room_side_headcount(public.rooms, text)
  from public, anon, authenticated;
revoke all on function private.game_result_phones(public.rooms) from public, anon, authenticated;

-- Proposals -----------------------------------------------------------------------------------------
-- rooms/propose-game: any phone; the proposal is its side's. As in 20261016090000_sahtekar.sql
-- otherwise.
create or replace function public.rooms_propose_game(
  target_user_id uuid,
  target_room_id uuid,
  new_concept text,
  ttl_seconds integer,
  proposer_players integer default null
)
returns public.game_proposals
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  created public.game_proposals;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.status <> 'active' or r.guest_session_id is null then
    raise exception using errcode = 'P0001', message = 'needs_two_tables';
  end if;
  if r.concept is not null then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;

  delete from public.game_proposals where room_id = r.id and expires_at <= now();
  if exists (select 1 from public.game_proposals where room_id = r.id) then
    raise exception using errcode = 'P0001', message = 'proposal_pending';
  end if;

  insert into public.game_proposals
    (room_id, proposer_session_id, proposer_side, concept, expires_at, proposer_players)
  values (r.id, m.session_id, m.side, new_concept, now() + make_interval(secs => ttl_seconds),
          case when new_concept = 'sahtekar' then proposer_players end)
  returning * into created;
  update public.rooms set last_activity_at = now() where id = r.id;
  return created;
end;
$$;

-- rooms/answer-game: any phone on the other side (the proposer's teammates: no_proposal). Sahtekar's
-- counts default to the sides' headcounts now, at the start. As in 20261018090000_ibre.sql otherwise.
create or replace function public.rooms_answer_game(
  target_user_id uuid,
  target_room_id uuid,
  accept boolean,
  turn_seconds integer,
  total_turns integer,
  max_passes integer,
  cards_per_turn integer,
  cooldown_ms integer,
  acceptor_players integer default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  p public.game_proposals;
  mine integer;
  theirs integer;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  select * into p from public.game_proposals where room_id = r.id for update;
  if p.room_id is null or p.expires_at <= now() or p.proposer_side = m.side then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  delete from public.game_proposals where room_id = r.id;

  if not accept then
    return r;
  end if;
  if r.status <> 'active' or r.guest_session_id is null then
    raise exception using errcode = 'P0001', message = 'needs_two_tables';
  end if;
  if r.concept is not null then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;

  if p.concept = 'tabu' then
    return private.start_voice_tabu(r, turn_seconds, total_turns, max_passes, cards_per_turn);
  end if;
  if p.concept = 'sahtekar' then
    mine := coalesce(acceptor_players, least(private.room_side_headcount(r, m.side), 4));
    theirs := coalesce(p.proposer_players, least(private.room_side_headcount(r, p.proposer_side), 4));
    return private.start_sahtekar(
      r,
      case when m.side = 'owner' then mine else theirs end,
      case when m.side = 'owner' then theirs else mine end
    );
  end if;
  if p.concept in ('harf', 'sarki') then
    return private.start_say(r, p.concept);
  end if;
  if p.concept = 'ibre' then
    return private.start_ibre(r);
  end if;
  return private.deal_sohbet(r, cooldown_ms);
end;
$$;

-- rooms/end-game ("Oyunu bitir"): any phone. As in 20261018090000_ibre.sql otherwise.
create or replace function public.rooms_end_game(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  last_game jsonb;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is null then
    return r;
  end if;
  last_game := jsonb_build_object('concept', r.concept);
  if r.concept = 'tabu' and r.game_state ->> 'phase' = 'playing' then
    last_game := last_game || jsonb_build_object(
      'abandoned', true,
      'turnNo', (r.game_state ->> 'turnNo')::integer,
      'totalTurns', (r.game_state ->> 'totalTurns')::integer
    );
  end if;
  if r.concept = 'sahtekar' and r.game_state ? 'players' then
    last_game := last_game || jsonb_build_object('abandoned', true, 'players', r.game_state -> 'players');
  end if;
  if r.concept in ('harf', 'sarki', 'ibre') and r.game_state ->> 'phase' = 'playing' then
    last_game := last_game || jsonb_build_object(
      'abandoned', true,
      'turnNo', (r.game_state ->> 'roundNo')::integer,
      'totalTurns', (r.game_state ->> 'totalRounds')::integer,
      'scores', r.game_state -> 'scores'
    );
  end if;
  update public.rooms
  set concept = null, last_activity_at = now(),
      game_state = private.between_games(game_state, last_game)
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Sohbet cards: any phone. As in 20261010090000_room_flow.sql otherwise.
create or replace function public.sohbet_next(
  target_user_id uuid,
  target_room_id uuid,
  cooldown_ms integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is not distinct from 'sohbet' then
    return private.deal_sohbet(r, cooldown_ms);
  end if;
  if r.concept is not null then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  if r.guest_session_id is not null then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  return private.deal_sohbet(r, cooldown_ms);
end;
$$;

-- One-table decks ("Masanla oyna" in a room without a guest side): any phone on the owner's side, as
-- every authority of "the table" is the side's (§22.E). As in their migrations otherwise.
create or replace function public.tabu_local_deck(
  target_user_id uuid,
  target_room_id uuid,
  deck_size integer
)
returns table (word text, forbidden text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.guest_session_id is not null then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  if r.concept is not null and r.concept <> 'tabu' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  update public.rooms
  set concept = 'tabu', last_activity_at = now(),
      game_state = private.between_games(game_state, null)
  where id = r.id;
  return query
    select c.word, c.forbidden from public.cards c
    where c.deck = 'tabu' and c.is_active
    order by random()
    limit deck_size;
end;
$$;

create or replace function public.sahtekar_local_deck(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  deal jsonb;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.guest_session_id is not null then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  if r.concept is not null and r.concept <> 'sahtekar' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  deal := private.sahtekar_deal(r.id);
  update public.rooms
  set concept = 'sahtekar', last_activity_at = now(),
      game_state = private.between_games(game_state, null)
  where id = r.id;
  return jsonb_build_object(
    'category', deal -> 'category', 'word', deal -> 'word', 'options', deal -> 'options'
  );
end;
$$;

create or replace function public.say_local_deck(target_user_id uuid, target_room_id uuid, kind text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  prompts text[] := '{}';
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.guest_session_id is not null then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  if r.concept is not null and r.concept <> kind then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  for i in 1 .. (private.say_config(kind) ->> 'totalRounds')::integer loop
    prompts := prompts || private.say_deal(r.id, kind);
  end loop;
  update public.rooms
  set concept = kind, last_activity_at = now(),
      game_state = private.between_games(game_state, null)
  where id = r.id;
  return prompts;
end;
$$;

create or replace function public.ibre_local_deck(target_user_id uuid, target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  scales jsonb := '[]'::jsonb;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.guest_session_id is not null then
    raise exception using errcode = 'P0001', message = 'no_proposal';
  end if;
  if r.concept is not null and r.concept <> 'ibre' then
    raise exception using errcode = 'P0001', message = 'game_in_progress';
  end if;
  for i in 1 .. (private.ibre_config() ->> 'totalRounds')::integer loop
    scales := scales || jsonb_build_array(private.ibre_deal(r.id));
  end loop;
  update public.rooms
  set concept = 'ibre', last_activity_at = now(),
      game_state = private.between_games(game_state, null)
  where id = r.id;
  return scales;
end;
$$;

-- Sesli Tabu ----------------------------------------------------------------------------------------
-- The caller's room, phone, side and the current turn. The side is new; the rest as in
-- 20261010090000_room_flow.sql.
drop function private.tabu_playing_room(uuid, uuid);
create function private.tabu_playing_room(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, session_id uuid, turn public.tabu_turns, side text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  t public.tabu_turns;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if r.concept is distinct from 'tabu' or r.game_state ->> 'phase' is distinct from 'playing' then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  select * into t from public.tabu_turns
  where room_id = r.id
    and game_no = (r.game_state ->> 'gameNo')::integer
    and turn_no = (r.game_state ->> 'turnNo')::integer
  for update;
  return query select r, m.session_id, t, m.side::text;
end;
$$;

revoke all on function private.tabu_playing_room(uuid, uuid) from public, anon, authenticated;

-- The game's mode comes from the sides' headcounts at the start, and game_started_at marks who plays
-- it.
-- As in 20261015090000_tabu_ready.sql otherwise.
create or replace function private.start_voice_tabu(
  r public.rooms,
  turn_seconds integer,
  total_turns integer,
  max_passes integer,
  cards_per_turn integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_game integer;
  game_mode text;
  turn public.tabu_turns;
begin
  next_game := coalesce((r.game_state ->> 'gameNo')::integer, 0) + 1;
  game_mode := private.tabu_mode(
    private.room_side_headcount(r, 'owner'), private.room_side_headcount(r, 'guest')
  );
  r.game_state := jsonb_build_object(
    'concept', 'tabu', 'mode', game_mode, 'phase', 'playing', 'gameNo', next_game,
    'turnNo', 1, 'totalTurns', total_turns, 'turnSeconds', turn_seconds,
    'cardsPerTurn', cards_per_turn, 'describingTable', 'owner',
    'scores', case when game_mode = 'cooperative' then jsonb_build_object('team', 0)
                   else jsonb_build_object('owner', 0, 'guest', 0) end,
    'passesUsed', 0, 'maxPasses', max_passes, 'cardIndex', 0
  );
  turn := private.open_turn(r, 1, next_game);

  update public.rooms
  set concept = 'tabu', last_activity_at = now(), game_started_at = now(),
      game_state = r.game_state || jsonb_build_object(
        'turnPhase', 'ready', 'readyEndsAt', turn.ready_ends_at
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/begin-turn: a phone on the describing side starts the clock at any time and describes the
-- turn; after readyEndsAt any phone may, and then the describing side's leader describes. Anything
-- else returns the room unchanged, so the first press wins.
create or replace function public.tabu_begin_turn(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  t public.tabu_turns;
  ends timestamptz;
  describing text;
  describer uuid;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from 'tabu' or r.game_state ->> 'phase' is distinct from 'playing' then
    return r;
  end if;
  select * into t from public.tabu_turns
  where room_id = r.id
    and game_no = (r.game_state ->> 'gameNo')::integer
    and turn_no = (r.game_state ->> 'turnNo')::integer
  for update;
  if t.id is null or t.ends_at is not null then
    return r;
  end if;
  describing := r.game_state ->> 'describingTable';
  if m.side = describing then
    describer := m.session_id;
  elsif now() >= t.ready_ends_at then
    describer := private.side_leader(r, describing);
  else
    return r;
  end if;

  ends := now() + make_interval(secs => (r.game_state ->> 'turnSeconds')::integer);
  update public.tabu_turns
  set describer_session_id = describer, started_at = now(), ends_at = ends
  where id = t.id;
  perform private.use_card(r.id, t.card_ids[t.card_index + 1]);
  insert into public.game_events (room_id, turn_id, session_id, type, payload)
  values (r.id, t.id, describer, 'turn_started', jsonb_build_object('turnNo', t.turn_no));

  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'readyEndsAt') || jsonb_build_object(
        'turnPhase', 'running', 'turnEndsAt', ends, 'describer', describer
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/turn-cards: the describer, and in refereed mode every phone on the judging side; the
-- describer's teammates and, in cooperative mode, the other side get not_describer. While the turn is
-- ready the describing side hears turn_not_started (its phone that starts it will describe).
create or replace function public.tabu_turn_cards(target_user_id uuid, target_room_id uuid)
returns table (turn_no integer, card_index integer, word text, forbidden text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  cooperative boolean;
  judging boolean;
begin
  select * into p from private.tabu_playing_room(target_user_id, target_room_id);
  cooperative := (p.room).game_state ->> 'mode' = 'cooperative';
  judging := p.side is distinct from (p.room).game_state ->> 'describingTable';
  if (p.turn).ends_at is null then
    if cooperative and judging then
      raise exception using errcode = 'P0001', message = 'not_describer';
    end if;
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if (p.turn).describer_session_id is distinct from p.session_id and (cooperative or not judging) then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  return query
    select (p.turn).turn_no, (ord - 1)::integer, c.word, c.forbidden
    from unnest((p.turn).card_ids) with ordinality as list(card_id, ord)
    join public.cards c on c.id = list.card_id
    order by ord;
end;
$$;

-- tabu/mark (§22.E): refereed, Doğru from every phone on both sides, Tabu from every phone on the
-- judging side, Pas from the describer only; cooperative, all three from the describer only. As in
-- 20261015090000_tabu_ready.sql otherwise.
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
  describing boolean;
  judging boolean;
  cooperative boolean;
  side text;
  delta integer;
  closed_word text;
  new_scores jsonb;
begin
  if result not in ('correct', 'taboo', 'pass') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into p from private.tabu_playing_room(target_user_id, target_room_id);
  r := p.room;
  t := p.turn;
  describing := t.describer_session_id is not distinct from p.session_id;
  judging := p.side is distinct from r.game_state ->> 'describingTable';
  cooperative := r.game_state ->> 'mode' = 'cooperative';

  if cooperative and not describing then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if not cooperative and result = 'taboo' and not judging then
    raise exception using errcode = 'P0001', message = 'not_judge';
  end if;
  if not cooperative and result = 'pass' and not describing then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if t.ends_at is null then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if t.turn_no <> turn_number or t.card_index <> index
     or index >= coalesce(array_length(t.card_ids, 1), 0) then
    return r;
  end if;
  if now() >= t.ends_at then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  if result = 'pass' and t.passes_used >= (r.game_state ->> 'maxPasses')::integer then
    raise exception using errcode = 'P0001', message = 'no_passes_left';
  end if;

  delta := case result when 'correct' then 1 when 'taboo' then -1 else 0 end;
  if cooperative then
    new_scores := jsonb_build_object(
      'team', (r.game_state -> 'scores' ->> 'team')::integer + delta
    );
  else
    side := r.game_state ->> 'describingTable';
    new_scores := jsonb_set(r.game_state -> 'scores', array[side],
                            to_jsonb((r.game_state -> 'scores' ->> side)::integer + delta));
  end if;
  -- The closed card's word goes to the room (game_events) only now, after the action.
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
        'scores', new_scores,
        'passesUsed', t.passes_used + case when result = 'pass' then 1 else 0 end,
        'cardIndex', index + 1
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- tabu/end-turn: any phone once the clock has run out. The result goes to the phones that played the
-- game (private.game_result_phones), with their side's score; the next turn opens ready without a
-- describer. As in 20261015090000_tabu_ready.sql otherwise.
create or replace function public.tabu_end_turn(
  target_user_id uuid,
  target_room_id uuid
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  t public.tabu_turns;
  next_no integer;
  next_turn public.tabu_turns;
  owner_score integer;
  guest_score integer;
  team_score integer;
  summary jsonb;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from 'tabu' or r.game_state ->> 'phase' is distinct from 'playing' then
    return r;
  end if;
  select * into t from public.tabu_turns
  where room_id = r.id
    and game_no = (r.game_state ->> 'gameNo')::integer
    and turn_no = (r.game_state ->> 'turnNo')::integer
  for update;
  if t.ends_at is null or now() < t.ends_at then
    return r;
  end if;

  if t.turn_no >= (r.game_state ->> 'totalTurns')::integer then
    if r.game_state ->> 'mode' = 'cooperative' then
      team_score := (r.game_state -> 'scores' ->> 'team')::integer;
      insert into public.game_results (user_id, room_id, concept, mode, score, won)
      select ph.user_id, r.id, 'tabu', 'cooperative', team_score, null
      from private.game_result_phones(r) ph;
    else
      owner_score := (r.game_state -> 'scores' ->> 'owner')::integer;
      guest_score := (r.game_state -> 'scores' ->> 'guest')::integer;
      insert into public.game_results (user_id, room_id, concept, mode, score, won)
      select ph.user_id, r.id, 'tabu', 'voice',
             case when ph.side = 'owner' then owner_score else guest_score end,
             case when ph.side = 'owner' then owner_score > guest_score
                  else guest_score > owner_score end
      from private.game_result_phones(r) ph;
    end if;
    insert into public.game_events (room_id, type, payload)
    values (r.id, 'game_completed', jsonb_build_object('scores', r.game_state -> 'scores'));

    update public.rooms
    set concept = null, last_activity_at = now(),
        game_state = private.between_games(
          game_state,
          jsonb_build_object('concept', 'tabu', 'scores', game_state -> 'scores')
        )
    where id = r.id
    returning * into r;
    return r;
  end if;

  -- The turn just played, from its own marks: pure/tabu.ts → summarizeTurn.
  select jsonb_build_object(
           'turnNo', t.turn_no,
           'describingTable', r.game_state ->> 'describingTable',
           'score', t.score,
           'correct', count(*) filter (where e.type = 'correct'),
           'taboo', count(*) filter (where e.type = 'taboo'),
           'pass', count(*) filter (where e.type = 'pass')
         )
  into summary
  from public.game_events e
  where e.turn_id = t.id;

  next_no := t.turn_no + 1;
  next_turn := private.open_turn(r, next_no, t.game_no);
  update public.rooms
  set last_activity_at = now(),
      game_state = (game_state - 'turnEndsAt' - 'describer') || jsonb_build_object(
        'turnNo', next_no, 'passesUsed', 0, 'cardIndex', 0,
        'describingTable', case when next_no % 2 = 1 then 'owner' else 'guest' end,
        'turnPhase', 'ready', 'readyEndsAt', next_turn.ready_ends_at, 'lastTurn', summary
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Sahtekar ------------------------------------------------------------------------------------------
-- The seats' actions (view, said, vote, options, guess) come from the side's leader only: its phone
-- holds the seats; members watch (not_your_seat). The leader of the moment: when the leader leaves,
-- the seats go on from the new leader's phone. As in 20261016090000_sahtekar.sql otherwise.
create or replace function private.sahtekar_room(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, is_owner boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from 'sahtekar' or r.guest_session_id is null
     or r.game_state ->> 'phase' is null then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  if not m.is_leader then
    raise exception using errcode = 'P0001', message = 'not_your_seat';
  end if;
  return query select r, m.side = 'owner';
end;
$$;

-- sahtekar/advance: any phone once the phase's time has run out. As in 20261016090000_sahtekar.sql.
create or replace function public.sahtekar_advance(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  phase text;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from 'sahtekar' or r.guest_session_id is null
     or r.game_state ->> 'phase' is null
     or now() < (r.game_state ->> 'endsAt')::timestamptz then
    return r;
  end if;
  phase := r.game_state ->> 'phase';
  if phase = 'viewing' then
    return private.sahtekar_end_viewing(r);
  elsif phase = 'clues' then
    return private.sahtekar_next_step(r);
  elsif phase = 'voting' then
    return private.sahtekar_count(r, private.sahtekar_secret(r));
  end if;
  -- The guess ran out: a wrong guess.
  return private.sahtekar_finish(r, private.sahtekar_secret(r), r.game_state ->> 'accused', null);
end;
$$;

-- game_started_at marks who plays the game. As in 20261016090000_sahtekar.sql otherwise.
create or replace function private.start_sahtekar(
  r public.rooms,
  owner_players integer,
  guest_players integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_game integer;
  seats text[];
  deal jsonb;
begin
  if owner_players + guest_players < (private.sahtekar_config() ->> 'minPlayers')::integer then
    raise exception using errcode = 'P0001', message = 'not_enough_players';
  end if;
  next_game := coalesce((r.game_state ->> 'gameNo')::integer, 0) + 1;
  seats := private.sahtekar_seats(owner_players, guest_players);
  deal := private.sahtekar_deal(r.id);

  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (r.id, next_game, 'sahtekar', jsonb_build_object(
    'imposter', seats[1 + floor(random() * array_length(seats, 1))::integer],
    'word', deal -> 'word', 'cardId', deal -> 'cardId', 'options', deal -> 'options',
    'votes', '{}'::jsonb
  ));

  update public.rooms
  set concept = 'sahtekar', last_activity_at = now(),
      game_state = jsonb_build_object(
        'concept', 'sahtekar', 'phase', 'viewing', 'gameNo', next_game,
        'players', jsonb_build_object('owner', owner_players, 'guest', guest_players),
        'seats', to_jsonb(seats), 'category', deal -> 'category', 'dealNo', 1,
        'viewed', '[]'::jsonb, 'order', '[]'::jsonb, 'step', 0, 'voters', '[]'::jsonb,
        'votesCast', 0, 'endsAt', now() + private.sahtekar_seconds('viewSeconds')
      ),
      game_started_at = now()
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- The result goes to the phones that played the game. As in 20261016090000_sahtekar.sql otherwise.
create or replace function private.sahtekar_finish(
  r public.rooms,
  s public.game_secrets,
  accused text,
  guess text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  imposter text := s.secret ->> 'imposter';
  winner text;
begin
  winner := case when accused = imposter and guess is distinct from (s.secret ->> 'word')
                 then 'tables' else 'imposter' end;
  insert into public.game_results (user_id, room_id, concept, mode, score, won)
  select ph.user_id, r.id, 'sahtekar', 'sahtekar', null, null
  from private.game_result_phones(r) ph;
  insert into public.game_events (room_id, type, payload)
  values (r.id, 'game_completed', jsonb_build_object('concept', 'sahtekar', 'winner', winner));

  update public.rooms
  set concept = null, last_activity_at = now(),
      game_state = private.between_games(game_state, jsonb_build_object(
        'concept', 'sahtekar',
        'players', game_state -> 'players',
        'reveal', jsonb_build_object(
          'imposter', imposter, 'word', s.secret -> 'word', 'category', game_state -> 'category',
          'votes', s.secret -> 'votes', 'accused', accused, 'guess', guess, 'winner', winner
        )
      ))
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Harf Kapmaca, Şarkıda Geçsin ----------------------------------------------------------------------
-- The caller's side: every phone on the side whose turn it is claims or says, every phone on the
-- other side objects (the objections are the side's). As in 20261017090000_say_games.sql otherwise.
create or replace function private.say_room(target_user_id uuid, target_room_id uuid, kind text)
returns table (room public.rooms, side text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from kind or r.guest_session_id is null
     or r.game_state ->> 'phase' is distinct from 'playing' then
    return query select r, null::text;
    return;
  end if;
  return query select r, m.side::text;
end;
$$;

-- game_started_at marks who plays the game. As in 20261017090000_say_games.sql otherwise.
create or replace function private.start_say(r public.rooms, kind text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := private.say_config(kind);
  next_game integer := coalesce((r.game_state ->> 'gameNo')::integer, 0) + 1;
begin
  update public.rooms
  set concept = kind, last_activity_at = now(),
      game_state = jsonb_build_object(
        'concept', kind, 'phase', 'playing', 'gameNo', next_game,
        'turnPhase', 'ready',
        'readyEndsAt', now() + make_interval(secs => (c ->> 'readySeconds')::integer),
        'roundNo', 1, 'totalRounds', (c ->> 'totalRounds')::integer,
        'prompt', private.say_deal(r.id, kind), 'letters', private.say_board(kind),
        'turnTable', private.say_round_starter(1), 'step', 0,
        'endsAt', null, 'objectionEndsAt', null, 'lastClaim', null,
        'objectionsLeft', jsonb_build_object(
          'owner', (c ->> 'objections')::integer, 'guest', (c ->> 'objections')::integer
        ),
        'scores', jsonb_build_object('owner', 0, 'guest', 0),
        'lastRound', null, 'timeouts', 0
      ),
      game_started_at = now()
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- The result goes to the phones that played the game. As in 20261017090000_say_games.sql otherwise.
create or replace function private.say_end_round(r public.rooms, winner text, reason text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text := r.game_state ->> 'concept';
  c jsonb := private.say_config(kind);
  scores jsonb := r.game_state -> 'scores';
  last_round jsonb;
  round_no integer := (r.game_state ->> 'roundNo')::integer;
  owner_score integer;
  guest_score integer;
  ready boolean := (c ->> 'readyEachRound')::boolean;
  timeouts integer;
begin
  if winner is not null then
    scores := jsonb_set(scores, array[winner], to_jsonb((scores ->> winner)::integer + 1));
  end if;
  last_round := jsonb_build_object('roundNo', round_no, 'winner', winner, 'reason', reason);
  timeouts := coalesce((r.game_state ->> 'timeouts')::integer, 0)
              + case when reason = 'timeout' then 1 else 0 end;

  if round_no >= (r.game_state ->> 'totalRounds')::integer then
    owner_score := (scores ->> 'owner')::integer;
    guest_score := (scores ->> 'guest')::integer;
    insert into public.game_results (user_id, room_id, concept, mode, score, won)
    select ph.user_id, r.id, kind, kind,
           case when ph.side = 'owner' then owner_score else guest_score end,
           case when ph.side = 'owner' then owner_score > guest_score
                else guest_score > owner_score end
    from private.game_result_phones(r) ph;
    insert into public.game_events (room_id, type, payload)
    values (r.id, 'game_completed', jsonb_build_object('concept', kind, 'scores', scores));
    update public.rooms
    set concept = null, last_activity_at = now(),
        game_state = private.between_games(r.game_state, jsonb_build_object(
          'concept', kind, 'scores', scores, 'lastRound', last_round,
          'objectionsLeft', r.game_state -> 'objectionsLeft', 'timeouts', timeouts
        ))
    where id = r.id
    returning * into r;
    return r;
  end if;

  round_no := round_no + 1;
  -- From the state handed in (an objection has already spent its count there).
  update public.rooms
  set last_activity_at = now(),
      game_state = r.game_state || jsonb_build_object(
        'roundNo', round_no, 'prompt', private.say_deal(r.id, kind),
        'letters', private.say_board(kind), 'turnTable', private.say_round_starter(round_no),
        'step', 0,
        'turnPhase', case when ready then 'ready' else 'running' end,
        'readyEndsAt', case when ready
          then now() + make_interval(secs => (c ->> 'readySeconds')::integer) end,
        'endsAt', case when ready then null
          else now() + make_interval(secs => private.say_turn_seconds(kind, round_no)) end,
        'objectionEndsAt', null, 'lastClaim', null, 'scores', scores, 'lastRound', last_round,
        'timeouts', timeouts
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- İbre ----------------------------------------------------------------------------------------------
-- The caller's room, side and phone. The phone is new; the rest as in 20261018090000_ibre.sql.
drop function private.ibre_room(uuid, uuid);
create function private.ibre_room(target_user_id uuid, target_room_id uuid)
returns table (room public.rooms, side text, session_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.concept is distinct from 'ibre' or r.guest_session_id is null
     or r.game_state ->> 'phase' is distinct from 'playing' then
    return query select r, null::text, m.session_id;
    return;
  end if;
  return query select r, m.side::text, m.session_id;
end;
$$;

revoke all on function private.ibre_room(uuid, uuid) from public, anon, authenticated;

-- game_started_at marks who plays the game; describer and lockBy are set when a round starts.
-- As in 20261018090000_ibre.sql otherwise.
create or replace function private.start_ibre(r public.rooms)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := private.ibre_config();
  next_game integer := coalesce((r.game_state ->> 'gameNo')::integer, 0) + 1;
begin
  insert into public.game_secrets (room_id, game_no, concept, secret)
  values (r.id, next_game, 'ibre', jsonb_build_object('roundNo', 1, 'target', private.ibre_target()));

  update public.rooms
  set concept = 'ibre', last_activity_at = now(),
      game_state = jsonb_build_object(
        'concept', 'ibre', 'phase', 'playing', 'gameNo', next_game,
        'turnPhase', 'ready',
        'readyEndsAt', now() + make_interval(secs => (c ->> 'readySeconds')::integer),
        'roundNo', 1, 'totalRounds', (c ->> 'totalRounds')::integer,
        'scale', private.ibre_deal(r.id), 'turnTable', private.ibre_turn_table(1),
        'endsAt', null, 'needle', null,
        'scores', jsonb_build_object('owner', 0, 'guest', 0),
        'bullseyes', jsonb_build_object('owner', 0, 'guest', 0),
        'reveal', null, 'describer', null, 'lockBy', null
      ),
      game_started_at = now()
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- A round's clock starts with its describer. lockBy freezes now (§22.E): with one phone on the
-- describing side the describer locks the needle, with more its teammates do.
drop function private.ibre_start_clock(public.rooms);
create function private.ibre_start_clock(r public.rooms, describer uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  phones integer;
begin
  select count(*) into phones from public.room_members
  where room_id = r.id and side = r.game_state ->> 'turnTable' and left_at is null;
  update public.game_secrets
  set secret = secret || jsonb_build_object('describer', describer)
  where room_id = r.id and game_no = (r.game_state ->> 'gameNo')::integer;
  update public.rooms
  set last_activity_at = now(),
      game_state = game_state || jsonb_build_object(
        'turnPhase', 'running', 'readyEndsAt', null,
        'endsAt', least(now(), (game_state ->> 'readyEndsAt')::timestamptz)
                  + make_interval(secs => (private.ibre_config() ->> 'clueSeconds')::integer),
        'describer', describer,
        'lockBy', case when phones > 1 then 'team' else 'describer' end
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

revoke all on function private.ibre_start_clock(public.rooms, uuid) from public, anon, authenticated;

-- ibre/begin: a phone on the describing side starts the round and describes it.
create or replace function public.ibre_begin(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
begin
  select * into p from private.ibre_room(target_user_id, target_room_id);
  if p.side is null or (p.room).game_state ->> 'turnPhase' <> 'ready'
     or p.side <> (p.room).game_state ->> 'turnTable' then
    return p.room;
  end if;
  return private.ibre_start_clock(p.room, p.session_id);
end;
$$;

-- ibre/target: the describer only (its teammates and the other side: not_describer). As in
-- 20261018090000_ibre.sql otherwise.
create or replace function public.ibre_target(target_user_id uuid, target_room_id uuid, round integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  gs jsonb;
  s public.game_secrets;
begin
  select * into p from private.ibre_room(target_user_id, target_room_id);
  if p.side is null then
    raise exception using errcode = 'P0001', message = 'no_game';
  end if;
  gs := (p.room).game_state;
  if p.side <> gs ->> 'turnTable' then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  if (gs ->> 'roundNo')::integer <> round then
    raise exception using errcode = 'P0001', message = 'turn_over';
  end if;
  if gs ->> 'turnPhase' = 'ready' then
    raise exception using errcode = 'P0001', message = 'turn_not_started';
  end if;
  if (gs ->> 'describer')::uuid is distinct from p.session_id then
    raise exception using errcode = 'P0001', message = 'not_describer';
  end if;
  s := private.ibre_secret(p.room);
  return jsonb_build_object('roundNo', round, 'target', (s.secret ->> 'target')::integer);
end;
$$;

-- ibre/lock: lockBy 'describer', the describer; 'team', the describing side's other phones, and the
-- describer too once none of them is left in the room. The first lock wins. Anything else returns the
-- room unchanged, as before. As in 20261018090000_ibre.sql otherwise.
create or replace function public.ibre_lock(
  target_user_id uuid,
  target_room_id uuid,
  round integer,
  value integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  gs jsonb;
  describer uuid;
begin
  select * into p from private.ibre_room(target_user_id, target_room_id);
  r := p.room;
  gs := r.game_state;
  if p.side is null or gs ->> 'turnPhase' <> 'running' or p.side <> gs ->> 'turnTable'
     or (gs ->> 'roundNo')::integer <> round or now() >= (gs ->> 'endsAt')::timestamptz
     or value is null or value < 0 or value > 100 then
    return r;
  end if;
  describer := (gs ->> 'describer')::uuid;
  if gs ->> 'lockBy' = 'team' then
    if p.session_id = describer and exists (
      select 1 from public.room_members
      where room_id = r.id and side = p.side and left_at is null and session_id <> describer
    ) then
      return r;
    end if;
  elsif describer is distinct from p.session_id then
    return r;
  end if;
  update public.rooms
  set last_activity_at = now(),
      game_state = game_state || jsonb_build_object(
        'turnPhase', 'side', 'needle', value,
        'endsAt', now() + make_interval(secs => (private.ibre_config() ->> 'sideSeconds')::integer)
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- ibre/advance: any phone once the time has run out. A ready round that starts this way is described
-- by the describing side's leader. As in 20261018090000_ibre.sql otherwise.
create or replace function public.ibre_advance(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  gs jsonb;
begin
  select * into p from private.ibre_room(target_user_id, target_room_id);
  r := p.room;
  gs := r.game_state;
  if p.side is null then
    return r;
  end if;
  if gs ->> 'turnPhase' = 'ready' then
    if now() < (gs ->> 'readyEndsAt')::timestamptz then
      return r;
    end if;
    return private.ibre_start_clock(r, private.side_leader(r, gs ->> 'turnTable'));
  end if;
  if now() < (gs ->> 'endsAt')::timestamptz then
    return r;
  end if;
  return private.ibre_end_round(r, null);
end;
$$;

-- The result goes to the phones that played the game; the next round opens without a describer.
-- As in 20261018090000_ibre.sql otherwise.
create or replace function private.ibre_end_round(r public.rooms, side text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := private.ibre_config();
  gs jsonb := r.game_state;
  s public.game_secrets;
  target integer;
  needle integer;
  band integer;
  side_point boolean;
  describer text := gs ->> 'turnTable';
  guesser text;
  scores jsonb := gs -> 'scores';
  bullseyes jsonb := gs -> 'bullseyes';
  reveal jsonb;
  round_no integer := (gs ->> 'roundNo')::integer;
  owner_score integer;
  guest_score integer;
begin
  s := private.ibre_secret(r);
  target := (s.secret ->> 'target')::integer;
  guesser := case when describer = 'owner' then 'guest' else 'owner' end;
  needle := case when gs ->> 'turnPhase' = 'side' then (gs ->> 'needle')::integer end;
  band := case when needle is null then 0 else private.ibre_band(needle - target) end;
  side_point := needle is not null and side is not null and needle <> target
                and ((side = 'left') = (target < needle));
  scores := jsonb_set(scores, array[describer], to_jsonb((scores ->> describer)::integer + band));
  scores := jsonb_set(
    scores, array[guesser], to_jsonb((scores ->> guesser)::integer + case when side_point then 1 else 0 end)
  );
  bullseyes := jsonb_set(
    bullseyes, array[describer],
    to_jsonb((bullseyes ->> describer)::integer + case when band = 4 then 1 else 0 end)
  );
  reveal := jsonb_build_object(
    'roundNo', round_no, 'scale', gs -> 'scale', 'table', describer, 'target', target,
    'needle', needle, 'band', band,
    'side', side, 'sidePoint', side_point
  );

  if round_no >= (gs ->> 'totalRounds')::integer then
    owner_score := (scores ->> 'owner')::integer;
    guest_score := (scores ->> 'guest')::integer;
    insert into public.game_results (user_id, room_id, concept, mode, score, won)
    select ph.user_id, r.id, 'ibre', 'ibre',
           case when ph.side = 'owner' then owner_score else guest_score end,
           case when ph.side = 'owner' then owner_score > guest_score
                else guest_score > owner_score end
    from private.game_result_phones(r) ph;
    insert into public.game_events (room_id, type, payload)
    values (r.id, 'game_completed', jsonb_build_object('concept', 'ibre', 'scores', scores));
    update public.rooms
    set concept = null, last_activity_at = now(),
        game_state = private.between_games(gs, jsonb_build_object(
          'concept', 'ibre', 'scores', scores, 'reveal', reveal, 'bullseyes', bullseyes
        ))
    where id = r.id
    returning * into r;
    return r;
  end if;

  round_no := round_no + 1;
  update public.game_secrets
  set secret = jsonb_build_object('roundNo', round_no, 'target', private.ibre_target())
  where room_id = s.room_id and game_no = s.game_no;
  update public.rooms
  set last_activity_at = now(),
      game_state = gs || jsonb_build_object(
        'turnPhase', 'ready',
        'readyEndsAt', now() + make_interval(secs => (c ->> 'readySeconds')::integer),
        'roundNo', round_no, 'scale', private.ibre_deal(r.id),
        'turnTable', private.ibre_turn_table(round_no), 'endsAt', null, 'needle', null,
        'scores', scores, 'bullseyes', bullseyes, 'reveal', reveal,
        'describer', null, 'lockBy', null
      )
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Games running now ----------------------------------------------------------------------------------
-- Only leaders played before this migration: a running Tabu turn's describer is its turn's, a running
-- İbre round's is the describing side's leader, who also locks. Their results count the phones in
-- the room from now.
update public.rooms
set game_started_at = now()
where status <> 'closed'
  and concept in ('tabu', 'sahtekar', 'harf', 'sarki', 'ibre')
  and game_state ? 'phase';

update public.rooms r
set game_state = r.game_state || jsonb_build_object('describer', t.describer_session_id)
from public.tabu_turns t
where r.status <> 'closed'
  and r.concept = 'tabu'
  and r.game_state ->> 'phase' = 'playing'
  and r.game_state ->> 'turnPhase' = 'running'
  and t.room_id = r.id
  and t.game_no = (r.game_state ->> 'gameNo')::integer
  and t.turn_no = (r.game_state ->> 'turnNo')::integer;

update public.rooms r
set game_state = r.game_state || jsonb_build_object(
  'describer', private.side_leader(r, r.game_state ->> 'turnTable'), 'lockBy', 'describer'
)
where r.status <> 'closed'
  and r.concept = 'ibre'
  and r.game_state ->> 'phase' = 'playing'
  and r.game_state ->> 'turnPhase' in ('running', 'side');

update public.game_secrets s
set secret = s.secret || jsonb_build_object('describer', r.game_state -> 'describer')
from public.rooms r
where s.room_id = r.id
  and s.concept = 'ibre'
  and s.game_no = (r.game_state ->> 'gameNo')::integer
  and r.status <> 'closed'
  and r.concept = 'ibre'
  and r.game_state ? 'describer'
  and r.game_state -> 'describer' <> 'null'::jsonb;
