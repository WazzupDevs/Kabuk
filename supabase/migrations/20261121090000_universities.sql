-- Universities with one or more campuses (docs/SPEC_V4.md §4.Q; docs/decisions/universite-yerleske.md).
-- A university is a grouping, not a place: nobody checks in to it, no table, chat, lobby or invite
-- refers to it. Each campus stays an ordinary venue (kind 'campus', its own venue_id, boundary and
-- spots) and only points at its university. Everything that is bounded by a venue (check-in,
-- tables, the lobby, venue chat, invites, Realtime topics) stays bounded by the campus's venue_id.
--
-- Public like the venue row: a university's name and city are not personal data, and nothing here
-- says who is at which campus.

-- Lock order (CLAUDE.md rule 10): only the seed writes universities; no user action locks a row
-- of it, and every read of it (explore_venues, venue_contains) is unlocked.

-- universities -----------------------------------------------------------------------------------
-- Seeded from content/venues-campus.json (`universities`). `ref` is the permanent key; a university
-- leaving the app is set inactive, never deleted, so its campuses' rows stay valid.
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (ref ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 120),
  city text not null check (char_length(city) between 1 and 60),
  is_active boolean not null default true
);

alter table public.universities enable row level security;
revoke all on table public.universities from anon, authenticated;
grant select on table public.universities to authenticated;

create policy "universities: authenticated users read"
  on public.universities for select
  to authenticated
  using (true);

-- A campus's university. Only a campus may have one; a cafe never does. Restrict: a university
-- with campuses is never deleted (they are set inactive instead).
alter table public.venues
  add column university_id uuid references public.universities (id) on delete restrict,
  add constraint venues_university_campus check (university_id is null or kind = 'campus');

create index venues_university_id_idx on public.venues (university_id) where university_id is not null;

-- Check-in: as in 20261009090000_campus.sql, and a campus of an inactive university is like an
-- inactive venue (null: venue_not_found). The server stays the only judge of the position; the
-- coordinates are compared and forgotten, never stored.
create or replace function public.venue_contains(
  target_venue_id uuid,
  lat double precision,
  lng double precision,
  tolerance_m double precision,
  radius_m double precision
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
           when v.boundary is not null then extensions.st_dwithin(v.boundary, here.p, tolerance_m)
           else extensions.st_dwithin(v.location, here.p, radius_m)
         end
  from public.venues v
  left join public.universities u on u.id = v.university_id
  cross join (
    select extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography as p
  ) here
  where v.id = target_venue_id
    and v.is_active
    and (v.university_id is null or u.is_active);
$$;

revoke all on function public.venue_contains(uuid, double precision, double precision, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.venue_contains(uuid, double precision, double precision, double precision, double precision)
  to service_role;

-- Keşfet: as in 20261104120000_venue_category.sql, plus the campus's university (its id, ref and
-- name; null for every other venue). A campus of an inactive university is not listed.
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
  boundary jsonb,
  university_id uuid,
  university_ref text,
  university_name text
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
         end,
         u.id,
         u.ref,
         u.name
  from public.venues v
  left join public.universities u on u.id = v.university_id
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
    and (v.university_id is null or u.is_active)
  order by v.name;
$$;

revoke all on function public.explore_venues(integer) from public, anon;
grant execute on function public.explore_venues(integer) to authenticated;
