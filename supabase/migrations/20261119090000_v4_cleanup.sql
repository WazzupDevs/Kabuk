-- Step 4.8b (docs/SPEC_V4.md §4.H "4.8 temizliği"): the old table model leaves the database. 4.8a
-- took every reader out of the app, the Edge Functions and the tests (scripts/v4-cleanup.test.ts);
-- 4.8b-1 took the venue chat's `profiled` field out of venue-chat (MIN_APP_BUILD 0.9.3). Here go
-- the game proposals, the side model, the old lobby reads, the headcount at check-in, the owner and
-- guest copies on rooms, venue_chat_profiled and rooms_end's unused decision_seconds.
--
-- Not here: each team game's own SQL (tabu_*, sahtekar_*, ibre_*, say_*, *_local_deck,
-- private.side_leader, phone_side, room_side_headcount, tabu_mode): their start is update_required
-- since step 4.5 and they go with each game's per-person step (4.6.x). Nor
-- join_requests.requester_headcount and play_history.other_headcount (still read).
--
-- Locks (rule 10): no new path; the functions written again lock as before.

-- 1. Functions that wrote the old columns, without them ---------------------------------------------

-- The owner's name copy (rooms.owner_alias) goes; the table's name is rooms.name.
create or replace function private.room_name_and_icon()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_venue_names(new.venue_id);
  if new.icon is null then
    new.icon := private.free_table_icon(new.venue_id);
  else
    perform private.check_table_icon(new.venue_id, new.icon, null);
  end if;
  if new.name is null then
    new.name := coalesce(
      (select i.name from public.table_icons i where i.id = new.icon),
      private.free_table_name(new.venue_id)
    );
  end if;
  return new;
end;
$$;

create or replace function public.rooms_set_icon(target_user_id uuid, target_room_id uuid, new_icon text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  icon_name text;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  -- The same icon again changes nothing (and the caller announces nothing).
  if r.icon is not distinct from new_icon then
    return r;
  end if;
  perform private.lock_venue_names(r.venue_id);
  perform private.check_table_icon(r.venue_id, new_icon, r.id);
  select i.name into icon_name from public.table_icons i where i.id = new_icon;
  update public.rooms
  set icon = new_icon, name = icon_name
  where id = r.id
  returning * into r;
  return r;
end;
$$;

create or replace function public.rooms_reroll_name(target_user_id uuid, target_room_id uuid, max_rerolls integer)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r public.rooms;
  picked text;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  if r.name_rerolls >= max_rerolls then
    raise exception using errcode = 'P0001', message = 'reroll_limit';
  end if;
  perform private.lock_venue_names(r.venue_id);
  picked := private.free_table_name(r.venue_id);
  if picked is null then
    raise exception using errcode = 'P0001', message = 'alias_exhausted';
  end if;
  update public.rooms set name = picked, name_rerolls = name_rerolls + 1
  where id = r.id
  returning * into r;
  return r;
end;
$function$
;

-- The owner's profiled copy goes; the seat (room_members.profiled) says it.
create or replace function public.rooms_create(target_user_id uuid, in_lobby boolean DEFAULT true, new_intent text DEFAULT NULL::text, new_game_tag text DEFAULT NULL::text, new_icon text DEFAULT NULL::text)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.table_sessions;
  seat record;
  created public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  if private.open_room_of_session(s.id) is not null then
    raise exception using errcode = 'P0001', message = 'already_in_table';
  end if;
  select * into seat from private.table_seat(s.id);

  insert into public.rooms
    (venue_id, owner_session_id, visibility, status, intent, game_tag, icon, phones)
  values (s.venue_id, s.id, case when in_lobby then 'open' else 'private' end, 'active', new_intent,
          new_game_tag, new_icon, 1)
  returning * into created;

  perform private.close_stale_member_rows(s.id);
  insert into public.room_members (room_id, session_id, alias, profiled, joined_at)
  values (created.id, s.id, seat.alias, seat.profiled, created.created_at);
  return created;
end;
$function$
;

create or replace function private.leave_room(target_room_id uuid, target_session_id uuid, how text)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
                              else owner_session_id end
  where id = r.id
  returning * into r;
  return r;
end;
$function$
;

-- The check-in identity is the venue chat's too (§4.D); venue_chat_profiled goes.
create or replace function public.set_checkin_identity(target_user_id uuid, new_mode text)
 RETURNS table_sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ts public.table_sessions;
begin
  if new_mode not in ('anonymous', 'profiled') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into ts from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;
  if ts.identity_mode = new_mode then
    return ts;
  end if;
  if ts.identity_switches >= 1 then
    raise exception using errcode = 'P0001', message = 'identity_switch_used';
  end if;
  if private.has_open_request(ts.id) then
    raise exception using errcode = 'P0001', message = 'request_pending';
  end if;
  if new_mode = 'profiled' and not public.has_profile_photo(target_user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;
  update public.table_sessions
  set identity_mode = new_mode,
      identity_switches = identity_switches + 1
  where id = ts.id
  returning * into ts;
  return ts;
end;
$function$
;

-- A member of the table now, from room_members alone (no guest seat).
create or replace function public.room_member_profiles(target_room_id uuid)
 RETURNS TABLE(session_id uuid, public_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select distinct on (rm.session_id) rm.session_id, p.public_id
  from public.rooms r
  join public.table_sessions me
    on me.user_id = (select auth.uid()) and me.status = 'active'
  join public.room_members rm on rm.room_id = r.id
  join public.table_sessions other on other.id = rm.session_id
  join public.profiles p on p.id = other.user_id
  where r.id = target_room_id
    and exists (
      select 1 from public.room_members mine
      where mine.room_id = r.id and mine.session_id = me.id and mine.left_at is null
    )
    and rm.profiled
    and other.user_id <> me.user_id
    and r.status in ('waiting', 'active')
    and rm.left_at is null
    and not private.is_blocked_between(me.user_id, other.user_id)
  order by rm.session_id;
$function$
;

-- 2. The venue chat: the identity the app shows, nothing else --------------------------------------
-- The old app's `profiled` (a first message choosing the mode) is gone with venue_chat_profiled;
-- so are venue_chat_mode_locked and the old wrapper venue_chat_send (nothing calls it).
drop function public.venue_chat_send(uuid, uuid, text, integer, integer, integer, uuid, boolean, text);
drop function public.venue_chat_send_once(
  uuid, uuid, text, integer, integer, integer, uuid, boolean, text, uuid
);

create function public.venue_chat_send_once(target_user_id uuid, target_venue_id uuid, new_body text, min_interval_ms integer, window_seconds integer, window_max integer, expected_identity text, reply_to uuid DEFAULT NULL::uuid, new_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(message_id uuid, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ts public.table_sessions;
  rate public.venue_chat_rate;
  msg public.venue_chat_messages;
  prior public.venue_chat_messages;
  p public.profiles;
  chosen text;
begin
  select * into ts from public.table_sessions
  where user_id = target_user_id and venue_id = target_venue_id
    and status = 'active' and expires_at > now()
  for no key update;

  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;

  -- Sent before (its answer lost): the same message, nothing new. Read after the check-in's lock,
  -- so a send running at the same time has finished.
  if new_client_id is not null then
    select * into prior from public.venue_chat_messages
    where sender_user_id = target_user_id and client_id = new_client_id;
    if prior.id is not null then
      if prior.session_id <> ts.id or prior.venue_id <> target_venue_id
        or prior.body <> new_body or prior.reply_to_id is distinct from reply_to then
        raise exception using errcode = 'P0001', message = 'client_id_reused';
      end if;
      if prior.profiled <> (expected_identity = 'profiled') then
        raise exception using errcode = 'P0001', message = 'identity_mismatch';
      end if;
      message_id := prior.id;
      replayed := true;
      return next;
      return;
    end if;
  end if;

  -- The message goes with the check-in's identity; the one the app shows must be it.
  if expected_identity is distinct from ts.identity_mode then
    raise exception using errcode = 'P0001', message = 'identity_mismatch';
  end if;
  chosen := ts.identity_mode;
  if reply_to is not null and (
    (private.visible_venue_chat_message(target_user_id, reply_to)).venue_id
      is distinct from target_venue_id
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  insert into public.venue_chat_rate (user_id, window_started_at, count, last_sent_at)
  values (target_user_id, '-infinity', 0, '-infinity')
  on conflict (user_id) do nothing;
  select * into rate from public.venue_chat_rate where user_id = target_user_id for update;
  if now() - rate.last_sent_at < make_interval(secs => min_interval_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'too_soon';
  end if;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.venue_chat_rate
    set window_started_at = now(), count = 1, last_sent_at = now()
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.venue_chat_rate
    set count = count + 1, last_sent_at = now()
    where user_id = target_user_id;
  end if;

  -- The message carries the identity's own name and never the table alias (rule 4, §4.D): an account
  -- without a nick (check-in and the own profile give one, _shared/capsule.ts) writes nothing.
  select * into p from public.profiles where id = target_user_id;
  if (case when chosen = 'profiled' then p.display_name else p.capsule_nick end) is null then
    raise exception using errcode = 'P0001', message = 'onboarding_required';
  end if;
  insert into public.venue_chat_messages
    (venue_id, session_id, sender_user_id, sender_alias, profiled, sender_look, body, reply_to_id,
     replied, client_id)
  values
    (target_venue_id, ts.id, target_user_id,
     case when chosen = 'profiled' then p.display_name else p.capsule_nick end,
     chosen = 'profiled',
     case when chosen = 'profiled' then null else p.capsule_look end,
     new_body, reply_to, reply_to is not null, new_client_id)
  returning * into msg;
  message_id := msg.id;
  replayed := false;
  return next;
end;
$function$
;

revoke all on function public.venue_chat_send_once(
  uuid, uuid, text, integer, integer, integer, text, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.venue_chat_send_once(
  uuid, uuid, text, integer, integer, integer, text, uuid, uuid
) to service_role;

-- 3. rooms_end without decision_seconds (23.4b; the rooms function stopped sending it) -------------
drop function public.rooms_end(uuid, integer);

create function public.rooms_end(target_user_id uuid)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.table_sessions;
  r public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = private.open_room_of_session(s.id) for update;
  if r.id is null or r.status = 'closed' then
    return r;
  end if;
  if r.owner_session_id <> s.id then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  return private.end_table(r.id);
end;
$function$
;

revoke all on function public.rooms_end(uuid) from public, anon, authenticated;
grant execute on function public.rooms_end(uuid) to service_role;

-- 4. The game proposals ------------------------------------------------------------------------------
select cron.unschedule('expire-game-proposals');
drop function private.expire_game_proposals();
drop function public.rooms_propose_game(uuid, uuid, text, integer, integer);
drop function public.rooms_answer_game(
  uuid, uuid, boolean, integer, integer, integer, integer, integer, integer
);
drop table public.game_proposals;

-- 5. The old lobby reads and the rest of the two-seat model ----------------------------------------
drop function public.venue_lobby_tags(uuid);
drop function public.venue_lobby_phones(uuid);
drop function public.venue_lobby(uuid);
drop function public.venue_running_rooms(uuid);
drop function public.room_phones(uuid);
drop function public.room_member_profile(uuid);
drop function public.sohbet_next(uuid, uuid, integer);
drop function private.room_membership(uuid, uuid);
drop function private.own_waiting_room(uuid);
drop trigger rooms_guest_joined_at on public.rooms;
drop function private.set_guest_joined_at();

-- A join request is read by the table's owner (the side's leader is gone with the sides).
drop policy "join_requests: the side's leader reads" on public.join_requests;
create policy "join_requests: room owner reads"
  on public.join_requests for select
  to authenticated
  using (private.is_room_owner(room_id));
drop function private.is_request_approver(uuid, text, boolean);

drop function private.was_on_side(uuid, uuid, text);
drop function private.side_headcount(smallint, smallint);
drop function private.max_side_phones();

-- 6. The columns -------------------------------------------------------------------------------------
-- The live reads of room_members filter on the seats still taken; the side index goes with side.
create index room_members_room_live_idx on public.room_members (room_id) where left_at is null;

alter table public.room_members drop column side;
alter table public.join_requests drop column side;
alter table public.table_sessions
  drop column alias,
  drop column alias_rerolls,
  drop column headcount,
  drop column team_capable,
  drop column venue_chat_profiled;
alter table public.rooms
  drop column owner_alias,
  drop column owner_headcount,
  drop column owner_phones,
  drop column owner_profiled,
  drop column guest_session_id,
  drop column guest_alias,
  drop column guest_headcount,
  drop column guest_phones,
  drop column guest_profiled,
  drop column guest_joined_at;
