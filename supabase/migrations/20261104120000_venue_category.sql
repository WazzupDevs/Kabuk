-- What sort of place a venue is, for Keşfet's list (docs/SPEC_V4.md §4.C; the project owner's
-- decision): 'kafe', 'cay_bahcesi' or 'yemek' (pure/venueKind.ts → VENUE_CATEGORIES). The seed
-- writes it from content/ for every cafe-kind venue; a campus is told apart by `kind` and has none.
-- An empty one is a kafe: the venues written without it (rows older than this, the E2E bot's) read
-- as one.
--
-- The timestamp sits between main's last migration (20261104090000_table_model.sql) and the 4.5
-- integration branch's first (20261105090000_people_tables.sql), so neither lands before a migration
-- already applied on the dev project.

alter table public.venues
  add column category text check (category in ('kafe', 'cay_bahcesi', 'yemek'));

update public.venues set category = 'kafe' where kind = 'cafe';

-- Keşfet: as in 20261013090000_venue_kind.sql, plus the category (none for a campus).
drop function public.explore_venues(integer);

create function public.explore_venues(event_days integer default 7)
returns table (
  venue_id uuid,
  name text,
  district text,
  kind text,
  category text,
  lat double precision,
  lng double precision,
  bucket text,
  events jsonb,
  boundary jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id,
         v.name,
         v.district,
         v.kind,
         case when v.kind = 'campus' then null else coalesce(v.category, 'kafe') end,
         extensions.st_y(v.location::extensions.geometry),
         extensions.st_x(v.location::extensions.geometry),
         coalesce(a.bucket, 'calm'),
         coalesce(e.events, '[]'::jsonb),
         case when v.boundary is not null
           then (extensions.st_asgeojson(v.boundary::extensions.geometry)::jsonb -> 'coordinates' -> 0)
         end
  from public.venues v
  left join public.venue_activity a on a.venue_id = v.id
  left join lateral (
    select jsonb_agg(
             jsonb_build_object('title', ev.title, 'startsAt', ev.starts_at, 'endsAt', ev.ends_at)
             order by ev.starts_at
           ) as events
    from public.venue_events ev
    where ev.venue_id = v.id
      and ev.ends_at > now()
      and ev.starts_at <= now() + make_interval(days => least(greatest(event_days, 0), 14))
  ) e on true
  where v.is_active
  order by v.name;
$$;

revoke all on function public.explore_venues(integer) from public, anon;
grant execute on function public.explore_venues(integer) to authenticated;
