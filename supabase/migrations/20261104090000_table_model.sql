-- Faz 4 step 4.5, server part 1 of the a/b plan (docs/SPEC_V4.md §4.E, §4.H, §4.K; the plan:
-- docs/decisions/4.5-masa-modeli.md): additive only, today's app keeps working.
--
-- - A table's name and icon (K-45): every room gets a name from the alias words and one of the 100
--   icons when it is created, whichever way it is created; neither is used twice by the venue's open
--   and running tables. The owner can choose the icon (rooms/create, rooms/set-icon) and draw a new
--   name three times (rooms/reroll-name). Today's app shows neither.
-- - "Eklendi"ye yeniden basmak (K-67): friends/withdraw-add takes back a silent "Arkadaş ekle".
--   Lock order (§4.K): the own play_history row, then the pair, then the intent.
-- - add-from-room says whether the pair are friends (K-70: the second presser sees "Arkadaş
--   oldunuz"; the push to the first presser is the function's).

-- Table icons --------------------------------------------------------------------------------------
-- content/table-icons.json, seeded (scripts/seed/tableIcons.ts); the app reads the same list from
-- pure/tableIcons.ts. An icon taken out of the JSON stays for the tables that show it.
create table public.table_icons (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  theme text not null,
  theme_order smallint not null,
  sort_order smallint not null,
  is_active boolean not null default true
);

alter table public.table_icons enable row level security;
revoke all on table public.table_icons from anon, authenticated;

-- A table's name and icon --------------------------------------------------------------------------
alter table public.rooms
  add column name text check (char_length(name) between 1 and 60),
  add column name_rerolls smallint not null default 0 check (name_rerolls >= 0),
  -- Nulled on delete like every public key (account.test.ts); the seed never deletes an icon, it
  -- sets is_active = false.
  add column icon text references public.table_icons (id) on delete set null;

-- No two open or running tables of a venue show the same icon (K-45). The trigger below picks under
-- the venue's lock; this is the database's own guard.
create unique index rooms_venue_icon on public.rooms (venue_id, icon)
  where status <> 'closed' and icon is not null;

-- One venue's icon and name picks, one at a time: two tables created at once never pick the same
-- free icon. Taken after the row locks a caller holds (a room's or a check-in's) and before none.
create function private.lock_venue_names(target_venue_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('table_names:' || target_venue_id::text, 0));
$$;

-- A free "Sıfat İsim" at the venue (the alias words; pure/alias.ts → formatAlias), or null.
create function private.free_table_name(target_venue_id uuid)
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select a.word || ' ' || n.word
  from public.alias_words a
  cross join public.alias_words n
  where a.kind = 'adjective' and n.kind = 'noun'
    and not exists (
      select 1 from public.rooms r
      where r.venue_id = target_venue_id and r.status <> 'closed'
        and r.name = a.word || ' ' || n.word
    )
  order by random()
  limit 1;
$$;

-- A free active icon at the venue, or null when all are taken.
create function private.free_table_icon(target_venue_id uuid)
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select i.id from public.table_icons i
  where i.is_active
    and not exists (
      select 1 from public.rooms r
      where r.venue_id = target_venue_id and r.status <> 'closed' and r.icon = i.id
    )
  order by random()
  limit 1;
$$;

-- An icon the owner chose: active, and free at the venue apart from their own table.
create function private.check_table_icon(target_venue_id uuid, chosen text, own_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.table_icons where id = chosen and is_active) then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  if exists (
    select 1 from public.rooms r
    where r.venue_id = target_venue_id and r.status <> 'closed' and r.icon = chosen
      and r.id is distinct from own_room_id
  ) then
    raise exception using errcode = 'P0001', message = 'icon_taken';
  end if;
end;
$$;

-- Every new room: a name and an icon unless it brings its own (rooms/create { icon }).
create function private.room_name_and_icon()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_venue_names(new.venue_id);
  if new.name is null then
    new.name := private.free_table_name(new.venue_id);
  end if;
  if new.icon is null then
    new.icon := private.free_table_icon(new.venue_id);
  else
    perform private.check_table_icon(new.venue_id, new.icon, null);
  end if;
  return new;
end;
$$;

create trigger rooms_name_and_icon
  before insert on public.rooms
  for each row execute function private.room_name_and_icon();

-- rooms/create, plus the icon the owner chose (K-45).
drop function public.rooms_create(uuid, boolean, text, text);

create function public.rooms_create(
  target_user_id uuid,
  profiled boolean,
  new_intent text default null,
  new_game_tag text default null,
  new_icon text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.table_sessions;
  created public.rooms;
begin
  s := private.active_session_for_update(target_user_id);
  if private.open_room_of_session(s.id) is not null then
    raise exception using errcode = 'P0001', message = 'already_in_room';
  end if;

  insert into public.rooms
    (venue_id, owner_session_id, owner_alias, owner_headcount, concept, visibility, intent,
     owner_profiled, game_tag, icon)
  values (s.venue_id, s.id, s.alias, s.headcount, null, 'open', new_intent, profiled, new_game_tag,
          new_icon)
  returning * into created;
  return created;
end;
$$;

revoke all on function public.rooms_create(uuid, boolean, text, text, text)
  from public, anon, authenticated;
grant execute on function public.rooms_create(uuid, boolean, text, text, text) to service_role;

-- The owner's own table that is not closed, locked (rooms after the check-in, rule 10).
create function private.owned_open_room(target_user_id uuid, target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms
  where id = target_room_id and status <> 'closed'
  for no key update;
  if r.id is null or not exists (
    select 1 from public.table_sessions
    where id = r.owner_session_id and user_id = target_user_id and status = 'active'
  ) then
    raise exception using errcode = 'P0001', message = 'not_owner';
  end if;
  return r;
end;
$$;

-- rooms/set-icon (K-45, K-59): only the owner; another table's icon is icon_taken.
create function public.rooms_set_icon(target_user_id uuid, target_room_id uuid, new_icon text)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  r := private.owned_open_room(target_user_id, target_room_id);
  -- The same icon again changes nothing (and the caller announces nothing).
  if r.icon is not distinct from new_icon then
    return r;
  end if;
  perform private.lock_venue_names(r.venue_id);
  perform private.check_table_icon(r.venue_id, new_icon, r.id);
  update public.rooms set icon = new_icon where id = r.id returning * into r;
  return r;
end;
$$;

-- rooms/reroll-name: only the owner, `max_rerolls` times per table; the icon stays.
create function public.rooms_reroll_name(
  target_user_id uuid,
  target_room_id uuid,
  max_rerolls integer
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Friends -------------------------------------------------------------------------------------------
-- Whether the pair became friends at this encounter: both pressed "Arkadaş ekle" on it (the same
-- test as public.my_history_friends). A friendship from before it is never told through it (rule 4:
-- a friend who sat anonymously is not tied to the account).
create function private.matched_at(target_encounter_id uuid, a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = 2 from public.mutual_friend_intents
  where encounter_id = target_encounter_id and user_id in (a, b);
$$;

-- "Arkadaş ekle", and whether the pair became friends at this encounter (K-70: the second presser
-- sees "Arkadaş oldunuz"). A friendship from before answers like a press that matched nothing
-- (rule 4). The intent's time is taken under the pair's lock, so the first presser by it is the one
-- the match push goes to. Otherwise as 20261029090000_table_end.sql.
create or replace function public.friends_add_from_room(target_user_id uuid, target_history_id uuid)
returns table (outcome text, other_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.play_history;
begin
  select * into h from private.own_history(target_user_id, target_history_id);
  if h.id is null or not (h.reveal_mutual or h.friend_open) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  update public.play_history set friend_action_at = coalesce(friend_action_at, now())
  where id = h.id;
  if h.other_user_id is null or private.is_blocked_between(target_user_id, h.other_user_id) then
    return query select 'ok'::text, null::uuid;
    return;
  end if;
  perform private.lock_pair(target_user_id, h.other_user_id);
  if private.are_friends(target_user_id, h.other_user_id) then
    if private.matched_at(h.encounter_id, target_user_id, h.other_user_id) then
      return query select 'already_matched'::text, null::uuid;
    else
      return query select 'ok'::text, null::uuid;
    end if;
    return;
  end if;

  insert into public.mutual_friend_intents (encounter_id, user_id, created_at)
  values (h.encounter_id, target_user_id, clock_timestamp())
  on conflict do nothing;

  if exists (
    select 1 from public.mutual_friend_intents
    where encounter_id = h.encounter_id and user_id = h.other_user_id
  ) and private.make_friends(target_user_id, h.other_user_id, 'room_end_mutual') then
    return query select 'friendship_created'::text, h.other_user_id;
    return;
  end if;
  return query select 'ok'::text, null::uuid;
end;
$$;

-- friends/withdraw-add (K-67, §4.K): only a silent "Arkadaş ekle" press (a record open to it; an
-- "İstek gönder" record's request stays the request's own). The own record is locked first and left
-- as it is; then the pair. A friendship made at this encounter, seen under the pair's lock, wins:
-- nothing changes and the answer says so. A friendship from before is not told (rule 4): the press
-- is taken back like any other.
-- Otherwise the intent goes and friend_action_at empties together, under the pair's lock: emptied
-- before it, the other side's press could make the pair friends in between, and the record would
-- look unpressed for a friendship it made. The other side sees nothing of it (rule 5).
create function public.friends_withdraw_add(target_user_id uuid, target_history_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.play_history;
begin
  select * into h from public.play_history
  where id = target_history_id and user_id = target_user_id and available_at <= now()
  for update;
  if h.id is null or h.friend_action_at is null or not (h.reveal_mutual or h.friend_open) then
    return 'ok';
  end if;
  if h.other_user_id is not null then
    perform private.lock_pair(target_user_id, h.other_user_id);
    if private.are_friends(target_user_id, h.other_user_id)
      and private.matched_at(h.encounter_id, target_user_id, h.other_user_id)
    then
      return 'already_matched';
    end if;
  end if;
  delete from public.mutual_friend_intents
  where encounter_id = h.encounter_id and user_id = target_user_id;
  update public.play_history set friend_action_at = null where id = h.id;
  return 'withdrawn';
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.rooms_set_icon(uuid, uuid, text)',
    'public.rooms_reroll_name(uuid, uuid, integer)',
    'public.friends_withdraw_add(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'private.lock_venue_names(uuid)',
    'private.free_table_name(uuid)',
    'private.free_table_icon(uuid)',
    'private.check_table_icon(uuid, text, uuid)',
    'private.owned_open_room(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
