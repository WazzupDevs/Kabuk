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
-- without locks first), the table, its seats (leave_room), then the person's waiting requests.
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
  if caller.id is not null and caller.id <> target_session_id
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

-- Masa bitti's title (rule 1: reads only, the caller's own seats): whether this account's seat at
-- the table was taken away by its owner.
create or replace function public.room_exit_removed(target_room_id uuid)
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
    where rm.room_id = target_room_id and rm.removed_at is not null
      and ts.user_id = (select auth.uid())
  );
$$;

revoke all on function public.room_exit_removed(uuid) from public, anon;
grant execute on function public.room_exit_removed(uuid) to authenticated;
