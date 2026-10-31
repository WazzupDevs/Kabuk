-- "Masadan ayrıl" (K-13) hands the table only to a check-in that is still on: one past its 4 hours
-- whose end the cron has not run yet (status still 'active') was taken as the new owner, or kept a
-- table open whose last real person had left. The heir is chosen with expires_at > now() as every
-- other road chooses the table's people (table_people, the seat guards).
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
        and ts.expires_at > now()
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
