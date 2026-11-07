-- Hediye paketleri (docs/SPEC_V4.md §4.U, K-89; the owner's calls, 6–7 Kasım): a login a day
-- counts, three counted logins earn a Bronz pack, a pack gives one capsule accessory the person does
-- not own yet, drawn on the server (rule 3, functions/gifts). The worn accessory is a token of the
-- capsule look ("x:<id>", pure/gifts.ts → ACCESSORY_SLOT): it goes wherever the look goes and never
-- with the profile (rule 4). Every table is closed to clients (rule 1, 2): the app reads its own
-- packs and accessories through gifts/state.
--
-- Lock order (rule 10): profiles → gift_progress → user_accessories. A login locks only its
-- gift_progress row; opening a pack locks gift_progress, then writes user_accessories; wearing an
-- accessory locks only profiles (ownership is read without a lock: an owned accessory is never taken
-- back, only deleted with the account).

-- 1. The accessories (content/gift-packs.json, seeded by `pnpm seed`) -------------------------------
create table public.gift_accessories (
  id text primary key check (id ~ '^[a-z0-9]+$'),
  tier text not null check (tier in ('siradan', 'nadir', 'destansi', 'efsanevi')),
  weight integer not null check (weight > 0),
  -- false: left out of the content; people who own it keep it, no pack gives it again.
  in_packs boolean not null default true
);

alter table public.gift_accessories enable row level security;
revoke all on table public.gift_accessories from anon, authenticated;

-- 2. The login count and the unopened Bronz packs, one row a person ------------------------------
create table public.gift_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  logins smallint not null default 0 check (logins >= 0),
  -- Istanbul's date of the last counted login: one a day counts.
  last_day date,
  unopened integer not null default 0 check (unopened >= 0),
  updated_at timestamptz not null default now()
);

alter table public.gift_progress enable row level security;
revoke all on table public.gift_progress from anon, authenticated;

-- 3. What a person owns ----------------------------------------------------------------------------
create table public.user_accessories (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The seed never deletes an accessory (in_packs = false instead); cascade keeps deletes free.
  accessory_id text not null references public.gift_accessories (id) on delete cascade,
  pack text not null check (pack in ('bronz', 'gumus', 'altin', 'elmas')),
  created_at timestamptz not null default now(),
  primary key (user_id, accessory_id)
);

alter table public.user_accessories enable row level security;
revoke all on table public.user_accessories from anon, authenticated;

-- Every accessory a pack gives is owned: no pack is earned while that is so (§4.U).
create or replace function private.gifts_owns_all(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.gift_accessories a
    where a.in_packs
      and not exists (
        select 1 from public.user_accessories u
        where u.user_id = target_user_id and u.accessory_id = a.id
      )
  );
$$;

-- gifts/login: the app opened with a session on `today` (Istanbul's date, worked out by the
-- function). One a day counts; the third counted login earns a Bronz pack and starts the count again;
-- no streak. While everything is owned the count waits. A second call on the same day changes
-- nothing, so the call is idempotent (apiRetry.ts).
create or replace function public.gifts_login(
  target_user_id uuid,
  today date,
  logins_per_pack integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  progress public.gift_progress;
begin
  if not exists (select 1 from public.profiles where id = target_user_id) then
    return null;
  end if;
  insert into public.gift_progress (user_id) values (target_user_id)
  on conflict (user_id) do nothing;
  select * into progress from public.gift_progress where user_id = target_user_id for update;

  if progress.last_day is distinct from today and not private.gifts_owns_all(target_user_id) then
    if progress.logins + 1 >= logins_per_pack then
      update public.gift_progress
      set logins = 0, last_day = today, unopened = unopened + 1, updated_at = now()
      where user_id = target_user_id
      returning * into progress;
    else
      update public.gift_progress
      set logins = logins + 1, last_day = today, updated_at = now()
      where user_id = target_user_id
      returning * into progress;
    end if;
  end if;

  return jsonb_build_object('logins', progress.logins, 'unopened', progress.unopened);
end;
$$;

-- gifts/open: takes one unopened Bronz pack and gives the drawn accessory (the draw is the
-- function's, pure/gifts.ts → drawAccessory). Checked again under the lock: 'no_pack' when there is
-- no unopened pack, 'stale' when the accessory is owned meanwhile or no longer in the packs (the
-- function reads what is owned again and draws once more).
create or replace function public.gifts_open(
  target_user_id uuid,
  target_pack text,
  target_accessory_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  progress public.gift_progress;
begin
  select * into progress from public.gift_progress where user_id = target_user_id for update;
  if not found or progress.unopened < 1 then
    return 'no_pack';
  end if;
  if not exists (
    select 1 from public.gift_accessories where id = target_accessory_id and in_packs
  ) or exists (
    select 1 from public.user_accessories
    where user_id = target_user_id and accessory_id = target_accessory_id
  ) then
    return 'stale';
  end if;

  insert into public.user_accessories (user_id, accessory_id, pack)
  values (target_user_id, target_accessory_id, target_pack);
  update public.gift_progress
  set unopened = unopened - 1, updated_at = now()
  where user_id = target_user_id;
  return 'ok';
end;
$$;

-- The look without its accessory token, and with `accessory` (null: none).
create or replace function private.look_with_accessory(look text, accessory text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      btrim(regexp_replace(regexp_replace(look, '(^|\s)x:\S*', ' ', 'g'), '\s+', ' ', 'g'))
      || case when accessory is null then '' else ' x:' || accessory end
    ),
    ''
  );
$$;

-- gifts/equip: the worn accessory is written into the account's capsule look; only an owned one.
-- What was written before keeps its look (K-10: a seat and a message keep the look they were written
-- with). Returns the new look; null when the account has no capsule yet; 'not_owned' as an error.
create or replace function public.gifts_equip(target_user_id uuid, target_accessory_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
begin
  if not exists (
    select 1 from public.user_accessories
    where user_id = target_user_id and accessory_id = target_accessory_id
  ) then
    raise exception 'not_owned';
  end if;
  update public.profiles
  set capsule_look = private.look_with_accessory(capsule_look, target_accessory_id)
  where id = target_user_id and capsule_look is not null
  returning capsule_look into look;
  return look;
end;
$$;

-- gifts/equip with no accessory: takes the worn one off. Returns the new look, null as above.
create or replace function public.gifts_unequip(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
begin
  update public.profiles
  set capsule_look = private.look_with_accessory(capsule_look, null)
  where id = target_user_id and capsule_look is not null
  returning capsule_look into look;
  return look;
end;
$$;

-- profile/set-look (K-47) keeps the worn accessory: the decoration screen sends the six slots only
-- (pure/capsule.ts → normalizeLook drops any "x:" token), the accessory stays as it is. The function
-- filtered the retired parts against `read_look`; the write happens only while the look is still
-- that one ('' for none; null: changed meanwhile, the function reads again).
create or replace function public.profile_set_look(
  target_user_id uuid,
  new_look text,
  read_look text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
begin
  update public.profiles
  set capsule_look = private.look_with_accessory(
    new_look,
    substring(capsule_look from '(?:^|\s)x:(\S+)')
  )
  where id = target_user_id and capsule_look is not distinct from nullif(read_look, '')
  returning capsule_look into look;
  return look;
end;
$$;

-- Grants -------------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.gifts_login(uuid, date, integer)',
    'public.gifts_open(uuid, text, text)',
    'public.gifts_equip(uuid, text)',
    'public.gifts_unequip(uuid)',
    'public.profile_set_look(uuid, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.gifts_owns_all(uuid)',
    'private.look_with_accessory(text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
