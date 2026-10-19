-- A check-in sent twice opens one table: the app's one retry after a 5xx (pure/apiRetry.ts →
-- IDEMPOTENT_CALLS) and, in the integration tests, the local serve's retired isolate, which answers
-- a bodiless 503 after the function ran. The app sends a key with each check-in it starts
-- (`requestId`) and the same key when it sends it again. While the table that key opened is active
-- and within its time, the same key with the same venue, spot, headcount and team choice returns
-- that table as it is: no second row, the same alias, its rooms kept. A check-in without a key (an
-- older app), with a new key or with other choices ends the active table and opens a new one, as
-- before. The key is the account's own (table_sessions is read only by its
-- owner, RLS). Otherwise as in 20261024090000_teams.sql.
alter table public.table_sessions add column checkin_key uuid;

drop function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean);

create function public.start_table_session(
  target_user_id uuid,
  target_venue_id uuid,
  new_alias text,
  new_headcount smallint,
  consent_version text,
  accuracy_m real default null,
  new_participation text default 'anonymous',
  new_spot_id uuid default null,
  new_team_capable boolean default false,
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

  -- The same check-in again (its key, venue, spot, headcount and team choice): the table it
  -- opened, untouched.
  if new_checkin_key is not null then
    select * into created from public.table_sessions
    where user_id = target_user_id
      and status = 'active'
      and checkin_key = new_checkin_key
      and venue_id = target_venue_id
      and spot_id is not distinct from new_spot_id
      and headcount = new_headcount
      and team_capable = new_team_capable
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
    (user_id, venue_id, alias, headcount, gps_accuracy_m, participation, spot_id, team_capable,
     checkin_key, expires_at)
  values
    (target_user_id, target_venue_id, new_alias, new_headcount, accuracy_m, new_participation,
     new_spot_id, new_team_capable, new_checkin_key, now() + interval '4 hours')
  returning * into created;

  return created;
end;
$$;
revoke all on function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean, uuid)
  to service_role;
