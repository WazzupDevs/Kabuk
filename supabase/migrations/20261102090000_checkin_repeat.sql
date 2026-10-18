-- A check-in sent again opens no second table. The platform can answer a check-in 5xx after the
-- function ran (the local serve's empty 503, supabase/tests/refusal.ts), and the app sends it once
-- more after a 5xx (pure/apiRetry.ts → IDEMPOTENT_CALLS). Until now that second call ended the
-- table the first one had opened and opened another: a new id, alias and clock, the first answer's
-- table gone.
--
-- Now a check-in finding the table it would open is the same check-in sent again: it comes back as
-- it is and nothing is written. That table was opened in the last minute with the same venue, spot,
-- headcount and teams setting, and has done nothing yet: in no room and with no request out (as
-- reroll_table_alias asks), no alias drawn again, no venue chat message (its mode unchosen). A room
-- it opened and closed within that minute stays closed either way: the repeat keeps only the alias
-- and the clock. Every other check-in still ends the active table and opens a new one (MVP_SPEC
-- §4.2 item 6): later, with another choice, or after the table did something, since a new check-in
-- starts those afresh. The accuracy is a measurement, not a choice: it does not count. The row is
-- the one the loop already locked and the room and request checks only read, so no new lock is
-- taken (CLAUDE.md rule 10). Otherwise as in 20261024090000_teams.sql.
create or replace function public.start_table_session(
  target_user_id uuid,
  target_venue_id uuid,
  new_alias text,
  new_headcount smallint,
  consent_version text,
  accuracy_m real default null,
  new_participation text default 'anonymous',
  new_spot_id uuid default null,
  new_team_capable boolean default false
)
returns public.table_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.table_sessions;
  old public.table_sessions;
begin
  perform private.check_spot(target_venue_id, new_spot_id);

  update public.profiles
  set location_consent_at = now(), location_consent_version = consent_version
  where id = target_user_id
    and location_consent_version is distinct from consent_version;

  for old in
    select * from public.table_sessions
    where user_id = target_user_id and status = 'active'
    for no key update
  loop
    if old.venue_id = target_venue_id
       and old.spot_id is not distinct from new_spot_id
       and old.headcount = new_headcount
       and old.team_capable = new_team_capable
       and old.created_at > now() - interval '1 minute'
       and old.alias_rerolls = 0
       and old.venue_chat_profiled is null
       and private.open_room_of_session(old.id) is null
       and not private.has_open_request(old.id) then
      return old;
    end if;
    perform private.release_rooms_of_session(old.id);
    update public.table_sessions set status = 'ended', ended_at = now() where id = old.id;
  end loop;

  insert into public.table_sessions
    (user_id, venue_id, alias, headcount, gps_accuracy_m, participation, spot_id, team_capable,
     expires_at)
  values
    (target_user_id, target_venue_id, new_alias, new_headcount, accuracy_m, new_participation,
     new_spot_id, new_team_capable, now() + interval '4 hours')
  returning * into created;

  return created;
end;
$$;
