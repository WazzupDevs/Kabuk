-- Faz 3 step 23.2, server (docs/SPEC_V3.md §23.D, §23.E, §23.H): gender and the asymmetric
-- anonymity rule.
--
-- The gender is never shown to anyone, the owner included, like the birth date (§3.2): the column is
-- not granted to the client (the column grants of profiles_v2 stay); the client reads only whether
-- its own gender is set. The owner gets it in their own profile/get answer. It goes with the
-- account (cascade). The rule it serves (pure/gender.ts) runs in the rooms function.
--
-- Staged (the owner's decision for 23.2): until the app asks for the gender (step 23.2's client
-- part), an empty gender passes the game flow as today and complete-onboarding takes it as optional.
alter table public.profiles
  add column gender text check (gender in ('female', 'male', 'unspecified')),
  add column has_gender boolean generated always as (gender is not null) stored;

grant select (has_gender) on table public.profiles to authenticated;

-- "Yanlış cinsiyet beyanı" (§23.D): a reason for a person met in the game flow; the function accepts
-- it only for a phone in the room and a history row.
alter table public.reports drop constraint reports_reason_check;
alter table public.reports add constraint reports_reason_check
  check (reason in ('harassment', 'inappropriate', 'spam', 'other', 'wrong_gender'));

-- The request card's profile (§23.E): the requester's account, only while the request waits and only
-- for the leader who can answer it (rooms_respond: a side's leader for "Bu masadayım", the room's
-- owner for "Katıl"), and only if the requester asked with its profile. Anything else is null, alike.
-- Returns an account id, so it is closed to clients (rule 1); the rooms function reads the name, the
-- age and the photo with it and never sends the id or public_id on (rule 4).
create function public.rooms_request_profile_owner(target_user_id uuid, target_request_id uuid)
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
  join public.table_sessions leader
    on leader.id = case
      when jr.as_member and jr.side = 'guest' then r.guest_session_id
      else r.owner_session_id
    end
  where jr.id = target_request_id
    and jr.status = 'pending'
    and jr.expires_at > now()
    and jr.requester_profiled
    and r.status <> 'closed'
    and leader.user_id = target_user_id
    and leader.status = 'active';
$$;

revoke all on function public.rooms_request_profile_owner(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.rooms_request_profile_owner(uuid, uuid) to service_role;
