-- Faz 3 step 23.1, server (docs/SPEC_V3.md §23.C, §23.K): the table's lobby.
--
-- - rooms.game_tag: the optional game tag of "Masanı lobiye aç" (one of CONCEPTS, or none for
--   "fark etmez"). Shown in the lobby only; it starts nothing and limits no proposal.
-- - The lobby carries no 'profilli' flag (rule 4, step 23.1): venue_lobby keeps its columns for old
--   apps and the tests that read its column list, and answers false in every row.
-- - venue_lobby_tags: the game tag by room, over venue_lobby's rows (venue_lobby_phones keeps its
--   columns as well).
-- - "Katıl" from a table whose only room is its own one-sided waiting room in the lobby. Accepting it
--   closes that room in the same transaction and moves its members to the guest side with their
--   anonymous or profiled choice (§23.P, decision 3). Requests waiting on that room stay as they are
--   and end at expires_at as unavailable, as when a waiting room closes today (rule 5).
--
-- Unchanged: the lobby's rows, "Bu masadayım" and the running rooms (§22.C); close_idle_rooms (its
-- change comes with step 23.3).

-- rooms.game_tag ------------------------------------------------------------------------------------
-- The values of pure/rooms.ts → CONCEPTS (tableLobby.test.ts checks that they agree).
alter table public.rooms
  add column game_tag text
    constraint rooms_game_tag_check
    check (game_tag in ('tabu', 'sohbet', 'sahtekar', 'harf', 'sarki', 'ibre'));

-- "Masanı lobiye aç" (today's "Oda kur"): as in 20261010090000_room_flow.sql, with the game tag.
drop function public.rooms_create(uuid, boolean, text);

create function public.rooms_create(
  target_user_id uuid,
  profiled boolean,
  new_intent text default null,
  new_game_tag text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  created public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  if private.open_room_of_session(s.id) is not null then
    raise exception using errcode = 'P0001', message = 'already_in_room';
  end if;

  insert into public.rooms
    (venue_id, owner_session_id, owner_alias, owner_headcount, concept, visibility, intent,
     owner_profiled, game_tag)
  values (s.venue_id, s.id, s.alias, s.headcount, null, 'open', new_intent, profiled, new_game_tag)
  returning * into created;
  return created;
end;
$$;

revoke all on function public.rooms_create(uuid, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.rooms_create(uuid, boolean, text, text) to service_role;

-- The caller's own one-sided waiting room in the lobby (§23.C), if that is its room: the only room
-- that does not keep a table from "Katıl" elsewhere.
create function private.own_waiting_room(target_session_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id from public.rooms r
  where r.owner_session_id = target_session_id
    and r.status = 'waiting'
    and r.visibility = 'open'
    and r.guest_session_id is null;
$$;

revoke all on function private.own_waiting_room(uuid) from public, anon, authenticated;

-- Joining (§22.C, §23.C) ------------------------------------------------------------------------------
-- As in 20261024090000_teams.sql, except: "Katıl" (target_side null) from a table whose room is its
-- own one-sided waiting room in the lobby goes through; its own room is room_not_available, and so is
-- a host room a side with members cannot join (§22.B: the host's table cannot be in a team). "Bu
-- masadayım" from a table in any room is still already_in_room.
create or replace function public.rooms_request_join(
  target_user_id uuid,
  target_room_id uuid,
  ttl_seconds integer,
  max_per_hour integer,
  profiled boolean,
  target_side text default null
)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
  owner public.table_sessions;
  guest public.table_sessions;
  member boolean := target_side is not null;
  joining text := coalesce(target_side, 'guest');
  waiting uuid;
  waiting_phones smallint;
  created public.join_requests;
begin
  s := private.active_session_for_update(target_user_id);
  waiting := private.own_waiting_room(s.id);
  if private.open_room_of_session(s.id) is not null and (member or waiting is null) then
    raise exception using errcode = 'P0001', message = 'already_in_room';
  end if;
  select owner_phones into waiting_phones from public.rooms where id = waiting;

  select * into r from public.rooms where id = target_room_id for update;
  select * into owner from public.table_sessions where id = r.owner_session_id;
  select * into guest from public.table_sessions where id = r.guest_session_id;

  if r.id is null
    or r.visibility <> 'open'
    or r.venue_id <> s.venue_id
    or r.owner_session_id = s.id
    or owner.status <> 'active'
    or owner.expires_at <= now()
    or private.room_blocked_for(r.id, s.user_id)
    -- An 'unavailable' answer to "Katıl" from this room is final for this table (MVP_SPEC §4.4).
    or exists (
      select 1 from public.join_requests
      where room_id = r.id and requester_session_id = s.id and not as_member
        and status <> 'accepted' and expires_at <= now()
    )
    or (not member and (
      r.status <> 'waiting'
      or r.guest_session_id is not null
      -- §22.B: an owner's side with members only for a table that can be in a team.
      or (r.owner_phones > 1 and not s.team_capable)
      -- ... and a side with members only to a table that can be in a team (§23.C).
      or (coalesce(waiting_phones, 1) > 1 and not owner.team_capable)
    ))
    or (member and (
      r.status not in ('waiting', 'active')
      or not s.team_capable
      or not owner.team_capable
      or (r.guest_session_id is not null and not coalesce(guest.team_capable, false))
      or (joining = 'guest' and r.guest_session_id is null)
      or (case when joining = 'owner' then r.owner_phones else r.guest_phones end)
           >= private.max_side_phones()
    ))
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;

  if private.was_on_side(r.id, s.user_id, case when joining = 'owner' then 'guest' else 'owner' end) then
    raise exception using errcode = 'P0001', message = 'wrong_side';
  end if;

  if r.spot_id is distinct from s.spot_id then
    raise exception using errcode = 'P0001', message = 'different_spot';
  end if;

  if private.has_open_request(s.id) then
    raise exception using errcode = 'P0001', message = 'request_pending';
  end if;

  if (
    select count(*) from public.join_requests
    where requester_session_id = s.id and created_at > now() - interval '1 hour'
  ) >= max_per_hour then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.join_requests
    (room_id, requester_session_id, requester_alias, requester_headcount, requester_profiled,
     side, as_member, expires_at)
  values (r.id, s.id, s.alias, s.headcount, profiled, joining, member,
          now() + make_interval(secs => ttl_seconds))
  returning * into created;
  return created;
end;
$$;

-- The answer. "Bu masadayım": as in 20261024090000_teams.sql. "Katıl": as there, and when the
-- requester's room is its own one-sided waiting room in the lobby (§23.C), the accept closes that
-- room and its members join the guest side behind their leader, each with its own alias and choice.
-- Locks (§23.K): the requester's session, then the two rooms in id order, the waiting room's phone
-- rows, then the request. A requester whose room is anything else by now (it took a guest, or the
-- table is in another room) is room_not_available and the request stays pending, so the requester
-- sees it as unavailable at expires_at (rule 5).
create or replace function public.rooms_respond(
  target_user_id uuid,
  target_request_id uuid,
  accept boolean
)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  jr public.join_requests;
  r public.rooms;
  w public.rooms;
  owner public.table_sessions;
  guest public.table_sessions;
  leader public.table_sessions;
  requester public.table_sessions;
  leader_session uuid;
  waiting uuid;
  mover record;
  moved smallint := 0;
begin
  select * into jr from public.join_requests where id = target_request_id;
  if jr.id is null then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;

  if jr.as_member then
    -- §22.K: the request read unlocked; the requester's and the leader's sessions in id order, the
    -- room, the side's rows, then the request again under the lock.
    select case when jr.side = 'guest' then guest_session_id else owner_session_id end
    into leader_session
    from public.rooms where id = jr.room_id;
    perform 1 from public.table_sessions
    where id in (jr.requester_session_id, leader_session)
    order by id
    for no key update;
    select * into r from public.rooms where id = jr.room_id for update;
    perform 1 from public.room_members
    where room_id = r.id and side = jr.side and left_at is null
    for update;
    -- Before the request (rule 10); rolled back with everything else if the accept is refused.
    if accept then
      perform private.close_stale_member_rows(jr.requester_session_id);
    end if;
    select * into jr from public.join_requests where id = target_request_id for update;
    select * into leader from public.table_sessions
    where id = case when jr.side = 'guest' then r.guest_session_id else r.owner_session_id end;

    if jr.id is null or leader.user_id is distinct from target_user_id then
      raise exception using errcode = 'P0001', message = 'request_not_found';
    end if;
    if jr.status <> 'pending' or jr.expires_at <= now() then
      raise exception using errcode = 'P0001', message = 'request_expired';
    end if;
    if not accept then
      update public.join_requests set status = 'declined', responded_at = now()
      where id = jr.id returning * into jr;
      return jr;
    end if;

    select * into requester from public.table_sessions where id = jr.requester_session_id;
    select * into owner from public.table_sessions where id = r.owner_session_id;
    select * into guest from public.table_sessions where id = r.guest_session_id;
    if r.status not in ('waiting', 'active')
      or r.visibility <> 'open'
      or requester.status <> 'active' or requester.expires_at <= now()
      or requester.venue_id <> r.venue_id
      or not requester.team_capable
      or not owner.team_capable
      or (r.guest_session_id is not null and not coalesce(guest.team_capable, false))
      or (jr.side = 'guest' and r.guest_session_id is null)
      or (case when jr.side = 'owner' then r.owner_phones else r.guest_phones end)
           >= private.max_side_phones()
      or private.open_room_of_session(requester.id) is not null
      or private.room_blocked_for(r.id, requester.user_id)
      or private.was_on_side(r.id, requester.user_id,
                             case when jr.side = 'owner' then 'guest' else 'owner' end)
    then
      raise exception using errcode = 'P0001', message = 'room_not_available';
    end if;

    insert into public.room_members (room_id, session_id, side, alias, profiled)
    values (r.id, requester.id, jr.side, requester.alias, jr.requester_profiled);
    update public.rooms
    set owner_phones = owner_phones + case when jr.side = 'owner' then 1 else 0 end,
        guest_phones = guest_phones + case when jr.side = 'guest' then 1 else 0 end,
        last_activity_at = now()
    where id = r.id;
    update public.join_requests set status = 'accepted', responded_at = now()
    where id = jr.id returning * into jr;
    return jr;
  end if;

  select * into requester from public.table_sessions
  where id = jr.requester_session_id
  for no key update;
  -- The requester's waiting room read unlocked; the two rooms then in id order (§23.K), and the
  -- waiting room read again under the lock.
  if accept then
    waiting := private.own_waiting_room(requester.id);
  end if;
  perform 1 from public.rooms
  where id in (jr.room_id, coalesce(waiting, jr.room_id))
  order by id
  for update;
  select * into r from public.rooms where id = jr.room_id;
  if waiting is not null then
    select * into w from public.rooms where id = waiting;
    perform 1 from public.room_members
    where room_id = w.id and left_at is null
    for update;
  end if;
  if accept then
    perform private.close_stale_member_rows(jr.requester_session_id);
  end if;
  select * into jr from public.join_requests where id = target_request_id for update;
  select * into owner from public.table_sessions where id = r.owner_session_id;

  if jr.id is null or owner.user_id is distinct from target_user_id then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;
  if jr.status <> 'pending' or jr.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;

  if not accept then
    update public.join_requests set status = 'declined', responded_at = now()
    where id = jr.id returning * into jr;
    return jr;
  end if;

  -- The requester's table is in a room other than its own waiting room by now (§23.C). First, so
  -- that of two tables accepting each other at once the second hears room_not_available (§23.K),
  -- although the first one's accept also closed the second one's own room.
  if private.open_room_of_session(requester.id) is distinct from w.id
    or (w.id is not null and (
      w.status <> 'waiting' or w.visibility <> 'open' or w.guest_session_id is not null
      or w.owner_session_id <> requester.id
    ))
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;
  if r.status <> 'waiting'
    or r.guest_session_id is not null
    or owner.status <> 'active' or owner.expires_at <= now()
    or requester.status <> 'active' or requester.expires_at <= now()
    or requester.venue_id <> r.venue_id
    or private.is_blocked_between(owner.user_id, requester.user_id)
  then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;
  -- §22.B: members came to the owner's side while the request waited; or the requester's side has
  -- members and the host's table cannot be in a team, or one of them cannot be in this room.
  if (r.owner_phones > 1 and not requester.team_capable)
    or private.room_blocked_for(r.id, requester.user_id)
    or private.was_on_side(r.id, requester.user_id, 'owner')
    or (w.id is not null and w.owner_phones > 1 and not owner.team_capable)
    or exists (
      select 1
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = w.id and rm.left_at is null and rm.session_id <> requester.id
        and (private.room_blocked_for(r.id, ts.user_id)
             or private.was_on_side(r.id, ts.user_id, 'owner'))
    )
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;

  -- The waiting room's members move to the guest side (§23.P, decision 3), then the room closes:
  -- no window and no play history, it had one side.
  if w.id is not null then
    for mover in
      select rm.id, rm.session_id, rm.alias, rm.profiled
      from public.room_members rm
      where rm.room_id = w.id and rm.left_at is null and rm.session_id <> requester.id
      order by rm.joined_at, rm.id
    loop
      update public.room_members set left_at = now() where id = mover.id;
      insert into public.room_members (room_id, session_id, side, alias, profiled)
      values (r.id, mover.session_id, 'guest', mover.alias, mover.profiled);
      moved := moved + 1;
    end loop;
    update public.rooms set status = 'closed', closed_at = now() where id = w.id;
  end if;

  update public.rooms
  set guest_session_id = requester.id, guest_alias = requester.alias,
      guest_headcount = requester.headcount, guest_profiled = jr.requester_profiled,
      guest_phones = 1 + moved,
      status = 'active', last_activity_at = now(),
      concept = null, game_state = private.between_games(game_state, null)
  where id = r.id;
  insert into public.room_members (room_id, session_id, side, alias, profiled)
  values (r.id, requester.id, 'guest', requester.alias, jr.requester_profiled);

  update public.join_requests set status = 'declined', responded_at = now()
  where room_id = r.id and status = 'pending' and id <> jr.id and not as_member;

  update public.join_requests set status = 'accepted', responded_at = now()
  where id = jr.id returning * into jr;
  return jr;
end;
$$;

-- Client reads (security definer, read only) -------------------------------------------------------------
-- The open rooms: as in 20261024090000_teams.sql, the same columns, and profiled false in every row
-- (rule 4, step 23.1: the flag would hint at a gender with step 23.2).
create or replace function public.venue_lobby(target_venue_id uuid)
returns table (
  room_id uuid,
  alias text,
  headcount smallint,
  intent text,
  waiting_since timestamptz,
  profiled boolean,
  spot_id uuid,
  spot_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select ts.id as session_id, ts.user_id, ts.team_capable
    from public.table_sessions ts
    where ts.user_id = (select auth.uid())
      and ts.venue_id = target_venue_id
      and ts.status = 'active'
      and ts.expires_at > now()
  )
  select r.id, r.owner_alias, private.side_headcount(r.owner_headcount, r.owner_phones), r.intent,
         greatest(r.waiting_since, private.room_listed_from(r.id)),
         false,
         r.spot_id,
         sp.name
  from public.rooms r
  join public.table_sessions owner on owner.id = r.owner_session_id
  left join public.venue_spots sp on sp.id = r.spot_id
  cross join me
  where r.venue_id = target_venue_id
    and r.status = 'waiting'
    and r.visibility = 'open'
    and r.guest_session_id is null
    and r.owner_session_id <> me.session_id
    and not exists (
      select 1 from public.room_members rm
      where rm.room_id = r.id and rm.session_id = me.session_id and rm.left_at is null
    )
    and owner.status = 'active'
    and coalesce(private.room_listed_from(r.id), '-infinity') <= now()
    and owner.expires_at > now()
    and not private.room_blocked_for(r.id, me.user_id)
    and (r.owner_phones = 1 or me.team_capable)
    and not exists (
      select 1 from public.join_requests jr
      where jr.room_id = r.id
        and jr.requester_session_id = me.session_id
        and not jr.as_member
        and jr.status <> 'accepted'
        and jr.expires_at <= now()
    )
  order by 5;
$$;

-- The open rooms' game tags, by room (§23.C): exactly venue_lobby's rooms; null is "fark etmez".
create function public.venue_lobby_tags(target_venue_id uuid)
returns table (room_id uuid, game_tag text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.room_id, r.game_tag
  from public.venue_lobby(target_venue_id) l
  join public.rooms r on r.id = l.room_id;
$$;

revoke all on function public.venue_lobby_tags(uuid) from public, anon;
grant execute on function public.venue_lobby_tags(uuid) to authenticated;
