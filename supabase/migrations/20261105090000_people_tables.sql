-- Faz 4 step 4.5, server part 2 (docs/SPEC_V4.md §4.E, §4.H, §4.I, §4.K; the plan:
-- docs/decisions/4.5-masa-modeli.md): the table of people, at once (§4.N; the owner's choice of
-- 20 October). Today's app cannot open or play a table after this; the app's OTA (4.5b) follows.
--
-- - Every open table closes now (§4.H: no pilot).
-- - Check-in is being at the venue: no headcount, no alias (table_sessions.alias stays empty and
--   its unique index goes; the columns go in 4.8).
-- - A table is the rooms row of the person who opened it, and its people are room_members rows
--   without a side: the identity each person sat down with (§4.D, K-10), at most 12 phones.
-- - "Katıl" moves the requester's whole table into the owner's in one transaction and closes it;
--   "Bu masadayım" brings a person without a table (§4.E).
-- - Leaving hands the table to its earliest person (K-13); the owner's "Masayı bitir" closes it
--   for everyone; a one-person table closes after 30 quiet minutes, a larger one never.
-- - The play history is written per pair of people together for 3 minutes (K-66).
-- - A person reads the table's chat from the moment it sat down.
-- - Reads: venue_tables (the lobby and the running tables, §4.E) and table_people.
-- Today's games are of the side model and do not run at the new table (§4.E); their Edge actions
-- answer update_required until each comes back in 4.6. Their SQL stays until 4.8.

-- 1. Every open table closes ---------------------------------------------------------------------
update public.join_requests set status = 'expired' where status = 'pending';
delete from public.game_proposals;
update public.rooms set status = 'closed', closed_at = now() where status <> 'closed';

-- 2. Check-in without a table --------------------------------------------------------------------
alter table public.table_sessions
  alter column alias drop not null,
  alter column headcount drop not null;
drop index public.table_sessions_unique_active_alias;

drop function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean, uuid);
drop function public.reroll_table_alias(uuid, text, integer);

-- The same check-in sent again (its key, venue and spot) returns the check-in it made. Otherwise
-- the person leaves the table it is at (K-13) and the old check-in ends.
create function public.start_table_session(
  target_user_id uuid,
  target_venue_id uuid,
  consent_version text,
  accuracy_m real default null,
  new_spot_id uuid default null,
  new_checkin_key uuid default null
)
returns public.table_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.table_sessions;
  old_session_id uuid;
begin
  perform private.check_spot(target_venue_id, new_spot_id);

  update public.profiles
  set location_consent_at = now(), location_consent_version = consent_version
  where id = target_user_id
    and location_consent_version is distinct from consent_version;

  if new_checkin_key is not null then
    select * into created from public.table_sessions
    where user_id = target_user_id
      and status = 'active'
      and checkin_key = new_checkin_key
      and venue_id = target_venue_id
      and spot_id is not distinct from new_spot_id
      and expires_at > now()
    for no key update;
    if found then
      return created;
    end if;
  end if;

  for old_session_id in
    select id from public.table_sessions
    where user_id = target_user_id and status = 'active'
    for no key update
  loop
    perform private.release_rooms_of_session(old_session_id);
    update public.table_sessions set status = 'ended', ended_at = now() where id = old_session_id;
  end loop;

  insert into public.table_sessions
    (user_id, venue_id, gps_accuracy_m, spot_id, checkin_key, expires_at, identity_mode)
  values
    (target_user_id, target_venue_id, accuracy_m, new_spot_id, new_checkin_key,
     now() + interval '4 hours',
     case
       when (select default_participation from public.profiles where id = target_user_id)
           = 'profile'
         and public.has_profile_photo(target_user_id) then 'profiled'
       else 'anonymous'
     end)
  returning * into created;

  return created;
end;
$$;

revoke all on function public.start_table_session(uuid, uuid, text, real, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.start_table_session(uuid, uuid, text, real, uuid, uuid)
  to service_role;

-- checkin/set-identity as in step 4.4, refused while the check-in has an open request
-- (request_pending): the owner sees the identity the request came with (rooms/request-profile)
-- and would link it to the other one the person sits with (rule 4; WazzupDevs/Kabuk#183). A declined
-- request is open until it expires, as the requester sees it (rule 5). Only the check-in is locked
-- (§4.K).
create or replace function public.set_checkin_identity(target_user_id uuid, new_mode text)
returns public.table_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
begin
  if new_mode not in ('anonymous', 'profiled') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into ts from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;
  if ts.identity_mode = new_mode then
    return ts;
  end if;
  if ts.identity_switches >= 1 then
    raise exception using errcode = 'P0001', message = 'identity_switch_used';
  end if;
  if private.has_open_request(ts.id) then
    raise exception using errcode = 'P0001', message = 'request_pending';
  end if;
  if new_mode = 'profiled' and not public.has_profile_photo(target_user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;
  update public.table_sessions
  set identity_mode = new_mode,
      identity_switches = identity_switches + 1,
      venue_chat_profiled = new_mode = 'profiled'
  where id = ts.id
  returning * into ts;
  return ts;
end;
$$;

-- 3. The table and its people --------------------------------------------------------------------
-- pure/tables.ts → MAX_TABLE_PHONES; tableModel.test.ts checks both give the same number.
create function private.max_table_phones()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 12;
$$;

alter table public.rooms
  add column phones smallint not null default 1 check (phones between 0 and 12),
  alter column owner_alias drop not null,
  alter column owner_headcount drop not null;

alter table public.room_members alter column side drop not null;

alter table public.join_requests
  alter column side drop not null,
  alter column side drop default,
  alter column requester_headcount drop not null,
  -- The table a "Katıl" moves (its owner asked); null for a person on its own.
  add column requester_room_id uuid references public.rooms (id) on delete set null,
  add column requester_phones smallint not null default 1
    check (requester_phones between 1 and 12);

-- The table's name is its owner_alias until 4.8 (§4.H, "4.5'te eski takma ad kolonları").
create or replace function private.room_name_and_icon()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_venue_names(new.venue_id);
  if new.name is null then
    new.name := private.free_table_name(new.venue_id);
  end if;
  new.owner_alias := coalesce(new.owner_alias, new.name);
  if new.icon is null then
    new.icon := private.free_table_icon(new.venue_id);
  else
    perform private.check_table_icon(new.venue_id, new.icon, null);
  end if;
  return new;
end;
$$;

-- rooms_create seats its owner itself, with the owner's identity (below).
drop trigger rooms_owner_member on public.rooms;
drop function private.on_room_created();

-- The name and the identity a person sits down with (§4.D, K-3, K-4, K-10; rules 4 and 12): the
-- check-in's identity; a man and "Belirtmek istemiyorum" are always profiled at a table; a profiled
-- seat needs a visible photo; an account without a gender answers the one-time question first.
-- Anonymous is the capsule nick, profiled the display name.
create function private.table_seat(target_session_id uuid)
returns table (alias text, profiled boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  p public.profiles;
  seated boolean;
begin
  select * into s from public.table_sessions where id = target_session_id;
  select * into p from public.profiles where id = s.user_id;
  if p.gender is null then
    raise exception using errcode = 'P0001', message = 'gender_required';
  end if;
  seated := s.identity_mode = 'profiled' or p.gender <> 'female';
  if seated and not public.has_profile_photo(s.user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;
  return query
    select case when seated then p.display_name else p.capsule_nick end, seated;
end;
$$;

-- The table a check-in is at (rule 10: read unlocked; callers lock and check again).
create or replace function private.open_room_of_session(target_session_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
  from public.room_members rm
  join public.rooms r on r.id = rm.room_id
  where rm.session_id = target_session_id and rm.left_at is null and r.status <> 'closed'
  limit 1;
$$;

create or replace function private.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and ts.user_id = (select auth.uid()) and ts.status = 'active'
  );
$$;

-- The table row (the "rooms: members read" policy): the people at the table now, and those who were
-- there when it closed (they left with the close), so their screen learns it closed (Postgres
-- Changes, the status check). Channels stay is_room_member's: present people only (rule 9).
create or replace function private.can_read_room(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.room_members rm on rm.room_id = r.id
    join public.table_sessions ts on ts.id = rm.session_id
    where r.id = target_room_id and ts.user_id = (select auth.uid())
      and (rm.left_at is null or (r.status = 'closed' and rm.left_at >= r.closed_at))
  );
$$;

revoke all on function private.can_read_room(uuid) from public, anon;
grant execute on function private.can_read_room(uuid) to authenticated;

drop policy "rooms: members read" on public.rooms;
create policy "rooms: members read"
  on public.rooms for select
  to authenticated
  using (private.can_read_room(id));

create or replace function private.room_blocked_for(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and private.is_blocked_between(ts.user_id, target_user_id)
  );
$$;

-- The owner answers every request to the table (the policy keeps its arguments until 4.8).
create or replace function private.is_request_approver(
  target_room_id uuid,
  target_side text,
  member boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.table_sessions ts on ts.id = r.owner_session_id
    where r.id = target_room_id and ts.user_id = (select auth.uid())
  );
$$;

create or replace function public.rooms_request_profile_owner(
  target_user_id uuid,
  target_request_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select requester.user_id
  from public.join_requests jr
  join public.rooms r on r.id = jr.room_id
  join public.table_sessions requester on requester.id = jr.requester_session_id
  join public.table_sessions owner on owner.id = r.owner_session_id
  where jr.id = target_request_id
    and jr.status = 'pending'
    and jr.expires_at > now()
    and jr.requester_profiled
    and r.status <> 'closed'
    and owner.user_id = target_user_id
    and owner.status = 'active';
$$;

-- rooms/create (§4.E): open in the lobby or not; the owner sits down with its identity.
drop function public.rooms_create(uuid, boolean, text, text, text);
drop function public.rooms_create_solo(uuid);

create function public.rooms_create(
  target_user_id uuid,
  in_lobby boolean default true,
  new_intent text default null,
  new_game_tag text default null,
  new_icon text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  seat record;
  created public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  if private.open_room_of_session(s.id) is not null then
    raise exception using errcode = 'P0001', message = 'already_in_table';
  end if;
  select * into seat from private.table_seat(s.id);

  insert into public.rooms
    (venue_id, owner_session_id, visibility, status, intent, owner_profiled, game_tag, icon, phones)
  values (s.venue_id, s.id, case when in_lobby then 'open' else 'private' end, 'active', new_intent,
          seat.profiled, new_game_tag, new_icon, 1)
  returning * into created;

  perform private.close_stale_member_rows(s.id);
  insert into public.room_members (room_id, session_id, alias, profiled, joined_at)
  values (created.id, s.id, seat.alias, seat.profiled, created.created_at);
  return created;
end;
$$;

-- rooms/set-visibility (§4.E): only the owner. Requests of the other road end as a decline does
-- (rule 5): "Katıl" goes with the lobby, "Bu masadayım" with the running tables.
create function public.rooms_set_visibility(
  target_user_id uuid,
  target_room_id uuid,
  in_lobby boolean
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  if (r.visibility = 'open') = in_lobby then
    return r;
  end if;
  update public.rooms
  set visibility = case when in_lobby then 'open' else 'private' end,
      waiting_since = case when in_lobby then now() else waiting_since end
  where id = r.id
  returning * into r;
  update public.join_requests set status = 'declined', responded_at = now()
  where room_id = r.id and status = 'pending' and as_member = in_lobby;
  return r;
end;
$$;

-- rooms/request-join (§4.E): "Katıl" to a table in the lobby, from a table's owner (the whole table
-- moves) or a person on its own; "Bu masadayım" (as_member) to a running table, from a person on
-- its own. At most 12 phones together (table_full), checked again at the accept.
drop function public.rooms_request_join(uuid, uuid, integer, integer, boolean, text);

create function public.rooms_request_join(
  target_user_id uuid,
  target_room_id uuid,
  ttl_seconds integer,
  max_per_hour integer,
  as_member boolean default false
)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  mine public.rooms;
  r public.rooms;
  owner public.table_sessions;
  seat record;
  asked_alias text;
  asked_profiled boolean;
  asked_phones smallint := 1;
  created public.join_requests;
begin
  s := private.active_session_for_update(target_user_id);
  select * into mine from public.rooms where id = private.open_room_of_session(s.id);
  if mine.id is not null then
    if as_member then
      raise exception using errcode = 'P0001', message = 'already_in_table';
    end if;
    if mine.owner_session_id <> s.id then
      raise exception using errcode = 'P0001', message = 'not_owner';
    end if;
    select rm.alias, rm.profiled into seat from public.room_members rm
    where rm.room_id = mine.id and rm.session_id = s.id and rm.left_at is null;
    asked_alias := coalesce(mine.name, seat.alias);
    asked_profiled := seat.profiled;
    asked_phones := mine.phones;
  else
    select * into seat from private.table_seat(s.id);
    asked_alias := seat.alias;
    asked_profiled := seat.profiled;
  end if;

  -- The two tables in id order, as rooms_respond takes them (WazzupDevs/Kabuk#183): the target
  -- for no key update, the requester's own with the key share lock the request's
  -- requester_room_id takes anyway. An owner asking another table while it accepts that table's
  -- request into its own then waits instead of deadlocking, and two tables asking each other at
  -- once still do not wait on each other (no key update and key share do not conflict).
  if mine.id < target_room_id then
    perform 1 from public.rooms where id = mine.id for key share;
  end if;
  select * into r from public.rooms where id = target_room_id for no key update;
  if mine.id > target_room_id then
    perform 1 from public.rooms where id = mine.id for key share;
  end if;
  select * into owner from public.table_sessions where id = r.owner_session_id;
  if r.id is null
    or r.status = 'closed'
    or r.venue_id <> s.venue_id
    or r.id = mine.id
    or owner.status <> 'active'
    or owner.expires_at <= now()
    or r.visibility <> (case when as_member then 'private' else 'open' end)
    or private.room_blocked_for(r.id, s.user_id)
    -- An 'unavailable' answer to "Katıl" from this table is final for this check-in (MVP_SPEC
    -- §4.4).
    or (not as_member and exists (
      select 1 from public.join_requests
      where room_id = r.id and requester_session_id = s.id and not join_requests.as_member
        and status <> 'accepted' and expires_at <= now()
    ))
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
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
  if r.phones + asked_phones > private.max_table_phones() then
    raise exception using errcode = 'P0001', message = 'table_full';
  end if;

  insert into public.join_requests
    (room_id, requester_session_id, requester_alias, requester_profiled, as_member,
     requester_room_id, requester_phones, expires_at)
  values (r.id, s.id, asked_alias, asked_profiled, as_member, mine.id, asked_phones,
          now() + make_interval(secs => ttl_seconds))
  returning * into created;
  return created;
end;
$$;

-- rooms/respond (§4.E, §4.K): the owner. Lock order: the requester's check-in → the two tables in
-- id order → their people → the request; read unlocked first, checked again under the locks. Of
-- two tables accepting each other at once, one goes through and the other is room_not_available
-- (its own table closed). The moved people keep their identities and the moved table closes
-- silently; requests to it end as a decline does (rule 5).
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
  requester public.table_sessions;
  owner public.table_sessions;
  current_room uuid;
  coming smallint;
  mover record;
  locked uuid[];
  seat record;
begin
  select * into jr from public.join_requests where id = target_request_id;
  if jr.id is null then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;

  -- The requester's check-in, and for a "Katıl" with a table the check-ins of its people too, all
  -- in id order (read unlocked first, checked again below): a moved person checking in again,
  -- leaving or deleting the account at the same moment waits, and no seat is left behind.
  if accept then
    current_room := private.open_room_of_session(jr.requester_session_id);
  end if;
  select coalesce(array_agg(id order by id), '{}') into locked
  from (
    select ts.id from public.table_sessions ts
    where ts.id = jr.requester_session_id
       or ts.id in (
         select rm.session_id from public.room_members rm
         where rm.room_id = current_room and rm.left_at is null
       )
    order by ts.id
    for no key update
  ) held;
  select * into requester from public.table_sessions where id = jr.requester_session_id;
  perform 1 from public.rooms
  where id in (jr.room_id, coalesce(current_room, jr.room_id))
  order by id
  for update;
  select * into r from public.rooms where id = jr.room_id;
  if current_room is not null then
    select * into w from public.rooms where id = current_room;
  end if;
  perform 1 from public.room_members
  where room_id in (r.id, coalesce(w.id, r.id)) and left_at is null
  order by id
  for update;
  if accept then
    perform private.close_stale_member_rows(requester.id);
  end if;
  select * into jr from public.join_requests where id = target_request_id for update;
  select * into owner from public.table_sessions where id = r.owner_session_id;

  if jr.id is null or owner.user_id is distinct from target_user_id then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;
  -- The owner's table is gone (moved to another by its own "Katıl", or closed): its requests went
  -- with it.
  if r.status = 'closed' then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;
  if jr.status <> 'pending' or jr.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;
  if not accept then
    update public.join_requests set status = 'declined', responded_at = now()
    where id = jr.id returning * into jr;
    return jr;
  end if;

  if owner.status <> 'active' or owner.expires_at <= now()
    -- The requester is at the table it asked with, and still owns it (or at none).
    or private.open_room_of_session(requester.id) is distinct from current_room
    or current_room is distinct from jr.requester_room_id
    or (w.id is not null and (w.status = 'closed' or w.owner_session_id <> requester.id))
    or r.visibility <> (case when jr.as_member then 'private' else 'open' end)
    -- Somebody sat down at the requester's table after the check-ins were locked.
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = w.id and rm.left_at is null and not (rm.session_id = any (locked))
    )
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;
  if requester.status <> 'active' or requester.expires_at <= now()
    or requester.venue_id <> r.venue_id
  then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;
  -- Nobody coming has a block with anybody at the table.
  if exists (
    select 1
    from public.room_members here
    join public.table_sessions here_s on here_s.id = here.session_id
    cross join (
      select ts.user_id from public.table_sessions ts where ts.id = requester.id
      union
      select ts.user_id
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = w.id and rm.left_at is null
    ) coming_user
    where here.room_id = r.id and here.left_at is null
      and private.is_blocked_between(here_s.user_id, coming_user.user_id)
  ) then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;
  -- The people who come: a moved table's people whose check-in is still on (one past its time
  -- leaves with the closing table), or the requester alone.
  coming := case
    when w.id is null then 1
    else (
      select count(*) from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = w.id and rm.left_at is null
        and ts.status = 'active' and ts.expires_at > now()
    )
  end;
  if r.phones + coming > private.max_table_phones() then
    raise exception using errcode = 'P0001', message = 'table_full';
  end if;

  if w.id is not null then
    -- The moved table's own requests end first (rule 10: join_requests before the rows of the room
    -- its people leave).
    update public.join_requests set status = 'declined', responded_at = now()
    where room_id = w.id and status = 'pending';
    for mover in
      select rm.id, rm.session_id, rm.alias, rm.profiled, rm.look,
             ts.status = 'active' and ts.expires_at > now() as still_on
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = w.id and rm.left_at is null
      order by rm.joined_at, rm.id
    loop
      update public.room_members set left_at = now() where id = mover.id;
      if mover.still_on then
        -- The seat keeps its identity, look included (K-10).
        insert into public.room_members (room_id, session_id, alias, profiled, look)
        values (r.id, mover.session_id, mover.alias, mover.profiled, mover.look);
      end if;
    end loop;
    update public.rooms set status = 'closed', closed_at = now(), phones = 0 where id = w.id;
  else
    -- A person alone sits with the check-in's identity at the accept, not at the request: one who
    -- switched to anonymous meanwhile sits anonymous (rule 4). One who cannot sit any more (a
    -- profiled identity whose photo went) finds the request gone.
    begin
      select * into seat from private.table_seat(requester.id);
    exception when sqlstate 'P0001' then
      raise exception using errcode = 'P0001', message = 'request_expired';
    end;
    insert into public.room_members (room_id, session_id, alias, profiled)
    values (r.id, requester.id, seat.alias, seat.profiled);
  end if;

  update public.rooms set phones = phones + coming, last_activity_at = now() where id = r.id;
  update public.join_requests set status = 'accepted', responded_at = now()
  where id = jr.id returning * into jr;
  return jr;
end;
$$;

-- The pairs of people together at the table for 3 minutes, each pair once per table (K-66): the
-- leaver's pairs with those still there, or (no session given) every pair still there as the
-- table closes. Zaten arkadaş olan çift de kayıt alır (bugünkü gibi).
create or replace function private.write_pair_history(
  target_room_id uuid,
  target_session_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  played text;
  pair record;
  encounter uuid;
  written integer := 0;
  n integer;
begin
  select * into r from public.rooms where id = target_room_id;
  if r.id is null then
    return 0;
  end if;
  played := coalesce(r.concept, r.game_state -> 'lastGame' ->> 'concept', 'chat');

  for pair in
    with people as (
      select distinct on (rm.session_id) rm.session_id, rm.alias, rm.profiled, ts.user_id
      from public.room_members rm
      join public.table_sessions ts on ts.id = rm.session_id
      where rm.room_id = r.id
        and (
          (target_session_id is not null
            and (rm.session_id = target_session_id or rm.left_at is null))
          or (target_session_id is null and (rm.left_at is null or rm.left_at = now()))
        )
      order by rm.session_id, rm.joined_at desc
    ),
    spans as (
      select rm.session_id, rm.joined_at as since, coalesce(rm.left_at, now()) as until
      from public.room_members rm
      where rm.room_id = r.id
    ),
    pairs as (
      select a.session_id as a_session, a.alias as a_alias, a.profiled as a_profiled,
             a.user_id as a_user,
             b.session_id as b_session, b.alias as b_alias, b.profiled as b_profiled,
             b.user_id as b_user
      from people a
      join people b on b.session_id > a.session_id and b.user_id <> a.user_id
      where target_session_id is null or target_session_id in (a.session_id, b.session_id)
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
      join spans y on y.session_id = pairs.b_session
      where x.session_id = pairs.a_session
    ) together
    where together.total >= interval '3 minutes'
  loop
    encounter := gen_random_uuid();
    insert into public.play_history (
      encounter_id, user_id, other_user_id, other_profiled, room_id, concept, mode, intent,
      own_alias, other_alias, other_headcount, started_at, played_at, available_at, friend_open
    )
    values
      (encounter, pair.a_user, pair.b_user, pair.b_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.a_alias, pair.b_alias, 1, pair.since, now(), now(), true),
      (encounter, pair.b_user, pair.a_user, pair.a_profiled, r.id, played,
       case when played = 'tabu' then 'voice' else 'text' end, r.intent,
       pair.b_alias, pair.a_alias, 1, pair.since, now(), now(), true)
    on conflict do nothing;
    get diagnostics n = row_count;
    written := written + n;
  end loop;
  return written;
end;
$$;

-- "Masayı bitir" and the last person leaving: the table closes for everyone and every pair still
-- there gets its record (the close stamps their left_at with now()).
create function private.end_table(target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  update public.rooms
  set status = 'closed', closed_at = now(), last_activity_at = now(), phones = 0
  where id = target_room_id
  returning * into r;
  perform private.write_pair_history(target_room_id);
  return r;
end;
$$;

-- A person leaves the table (K-13): its pairs get their records, the table goes on, and an owner
-- hands it to the earliest person still there. The last person's leaving closes it.
create or replace function private.leave_room(
  target_room_id uuid,
  target_session_id uuid,
  how text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  mine public.room_members;
  heir public.room_members;
begin
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' then
    return r;
  end if;
  select * into mine from public.room_members
  where room_id = r.id and session_id = target_session_id and left_at is null
  for update;
  if mine.id is null then
    return r;
  end if;

  select * into heir from public.room_members hm
  where hm.room_id = r.id and hm.left_at is null and hm.session_id <> target_session_id
    and exists (
      select 1 from public.table_sessions ts where ts.id = hm.session_id and ts.status = 'active'
    )
  order by hm.joined_at, hm.id
  limit 1
  for update;
  if heir.id is null then
    return private.end_table(r.id);
  end if;

  update public.room_members set left_at = now() where id = mine.id;
  perform private.write_pair_history(r.id, target_session_id);
  -- A leaving starts the quiet clock again: a table left with one person closes after its own
  -- quiet minutes, not at once (§4.E).
  update public.rooms
  set phones = phones - 1,
      last_activity_at = now(),
      owner_session_id = case when owner_session_id = target_session_id then heir.session_id
                              else owner_session_id end,
      owner_profiled = case when owner_session_id = target_session_id then heir.profiled
                            else owner_profiled end
  where id = r.id
  returning * into r;
  return r;
end;
$$;

create or replace function private.release_rooms_of_session(target_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  n integer := 0;
begin
  for rid in
    select rm.room_id from public.room_members rm
    where rm.session_id = target_session_id and rm.left_at is null
    order by 1
  loop
    perform private.leave_room(rid, target_session_id, 'release');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- "Masayı bitir": only the owner (not_owner); the argument stays until 4.8 (§4.H).
create or replace function public.rooms_end(
  target_user_id uuid,
  decision_seconds integer default null
)
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
  if r.id is null or r.status = 'closed' then
    return r;
  end if;
  if r.owner_session_id <> s.id then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  return private.end_table(r.id);
end;
$$;

-- A one-person table closes after `idle_minutes` quiet; a table of two or more never does
-- (§4.E). Requests to it end as unavailable at their time (rule 5).
create or replace function private.close_idle_rooms(idle_minutes integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_count integer;
begin
  update public.rooms set status = 'closed', closed_at = now(), phones = 0
  where id in (
    select id from public.rooms
    where status <> 'closed'
      and phones <= 1
      and last_activity_at <= now() - make_interval(mins => idle_minutes)
    for update skip locked
  );
  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

-- 4. Reads ---------------------------------------------------------------------------------------
-- The lobby and the running tables of the venue (§4.E): every table but the caller's own and a
-- blocked one; a table's name, icon and phone count, and in the lobby its intent and game tag.
-- No person's name, no profile or account id (rule 4).
create function public.venue_tables(target_venue_id uuid)
returns table (
  room_id uuid, name text, icon text, phones smallint, open boolean, intent text,
  game_tag text, spot_id uuid, spot_name text, waiting_since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select ts.id as session_id, ts.user_id
    from public.table_sessions ts
    where ts.user_id = (select auth.uid())
      and ts.venue_id = target_venue_id
      and ts.status = 'active'
      and ts.expires_at > now()
  )
  select r.id, r.name, r.icon, r.phones, r.visibility = 'open',
         case when r.visibility = 'open' then r.intent end,
         case when r.visibility = 'open' then r.game_tag end,
         r.spot_id, sp.name,
         r.waiting_since
  from public.rooms r
  join public.table_sessions owner on owner.id = r.owner_session_id
  left join public.venue_spots sp on sp.id = r.spot_id
  cross join me
  where r.venue_id = target_venue_id
    and r.status <> 'closed'
    and owner.status = 'active'
    and owner.expires_at > now()
    and not exists (
      select 1 from public.room_members rm
      where rm.room_id = r.id and rm.session_id = me.session_id and rm.left_at is null
    )
    and not private.room_blocked_for(r.id, me.user_id)
    and not (r.visibility = 'open' and exists (
      select 1 from public.join_requests jr
      where jr.room_id = r.id
        and jr.requester_session_id = me.session_id
        and not jr.as_member
        and jr.status <> 'accepted'
        and jr.expires_at <= now()
    ))
  order by r.visibility = 'open' desc, r.waiting_since, r.id;
$$;

-- Masadakiler (§4.E): the table's people for its people; the capsule look for the anonymous only.
create function public.table_people(target_room_id uuid)
returns table (
  session_id uuid, alias text, profiled boolean, look text, is_owner boolean,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select rm.session_id, rm.alias, rm.profiled,
         case when rm.profiled then null else rm.look end,
         rm.session_id = r.owner_session_id,
         rm.joined_at
  from public.rooms r
  join public.room_members rm on rm.room_id = r.id
  join public.table_sessions ts on ts.id = rm.session_id and ts.status = 'active'
  where r.id = target_room_id
    and private.is_room_member(r.id)
    and r.status <> 'closed'
    and rm.left_at is null
  order by rm.joined_at, rm.id;
$$;

-- A profiled person's profile opens to the people at the same table (rule 4).
create or replace function private.shares_room_with_profile(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members mine
    join public.table_sessions me
      on me.id = mine.session_id and me.user_id = viewer and me.status = 'active'
    join public.rooms r on r.id = mine.room_id and r.status <> 'closed'
    join public.room_members theirs
      on theirs.room_id = mine.room_id and theirs.left_at is null and theirs.profiled
    join public.table_sessions other
      on other.id = theirs.session_id and other.user_id = target and other.status = 'active'
    where mine.left_at is null
  );
$$;

-- 5. The table's chat: a person reads it from the moment it sat down ------------------------------
create or replace function private.can_read_room_message(
  target_room_id uuid,
  sent_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and ts.user_id = (select auth.uid())
      and sent_at >= rm.joined_at
  );
$$;

-- The caller's seat at the table, locked in rule 10's order (the check-in, then the table).
create or replace function private.room_phone(target_user_id uuid, target_room_id uuid)
returns table (
  session_id uuid, side text, is_leader boolean, other_leader uuid, other_alias text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' or not exists (
    select 1 from public.room_members rm
    where rm.room_id = r.id and rm.session_id = s.id and rm.left_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  return query select s.id, null::text, s.id = r.owner_session_id, null::uuid, null::text;
end;
$$;

create or replace function public.chat_send(
  target_user_id uuid,
  target_room_id uuid,
  new_body text,
  min_interval_ms integer,
  reply_to uuid default null
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  seat public.room_members;
  created public.messages;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into seat from public.room_members
  where room_id = target_room_id and session_id = p.session_id and left_at is null;

  if reply_to is not null and not exists (
    select 1 from public.messages q
    where q.id = reply_to and q.room_id = target_room_id and q.created_at >= seat.joined_at
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  if exists (
    select 1 from public.messages
    where session_id = p.session_id
      and created_at > clock_timestamp() - make_interval(secs => min_interval_ms / 1000.0)
  ) then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.messages
    (room_id, session_id, sender_alias, body, created_at, reply_to_id, replied)
  values
    (target_room_id, p.session_id, seat.alias, new_body, clock_timestamp(), reply_to,
     reply_to is not null)
  returning * into created;

  update public.rooms set last_activity_at = now() where id = target_room_id;
  return created;
end;
$$;

create or replace function public.chat_react(
  target_user_id uuid,
  target_message_id uuid,
  new_emoji text
)
returns table (room_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.messages;
  p record;
  seat public.room_members;
  before_emoji text;
begin
  -- Read unlocked first (rule 10: the check-in and the table lock before the table's rows).
  select * into msg from public.messages where id = target_message_id;
  if msg.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into p from private.room_phone(target_user_id, msg.room_id);
  select * into seat from public.room_members
  where room_members.room_id = msg.room_id and session_id = p.session_id and left_at is null;
  if msg.created_at < seat.joined_at then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  select emoji into before_emoji from public.message_reactions
  where message_id = msg.id and session_id = p.session_id;
  if new_emoji is null then
    delete from public.message_reactions where message_id = msg.id and session_id = p.session_id;
  else
    insert into public.message_reactions (message_id, session_id, emoji)
    values (msg.id, p.session_id, new_emoji)
    on conflict (message_id, session_id) do update set emoji = excluded.emoji, created_at = now()
    where public.message_reactions.emoji <> excluded.emoji;
  end if;
  return query select msg.room_id, before_emoji is distinct from new_emoji;
end;
$$;

-- A quote reads from the moment the viewer sat down (before it: gone), as the chat does; a reaction
-- is named by the seat name its person sat down with.
create or replace function private.room_quote(viewer_session uuid, m public.messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null or q.created_at < coalesce(seat.joined_at, 'infinity'::timestamptz)
      then jsonb_build_object('gone', true)
    else jsonb_build_object(
      'id', q.id, 'body', left(q.body, 80), 'from_me', q.session_id = viewer_session,
      'name', q.sender_alias
    )
  end
  from (select 1) one
  left join public.messages q on q.id = m.reply_to_id and q.room_id = m.room_id
  left join lateral (
    select rm.joined_at from public.room_members rm
    where rm.room_id = m.room_id and rm.session_id = viewer_session
    order by rm.left_at is null desc, rm.joined_at desc
    limit 1
  ) seat on true;
$$;

create or replace function private.room_reaction_list(viewer_session uuid, target_message_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('emoji', e.emoji, 'count', e.n, 'aliases', e.aliases,
                                 'mine', e.mine)
      order by e.first_at),
    '[]'::jsonb)
  from (
    select r.emoji, count(*)::int as n,
           jsonb_agg(seat.alias order by r.created_at) as aliases,
           bool_or(r.session_id = viewer_session) as mine,
           min(r.created_at) as first_at
    from public.message_reactions r
    join public.messages msg on msg.id = r.message_id
    left join lateral (
      select rm.alias from public.room_members rm
      where rm.room_id = msg.room_id and rm.session_id = r.session_id
      order by rm.left_at is null desc, rm.joined_at desc
      limit 1
    ) seat on true
    where r.message_id = target_message_id
    group by r.emoji
  ) e;
$$;

create or replace function public.room_chat_extras(target_room_id uuid)
returns table (message_id uuid, reply_to jsonb, reactions jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select rm.session_id, rm.joined_at
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and ts.user_id = (select auth.uid())
    limit 1
  )
  select m.id,
         private.room_quote(v.session_id, m),
         private.room_reaction_list(v.session_id, m.id)
  from viewer v
  join public.messages m on m.room_id = target_room_id
  where m.created_at >= v.joined_at
    and (m.replied or exists (select 1 from public.message_reactions x where x.message_id = m.id));
$$;

-- 6. Blocking and reporting at the table (K-13) ---------------------------------------------------
-- The owner's block takes the blocked person out; anybody else's block takes the blocker out.
-- Read without locks first: the owner removing someone locks that person's check-in too, both in
-- id order, before the table (§4.K).
create or replace function public.safety_block(
  target_user_id uuid,
  target_room_id uuid,
  target_session_id uuid default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller public.table_sessions;
  r public.rooms;
  target_seat public.room_members;
  blocked uuid;
begin
  select * into caller from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now();
  if target_session_id is not null and caller.id is not null
    and caller.id = (select owner_session_id from public.rooms where id = target_room_id)
  then
    perform 1 from public.table_sessions
    where id in (caller.id, target_session_id)
    order by id
    for no key update;
  end if;

  caller := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' or not exists (
    select 1 from public.room_members
    where room_id = r.id and session_id = caller.id and left_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if target_session_id is null or target_session_id = caller.id then
    raise exception using errcode = 'P0001', message = 'nothing_to_block';
  end if;
  select * into target_seat from public.room_members
  where room_id = r.id and session_id = target_session_id and left_at is null;
  select user_id into blocked from public.table_sessions where id = target_session_id;
  if target_seat.id is null or blocked is null or blocked = target_user_id then
    raise exception using errcode = 'P0001', message = 'nothing_to_block';
  end if;

  insert into public.blocks (blocker_id, blocked_id, blocked_alias)
  values (target_user_id, blocked, target_seat.alias)
  on conflict (blocker_id, blocked_id) do nothing;

  if caller.id = r.owner_session_id then
    return private.leave_room(r.id, target_session_id, 'removed');
  end if;
  return private.leave_room(r.id, caller.id, 'block');
end;
$$;

-- The person it names, at the table now or before; the chat from the reporter's own seat on.
create or replace function public.safety_report(
  target_user_id uuid,
  target_room_id uuid,
  new_reason text,
  target_session_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  seat public.room_members;
  reported uuid;
  snapshot jsonb;
  report_id uuid;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into seat from public.room_members
  where room_id = target_room_id and session_id = p.session_id and left_at is null;
  if target_session_id is null or target_session_id = p.session_id or not exists (
    select 1 from public.room_members rm
    where rm.room_id = target_room_id and rm.session_id = target_session_id
  ) then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select user_id into reported from public.table_sessions where id = target_session_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'alias', last50.sender_alias, 'body', last50.body, 'created_at', last50.created_at
         ) order by last50.created_at), '[]'::jsonb)
  into snapshot
  from (
    select sender_alias, body, created_at from public.messages
    where room_id = target_room_id and created_at >= seat.joined_at
    order by created_at desc
    limit 50
  ) last50;

  insert into public.reports (reporter_id, reported_user_id, room_id, reason, messages_snapshot)
  values (target_user_id, reported, target_room_id, new_reason, snapshot)
  returning id into report_id;
  return report_id;
end;
$$;

-- 6b. The expiry job and the name ---------------------------------------------------------------
-- The expiry job ends one check-in at a time and takes its tables with skip locked: from step 4.5
-- a "Katıl" locks two tables, and a table a user action holds waits for the next run instead of
-- the job holding a check-in while it waits (WazzupDevs/Kabuk#183).
create or replace function private.end_expired_table_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_session_id uuid;
  wanted integer;
  got integer;
  n integer := 0;
begin
  for old_session_id in
    select id from public.table_sessions
    where status = 'active' and expires_at <= now()
    for no key update skip locked
  loop
    select count(*) into wanted from public.room_members
    where session_id = old_session_id and left_at is null;
    select count(*) into got from (
      select r.id from public.rooms r
      where r.id in (
        select room_id from public.room_members
        where session_id = old_session_id and left_at is null
      )
      for update skip locked
    ) free;
    continue when got < wanted;
    perform private.release_rooms_of_session(old_session_id);
    update public.table_sessions set status = 'ended', ended_at = expires_at
    where id = old_session_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- rooms/reroll-name: the old owner_alias copy follows the name (§4.H, until 4.8).
create or replace function public.rooms_reroll_name(
  target_user_id uuid,
  target_room_id uuid,
  max_rerolls integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  picked text;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  if r.name_rerolls >= max_rerolls then
    raise exception using errcode = 'P0001', message = 'reroll_limit';
  end if;
  perform private.lock_venue_names(r.venue_id);
  picked := private.free_table_name(r.venue_id);
  if picked is null then
    raise exception using errcode = 'P0001', message = 'alias_exhausted';
  end if;
  update public.rooms set name = picked, owner_alias = picked, name_rerolls = name_rerolls + 1
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- 7. Grants --------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.rooms_create(uuid, boolean, text, text, text)',
    'public.rooms_set_visibility(uuid, uuid, boolean)',
    'public.rooms_request_join(uuid, uuid, integer, integer, boolean)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'private.max_table_phones()',
    'private.table_seat(uuid)',
    'private.end_table(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;

-- The two reads are the app's (rule 1: read only, search_path '').
revoke all on function public.venue_tables(uuid) from public, anon;
grant execute on function public.venue_tables(uuid) to authenticated;
revoke all on function public.table_people(uuid) from public, anon;
grant execute on function public.table_people(uuid) to authenticated;
