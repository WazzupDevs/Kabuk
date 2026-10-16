-- Faz 3 step 23.3, server (docs/SPEC_V3.md §23.G, §23.H, §23.J): the table's end without the
-- "Tanışalım mı?" window. A two-sided room closes at once on every road that opened the window: the
-- leader's "Odayı bitir", and a side's last phone leaving (leaving the room, blocking, leaving the
-- venue, its table session ending). Its pairs are written at the close (available at once, with
-- friend_open), and "Arkadaş ekle" works on them from the table's end and from the play history.
-- Inactivity no longer ends a two-sided room; a one-sided room closes after the given idle minutes
-- (30 from step 23.3's client PR, the cron's argument).
--
-- Staged (the owner's decision for 23.3, as for 23.2): this server change does not reach today's
-- app. private.table_end_on() is false here, and every road behaves as before: the window opens, the
-- idle rule is today's. Step 23.3's client PR, the app that shows the table's end, turns it on in a
-- migration of its own (and the cron's 30 minutes with it). What does not depend on it reaches
-- nothing yet: the friend_open column stays false until then, and friends_add_from_room and
-- pure/friends.ts → historyAction read it.
--
-- Lock order (rule 10): unchanged. The close takes the locks the window took: table_sessions →
-- rooms → room_members → play_history.

-- The switch ---------------------------------------------------------------------------------------
-- Not inlined (it has a search_path), so a test that replaces it sees the new answer at once.
create function private.table_end_on()
returns boolean
language sql
stable
set search_path = ''
as $$
  select false;
$$;

revoke all on function private.table_end_on() from public, anon, authenticated;

-- Play history ------------------------------------------------------------------------------------
-- friend_open (§23.G, §23.P): the record of a table that ended without the window. Its two phones
-- can press "Arkadaş ekle" on it (friends_add_from_room) as on a mutual "Evet" today. Old records
-- stay false: a pair that did not say "Evet" in a window gets no "Arkadaş ekle" afterwards.
alter table public.play_history add column friend_open boolean not null default false;

grant select (friend_open) on table public.play_history to authenticated;

-- write_pair_history: with table end on, the close (no phone given) writes the pairs of the phones
-- still at the table, the side's last phone that has just left included (its row closed in this
-- transaction), available at once. Every row written with table end on has friend_open. Otherwise
-- as in 20261026090000_team_reveal.sql.
create or replace function private.write_pair_history(target_room_id uuid, target_session_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  played text;
  available timestamptz;
  closing boolean := target_session_id is null and private.table_end_on();
  open_to_friends boolean := private.table_end_on();
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
  available := case when target_session_id is null and not closing then r.reveal_ends_at else now() end;

  for pair in
    with phones as (
      select p.session_id, p.side, p.alias, p.profiled, p.user_id
      from private.reveal_participants(r) p
      where target_session_id is null and not closing
      union all
      (
        select distinct on (rm.session_id) rm.session_id, rm.side, rm.alias, rm.profiled, ts.user_id
        from public.room_members rm
        join public.table_sessions ts on ts.id = rm.session_id
        where rm.room_id = r.id
          and (
            (target_session_id is not null
              and (rm.session_id = target_session_id or rm.left_at is null))
            or (closing and (rm.left_at is null or rm.left_at = now()))
          )
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
      own_alias, other_alias, other_headcount, started_at, played_at, available_at, friend_open
    )
    values
      (encounter, pair.owner_user, pair.guest_user, pair.guest_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.owner_alias, pair.guest_alias, private.room_side_headcount(r, 'guest'), pair.since,
       now(), available, open_to_friends),
      (encounter, pair.guest_user, pair.owner_user, pair.owner_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.guest_alias, pair.owner_alias, private.room_side_headcount(r, 'owner'), pair.since,
       now(), available, open_to_friends)
    on conflict do nothing;
    get diagnostics n = row_count;
    written := written + n;
  end loop;
  return written;
end;
$$;

-- The table's end -----------------------------------------------------------------------------------
-- Ends a two-sided room (§23.G). Table end on: its pairs are written and it closes at once (the
-- rooms_close_members trigger closes the members' rows). Off: the window opens, as before.
create function private.end_two_sided_room(target_room_id uuid, decision_seconds integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  if not private.table_end_on() then
    return private.start_reveal(target_room_id, decision_seconds);
  end if;
  perform private.write_pair_history(target_room_id);
  update public.rooms set status = 'closed', closed_at = now(), last_activity_at = now()
  where id = target_room_id
  returning * into r;
  return r;
end;
$$;

revoke all on function private.end_two_sided_room(uuid, integer) from public, anon, authenticated;

-- The side's last phone ends the room through end_two_sided_room; its "Hayır" only when a window
-- opened. Otherwise as in 20261026090000_team_reveal.sql.
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
  r := private.end_two_sided_room(r.id, private.reveal_decision_seconds());
  if r.status = 'ending' then
    insert into public.reveal_decisions (room_id, session_id, wants_meet)
    values (r.id, target_session_id, false)
    on conflict (room_id, session_id) do update set wants_meet = false;
  end if;
  return r;
end;
$$;

-- "Odayı bitir": a two-sided room ends through end_two_sided_room. Otherwise as in
-- 20261024090000_teams.sql.
create or replace function public.rooms_end(target_user_id uuid, decision_seconds integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = private.open_room_of_session(s.id) for update;
  if r.id is null or r.status not in ('waiting', 'active') then
    return r;
  end if;
  if s.id is distinct from r.owner_session_id and s.id is distinct from r.guest_session_id then
    raise exception using errcode = 'P0001', message = 'not_leader';
  end if;
  if r.status = 'active' and r.guest_session_id is not null then
    return private.end_two_sided_room(r.id, decision_seconds);
  end if;
  update public.rooms set status = 'closed', closed_at = now() where id = r.id returning * into r;
  return r;
end;
$$;

-- Inactivity (§23.G, §23.P-1): with table end on, a two-sided room is left alone (people at one
-- table talk with their phones away) and a one-sided room, waiting in the lobby or "Masanla oyna",
-- closes after idle_minutes; the requests waiting on it end as unavailable at their expiry (rule 5),
-- as when a waiting room closes today. Off: as in 20261010090000_room_flow.sql.
create or replace function private.close_idle_rooms(idle_minutes integer, decision_seconds integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  closed_count integer;
  n integer := 0;
begin
  update public.rooms set status = 'closed', closed_at = now()
  where id in (
    select id from public.rooms
    where status in ('waiting', 'active')
      and guest_session_id is null
      and last_activity_at <= now() - make_interval(mins => idle_minutes)
    for update skip locked
  );
  get diagnostics closed_count = row_count;
  if private.table_end_on() then
    return closed_count;
  end if;

  for rid in
    select id from public.rooms
    where status in ('waiting', 'active')
      and guest_session_id is not null
      and last_activity_at <= now() - make_interval(mins => idle_minutes)
    for update skip locked
  loop
    perform private.start_reveal(rid, decision_seconds);
    n := n + 1;
  end loop;
  return closed_count + n;
end;
$$;

-- "Arkadaş ekle" (§23.G): a friend_open record as a mutual "Evet" record, from the table's end and
-- from the play history alike (one call, one intent). Otherwise as in 20261007090000_lock_order.sql.
create or replace function public.friends_add_from_room(target_user_id uuid, target_history_id uuid)
returns table (outcome text, other_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.play_history;
begin
  select * into h from private.own_history(target_user_id, target_history_id);
  if h.id is null or not (h.reveal_mutual or h.friend_open) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.play_history set friend_action_at = coalesce(friend_action_at, now())
  where id = h.id;
  if h.other_user_id is null or private.is_blocked_between(target_user_id, h.other_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, h.other_user_id);
  if private.are_friends(target_user_id, h.other_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;

  insert into public.mutual_friend_intents (encounter_id, user_id)
  values (h.encounter_id, target_user_id)
  on conflict do nothing;

  if exists (
    select 1 from public.mutual_friend_intents
    where encounter_id = h.encounter_id and user_id = h.other_user_id
  ) and private.make_friends(target_user_id, h.other_user_id, 'room_end_mutual') then
    return query select 'friendship_created'::text, h.other_user_id;
    return;
  end if;
  return query select 'ok'::text, null::uuid;
end;
$$;
