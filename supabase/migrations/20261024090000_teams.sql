-- Faz 2 step 22.2: teams, joining and leaving (docs/SPEC_V3.md §22.B–§22.D, §22.H–§22.K).
--
-- A room still has two sides (owner, guest). rooms.owner_session_id / guest_session_id are the
-- sides' leaders; a side takes up to 4 phones (the leader and up to 3 members). room_members has a
-- row for every phone in a room, leaders included, so "one room per phone" is one partial unique
-- index and every phone's time in a room is one interval.
--
-- Old apps keep today's behaviour: a phone joins a side as a member only when it and both leaders
-- said `teams: true` at check-in (table_sessions.team_capable), and an owner's side with members is
-- never offered to a table without it (§22.B "Ters yön"). With no members every function below
-- answers exactly as before, so the existing integration tests stay as they are (§22.M).
--
-- Games (22.3) and the reveal (22.4) stay with the two leaders in this step: room_membership, the
-- game functions and reveal_decide still take only the leaders. Members read the room, chat,
-- report, block and leave.

-- Columns -------------------------------------------------------------------------------------------
alter table public.table_sessions add column team_capable boolean not null default false;

-- The phones on each side, for the lobby and the room screen; frozen during the reveal window
-- (rule 5). guest_phones is null while there is no guest side.
alter table public.rooms
  add column owner_phones smallint not null default 1 check (owner_phones between 1 and 4),
  add column guest_phones smallint check (guest_phones between 1 and 4);

update public.rooms set guest_phones = 1
where status <> 'closed' and guest_session_id is not null;

-- side: the side the request is for. as_member: false = "Katıl" (the guest's side as its leader),
-- true = "Bu masadayım" (a side as a member).
alter table public.join_requests
  add column side text not null default 'guest' check (side in ('owner', 'guest')),
  add column as_member boolean not null default false;

-- The numbers of pure/teams.ts; a test checks that they agree.
create function private.max_side_phones()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 4;
$$;

-- A side's headcount: the larger of what the side declared and its phones (pure/teams.ts →
-- sideHeadcount). Null without the side.
create function private.side_headcount(declared smallint, phones smallint)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select greatest(declared, phones);
$$;

revoke all on function private.max_side_phones() from public, anon, authenticated;
revoke all on function private.side_headcount(smallint, smallint) from public, anon, authenticated;

-- room_members ----------------------------------------------------------------------------------------
-- No account id: the account is found through table_sessions, on the server only. Clients read the
-- phones of their room through room_phones() and never this table.
create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  side text not null check (side in ('owner', 'guest')),
  alias text not null,
  profiled boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  check (left_at is null or left_at >= joined_at)
);

-- A phone is in one room at a time, as a leader or as a member.
create unique index room_members_one_room_per_session on public.room_members (session_id)
  where left_at is null;
create index room_members_room_side_idx on public.room_members (room_id, side)
  where left_at is null;
create index room_members_session_idx on public.room_members (session_id);

alter table public.room_members enable row level security;
revoke all on table public.room_members from anon, authenticated;

-- The leaders of the rooms still open. A table may lead a room whose window is running and already
-- a newer one (it went on, review_fixes): only its newest room keeps the row open.
insert into public.room_members (room_id, session_id, side, alias, profiled, joined_at, left_at)
select room_id, session_id, side, alias, profiled, joined_at,
       case when rn > 1 then greatest(now(), joined_at) end
from (
  select l.*,
         row_number() over (
           partition by l.session_id
           order by (l.status in ('waiting', 'active')) desc, l.created_at desc
         ) as rn
  from (
    select id as room_id, owner_session_id as session_id, 'owner' as side, owner_alias as alias,
           owner_profiled as profiled, created_at as joined_at, status, created_at
    from public.rooms
    where status <> 'closed'
    union all
    select id, guest_session_id, 'guest', guest_alias, guest_profiled,
           coalesce(guest_joined_at, created_at), status, created_at
    from public.rooms
    where status <> 'closed' and guest_session_id is not null
  ) l
) ranked;

-- Helpers ---------------------------------------------------------------------------------------------
-- The side a phone is (or was) on in a room: a leader by the room's row, a member by its newest row.
create function private.phone_side(target_room_id uuid, target_session_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_session_id = r.owner_session_id then 'owner'
    when target_session_id = r.guest_session_id then 'guest'
    else (
      select rm.side from public.room_members rm
      where rm.room_id = r.id and rm.session_id = target_session_id
      order by rm.joined_at desc
      limit 1
    )
  end
  from public.rooms r
  where r.id = target_room_id;
$$;

-- Whether the account has ever been on a side of the room (§22.B: one side per account).
create function private.was_on_side(target_room_id uuid, target_user_id uuid, target_side text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.side = target_side and ts.user_id = target_user_id
  );
$$;

-- A block between the account and any phone in the room now (the leaders always count).
create function private.room_blocked_for(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.table_sessions ts on ts.id in (r.owner_session_id, r.guest_session_id)
    where r.id = target_room_id and private.is_blocked_between(ts.user_id, target_user_id)
  ) or exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and private.is_blocked_between(ts.user_id, target_user_id)
  );
$$;

revoke all on function private.phone_side(uuid, uuid) from public, anon, authenticated;
revoke all on function private.was_on_side(uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.room_blocked_for(uuid, uuid) from public, anon, authenticated;

-- A phone going into a room leaves the room it still holds a row in: one whose reveal window is
-- running (a phone may go on during the window, review_fixes). A member's leaving is its "Hayır"
-- there (§22.F); a leader's answer stays as it is, as today. Rows in waiting or active rooms are
-- never touched here: the callers refuse a phone that is in one (open_room_of_session).
create function private.close_stale_member_rows(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stale record;
begin
  for stale in
    select rm.id, rm.room_id,
           target_session_id in (r.owner_session_id, coalesce(r.guest_session_id, r.owner_session_id))
             as leader
    from public.room_members rm
    join public.rooms r on r.id = rm.room_id
    where rm.session_id = target_session_id and rm.left_at is null
      and r.status not in ('waiting', 'active')
    for update of rm
  loop
    update public.room_members set left_at = now() where id = stale.id;
    if not stale.leader then
      insert into public.reveal_decisions (room_id, session_id, wants_meet)
      values (stale.room_id, target_session_id, false)
      on conflict (room_id, session_id) do update set wants_meet = false;
    end if;
  end loop;
end;
$$;

revoke all on function private.close_stale_member_rows(uuid) from public, anon, authenticated;

-- The owner's row comes with the room, for every way a room is created.
create function private.on_room_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.close_stale_member_rows(new.owner_session_id);
  insert into public.room_members (room_id, session_id, side, alias, profiled, joined_at)
  values (new.id, new.owner_session_id, 'owner', new.owner_alias, new.owner_profiled, new.created_at);
  return null;
end;
$$;

-- A closed room holds nobody.
create function private.on_room_closed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.room_members set left_at = now()
  where room_id = new.id and left_at is null;
  return null;
end;
$$;

revoke all on function private.on_room_created() from public, anon, authenticated;
revoke all on function private.on_room_closed() from public, anon, authenticated;

create trigger rooms_owner_member
  after insert on public.rooms
  for each row
  execute function private.on_room_created();

create trigger rooms_close_members
  after update of status on public.rooms
  for each row
  when (new.status = 'closed' and old.status <> 'closed')
  execute function private.on_room_closed();

-- guest_joined_at is when the guest's side came, not its leader: a new guest leader (§22.D) keeps it,
-- so the side keeps reading the chat from the same moment. Only null ↔ a guest moves it, as before.
create or replace function private.set_guest_joined_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.guest_session_id is null) is distinct from (old.guest_session_id is null) then
    new.guest_joined_at := case when new.guest_session_id is null then null else now() end;
  end if;
  return new;
end;
$$;

-- Play history: a leader handing over (§22.D) writes nothing; the pairs of every phone come with
-- step 22.4 (private.write_pair_history). Until then the room's end writes the two leaders' rows, as
-- before. Otherwise as in 20261010090000_room_flow.sql.
create or replace function private.on_room_encounter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_s public.table_sessions;
  guest_s public.table_sessions;
  encounter uuid;
  available timestamptz;
  played text;
begin
  if old.status = 'ending' and new.status = 'closed' and new.reveal_result = 'mutual' then
    update public.play_history
    set reveal_mutual = true, available_at = now()
    where room_id = new.id and available_at = old.reveal_ends_at;
    return null;
  end if;

  if old.guest_session_id is null or old.status not in ('waiting', 'active') then
    return null;
  end if;
  -- Still open: a leader handed over, or the phone counts moved.
  if new.status in ('waiting', 'active') then
    return null;
  end if;
  if old.guest_joined_at is null or now() - old.guest_joined_at < interval '3 minutes' then
    return null;
  end if;

  select * into owner_s from public.table_sessions where id = old.owner_session_id;
  select * into guest_s from public.table_sessions where id = old.guest_session_id;
  if owner_s.user_id is null or guest_s.user_id is null or owner_s.user_id = guest_s.user_id then
    return null;
  end if;

  available := case when new.status = 'ending' then new.reveal_ends_at else now() end;
  played := coalesce(old.concept, old.game_state -> 'lastGame' ->> 'concept', 'chat');
  encounter := gen_random_uuid();

  insert into public.play_history (
    encounter_id, user_id, other_user_id, other_profiled, room_id, concept, mode, intent,
    own_alias, other_alias, other_headcount, started_at, played_at, available_at
  )
  values
    (encounter, owner_s.user_id, guest_s.user_id, old.guest_profiled, old.id, played,
     case when played = 'tabu' then 'voice' else 'text' end, old.intent,
     old.owner_alias, old.guest_alias, old.guest_headcount, old.guest_joined_at, now(), available),
    (encounter, guest_s.user_id, owner_s.user_id, old.owner_profiled, old.id, played,
     case when played = 'tabu' then 'voice' else 'text' end, old.intent,
     old.guest_alias, old.owner_alias, old.owner_headcount, old.guest_joined_at, now(), available)
  on conflict do nothing;
  return null;
end;
$$;

-- A phone's room: waiting or active, as a leader or as a member. Otherwise as in
-- 20261001090000_review_fixes.sql.
create or replace function private.open_room_of_session(target_session_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from (
    select r.id from public.rooms r
    where r.status in ('waiting', 'active')
      and (r.owner_session_id = target_session_id or r.guest_session_id = target_session_id)
    union all
    select r.id
    from public.room_members rm
    join public.rooms r on r.id = rm.room_id
    where rm.session_id = target_session_id and rm.left_at is null
      and r.status in ('waiting', 'active')
  ) found
  limit 1;
$$;

-- Reads: the two leaders (as before, also after the room closed) and the members while they are
-- in the room (§22.I). A phone that leaves loses the room at once.
create or replace function private.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.table_sessions ts on ts.id in (r.owner_session_id, r.guest_session_id)
    where r.id = target_room_id and ts.user_id = (select auth.uid())
  ) or exists (
    select 1
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = target_room_id and rm.left_at is null
      and ts.user_id = (select auth.uid())
  );
$$;

-- Messages and game events: the owner's side reads them all, the guest's side from the moment it
-- came (guest_joined_at); members only while in the room. Otherwise as in
-- 20260928090000_chat_and_safety.sql.
create or replace function private.can_read_room_message(target_room_id uuid, sent_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.table_sessions ts on ts.user_id = (select auth.uid())
    where r.id = target_room_id
      and (
        ts.id = r.owner_session_id
        or (ts.id = r.guest_session_id and sent_at >= r.guest_joined_at)
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.session_id = ts.id and rm.left_at is null
            and (rm.side = 'owner' or sent_at >= r.guest_joined_at)
        )
      )
  );
$$;

-- Lobby hold (20261002090000_lobby_hold.sql) for every phone of a window: the leaders as before,
-- and the members who were in the room when its window opened (§22.F "Pencere sürerken lobi").
-- The window opens reveal_decision_seconds() before reveal_ends_at on every path.
create or replace function private.lobby_listed_from(target_session_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select max(ends_at) from (
    select reveal_ends_at as ends_at from public.rooms where owner_session_id = target_session_id
    union all
    select reveal_ends_at from public.rooms where guest_session_id = target_session_id
    union all
    select r.reveal_ends_at
    from public.room_members rm
    join public.rooms r on r.id = rm.room_id
    where rm.session_id = target_session_id
      and (rm.left_at is null
           or rm.left_at >= r.reveal_ends_at - make_interval(secs => private.reveal_decision_seconds()))
  ) windows;
$$;

-- A room is held while any of its phones is.
create function private.room_listed_from(target_room_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select max(private.lobby_listed_from(s.session_id))
  from (
    select r.owner_session_id as session_id from public.rooms r where r.id = target_room_id
    union
    select r.guest_session_id from public.rooms r
    where r.id = target_room_id and r.guest_session_id is not null
    union
    select rm.session_id from public.room_members rm
    where rm.room_id = target_room_id and rm.left_at is null
  ) s;
$$;

revoke all on function private.room_listed_from(uuid) from public, anon, authenticated;

create or replace function public.rooms_lobby_held(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.room_listed_from(id) > now(), false)
  from public.rooms where id = target_room_id;
$$;

-- Realtime (rule 9, §22.I): the room channels take the leaders and the members in the room; no one
-- joins presence:{room_id} during the window, where a phone leaving would show (rule 5). Otherwise
-- as in 20261014090000_dm_status.sql.
create or replace function private.realtime_topic_allowed(channel_topic text, sending boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kind text := split_part(channel_topic, ':', 1);
  target text := substr(channel_topic, length(kind) + 2);
  target_id uuid;
begin
  if target !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target_id := target::uuid;

  if kind = 'venue' then
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id and status = 'active'
    );
  elsif kind = 'venue_chat' then
    return not sending
      and (private.venue_chat_session((select auth.uid()), target_id)).id is not null;
  elsif kind = 'session' then
    return not sending and exists (
      select 1 from public.table_sessions
      where id = target_id and user_id = (select auth.uid())
    );
  elsif kind in ('room', 'messages', 'game', 'presence') then
    if kind = 'presence' and exists (
      select 1 from public.rooms where id = target_id and status = 'ending'
    ) then
      return false;
    end if;
    return private.is_room_member(target_id);
  elsif kind = 'inbox' then
    return not sending and target_id = (select auth.uid());
  elsif kind = 'dm' then
    return not sending and exists (
      select 1 from public.dm_threads
      where id = target_id and (select auth.uid()) in (user_a, user_b)
    );
  elsif kind = 'dm_typing' then
    return exists (
      select 1 from public.dm_threads t
      where t.id = target_id and (select auth.uid()) in (t.user_a, t.user_b)
        and not private.is_blocked_between(t.user_a, t.user_b)
    );
  end if;
  return false;
end;
$$;

-- Leaving (§22.D) ---------------------------------------------------------------------------------------
-- One phone leaves a room: rooms/leave ('leave'), leaving the venue, checking in again or running
-- out of time ('release'), blocking someone on the other side or being a member who blocks
-- ('block'), or removed by its leader's block ('removed'). The caller holds the phone's session
-- (or, for 'removed', the leader's and the member's) and locks the room here, then room_members
-- (rule 10). A phone not in the room changes nothing.
--
--   member                       its row closes, the room goes on;
--   leader, others on the side   the side's oldest member leads (joined_at); the declared headcount stays;
--   the side's last phone        as before: a two-sided room opens the window with this phone's "Hayır",
--                                a one-sided room closes.
--
-- During the window nothing about the room changes (rule 5): no hand-over, no phone count. A member's
-- leaving is its "Hayır"; a leader's own leave or block is its "Hayır" too, as a block was before;
-- a leader leaving the venue answers nothing, as before.
create function private.leave_room(target_room_id uuid, target_session_id uuid, how text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  mine public.room_members;
  heir public.room_members;
  my_side text;
  leader boolean;
begin
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' then
    return r;
  end if;
  select * into mine from public.room_members
  where room_id = r.id and session_id = target_session_id and left_at is null
  for update;
  my_side := case
    when target_session_id = r.owner_session_id then 'owner'
    when target_session_id = r.guest_session_id then 'guest'
    else mine.side
  end;
  if my_side is null then
    return r;
  end if;
  leader := target_session_id in (r.owner_session_id, coalesce(r.guest_session_id, r.owner_session_id));

  if mine.id is not null then
    update public.room_members set left_at = now() where id = mine.id;
  end if;

  if r.status = 'ending' then
    if not leader or how in ('leave', 'block') then
      insert into public.reveal_decisions (room_id, session_id, wants_meet)
      values (r.id, target_session_id, false)
      on conflict (room_id, session_id) do update set wants_meet = false;
    end if;
    return r;
  end if;

  if not leader then
    update public.rooms
    set owner_phones = owner_phones - case when my_side = 'owner' then 1 else 0 end,
        guest_phones = guest_phones - case when my_side = 'guest' then 1 else 0 end
    where id = r.id
    returning * into r;
    return r;
  end if;

  select * into heir from public.room_members
  where room_id = r.id and side = my_side and left_at is null and session_id <> target_session_id
  order by joined_at, id
  limit 1
  for update;
  if heir.id is not null then
    if my_side = 'owner' then
      update public.rooms
      set owner_session_id = heir.session_id, owner_alias = heir.alias,
          owner_profiled = heir.profiled, owner_phones = owner_phones - 1
      where id = r.id
      returning * into r;
    else
      update public.rooms
      set guest_session_id = heir.session_id, guest_alias = heir.alias,
          guest_profiled = heir.profiled, guest_phones = guest_phones - 1
      where id = r.id
      returning * into r;
    end if;
    -- A proposal stays the side's (22.3 keys it by side): the new leader holds it.
    update public.game_proposals set proposer_session_id = heir.session_id
    where room_id = r.id and proposer_session_id = target_session_id;
    return r;
  end if;

  if r.guest_session_id is null then
    update public.rooms set status = 'closed', closed_at = now() where id = r.id
    returning * into r;
    return r;
  end if;
  r := private.start_reveal(r.id, private.reveal_decision_seconds());
  insert into public.reveal_decisions (room_id, session_id, wants_meet)
  values (r.id, target_session_id, false)
  on conflict (room_id, session_id) do update set wants_meet = false;
  return r;
end;
$$;

revoke all on function private.leave_room(uuid, uuid, text) from public, anon, authenticated;

-- A table ending (leaving the venue, checking in again, its time running out, the account going)
-- leaves its room through leave_room. Without members this is exactly the step 3 rule: a one-table
-- room closes, a two-table room opens the window with this table's "Hayır", a window already open
-- is left alone. Otherwise as in 20261010090000_room_flow.sql.
create or replace function private.release_rooms_of_session(target_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  n integer := 0;
begin
  for rid in
    select r.id from public.rooms r
    where r.status in ('waiting', 'active')
      and target_session_id in (r.owner_session_id, coalesce(r.guest_session_id, r.owner_session_id))
    union
    select rm.room_id from public.room_members rm
    where rm.session_id = target_session_id and rm.left_at is null
    order by 1
  loop
    perform private.leave_room(rid, target_session_id, 'release');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- rooms/leave { roomId } ("Odadan çık", §22.D). Twice: the second call is not_in_room.
create function public.rooms_leave(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or not exists (
    select 1 from public.room_members
    where room_id = r.id and session_id = s.id and left_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  return private.leave_room(r.id, s.id, 'leave');
end;
$$;

revoke all on function public.rooms_leave(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rooms_leave(uuid, uuid) to service_role;

-- "Odayı bitir": the leaders only (§22.D); a member is not_leader. Otherwise as in
-- 20260930090000_reveal.sql.
create or replace function public.rooms_end(target_user_id uuid, decision_seconds integer)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = private.open_room_of_session(s.id) for update;
  if r.id is null or r.status not in ('waiting', 'active') then
    return r;
  end if;
  if s.id is distinct from r.owner_session_id and s.id is distinct from r.guest_session_id then
    raise exception using errcode = 'P0001', message = 'not_leader';
  end if;
  if r.status = 'active' and r.guest_session_id is not null then
    return private.start_reveal(r.id, decision_seconds);
  end if;
  update public.rooms set status = 'closed', closed_at = now() where id = r.id returning * into r;
  return r;
end;
$$;

-- Joining (§22.C) ---------------------------------------------------------------------------------------
-- target_side null: "Katıl", as before (the guest's side, as its leader). 'owner' or 'guest':
-- "Bu masadayım", a member of that side. One answer, room_not_available, for every reason the room
-- cannot take this table; then wrong_side (only the caller's own past), different_spot,
-- request_pending and the hourly limit, which both kinds share. Otherwise as in
-- 20261010090000_room_flow.sql.
drop function public.rooms_request_join(uuid, uuid, integer, integer, boolean);

create function public.rooms_request_join(
  target_user_id uuid,
  target_room_id uuid,
  ttl_seconds integer,
  max_per_hour integer,
  profiled boolean,
  target_side text default null
)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
  owner public.table_sessions;
  guest public.table_sessions;
  member boolean := target_side is not null;
  joining text := coalesce(target_side, 'guest');
  created public.join_requests;
begin
  s := private.active_session_for_update(target_user_id);
  if private.open_room_of_session(s.id) is not null then
    raise exception using errcode = 'P0001', message = 'already_in_room';
  end if;

  select * into r from public.rooms where id = target_room_id for update;
  select * into owner from public.table_sessions where id = r.owner_session_id;
  select * into guest from public.table_sessions where id = r.guest_session_id;

  if r.id is null
    or r.visibility <> 'open'
    or r.venue_id <> s.venue_id
    or owner.status <> 'active'
    or owner.expires_at <= now()
    or private.room_blocked_for(r.id, s.user_id)
    -- An 'unavailable' answer to "Katıl" from this room is final for this table (MVP_SPEC §4.4).
    or exists (
      select 1 from public.join_requests
      where room_id = r.id and requester_session_id = s.id and not as_member
        and status <> 'accepted' and expires_at <= now()
    )
    or (not member and (
      r.status <> 'waiting'
      or r.guest_session_id is not null
      -- §22.B: an owner's side with members only for a table that can be in a team.
      or (r.owner_phones > 1 and not s.team_capable)
    ))
    or (member and (
      r.status not in ('waiting', 'active')
      or not s.team_capable
      or not owner.team_capable
      or (r.guest_session_id is not null and not coalesce(guest.team_capable, false))
      or (joining = 'guest' and r.guest_session_id is null)
      or (case when joining = 'owner' then r.owner_phones else r.guest_phones end)
           >= private.max_side_phones()
    ))
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;

  if private.was_on_side(r.id, s.user_id, case when joining = 'owner' then 'guest' else 'owner' end) then
    raise exception using errcode = 'P0001', message = 'wrong_side';
  end if;

  if r.spot_id is distinct from s.spot_id then
    raise exception using errcode = 'P0001', message = 'different_spot';
  end if;

  if private.has_open_request(s.id) then
    raise exception using errcode = 'P0001', message = 'request_pending';
  end if;

  if (
    select count(*) from public.join_requests
    where requester_session_id = s.id and created_at > now() - interval '1 hour'
  ) >= max_per_hour then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.join_requests
    (room_id, requester_session_id, requester_alias, requester_headcount, requester_profiled,
     side, as_member, expires_at)
  values (r.id, s.id, s.alias, s.headcount, profiled, joining, member,
          now() + make_interval(secs => ttl_seconds))
  returning * into created;
  return created;
end;
$$;

revoke all on function public.rooms_request_join(uuid, uuid, integer, integer, boolean, text)
  from public, anon, authenticated;
grant execute on function public.rooms_request_join(uuid, uuid, integer, integer, boolean, text)
  to service_role;

-- The answer. "Katıl": the owner answers, as in 20261010090000_room_flow.sql; on accept the guest's
-- side starts with its leader and only the other "Katıl" requests are declined. "Bu masadayım":
-- the side's current leader answers; on accept the phone joins the side. An accept that the room
-- cannot take any more is room_not_available and leaves the request pending, so its requester sees
-- it as unavailable at expires_at, the same as a decline (rule 5).
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
  owner public.table_sessions;
  guest public.table_sessions;
  leader public.table_sessions;
  requester public.table_sessions;
  leader_session uuid;
begin
  select * into jr from public.join_requests where id = target_request_id;
  if jr.id is null then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;

  if jr.as_member then
    -- §22.K: the request read unlocked; the requester's and the leader's sessions in id order, the
    -- room, the side's rows, then the request again under the lock.
    select case when jr.side = 'guest' then guest_session_id else owner_session_id end
    into leader_session
    from public.rooms where id = jr.room_id;
    perform 1 from public.table_sessions
    where id in (jr.requester_session_id, leader_session)
    order by id
    for no key update;
    select * into r from public.rooms where id = jr.room_id for update;
    perform 1 from public.room_members
    where room_id = r.id and side = jr.side and left_at is null
    for update;
    -- Before the request (rule 10); rolled back with everything else if the accept is refused.
    if accept then
      perform private.close_stale_member_rows(jr.requester_session_id);
    end if;
    select * into jr from public.join_requests where id = target_request_id for update;
    select * into leader from public.table_sessions
    where id = case when jr.side = 'guest' then r.guest_session_id else r.owner_session_id end;

    if jr.id is null or leader.user_id is distinct from target_user_id then
      raise exception using errcode = 'P0001', message = 'request_not_found';
    end if;
    if jr.status <> 'pending' or jr.expires_at <= now() then
      raise exception using errcode = 'P0001', message = 'request_expired';
    end if;
    if not accept then
      update public.join_requests set status = 'declined', responded_at = now()
      where id = jr.id returning * into jr;
      return jr;
    end if;

    select * into requester from public.table_sessions where id = jr.requester_session_id;
    select * into owner from public.table_sessions where id = r.owner_session_id;
    select * into guest from public.table_sessions where id = r.guest_session_id;
    if r.status not in ('waiting', 'active')
      or r.visibility <> 'open'
      or requester.status <> 'active' or requester.expires_at <= now()
      or requester.venue_id <> r.venue_id
      or not requester.team_capable
      or not owner.team_capable
      or (r.guest_session_id is not null and not coalesce(guest.team_capable, false))
      or (jr.side = 'guest' and r.guest_session_id is null)
      or (case when jr.side = 'owner' then r.owner_phones else r.guest_phones end)
           >= private.max_side_phones()
      or private.open_room_of_session(requester.id) is not null
      or private.room_blocked_for(r.id, requester.user_id)
      or private.was_on_side(r.id, requester.user_id,
                             case when jr.side = 'owner' then 'guest' else 'owner' end)
    then
      raise exception using errcode = 'P0001', message = 'room_not_available';
    end if;

    insert into public.room_members (room_id, session_id, side, alias, profiled)
    values (r.id, requester.id, jr.side, requester.alias, jr.requester_profiled);
    update public.rooms
    set owner_phones = owner_phones + case when jr.side = 'owner' then 1 else 0 end,
        guest_phones = guest_phones + case when jr.side = 'guest' then 1 else 0 end,
        last_activity_at = now()
    where id = r.id;
    update public.join_requests set status = 'accepted', responded_at = now()
    where id = jr.id returning * into jr;
    return jr;
  end if;

  select * into requester from public.table_sessions
  where id = jr.requester_session_id
  for no key update;
  select * into r from public.rooms where id = jr.room_id for update;
  if accept then
    perform private.close_stale_member_rows(jr.requester_session_id);
  end if;
  select * into jr from public.join_requests where id = target_request_id for update;
  select * into owner from public.table_sessions where id = r.owner_session_id;

  if jr.id is null or owner.user_id is distinct from target_user_id then
    raise exception using errcode = 'P0001', message = 'request_not_found';
  end if;
  if jr.status <> 'pending' or jr.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;

  if not accept then
    update public.join_requests set status = 'declined', responded_at = now()
    where id = jr.id returning * into jr;
    return jr;
  end if;

  if r.status <> 'waiting'
    or r.guest_session_id is not null
    or owner.status <> 'active' or owner.expires_at <= now()
    or requester.status <> 'active' or requester.expires_at <= now()
    or requester.venue_id <> r.venue_id
    or private.open_room_of_session(requester.id) is not null
    or private.is_blocked_between(owner.user_id, requester.user_id)
  then
    raise exception using errcode = 'P0001', message = 'request_expired';
  end if;
  -- §22.B: members came to the owner's side while the request waited.
  if (r.owner_phones > 1 and not requester.team_capable)
    or private.room_blocked_for(r.id, requester.user_id)
    or private.was_on_side(r.id, requester.user_id, 'owner')
  then
    raise exception using errcode = 'P0001', message = 'room_not_available';
  end if;

  update public.rooms
  set guest_session_id = requester.id, guest_alias = requester.alias,
      guest_headcount = requester.headcount, guest_profiled = jr.requester_profiled,
      guest_phones = 1,
      status = 'active', last_activity_at = now(),
      concept = null, game_state = private.between_games(game_state, null)
  where id = r.id;
  insert into public.room_members (room_id, session_id, side, alias, profiled)
  values (r.id, requester.id, 'guest', requester.alias, jr.requester_profiled);

  update public.join_requests set status = 'declined', responded_at = now()
  where room_id = r.id and status = 'pending' and id <> jr.id and not as_member;

  update public.join_requests set status = 'accepted', responded_at = now()
  where id = jr.id returning * into jr;
  return jr;
end;
$$;

-- The raw request rows: "Katıl" for the owner, "Bu masadayım" for the side's current leader (a new
-- leader reads the requests that waited for the old one). The requester still reads only
-- my_join_requests (rule 5).
create function private.is_request_approver(target_room_id uuid, target_side text, member boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    join public.table_sessions ts
      on ts.id = case when member and target_side = 'guest' then r.guest_session_id
                      else r.owner_session_id end
    where r.id = target_room_id and ts.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_request_approver(uuid, text, boolean) from public, anon;
grant execute on function private.is_request_approver(uuid, text, boolean) to authenticated;

drop policy "join_requests: room owner reads" on public.join_requests;

create policy "join_requests: the side's leader reads"
  on public.join_requests for select
  to authenticated
  using (private.is_request_approver(room_id, side, as_member));

-- The room chat, reports and blocks for every phone in the room --------------------------------------------
-- The caller's phone in the room: a leader (also in the window, as before) or a member in the room.
-- Locks the caller's session, then the room; not_in_room otherwise.
create function private.room_phone(target_user_id uuid, target_room_id uuid)
returns table (session_id uuid, side text, is_leader boolean, other_leader uuid, other_alias text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  r public.rooms;
  member_side text;
begin
  s := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if s.id = r.owner_session_id then
    return query select s.id, 'owner'::text, true, r.guest_session_id, r.guest_alias;
    return;
  end if;
  if s.id = r.guest_session_id then
    return query select s.id, 'guest'::text, true, r.owner_session_id, r.owner_alias;
    return;
  end if;
  select rm.side into member_side from public.room_members rm
  where rm.room_id = r.id and rm.session_id = s.id and rm.left_at is null;
  if member_side is null then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  return query
    select s.id, member_side, false,
           case when member_side = 'owner' then r.guest_session_id else r.owner_session_id end,
           case when member_side = 'owner' then r.guest_alias else r.owner_alias end;
end;
$$;

revoke all on function private.room_phone(uuid, uuid) from public, anon, authenticated;

-- As in 20261021090000_replies_reactions.sql, for every phone: the sender's own alias, a reply to a
-- message its side can read.
create or replace function public.chat_send(
  target_user_id uuid,
  target_room_id uuid,
  new_body text,
  min_interval_ms integer,
  reply_to uuid default null
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  s public.table_sessions;
  r public.rooms;
  created public.messages;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select * into s from public.table_sessions where id = p.session_id;

  if reply_to is not null then
    select * into r from public.rooms where id = target_room_id;
    if not exists (
      select 1 from public.messages q
      where q.id = reply_to and q.room_id = target_room_id
        and (p.side = 'owner' or q.created_at >= r.guest_joined_at)
    ) then
      raise exception using errcode = 'P0001', message = 'reply_unavailable';
    end if;
  end if;

  if exists (
    select 1 from public.messages
    where session_id = s.id
      and created_at > clock_timestamp() - make_interval(secs => min_interval_ms / 1000.0)
  ) then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.messages
    (room_id, session_id, sender_alias, body, created_at, reply_to_id, replied)
  values
    (target_room_id, s.id, s.alias, new_body, clock_timestamp(), reply_to, reply_to is not null)
  returning * into created;

  update public.rooms set last_activity_at = now() where id = target_room_id;
  return created;
end;
$$;

create or replace function public.chat_react(target_user_id uuid, target_message_id uuid, new_emoji text)
returns table (room_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg public.messages;
  p record;
  r public.rooms;
  before_emoji text;
begin
  -- Read unlocked first (rule 10: the session and the room lock before the room's rows).
  select * into msg from public.messages where id = target_message_id;
  if msg.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  select * into p from private.room_phone(target_user_id, msg.room_id);
  select * into r from public.rooms where id = msg.room_id;
  if p.side = 'guest' and msg.created_at < r.guest_joined_at then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;

  select emoji into before_emoji from public.message_reactions
  where message_id = msg.id and session_id = p.session_id;
  if new_emoji is null then
    delete from public.message_reactions where message_id = msg.id and session_id = p.session_id;
  else
    insert into public.message_reactions (message_id, session_id, emoji)
    values (msg.id, p.session_id, new_emoji)
    on conflict (message_id, session_id) do update set emoji = excluded.emoji, created_at = now()
    where public.message_reactions.emoji <> excluded.emoji;
  end if;
  return query select msg.room_id, before_emoji is distinct from new_emoji;
end;
$$;

-- A quote older than the reader's side is gone for the guest's side. Otherwise as in
-- 20261021090000_replies_reactions.sql.
create or replace function private.room_quote(viewer_session uuid, m public.messages)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not m.replied then null
    when q.id is null
      or (private.phone_side(r.id, viewer_session) = 'guest' and q.created_at < r.guest_joined_at)
      then jsonb_build_object('gone', true)
    else jsonb_build_object(
      'id', q.id, 'body', left(q.body, 80), 'from_me', q.session_id = viewer_session,
      'name', q.sender_alias
    )
  end
  from public.rooms r
  left join public.messages q on q.id = m.reply_to_id and q.room_id = m.room_id
  where r.id = m.room_id;
$$;

create or replace function public.room_chat_extras(target_room_id uuid)
returns table (message_id uuid, reply_to jsonb, reactions jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select ts.id as session_id, private.phone_side(r.id, ts.id) as side, r.guest_joined_at
    from public.rooms r
    join public.table_sessions ts on ts.user_id = (select auth.uid())
    where r.id = target_room_id
      and (
        ts.id in (r.owner_session_id, coalesce(r.guest_session_id, r.owner_session_id))
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.session_id = ts.id and rm.left_at is null
        )
      )
    limit 1
  )
  select m.id,
         private.room_quote(v.session_id, m),
         private.room_reaction_list(v.session_id, m.id)
  from viewer v
  join public.messages m on m.room_id = target_room_id
  where (v.side = 'owner' or m.created_at >= v.guest_joined_at)
    and (m.replied or exists (select 1 from public.message_reactions x where x.message_id = m.id));
$$;

-- A room report from any phone: the copy holds the messages its side could read, from every phone
-- (§22.J); the reported account is the other side's leader, as before. Otherwise as in
-- 20260928090000_chat_and_safety.sql.
create or replace function public.safety_report(target_user_id uuid, target_room_id uuid, new_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p record;
  reported uuid;
  snapshot jsonb;
  guest_since timestamptz;
  report_id uuid;
begin
  select * into p from private.room_phone(target_user_id, target_room_id);
  select user_id into reported from public.table_sessions where id = p.other_leader;
  select case when p.side = 'owner' then null else guest_joined_at end into guest_since
  from public.rooms where id = target_room_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'alias', last50.sender_alias, 'body', last50.body, 'created_at', last50.created_at
         ) order by last50.created_at), '[]'::jsonb)
  into snapshot
  from (
    select sender_alias, body, created_at from public.messages
    where room_id = target_room_id and (guest_since is null or created_at >= guest_since)
    order by created_at desc
    limit 50
  ) last50;

  insert into public.reports (reporter_id, reported_user_id, room_id, reason, messages_snapshot)
  values (target_user_id, reported, target_room_id, new_reason, snapshot)
  returning id into report_id;
  return report_id;
end;
$$;

-- safety/block { roomId, sessionId? } (§22.D). Without sessionId the other side's leader, as before.
-- Who leaves: a leader blocking a member of its own side removes that member and stays; a member
-- leaves whoever it blocks; whoever blocks the other side leaves. Leaving is leave_room, so with
-- two leaders and no members this is the step 3 block: the window opens with the blocker's "Hayır".
drop function public.safety_block(uuid, uuid);

create function public.safety_block(
  target_user_id uuid,
  target_room_id uuid,
  target_session_id uuid default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller public.table_sessions;
  r public.rooms;
  caller_side text;
  caller_leader boolean;
  target uuid := target_session_id;
  target_side text;
  target_alias text;
  blocked uuid;
begin
  -- Read without locks first: a leader removing a member of its own side locks the member's session
  -- too, both in id order, before the room (§22.K).
  select * into caller from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now();
  if target is not null and caller.id is not null
    and caller.id in (select owner_session_id from public.rooms where id = target_room_id
                      union all
                      select guest_session_id from public.rooms where id = target_room_id)
    and private.phone_side(target_room_id, target) = private.phone_side(target_room_id, caller.id)
  then
    perform 1 from public.table_sessions
    where id in (caller.id, target)
    order by id
    for no key update;
  end if;

  caller := private.active_session_for_update(target_user_id);
  select * into r from public.rooms where id = target_room_id for update;
  if r.id is null or r.status = 'closed' then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if caller.id = r.owner_session_id then
    caller_side := 'owner';
    caller_leader := true;
  elsif caller.id = r.guest_session_id then
    caller_side := 'guest';
    caller_leader := true;
  else
    select side into caller_side from public.room_members
    where room_id = r.id and session_id = caller.id and left_at is null;
    caller_leader := false;
  end if;
  if caller_side is null then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;

  if target is null then
    target := case when caller_side = 'owner' then r.guest_session_id else r.owner_session_id end;
  end if;
  if target is null or target = caller.id then
    raise exception using errcode = 'P0001', message = 'nothing_to_block';
  end if;
  if target = r.owner_session_id then
    target_side := 'owner';
    target_alias := r.owner_alias;
  elsif target = r.guest_session_id then
    target_side := 'guest';
    target_alias := r.guest_alias;
  else
    select side, alias into target_side, target_alias from public.room_members
    where room_id = r.id and session_id = target and left_at is null;
  end if;
  if target_side is null then
    raise exception using errcode = 'P0001', message = 'nothing_to_block';
  end if;
  select user_id into blocked from public.table_sessions where id = target;
  if blocked is null or blocked = target_user_id then
    raise exception using errcode = 'P0001', message = 'nothing_to_block';
  end if;

  insert into public.blocks (blocker_id, blocked_id, blocked_alias)
  values (target_user_id, blocked, target_alias)
  on conflict (blocker_id, blocked_id) do nothing;

  if caller_leader and target_side = caller_side then
    return private.leave_room(r.id, target, 'removed');
  end if;
  return private.leave_room(r.id, caller.id, 'block');
end;
$$;

revoke all on function public.safety_block(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.safety_block(uuid, uuid, uuid) to service_role;

-- Check-in: the new app says it can be in a team (§22.B); an old one says nothing and stays false.
-- Otherwise as in 20261009090000_campus.sql.
drop function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid);

create function public.start_table_session(
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
  old_session_id uuid;
begin
  perform private.check_spot(target_venue_id, new_spot_id);

  update public.profiles
  set location_consent_at = now(), location_consent_version = consent_version
  where id = target_user_id
    and location_consent_version is distinct from consent_version;

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
     expires_at)
  values
    (target_user_id, target_venue_id, new_alias, new_headcount, accuracy_m, new_participation,
     new_spot_id, new_team_capable, now() + interval '4 hours')
  returning * into created;

  return created;
end;
$$;

revoke all on function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.start_table_session(uuid, uuid, text, smallint, text, real, text, uuid, boolean)
  to service_role;

-- Client reads (security definer, read only) -------------------------------------------------------------
-- The open rooms (§22.C "Açık odalar"): the same columns as before, so old apps and their tests read
-- the same rows. The headcount is the side's (sideHeadcount); a room with a blocked phone, a phone
-- held by a running window, or an owner's side with members for a table that cannot be in a team is
-- left out. Otherwise as in 20261010090000_room_flow.sql.
create or replace function public.venue_lobby(target_venue_id uuid)
returns table (
  room_id uuid,
  alias text,
  headcount smallint,
  intent text,
  waiting_since timestamptz,
  profiled boolean,
  spot_id uuid,
  spot_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select ts.id as session_id, ts.user_id, ts.team_capable
    from public.table_sessions ts
    where ts.user_id = (select auth.uid())
      and ts.venue_id = target_venue_id
      and ts.status = 'active'
      and ts.expires_at > now()
  )
  select r.id, r.owner_alias, private.side_headcount(r.owner_headcount, r.owner_phones), r.intent,
         greatest(r.waiting_since, private.room_listed_from(r.id)),
         r.owner_profiled,
         r.spot_id,
         sp.name
  from public.rooms r
  join public.table_sessions owner on owner.id = r.owner_session_id
  left join public.venue_spots sp on sp.id = r.spot_id
  cross join me
  where r.venue_id = target_venue_id
    and r.status = 'waiting'
    and r.visibility = 'open'
    and r.guest_session_id is null
    and r.owner_session_id <> me.session_id
    and not exists (
      select 1 from public.room_members rm
      where rm.room_id = r.id and rm.session_id = me.session_id and rm.left_at is null
    )
    and owner.status = 'active'
    and coalesce(private.room_listed_from(r.id), '-infinity') <= now()
    and owner.expires_at > now()
    and not private.room_blocked_for(r.id, me.user_id)
    and (r.owner_phones = 1 or me.team_capable)
    and not exists (
      select 1 from public.join_requests jr
      where jr.room_id = r.id
        and jr.requester_session_id = me.session_id
        and not jr.as_member
        and jr.status <> 'accepted'
        and jr.expires_at <= now()
    )
  order by 5;
$$;

-- The open rooms' team columns, by room (venue_lobby keeps its columns): the owner's phones and
-- whether "Bu masadayım" is open for the caller (both can be in a team, fewer than 4 phones).
create function public.venue_lobby_phones(target_venue_id uuid)
returns table (room_id uuid, phones smallint, member_open boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select l.room_id, r.owner_phones,
         me.team_capable and owner.team_capable and r.owner_phones < private.max_side_phones()
  from public.venue_lobby(target_venue_id) l
  join public.rooms r on r.id = l.room_id
  join public.table_sessions owner on owner.id = r.owner_session_id
  cross join (
    select ts.team_capable
    from public.table_sessions ts
    where ts.user_id = (select auth.uid())
      and ts.venue_id = target_venue_id
      and ts.status = 'active'
      and ts.expires_at > now()
  ) me;
$$;

revoke all on function public.venue_lobby_phones(uuid) from public, anon;
grant execute on function public.venue_lobby_phones(uuid) to authenticated;

-- "Süren odalar" (§22.C, decision 4): two-sided open rooms outside the window whose leaders can both
-- be in a team. Only the two leaders' aliases, each side's phones and headcount and whether its
-- "Bu masadayım" is open, and the room's spot (venue data, as in venue_lobby). No profile, intent,
-- member alias or game.
create function public.venue_running_rooms(target_venue_id uuid)
returns table (
  room_id uuid,
  owner_alias text,
  guest_alias text,
  owner_phones smallint,
  guest_phones smallint,
  owner_headcount smallint,
  guest_headcount smallint,
  owner_open boolean,
  guest_open boolean,
  spot_id uuid,
  spot_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select ts.id as session_id, ts.user_id, ts.team_capable
    from public.table_sessions ts
    where ts.user_id = (select auth.uid())
      and ts.venue_id = target_venue_id
      and ts.status = 'active'
      and ts.expires_at > now()
  )
  select r.id, r.owner_alias, r.guest_alias, r.owner_phones, r.guest_phones,
         private.side_headcount(r.owner_headcount, r.owner_phones),
         private.side_headcount(r.guest_headcount, r.guest_phones),
         me.team_capable and r.owner_phones < private.max_side_phones(),
         me.team_capable and r.guest_phones < private.max_side_phones(),
         r.spot_id,
         sp.name
  from public.rooms r
  join public.table_sessions owner on owner.id = r.owner_session_id
  join public.table_sessions guest on guest.id = r.guest_session_id
  left join public.venue_spots sp on sp.id = r.spot_id
  cross join me
  where r.venue_id = target_venue_id
    and r.status = 'active'
    and r.visibility = 'open'
    and owner.team_capable
    and guest.team_capable
    and owner.status = 'active' and owner.expires_at > now()
    and guest.status = 'active' and guest.expires_at > now()
    and me.session_id not in (r.owner_session_id, r.guest_session_id)
    and not exists (
      select 1 from public.room_members rm
      where rm.room_id = r.id and rm.session_id = me.session_id and rm.left_at is null
    )
    and coalesce(private.room_listed_from(r.id), '-infinity') <= now()
    and not private.room_blocked_for(r.id, me.user_id)
  order by r.guest_joined_at, r.id;
$$;

revoke all on function public.venue_running_rooms(uuid) from public, anon;
grant execute on function public.venue_running_rooms(uuid) to authenticated;

-- The phones of the caller's room (§22.I): session id (rule 4: room members may see it), side,
-- alias, the phone's own choice, whether it leads, when it came. Only for a phone in the room. During
-- and after the window: the phones that were in the room when it opened, also those that left
-- since (rule 5).
create function public.room_phones(target_room_id uuid)
returns table (
  session_id uuid,
  side text,
  alias text,
  profiled boolean,
  is_leader boolean,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select rm.session_id, rm.side, rm.alias, rm.profiled,
         rm.session_id = r.owner_session_id or rm.session_id is not distinct from r.guest_session_id,
         rm.joined_at
  from public.rooms r
  join public.room_members rm on rm.room_id = r.id
  where r.id = target_room_id
    and private.is_room_member(r.id)
    and case
      when r.status in ('waiting', 'active') then rm.left_at is null
      when r.reveal_ends_at is not null then
        rm.left_at is null
        or rm.left_at >= r.reveal_ends_at - make_interval(secs => private.reveal_decision_seconds())
      else false
    end
  order by rm.side desc, rm.joined_at, rm.id;
$$;

revoke all on function public.room_phones(uuid) from public, anon;
grant execute on function public.room_phones(uuid) to authenticated;
