-- Faz 4 step 4.7, server (docs/SPEC_V4.md §4.G, §4.H, §4.K; K-2, K-18, K-53, K-62, K-70): the
-- table invite, the notification list behind the bell and the notification settings.
--
-- The table invite (§4.B-8, rule 4's open exception): only a table's owner sends it, only to a
-- friend, and only a friend checked in at the same venue, and at the table's spot where the venue
-- has spots, gets it. Everything else (a friend elsewhere, a block either way, one already invited,
-- the hour's limit, a full table) writes nothing, and the owner hears the same "Davet gönderildi"
-- every time (K-2, K-18). An invite carries the table's name and phones as they were when it went,
-- never the venue; it lasts 2 minutes. Joining by an invite is the owner's
-- consent; the person leaves the table they were at by the "Masadan ayrıl" rule (K-13). A decline and
-- a time-out look the same to the owner: nothing.
--
-- The list (§4.G "Veri"): no table of notifications. my_notifications reads them from the friend
-- requests (incoming, and the caller's accepted in 7 days), the matches of the silent "Arkadaş ekle"
-- (7 days, the first presser only, K-70) and the invites (1 day). The bell's count is what came after
-- profiles.notifications_seen_at.
--
-- Lock order (rule 10, §4.K): check-in → rooms → room_members → join_requests → table_invites. An
-- invite: the owner's check-in and table (private.room_phone), then the invite. Joining by one: the
-- invitee's check-in → the table it is at and the inviting table, by id → their room_members → the
-- invite.

-- 1. Notification settings and the bell --------------------------------------------------------------
-- K-53, K-62: "Masa davetleri" next to "Arkadaşlık istekleri" and "Birebir mesajlar"; read before a
-- push goes. notifications_seen_at: the list was last opened (account/notifications-seen).
alter table public.profiles
  add column notify_invites boolean not null default true,
  add column notifications_seen_at timestamptz;

grant select (notify_invites, notifications_seen_at) on public.profiles to authenticated;

-- 2. The invites -----------------------------------------------------------------------------------
-- Closed to clients (no policy): the invitee reads its own through my_notifications; the account it
-- went to never reaches a client. room_name and phones are the table's when the invite went: the
-- list shows them a day, and the table itself (still open? how many now?) never reaches the
-- invitee after the 2 minutes (rule 4; WazzupDevs/Kabuk#195).
create table public.table_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  from_session_id uuid not null references public.table_sessions (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  room_name text,
  phones smallint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired')),
  responded_at timestamptz,
  check (expires_at > created_at)
);

-- One waiting invite from an owner to a friend at a time; one past its time is set expired first.
create unique index table_invites_one_pending
  on public.table_invites (from_session_id, to_user_id) where status = 'pending';
create index table_invites_to_user_idx on public.table_invites (to_user_id, created_at desc);
create index table_invites_from_session_idx on public.table_invites (from_session_id, created_at);

alter table public.table_invites enable row level security;
revoke all on table public.table_invites from anon, authenticated;

-- 3. rooms/invite ----------------------------------------------------------------------------------
-- The owner of the table (not_owner otherwise) invites a friend by public_id. Returns the invite
-- written, or no row: not a friend (or no such id), a block either way, not checked in at the
-- venue or at another spot of it, already at the table, a waiting invite from this owner,
-- `hourly_max` invites from this account in the past hour, or a full table. The answer never tells
-- which (K-2).
create function public.rooms_invite(
  target_user_id uuid,
  target_room_id uuid,
  friend_public_id uuid,
  ttl_seconds integer,
  hourly_max integer
)
returns setof public.table_invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  r public.rooms;
  friend_id uuid;
  invitee public.table_sessions;
  created public.table_invites;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into r from public.rooms where id = target_room_id;
  if not p.is_leader then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;

  select id into friend_id from public.profiles where public_id = friend_public_id;
  if friend_id is null or friend_id = target_user_id
     or not private.are_friends(target_user_id, friend_id)
     or private.room_blocked_for(r.id, friend_id)
  then
    return;
  end if;
  -- The friend's check-in, read only: the invite says nothing about it, and the join checks again.
  select * into invitee from public.table_sessions
  where user_id = friend_id and status = 'active' and expires_at > now();
  -- Only a table's own spot sits together (rooms_request_join's different_spot): another spot is
  -- as far as another venue (the project owner's decision, WazzupDevs/Kabuk#195).
  if invitee.id is null or invitee.venue_id <> r.venue_id
     or invitee.spot_id is distinct from r.spot_id
     or private.open_room_of_session(invitee.id) is not distinct from r.id
     or r.phones >= private.max_table_phones()
  then
    return;
  end if;
  if (
    select count(*) from public.table_invites ti
    join public.table_sessions ts on ts.id = ti.from_session_id
    where ts.user_id = target_user_id and ti.created_at > now() - interval '1 hour'
  ) >= hourly_max then
    return;
  end if;

  update public.table_invites set status = 'expired'
  where from_session_id = p.session_id and to_user_id = friend_id
    and status = 'pending' and expires_at <= now();
  insert into public.table_invites (room_id, from_session_id, to_user_id, room_name, phones, expires_at)
  values (r.id, p.session_id, friend_id, r.name, r.phones, now() + make_interval(secs => ttl_seconds))
  on conflict (from_session_id, to_user_id) where status = 'pending' do nothing
  returning * into created;
  if created.id is not null then
    return next created;
  end if;
end;
$$;

-- 4. rooms/answer-invite -----------------------------------------------------------------------------
-- The invitee answers. A decline: the invite ends, and nothing reaches the owner. Joining: the invite
-- is the owner's consent. It is no longer valid (invite_unavailable, one answer for all) when it has
-- run out, the table closed or is full, its owner is not the inviter any more or the inviter's
-- check-in has run out, the two are not friends any more (a removal looks like a block, rule 5),
-- the table is at another venue or spot than the invitee's check-in, or there is a block with
-- someone at the table (WazzupDevs/Kabuk#195). The
-- invitee sits with the check-in's identity (private.table_seat: photo_required, gender_required)
-- and first leaves the table it is at by the "Masadan ayrıl" rule (private.leave_room: alone there,
-- the table closes quietly; its owner, the table goes to the earliest person; K-13). Already at the
-- table: the invite is just accepted. Returns the invite with the table it left, if any.
create function public.rooms_answer_invite(
  target_user_id uuid,
  target_invite_id uuid,
  accept boolean
)
returns table (invite public.table_invites, left_room_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.table_invites;
  s public.table_sessions;
  r public.rooms;
  inviter public.table_sessions;
  current_room uuid;
  seat record;
begin
  select * into inv from public.table_invites where id = target_invite_id;
  if inv.id is null or inv.to_user_id is distinct from target_user_id then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  if not accept then
    update public.table_invites set status = 'declined', responded_at = now()
    where id = inv.id and status = 'pending'
    returning * into inv;
    if inv.id is null then
      select * into inv from public.table_invites where id = target_invite_id;
    end if;
    return query select inv, null::uuid;
    return;
  end if;

  s := private.active_session_for_update(target_user_id);
  current_room := private.open_room_of_session(s.id);
  perform 1 from public.rooms
  where id in (inv.room_id, coalesce(current_room, inv.room_id))
  order by id
  for update;
  perform 1 from public.room_members
  where room_id in (inv.room_id, coalesce(current_room, inv.room_id)) and left_at is null
  order by id
  for update;
  select * into inv from public.table_invites where id = target_invite_id for update;
  select * into r from public.rooms where id = inv.room_id;
  -- The inviter's check-in, read only, as rooms_respond reads the owner's.
  select * into inviter from public.table_sessions where id = inv.from_session_id;

  if current_room is not distinct from r.id and r.status <> 'closed' then
    update public.table_invites set status = 'accepted', responded_at = now()
    where id = inv.id and status = 'pending'
    returning * into inv;
    if inv.id is null then
      select * into inv from public.table_invites where id = target_invite_id;
    end if;
    return query select inv, null::uuid;
    return;
  end if;
  if inv.status <> 'pending' or inv.expires_at <= now()
     or r.status = 'closed'
     or r.owner_session_id <> inv.from_session_id
     or inviter.status <> 'active' or inviter.expires_at <= now()
     or not private.are_friends(inviter.user_id, target_user_id)
     or r.venue_id <> s.venue_id
     or r.spot_id is distinct from s.spot_id
     or r.phones >= private.max_table_phones()
     or private.room_blocked_for(r.id, target_user_id)
  then
    raise exception using errcode = 'P0001', message = 'invite_unavailable';
  end if;

  select * into seat from private.table_seat(s.id);
  if current_room is not null then
    perform private.leave_room(current_room, s.id, 'invite');
  end if;
  perform private.close_stale_member_rows(s.id);
  insert into public.room_members (room_id, session_id, alias, profiled)
  values (r.id, s.id, seat.alias, seat.profiled);
  update public.rooms set phones = phones + 1, last_activity_at = now() where id = r.id;
  update public.table_invites set status = 'accepted', responded_at = now()
  where id = inv.id
  returning * into inv;
  return query select inv, current_room;
end;
$$;

-- 5. The list -------------------------------------------------------------------------------------
-- The caller's notifications, newest first (§4.G): one row each, its kind and time, and only what
-- the kind may show.
-- - 'request': a friend request to the caller, waiting or accepted in 7 days. From the venue chat:
--   the sender's name, age (birth date, for the function to turn into an age) and photo, and the
--   venue as today (docs/SPEC_V3.md §7.5). From a play history ("İstek gönder"): the history row and
--   the name the sender had at the table, nothing more. Once accepted they are friends: the
--   friend's public_id.
-- - 'accepted': the caller's request a friend accepted in 7 days: the friend.
-- - 'match': a friendship of the silent "Arkadaş ekle" made in 7 days, for the first presser only
--   (the earlier of the two intents; K-70): the friend.
-- - 'invite': a friend's table invite to the caller in a day: the friend, the table's name and
--   phones as they were when it went (never the table as it is now), the invite's time and
--   status. Never the venue.
-- A block either way, and a friendship that ended, take the row out. No account id; no public_id
-- before a friendship (rule 4).
create function public.my_notifications(target_user_id uuid)
returns table (
  kind text,
  item_id uuid,
  created_at timestamptz,
  source text,
  history_id uuid,
  other_alias text,
  venue_name text,
  public_id uuid,
  display_name text,
  birth_date date,
  photo_path text,
  status text,
  room_name text,
  phones smallint,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select 'request'::text, fr.id, fr.created_at, fr.source,
           h.id, h.other_alias,
           case when fr.source = 'venue_chat' then fr.venue_chat_context ->> 'venueName' end,
           case when fr.status = 'accepted' then p.public_id end,
           case when fr.source = 'venue_chat' or fr.status = 'accepted' then p.display_name end,
           case when fr.source = 'venue_chat' then p.birth_date end,
           case when (fr.source = 'venue_chat' or fr.status = 'accepted')
                     and p.photo_hidden_at is null then p.photo_path end,
           fr.status, null::text, null::smallint, null::timestamptz
    from public.friend_requests fr
    join public.profiles p on p.id = fr.from_user_id
    left join public.play_history h
      on fr.source = 'encounter' and h.user_id = fr.to_user_id
         and h.encounter_id = fr.encounter_id
    where fr.to_user_id = target_user_id
      and (fr.status = 'pending'
           or (fr.status = 'accepted' and fr.responded_at > now() - interval '7 days'
               and private.are_friends(fr.from_user_id, fr.to_user_id)))
      and (fr.source = 'venue_chat' or h.id is not null)
      and not private.is_blocked_between(fr.from_user_id, fr.to_user_id)

    union all
    select 'accepted', fr.id, fr.responded_at, fr.source, null, null, null,
           p.public_id, p.display_name, null,
           case when p.photo_hidden_at is null then p.photo_path end,
           fr.status, null, null, null
    from public.friend_requests fr
    join public.profiles p on p.id = fr.to_user_id
    where fr.from_user_id = target_user_id
      and fr.status = 'accepted' and fr.responded_at > now() - interval '7 days'
      and private.are_friends(fr.from_user_id, fr.to_user_id)
      and not private.is_blocked_between(fr.from_user_id, fr.to_user_id)

    union all
    select 'match', null, f.created_at, f.source, null, null, null,
           p.public_id, p.display_name, null,
           case when p.photo_hidden_at is null then p.photo_path end,
           null, null, null, null
    from public.friendships f
    join public.profiles p
      on p.id = case when f.user_a = target_user_id then f.user_b else f.user_a end
    where (f.user_a = target_user_id or f.user_b = target_user_id)
      and f.source = 'room_end_mutual' and f.created_at > now() - interval '7 days'
      and not private.is_blocked_between(f.user_a, f.user_b)
      -- The caller pressed first at the encounter that matched (its latest one with both intents).
      and exists (
        select 1 from (
          select mine.created_at < theirs.created_at as first
          from public.mutual_friend_intents mine
          join public.mutual_friend_intents theirs
            on theirs.encounter_id = mine.encounter_id and theirs.user_id = p.id
          where mine.user_id = target_user_id
          order by greatest(mine.created_at, theirs.created_at) desc
          limit 1
        ) matched
        where matched.first
      )

    union all
    select 'invite', ti.id, ti.created_at, null, null, null, null,
           p.public_id, p.display_name, null,
           case when p.photo_hidden_at is null then p.photo_path end,
           case when ti.status = 'pending' and ti.expires_at <= now() then 'expired'
                else ti.status end,
           ti.room_name, ti.phones, ti.expires_at
    from public.table_invites ti
    join public.table_sessions ts on ts.id = ti.from_session_id
    join public.profiles p on p.id = ts.user_id
    where ti.to_user_id = target_user_id
      and ti.created_at > now() - interval '1 day'
      and private.are_friends(ts.user_id, ti.to_user_id)
      and not private.is_blocked_between(ts.user_id, ti.to_user_id)
  ) listed (kind, item_id, created_at, source, history_id, other_alias, venue_name, public_id,
            display_name, birth_date, photo_path, status, room_name, phones, expires_at)
  order by listed.created_at desc
  limit 100;
$$;

-- 6. Grants --------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.rooms_invite(uuid, uuid, uuid, integer, integer)',
    'public.rooms_answer_invite(uuid, uuid, boolean)',
    'public.my_notifications(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
