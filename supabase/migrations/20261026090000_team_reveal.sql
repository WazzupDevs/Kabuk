-- Faz 2 step 22.4: "Tanışalım mı?" per phone, play history per pair (docs/SPEC_V3.md §22.F, §22.H–§22.K,
-- §22.M).
--
-- The window's participants are the phones in the room when it opened, and the phone whose leaving
-- opened it (its answer "Hayır"): room_members intervals that cover the window's start
-- (private.reveal_participants). Each answers for itself. Two phones on opposite sides that both say
-- "Evet" match at once: the pair gets an emoji (one color per room), its two play_history rows open,
-- and only those two phones hear it (reveal_decide returns them; the reveal function sends
-- `reveal_match` on their session: channels). Everything else waits for reveal_ends_at (rule 5,
-- per pair): no, no answer, leaving and blocking change nothing the "Evet" phone can read before then.
-- The color and the emojis stay on the server (reveal_signals); reveal/matches hands each phone its
-- own matches, and at the end the other side's phones it did not match.
--
-- Play history is per pair: every two phones on opposite sides whose room_members intervals
-- overlap for 3 minutes or more (summed) get two rows with their own encounter_id. A phone leaving a
-- two-sided room writes its pairs (available now); the window writes its participants' pairs
-- (available at reveal_ends_at); a match opens its pair's rows. private.write_pair_history replaces
-- the rooms_record_encounter trigger. With one phone a side this is today's record: the same two
-- rows, the same times.
--
-- Old apps: a two-phone window is today's: the room closes at once on two "Evet" with
-- reveal_result 'mutual' and reveal_token (the room's color and the pair's emoji); otherwise it
-- closes at reveal_ends_at with 'none'. The existing integration tests run unchanged (§22.M).
--
-- Lock order (rule 10): table_sessions → rooms → room_members (read) → reveal_decisions →
-- reveal_signals → play_history. start_reveal writes the room's new reveal_signals row and its
-- pairs' rows with the room held; nothing else can hold them.

-- reveal_signals -----------------------------------------------------------------------------------
-- The room's color (chosen when the window opens) and each matched pair's emoji (chosen at the
-- match), keyed by the pair's two table session ids in order. Server only: the rooms row is read by
-- every phone in the room.
create table public.reveal_signals (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  color text not null,
  pair_emojis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.reveal_signals enable row level security;
revoke all on table public.reveal_signals from anon, authenticated;

comment on table public.reveal_signals is
  'Server only (no policy): the reveal window''s color and matched pairs'' emojis '
  '(docs/SPEC_V3.md §22.F). created_at is the window''s start.';

-- One record per pair of accounts in a room: a pair written twice (a phone leaving, then the window)
-- keeps its first record.
create unique index play_history_room_pair_idx
  on public.play_history (room_id, user_id, other_user_id);

-- pure/reveal.ts → REVEAL_COLORS and REVEAL_EMOJIS; an integration test checks they agree.
create function private.reveal_colors()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#457B9D', '#8E44AD', '#FF6FB5',
               '#06D6A0'];
$$;

create function private.reveal_emojis()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['🦊', '🐙', '🌻', '🚀', '🍉', '🎈', '⭐', '🦋', '🍀', '🎸', '🐢', '🍒', '🌈', '🎯',
               '🍩', '🦄'];
$$;

-- A pair's key in reveal_signals.pair_emojis: its two table session ids in order.
create function private.pair_key(a uuid, b uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select least(a, b)::text || ':' || greatest(a, b)::text;
$$;

revoke all on function private.reveal_colors() from public, anon, authenticated;
revoke all on function private.reveal_emojis() from public, anon, authenticated;
revoke all on function private.pair_key(uuid, uuid) from public, anon, authenticated;

-- The window's participants (§22.F): every phone with a room_members interval covering the window's
-- start, the phone that opened it by leaving included (its row closed at that moment). One row a
-- phone, with its latest alias and choice. Empty before the window.
create function private.reveal_participants(r public.rooms)
returns table (session_id uuid, side text, alias text, profiled boolean, user_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  with opened as (
    select coalesce(
      (select s.created_at from public.reveal_signals s where s.room_id = r.id),
      r.reveal_ends_at - make_interval(secs => private.reveal_decision_seconds())
    ) as at
  )
  select distinct on (rm.session_id) rm.session_id, rm.side, rm.alias, rm.profiled, ts.user_id
  from opened, public.room_members rm
  join public.table_sessions ts on ts.id = rm.session_id
  where r.reveal_ends_at is not null
    and rm.room_id = r.id
    and rm.joined_at <= opened.at
    and (rm.left_at is null or rm.left_at >= opened.at)
  order by rm.session_id, rm.joined_at desc;
$$;

revoke all on function private.reveal_participants(public.rooms) from public, anon, authenticated;

-- Play history ------------------------------------------------------------------------------------
-- The record of each pair of phones on opposite sides (§22.F): two rows, one per account, with the
-- pair's own encounter_id, written when the pair has been in the room together for 3 minutes or more
-- (the overlap of their room_members intervals, summed). With a phone (it has just left a two-sided
-- room): its pairs with the other side's phones in the room, available now. Without: the window's
-- participants' pairs, available at reveal_ends_at. A pair already written keeps its record.
-- The two sides' first phones count from rooms.guest_joined_at, when the sides met: the guest's
-- first row is written in that same moment and the owner's first row is older, so nothing changes
-- for them, and the 3-minute rule of a two-phone room is measured from guest_joined_at, as before.
create function private.write_pair_history(target_room_id uuid, target_session_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  played text;
  available timestamptz;
  pair record;
  encounter uuid;
  written integer := 0;
  n integer;
begin
  select * into r from public.rooms where id = target_room_id;
  if r.id is null or r.guest_session_id is null then
    return 0;
  end if;
  played := coalesce(r.concept, r.game_state -> 'lastGame' ->> 'concept', 'chat');
  available := case when target_session_id is null then r.reveal_ends_at else now() end;

  for pair in
    with phones as (
      select p.session_id, p.side, p.alias, p.profiled, p.user_id
      from private.reveal_participants(r) p
      where target_session_id is null
      union all
      (
        select distinct on (rm.session_id) rm.session_id, rm.side, rm.alias, rm.profiled, ts.user_id
        from public.room_members rm
        join public.table_sessions ts on ts.id = rm.session_id
        where target_session_id is not null
          and rm.room_id = r.id
          and (rm.session_id = target_session_id or rm.left_at is null)
        order by rm.session_id, rm.joined_at desc
      )
    ),
    spans as (
      select rm.session_id,
             case when rm.joined_at = first_row.at
                  then least(rm.joined_at, coalesce(r.guest_joined_at, rm.joined_at))
                  else rm.joined_at end as since,
             coalesce(rm.left_at, now()) as until
      from public.room_members rm
      join (
        select f.side, min(f.joined_at) as at from public.room_members f
        where f.room_id = r.id
        group by f.side
      ) first_row on first_row.side = rm.side
      where rm.room_id = r.id
    ),
    pairs as (
      select o.session_id as owner_session, o.alias as owner_alias, o.profiled as owner_profiled,
             o.user_id as owner_user,
             g.session_id as guest_session, g.alias as guest_alias, g.profiled as guest_profiled,
             g.user_id as guest_user
      from phones o
      join phones g on g.side = 'guest'
      where o.side = 'owner'
        and o.user_id <> g.user_id
        and (target_session_id is null or target_session_id in (o.session_id, g.session_id))
    )
    select pairs.*, together.total, together.since
    from pairs
    cross join lateral (
      select sum(greatest(least(x.until, y.until) - greatest(x.since, y.since), interval '0'))
               as total,
             min(greatest(x.since, y.since)) filter (
               where least(x.until, y.until) > greatest(x.since, y.since)
             ) as since
      from spans x
      join spans y on y.session_id = pairs.guest_session
      where x.session_id = pairs.owner_session
    ) together
    where together.total >= interval '3 minutes'
  loop
    encounter := gen_random_uuid();
    insert into public.play_history (
      encounter_id, user_id, other_user_id, other_profiled, room_id, concept, mode, intent,
      own_alias, other_alias, other_headcount, started_at, played_at, available_at
    )
    values
      (encounter, pair.owner_user, pair.guest_user, pair.guest_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.owner_alias, pair.guest_alias, private.room_side_headcount(r, 'guest'), pair.since,
       now(), available),
      (encounter, pair.guest_user, pair.owner_user, pair.owner_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.guest_alias, pair.owner_alias, private.room_side_headcount(r, 'owner'), pair.since,
       now(), available)
    on conflict do nothing;
    get diagnostics n = row_count;
    written := written + n;
  end loop;
  return written;
end;
$$;

revoke all on function private.write_pair_history(uuid, uuid) from public, anon, authenticated;

-- The rooms trigger that wrote the two leaders' record gives way to write_pair_history.
drop trigger rooms_record_encounter on public.rooms;
drop function private.on_room_encounter();

-- The window ---------------------------------------------------------------------------------------
-- Opens it: the room ends, its color is chosen, and its participants' pairs are written.
create or replace function private.start_reveal(target_room_id uuid, decision_seconds integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  update public.rooms
  set status = 'ending', last_activity_at = now(),
      reveal_ends_at = now() + make_interval(secs => decision_seconds)
  where id = target_room_id
  returning * into r;
  insert into public.reveal_signals (room_id, color)
  select r.id, c from unnest(private.reveal_colors()) c order by random() limit 1
  on conflict (room_id) do nothing;
  perform private.write_pair_history(r.id);
  return r;
end;
$$;

-- Closes it: 'mutual' when every participant said "Evet" (the room closes at once), else 'none'.
-- reveal_token only for two participants (one pair): the room's color and the pair's emoji, as
-- before; a larger room's signal is in reveal/matches only.
drop function private.finish_reveal(uuid, jsonb);
create function private.finish_reveal(target_room_id uuid, mutual boolean)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  s public.reveal_signals;
  participants integer;
begin
  select * into r from public.rooms where id = target_room_id;
  select count(*) into participants from private.reveal_participants(r);
  select * into s from public.reveal_signals where room_id = target_room_id;
  update public.rooms
  set status = 'closed', closed_at = now(),
      reveal_result = case when mutual then 'mutual' else 'none' end,
      reveal_token = case when mutual and participants = 2 then jsonb_build_object(
        'color', s.color,
        'emoji', (select e.value from jsonb_each_text(s.pair_emojis) e limit 1)
      ) end
  where id = target_room_id and status = 'ending'
  returning * into r;
  return r;
end;
$$;

revoke all on function private.finish_reveal(uuid, boolean) from public, anon, authenticated;

-- reveal/decide: each phone answers for itself, once (§22.F). An "Evet" matches every phone on the
-- other side that has said "Evet": each new pair gets its emoji and its record opens. Returns the
-- phones to tell (`reveal_match` on their session: channel): the caller and its new partners, or
-- nothing. Every participant "Evet": the room closes at once. `token` is not used any more (the
-- color and emojis are chosen here); it stays so a call shaped like before still resolves.
drop function public.reveal_decide(uuid, uuid, boolean, jsonb);
create function public.reveal_decide(
  target_user_id uuid,
  target_room_id uuid,
  wants boolean,
  token jsonb default null
)
returns table (matched_session_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  r public.rooms;
  me record;
  partner record;
  s public.reveal_signals;
  mine boolean;
  pair text;
  emoji text;
  matched uuid[] := '{}';
begin
  select * into m from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.status <> 'ending' or now() >= r.reveal_ends_at then
    raise exception using errcode = 'P0001', message = 'reveal_closed';
  end if;
  select * into me from private.reveal_participants(r) p where p.session_id = m.session_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;

  insert into public.reveal_decisions (room_id, session_id, wants_meet)
  values (r.id, m.session_id, wants)
  on conflict (room_id, session_id) do nothing;
  select d.wants_meet into mine from public.reveal_decisions d
  where d.room_id = r.id and d.session_id = m.session_id;

  if mine then
    select * into s from public.reveal_signals where room_id = r.id for update;
    for partner in
      select p.session_id, p.user_id
      from private.reveal_participants(r) p
      join public.reveal_decisions d
        on d.room_id = r.id and d.session_id = p.session_id and d.wants_meet
      where p.side <> me.side
      order by p.session_id
    loop
      pair := private.pair_key(m.session_id, partner.session_id);
      continue when s.pair_emojis ? pair;
      select e into emoji from unnest(private.reveal_emojis()) e
      where e not in (select v.value from jsonb_each_text(s.pair_emojis) v)
      order by random()
      limit 1;
      s.pair_emojis := s.pair_emojis || jsonb_build_object(pair, emoji);
      update public.play_history
      set reveal_mutual = true, available_at = now()
      where room_id = r.id
        and ((user_id = me.user_id and other_user_id = partner.user_id)
          or (user_id = partner.user_id and other_user_id = me.user_id));
      matched := matched || partner.session_id;
    end loop;
    if cardinality(matched) > 0 then
      update public.reveal_signals set pair_emojis = s.pair_emojis where room_id = r.id;
      matched := matched || m.session_id;
    end if;
  end if;

  if not exists (
    select 1 from private.reveal_participants(r) p
    where not exists (
      select 1 from public.reveal_decisions d
      where d.room_id = r.id and d.session_id = p.session_id and d.wants_meet
    )
  ) then
    perform private.finish_reveal(r.id, true);
  end if;
  return query select unnest(matched);
end;
$$;

revoke all on function public.reveal_decide(uuid, uuid, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.reveal_decide(uuid, uuid, boolean, jsonb) to service_role;

-- reveal/finalize: as in 20261002090000_lobby_hold.sql; any participant may call it.
create or replace function public.reveal_finalize(target_user_id uuid, target_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  member boolean;
begin
  select * into r from public.rooms where id = target_room_id for update;
  select exists (
    select 1 from public.table_sessions ts
    where ts.user_id = target_user_id and ts.id in (r.owner_session_id, r.guest_session_id)
  ) or exists (
    select 1 from private.reveal_participants(r) p where p.user_id = target_user_id
  ) into member;
  if r.id is null or not member then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if r.status = 'ending' and now() >= r.reveal_ends_at then
    perform private.finish_reveal(r.id, false);
    return r.venue_id;
  end if;
  return null;
end;
$$;

-- Forgotten windows: as in 20261001090000_review_fixes.sql.
create or replace function private.close_expired_reveals()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_id uuid;
  n integer := 0;
begin
  for room_id in
    select id from public.rooms
    where status = 'ending' and reveal_ends_at <= now()
    for update skip locked
  loop
    perform private.finish_reveal(room_id, false);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- reveal/matches: the caller's own matches (§22.F), for the reveal function, which signs the photos
-- and turns the birth date into an age. One row per phone on the other side: during the window only
-- the phones it matched (with the room's color, the pair's emoji and, when that phone joined
-- profiled, its profile), from reveal_ends_at on also the others (matched false, nothing but the
-- alias); `ended` says which. Never an account id or public_id. Not a participant: not_in_room.
create function public.reveal_matches(target_user_id uuid, target_room_id uuid)
returns table (
  color text,
  session_id uuid,
  alias text,
  matched boolean,
  emoji text,
  profiled boolean,
  display_name text,
  birth_date date,
  photo_path text,
  ended boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  me record;
  s public.reveal_signals;
  ended boolean;
begin
  select * into r from public.rooms where id = target_room_id;
  if r.id is null then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  select * into me from private.reveal_participants(r) p where p.user_id = target_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  select * into s from public.reveal_signals x where x.room_id = r.id;
  ended := r.status = 'closed' or now() >= r.reveal_ends_at;
  return query
    with others as (
      select p.*, s.pair_emojis ->> private.pair_key(me.session_id, p.session_id) as pair_emoji
      from private.reveal_participants(r) p
      where p.side <> me.side
    )
    select case when exists (select 1 from others o where o.pair_emoji is not null)
                then s.color end,
           o.session_id, o.alias, o.pair_emoji is not null, o.pair_emoji,
           o.pair_emoji is not null and o.profiled,
           case when o.pair_emoji is not null and o.profiled then pr.display_name end,
           case when o.pair_emoji is not null and o.profiled then pr.birth_date end,
           case when o.pair_emoji is not null and o.profiled and pr.photo_hidden_at is null
                then pr.photo_path end,
           ended
    from others o
    join public.profiles pr on pr.id = o.user_id
    where o.pair_emoji is not null or ended
    order by o.pair_emoji is null, o.alias, o.session_id;
end;
$$;

revoke all on function public.reveal_matches(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reveal_matches(uuid, uuid) to service_role;

-- Leaving -----------------------------------------------------------------------------------------
-- A phone that leaves a two-sided room outside the window writes its pairs (available now): the
-- write_pair_history calls are new; as in 20261024090000_teams.sql otherwise. The side's last phone
-- opens the window, which writes every participant's pairs.
create or replace function private.leave_room(target_room_id uuid, target_session_id uuid, how text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  mine public.room_members;
  heir public.room_members;
  my_side text;
  leader boolean;
begin
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' then
    return r;
  end if;
  select * into mine from public.room_members
  where room_id = r.id and session_id = target_session_id and left_at is null
  for update;
  my_side := case
    when target_session_id = r.owner_session_id then 'owner'
    when target_session_id = r.guest_session_id then 'guest'
    else mine.side
  end;
  if my_side is null then
    return r;
  end if;
  leader := target_session_id in (r.owner_session_id, coalesce(r.guest_session_id, r.owner_session_id));

  if mine.id is not null then
    update public.room_members set left_at = now() where id = mine.id;
  end if;

  if r.status = 'ending' then
    if not leader or how in ('leave', 'block') then
      insert into public.reveal_decisions (room_id, session_id, wants_meet)
      values (r.id, target_session_id, false)
      on conflict (room_id, session_id) do update set wants_meet = false;
    end if;
    return r;
  end if;

  if not leader then
    update public.rooms
    set owner_phones = owner_phones - case when my_side = 'owner' then 1 else 0 end,
        guest_phones = guest_phones - case when my_side = 'guest' then 1 else 0 end
    where id = r.id
    returning * into r;
    perform private.write_pair_history(r.id, target_session_id);
    return r;
  end if;

  select * into heir from public.room_members
  where room_id = r.id and side = my_side and left_at is null and session_id <> target_session_id
  order by joined_at, id
  limit 1
  for update;
  if heir.id is not null then
    if my_side = 'owner' then
      update public.rooms
      set owner_session_id = heir.session_id, owner_alias = heir.alias,
          owner_profiled = heir.profiled, owner_phones = owner_phones - 1
      where id = r.id
      returning * into r;
    else
      update public.rooms
      set guest_session_id = heir.session_id, guest_alias = heir.alias,
          guest_profiled = heir.profiled, guest_phones = guest_phones - 1
      where id = r.id
      returning * into r;
    end if;
    -- A proposal stays the side's (22.3 keys it by side): the new leader holds it.
    update public.game_proposals set proposer_session_id = heir.session_id
    where room_id = r.id and proposer_session_id = target_session_id;
    perform private.write_pair_history(r.id, target_session_id);
    return r;
  end if;

  if r.guest_session_id is null then
    update public.rooms set status = 'closed', closed_at = now() where id = r.id
    returning * into r;
    return r;
  end if;
  r := private.start_reveal(r.id, private.reveal_decision_seconds());
  insert into public.reveal_decisions (room_id, session_id, wants_meet)
  values (r.id, target_session_id, false)
  on conflict (room_id, session_id) do update set wants_meet = false;
  return r;
end;
$$;

-- Profiles in the room ----------------------------------------------------------------------------
-- room_member_profiles: every other profiled phone in the caller's room, both sides (§22.G, rule 4):
-- its table session id and public_id, while the room lasts. In the window, its participants (a phone
-- leaving or blocking then stays listed: rule 5). The caller must be in the room with its live
-- table. room_member_profile (one row, the other leader) stays for old apps.
create function public.room_member_profiles(target_room_id uuid)
returns table (session_id uuid, public_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (rm.session_id) rm.session_id, p.public_id
  from public.rooms r
  join public.table_sessions me
    on me.user_id = (select auth.uid()) and me.status = 'active'
  join public.room_members rm on rm.room_id = r.id
  join public.table_sessions other on other.id = rm.session_id
  join public.profiles p on p.id = other.user_id
  where r.id = target_room_id
    and (me.id in (r.owner_session_id, r.guest_session_id)
         or exists (
           select 1 from public.room_members mine
           where mine.room_id = r.id and mine.session_id = me.id and mine.left_at is null
         ))
    and rm.profiled
    and other.user_id <> me.user_id
    and case
      when r.status in ('waiting', 'active') then
        rm.left_at is null and not private.is_blocked_between(me.user_id, other.user_id)
      when r.status = 'ending' then
        rm.session_id in (select x.session_id from private.reveal_participants(r) x)
      else false
    end
  order by rm.session_id;
$$;

revoke all on function public.room_member_profiles(uuid) from public, anon;
grant execute on function public.room_member_profiles(uuid) to authenticated;

-- Windows open now ---------------------------------------------------------------------------------
-- Their pairs were written by the old trigger; they get their color now.
insert into public.reveal_signals (room_id, color, created_at)
select r.id,
       (private.reveal_colors())[1 + floor(random() * cardinality(private.reveal_colors()))::integer],
       r.reveal_ends_at - make_interval(secs => private.reveal_decision_seconds())
from public.rooms r
where r.status = 'ending'
on conflict (room_id) do nothing;
