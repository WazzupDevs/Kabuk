-- Kapsülünü süsle's Kaydet in one write (docs/SPEC_V4.md §4.U): the look's parts and the whole worn
-- set at once, so a save is never half written (set-look done, wear failed). profile/set-look and
-- gifts/wear stay as they are for the apps before this one.
--
-- Lock order (rule 10) does not change: like wearing, this locks only profiles (ownership is read
-- without a lock: an owned accessory is never taken back). The look is written only if it is still
-- the one the function read (read_look), as profile/set-look does; otherwise null and the function
-- reads again.

-- profile/save-look: every accessory owned ('not_owned'), none twice and no two in one slot
-- ('slot_conflict'); on either nothing is written. Returns the new look; null when the look changed
-- since read_look (or the account has no profile).
create or replace function public.profile_save_look(
  target_user_id uuid,
  new_look text,
  read_look text,
  target_accessory_ids text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  look text;
  wanted text[] := coalesce(target_accessory_ids, '{}');
begin
  if exists (
    select 1 from unnest(wanted) w(id)
    where not exists (
      select 1 from public.user_accessories u
      where u.user_id = target_user_id and u.accessory_id = w.id
    )
  ) then
    raise exception 'not_owned';
  end if;
  if (select count(distinct id) from unnest(wanted) w(id)) <> cardinality(wanted)
     or (select count(*) from public.gift_accessories a, unnest(a.slots) s
         where a.id = any(wanted))
       <> (select count(distinct s) from public.gift_accessories a, unnest(a.slots) s
           where a.id = any(wanted)) then
    raise exception 'slot_conflict';
  end if;
  update public.profiles
  set capsule_look = private.look_with_accessories(new_look, wanted)
  where id = target_user_id and capsule_look is not distinct from nullif(read_look, '')
  returning capsule_look into look;
  return look;
end;
$$;

revoke all on function public.profile_save_look(uuid, text, text, text[])
  from public, anon, authenticated;
grant execute on function public.profile_save_look(uuid, text, text, text[]) to service_role;
