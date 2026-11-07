-- Genişleyen katalog ve yuvalar (docs/SPEC_V4.md §4.U; the owner's calls, 7 Kasım): every
-- accessory is worn in its own capsule slot (Baş, Yüz, Göz, Ağız, Boyun, Renk; a Destansı set takes
-- two), one in each slot, several at once, as "x:<id>" tokens of the capsule look
-- (pure/gifts.ts → accessoriesOf). Elf and Ninja are themed packs: each gives only its own
-- accessories, which no other pack gives. The accessories that left the catalog stay with whoever
-- owns them (in_packs = false).
--
-- Lock order (rule 10) does not change: profiles → gift_progress → user_accessories. Wearing,
-- whether one accessory or the whole set, locks only profiles (ownership is read without a lock: an
-- owned accessory is never taken back).

-- 1. Slots and themed packs ------------------------------------------------------------------------
alter table public.gift_accessories
  add column slots text[] not null default '{}'
    check (slots <@ array['c', 'e', 'h', 'f', 'm', 'n'] and cardinality(slots) <= 2),
  -- The themed pack that alone gives it; null: the four tier packs.
  add column pack text check (pack in ('elf', 'ninja'));

alter table public.user_accessories drop constraint user_accessories_pack_check;
alter table public.user_accessories
  add constraint user_accessories_pack_check
    check (pack in ('bronz', 'gumus', 'altin', 'elmas', 'elf', 'ninja'));

-- What a pack gives: a themed pack its own accessories, a tier pack every other one in the packs.
create or replace function private.gifts_in_pool(accessory public.gift_accessories, target_pack text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select accessory.in_packs and (
    case when target_pack in ('elf', 'ninja') then accessory.pack = target_pack
         else accessory.pack is null end
  );
$$;

-- Every accessory the open packs give is owned: no pack is earned while that is so (§4.U).
drop function private.gifts_owns_all(uuid);
create or replace function private.gifts_owns_all(target_user_id uuid, open_packs text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.gift_accessories a
    where exists (select 1 from unnest(open_packs) p where private.gifts_in_pool(a, p))
      and not exists (
        select 1 from public.user_accessories u
        where u.user_id = target_user_id and u.accessory_id = a.id
      )
  );
$$;

-- gifts/login as before; the count waits while everything the open packs give is owned. The
-- function passes the packs that open here; an older caller's three arguments mean the tier packs.
drop function public.gifts_login(uuid, date, integer);
create or replace function public.gifts_login(
  target_user_id uuid,
  today date,
  logins_per_pack integer,
  open_packs text[] default array['bronz', 'gumus', 'altin', 'elmas']
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

  if progress.last_day is distinct from today
     and not private.gifts_owns_all(target_user_id, open_packs) then
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

-- gifts/open as before; 'stale' also when the drawn accessory is not one the pack gives.
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
    select 1 from public.gift_accessories a
    where a.id = target_accessory_id and private.gifts_in_pool(a, target_pack)
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

-- 2. Wearing in slots ------------------------------------------------------------------------------
-- The look without its accessory tokens, and with `accessories` in this order (none: empty).
create or replace function private.look_with_accessories(look text, accessories text[])
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    btrim(
      btrim(regexp_replace(regexp_replace(look, '(^|\s)x:\S*', ' ', 'g'), '\s+', ' ', 'g'))
      || coalesce(
        (select string_agg(' x:' || a, '' order by o) from unnest(accessories) with ordinality t(a, o)),
        ''
      )
    ),
    ''
  );
$$;

-- The accessories a look wears, in order.
create or replace function private.look_accessories(look text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (select array_agg(m[1] order by o)
     from regexp_matches(coalesce(look, ''), '(?:^|\s)x:(\S+)', 'g') with ordinality t(m, o)),
    '{}'
  );
$$;

-- gifts/wear: the whole worn set at once (Kapsülünü süsle, a full set). Every one owned
-- ('not_owned'), none twice and no two in one slot ('slot_conflict'). Returns the new look; null
-- when the account has no capsule yet.
create or replace function public.gifts_wear(target_user_id uuid, target_accessory_ids text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
begin
  if exists (
    select 1 from unnest(target_accessory_ids) w(id)
    where not exists (
      select 1 from public.user_accessories u
      where u.user_id = target_user_id and u.accessory_id = w.id
    )
  ) then
    raise exception 'not_owned';
  end if;
  if (select count(distinct id) from unnest(target_accessory_ids) w(id))
       <> cardinality(target_accessory_ids)
     or (select count(*) from public.gift_accessories a, unnest(a.slots) s
         where a.id = any(target_accessory_ids))
       <> (select count(distinct s) from public.gift_accessories a, unnest(a.slots) s
           where a.id = any(target_accessory_ids)) then
    raise exception 'slot_conflict';
  end if;
  update public.profiles
  set capsule_look = private.look_with_accessories(capsule_look, target_accessory_ids)
  where id = target_user_id and capsule_look is not null
  returning capsule_look into look;
  return look;
end;
$$;

-- gifts/equip: puts one owned accessory on; whatever is worn in any of its slots comes off, the
-- others stay. Returns the new look; null when the account has no capsule yet; 'not_owned'.
create or replace function public.gifts_equip(target_user_id uuid, target_accessory_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
  wanted_slots text[];
begin
  if not exists (
    select 1 from public.user_accessories
    where user_id = target_user_id and accessory_id = target_accessory_id
  ) then
    raise exception 'not_owned';
  end if;
  select a.slots into wanted_slots from public.gift_accessories a where a.id = target_accessory_id;
  update public.profiles p
  set capsule_look = private.look_with_accessories(
    p.capsule_look,
    array(
      select w.id from unnest(private.look_accessories(p.capsule_look)) with ordinality w(id, o)
      where w.id <> target_accessory_id
        and not exists (
          select 1 from public.gift_accessories a
          where a.id = w.id and a.slots && coalesce(wanted_slots, '{}')
        )
      order by w.o
    ) || target_accessory_id
  )
  where p.id = target_user_id and p.capsule_look is not null
  returning p.capsule_look into look;
  return look;
end;
$$;

-- gifts/equip with no accessory: takes every worn one off.
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
  set capsule_look = private.look_with_accessories(capsule_look, '{}')
  where id = target_user_id and capsule_look is not null
  returning capsule_look into look;
  return look;
end;
$$;

-- profile/set-look keeps every worn accessory, as it kept the one before.
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
  set capsule_look = private.look_with_accessories(
    new_look,
    private.look_accessories(capsule_look)
  )
  where id = target_user_id and capsule_look is not distinct from nullif(read_look, '')
  returning capsule_look into look;
  return look;
end;
$$;

drop function private.look_with_accessory(text, text);

-- Grants -------------------------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.gifts_login(uuid, date, integer, text[])',
    'public.gifts_open(uuid, text, text)',
    'public.gifts_wear(uuid, text[])',
    'public.gifts_equip(uuid, text)',
    'public.gifts_unequip(uuid)',
    'public.profile_set_look(uuid, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
  foreach fn in array array[
    'private.gifts_in_pool(public.gift_accessories, text)',
    'private.gifts_owns_all(uuid, text[])',
    'private.look_with_accessories(text, text[])',
    'private.look_accessories(text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;
