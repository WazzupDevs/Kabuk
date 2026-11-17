-- Odadakiler (yeni arayüz tuvali: Odadakiler, OdaProfilli, OdaTek; docs/decisions/yeni-tuval.md →
-- 16 Kasım kararı a, 17 Kasım akşam; docs/SPEC_V4.md §4.V; rule 4's district paragraph).
--
-- The people of the caller's district room: everyone with an open session in it, those who never
-- wrote among them, with when they came in (to the minute). A profiled person shows the name, the
-- birth date (the function sends the age only) and the photo their messages already open to the
-- room, whether they are the caller's friend and whether the caller muted their profiled messages.
-- An anonymous person is a row with a time and nothing else: no nick, no look, no key that a
-- message carries, no friendship and no mute, so the row is tied to no account, no nick and no
-- message. No profile id, no account id.
--
-- Two things a list must not do (rule 4; the security review of 17 Kasım):
--   * A block does not filter it. A block is on the account and a nick is fixed to the account:
--     a row that left when a nick was blocked (or came back when it was unblocked) would name the
--     nick, and an anonymous row that left would say that person is here anonymously. The list
--     and its count are the same for everyone in the room.
--   * A session that changed its identity carries no time: the same minute on the anonymous row
--     that went and the profiled row that came would tie what it wrote before to its name.
-- What stays (accepted, docs/SPEC_V4.md §4.V): a reader comparing two readings sees that one
-- anonymous row went as one profiled row came.
-- Reads only, takes no lock; nothing is broadcast when someone comes or goes.
create function public.district_people_for(target_user_id uuid)
returns table (
  me boolean,
  profiled boolean,
  display_name text,
  birth_date date,
  photo_path text,
  joined_at timestamptz,
  friend boolean,
  muted boolean
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
         )
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
