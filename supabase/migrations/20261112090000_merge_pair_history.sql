-- Audit VEN-7 (28 Ekim): a table that joins another (its owner's "Katıl", docs/SPEC_V4.md §4.E)
-- closes without the record of its pairs (K-66). rooms_respond writes them before it closes the
-- moved table, as end_table does; play_history comes after room_members in the lock order (rule 10).
-- Otherwise unchanged from 20261105090000_people_tables.sql.

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

