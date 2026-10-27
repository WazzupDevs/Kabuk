-- A table is called by its icon (the owner's decision, 27 Ekim; docs/SPEC_V4.md K-76): the
-- icon's name ("Uzay istasyonu") is the table's name, from creation and after every icon change.
-- Icons are unique among a venue's open and running tables (K-45), so the names are too. A table
-- that got no icon (all of them taken) keeps a drawn "Sıfat İsim". The old owner_alias copy follows
-- the name until 4.8 (§4.H). Lock order unchanged (rule 10): the venue's names lock, then the row.

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
  new.owner_alias := coalesce(new.owner_alias, new.name);
  return new;
end;
$$;

-- rooms/set-icon (K-45, K-59, K-76): only the owner; another table's icon is icon_taken. The name
-- changes with the icon.
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
  set icon = new_icon, name = icon_name, owner_alias = icon_name
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- The tables open now take their icon's name too.
update public.rooms r
set name = i.name, owner_alias = i.name
from public.table_icons i
where r.icon = i.id and r.status <> 'closed' and r.name is distinct from i.name;
