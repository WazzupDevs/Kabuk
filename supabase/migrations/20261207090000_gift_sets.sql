-- Skin setleri (docs/SPEC_V4.md §4.U; the owner's call, 7 Kasım): Elf and Ninja are no longer packs
-- of their own but skin sets. Their pieces are Efsanevi accessories that the four tier packs give,
-- each with the same weight as every other Efsanevi one. Later skin sets come the same way.
--
-- gift_accessories.pack keeps its name (and its check, 'elf' or 'ninja') but now names the skin set
-- an accessory belongs to; it no longer limits which pack gives it. Lock order (rule 10) does not
-- change: nothing here takes a lock.

-- 1. Every tier pack gives every accessory in the packs, a set piece too ------------------------
create or replace function private.gifts_in_pool(accessory public.gift_accessories, target_pack text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select accessory.in_packs and target_pack in ('bronz', 'gumus', 'altin', 'elmas');
$$;

revoke all on function private.gifts_in_pool(public.gift_accessories, text)
  from public, anon, authenticated;

-- 2. The packs an accessory came from: only the four tier packs ---------------------------------
-- Only the dev project ever opened an Elf or Ninja pack (they were locked on the pilot); those
-- pieces stay owned, as if Elmas had given them.
update public.user_accessories set pack = 'elmas' where pack in ('elf', 'ninja');

alter table public.user_accessories drop constraint user_accessories_pack_check;
alter table public.user_accessories
  add constraint user_accessories_pack_check check (pack in ('bronz', 'gumus', 'altin', 'elmas'));

