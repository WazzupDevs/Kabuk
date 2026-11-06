-- "Masadan çıkar" (docs/SPEC_V4.md §4.E, K-88; the owner's call, 6 Kasım): the owner takes a person
-- off the table without a block. The person goes back to the venue and reads "Masadan çıkarıldın"
-- (room_exit_removed); while the table runs, their requests, "Bu masadayım" and invites to it are
-- refused like a block's (rule 5), and the table leaves their lobby. A block is unchanged: the
-- person it takes off reads Masa bitti, as before (rule 5: the blocked sees nothing).

-- The seat the owner took away. room_members stays closed to clients (RLS on, no new policy).
alter table public.room_members add column removed_at timestamptz;

-- A block with anybody at the table, or a seat at it taken away from this account. One place for
-- Katıl and "Bu masadayım" (rooms_request_join), the lobby (venue_tables) and both ends of an invite.
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
  ) or exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.removed_at is not null
      and ts.user_id = target_user_id
  );
$$;

-- Lock order (rule 10, the owner's block in safety_block): the two check-ins in id order (read
-- without locks first, always, whoever owns the table by then), the table, its seats (leave_room), then the person's waiting requests.
create or replace function public.rooms_remove(
  target_user_id uuid,
  target_room_id uuid,
  target_session_id uuid
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
  removed_user uuid;
  result public.rooms;
begin
  select * into caller from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now();
  if caller.id is not null and caller.id <> target_session_id then
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
  if r.owner_session_id <> caller.id then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  if target_session_id = caller.id then
    raise exception using errcode = 'P0001', message = 'nothing_to_remove';
  end if;
  select * into target_seat from public.room_members
  where room_id = r.id and session_id = target_session_id and left_at is null;
  select user_id into removed_user from public.table_sessions where id = target_session_id;
  if target_seat.id is null or removed_user is null or removed_user = target_user_id then
    raise exception using errcode = 'P0001', message = 'nothing_to_remove';
  end if;

  result := private.leave_room(r.id, target_session_id, 'removed');
  update public.room_members set removed_at = now() where id = target_seat.id;
  -- A request of theirs still waiting goes with the seat: the owner cannot let them back in.
  update public.join_requests set status = 'declined', responded_at = now()
  where room_id = r.id and status = 'pending'
    and requester_session_id in (
      select id from public.table_sessions where user_id = removed_user
    );
  return result;
end;
$$;

revoke all on function public.rooms_remove(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.rooms_remove(uuid, uuid, uuid) to service_role;

-- Masa bitti's title (rule 1: reads only, the caller's own seats): whether this account's last seat
-- at the table was taken away by its owner.
create or replace function public.room_exit_removed(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select rm.removed_at is not null
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and ts.user_id = (select auth.uid())
    order by rm.joined_at desc, rm.id desc
    limit 1
  ), false);
$$;

revoke all on function public.room_exit_removed(uuid) from public, anon;
grant execute on function public.room_exit_removed(uuid) to authenticated;

-- "Katıl" with a table (rooms_respond): a table bringing in a person whose seat here was taken away
-- cannot sit down either (room_not_available, as with a block). Otherwise unchanged from
-- 20261112090000_merge_pair_history.sql.
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
  ) or exists (
    -- Nobody coming had their seat here taken away by the owner while the table runs (K-88).
    select 1
    from public.room_members gone
    join public.table_sessions gone_s on gone_s.id = gone.session_id
    where gone.room_id = r.id and gone.removed_at is not null
      and gone_s.user_id in (
        select ts.user_id from public.table_sessions ts where ts.id = requester.id
        union
        select ts.user_id
        from public.room_members rm
        join public.table_sessions ts on ts.id = rm.session_id
        where rm.room_id = w.id and rm.left_at is null
      )
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
    -- Its pairs get their record before it closes, as at the end of a table: the movers' left_at
    -- is now() (audit VEN-7: people who sat together there for 20 minutes had no record of it).
    perform private.write_pair_history(w.id);
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
