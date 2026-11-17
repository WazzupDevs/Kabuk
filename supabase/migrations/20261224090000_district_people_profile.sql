-- Odadakiler: the profile of a profiled row (the owner's request, 17 Kasım gece; docs/SPEC_V4.md
-- §4.V; rule 4's district paragraph).
--
-- A profiled row of the list opens that person's profile, as a profiled message does, also for
-- one who never wrote. The row carries a reference for it (`ref`): a random value of the session,
-- made for this alone. It is not the session's id, not the key messages carry and not a profile
-- id: it ties the row to no message, no nick and no account, it is gone with the session, and it
-- answers only while that session is open, profiled and in the reader's own room. An anonymous
-- row carries none (the function sends it for profiled rows only), so a session that turns
-- anonymous stops answering and what it wrote anonymously stays untied.
--
-- A block does not filter the list (20261222090000), so it must not show here either: across a
-- block the profile answers with what the row already shows (name, age, photo) and nothing more
-- (`limited`), which reads as a profile with nothing written on it. A not_found there would tell
-- the blocked one of the block.
-- Reads only, takes no lock.
alter table public.district_sessions
  add column people_ref uuid not null default gen_random_uuid();
create unique index district_sessions_people_ref_key on public.district_sessions (people_ref);

drop function public.district_people_for(uuid);
create function public.district_people_for(target_user_id uuid)
returns table (
  me boolean,
  profiled boolean,
  display_name text,
  birth_date date,
  photo_path text,
  joined_at timestamptz,
  friend boolean,
  muted boolean,
  ref uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as materialized (
    select * from private.district_open_session(target_user_id) where id is not null
  )
  select s.user_id = target_user_id,
         s.identity_mode = 'profiled',
         case when s.identity_mode = 'profiled' then p.display_name end,
         case when s.identity_mode = 'profiled' then p.birth_date end,
         case when s.identity_mode = 'profiled' and p.photo_hidden_at is null then p.photo_path end,
         case when s.identity_switches = 0 then date_trunc('minute', s.joined_at) end,
         s.identity_mode = 'profiled' and s.user_id <> target_user_id
           and private.are_friends(target_user_id, s.user_id),
         s.identity_mode = 'profiled' and exists (
           select 1 from public.venue_chat_mutes mu
           where mu.user_id = target_user_id and mu.muted_user_id = s.user_id and mu.profiled
         ),
         case when s.identity_mode = 'profiled' then s.people_ref end
  from public.district_sessions s
  join mine on mine.room_id = s.room_id
  left join public.profiles p on p.id = s.user_id
  where s.status = 'open' and s.grace_ends_at > now() and s.day = mine.day
  order by (s.user_id = target_user_id) desc, (s.identity_mode = 'profiled') desc,
           case when s.identity_switches = 0 then date_trunc('minute', s.joined_at) end
             desc nulls last,
           md5(s.id::text || mine.id::text);
$$;
revoke all on function public.district_people_for(uuid) from public, anon, authenticated;
grant execute on function public.district_people_for(uuid) to service_role;

-- Whose profile a row's reference opens for this reader, and whether only the row's own fields
-- may go (a block either way). No row: no session of the reader's, another room or day, a closed
-- or anonymous session, an unknown reference.
create function public.district_person_profile_owner(target_user_id uuid, target_ref uuid)
returns table (owner_id uuid, limited boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as materialized (
    select * from private.district_open_session(target_user_id) where id is not null
  )
  select s.user_id, private.is_blocked_between(target_user_id, s.user_id)
  from public.district_sessions s
  join mine on mine.room_id = s.room_id
  where s.people_ref = target_ref
    and s.status = 'open' and s.grace_ends_at > now() and s.day = mine.day
    and s.identity_mode = 'profiled';
$$;
revoke all on function public.district_person_profile_owner(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.district_person_profile_owner(uuid, uuid) to service_role;
