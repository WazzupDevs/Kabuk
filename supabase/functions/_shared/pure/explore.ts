// Keşfet (docs/SPEC_V2.md §4). The server buckets each venue's active tables; the app never sees a
// count. A planned event shows as a label while it runs or when it starts within EVENT_WINDOW_DAYS.

import { normalize } from './trText.ts';

export const ACTIVITY_BUCKETS = ['calm', 'lively', 'buzzing'] as const;
export type ActivityBucket = (typeof ACTIVITY_BUCKETS)[number];

// 0–2 active tables look "calm" (so a single table can never be inferred), 3–5 "lively", 6+
// "buzzing". The cron job passes these to private.refresh_venue_activity; a test checks it does.
export const ACTIVITY_THRESHOLDS = { calmMax: 2, livelyMax: 5 } as const;
export const ACTIVITY_REFRESH_MINUTES = 5;

export function activityBucket(activeTables: number): ActivityBucket {
  if (activeTables <= ACTIVITY_THRESHOLDS.calmMax) return 'calm';
  if (activeTables <= ACTIVITY_THRESHOLDS.livelyMax) return 'lively';
  return 'buzzing';
}

export function isActivityBucket(value: unknown): value is ActivityBucket {
  return (ACTIVITY_BUCKETS as readonly unknown[]).includes(value);
}

export const EVENT_WINDOW_DAYS = 7;
export const EVENT_DEFAULT_HOURS = 3;
export const EVENT_TITLE_MAX = 60;

// Venues are in Türkiye (UTC+3, no daylight saving time); event times are shown in local time.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EventTime =
  | { kind: 'now' }
  | { kind: 'today' | 'tomorrow'; time: string }
  | { kind: 'weekday'; weekday: number; time: string };

function localParts(ms: number): { day: number; weekday: number; time: string } {
  const local = new Date(ms + ISTANBUL_OFFSET_MS);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return {
    day: Math.floor((ms + ISTANBUL_OFFSET_MS) / DAY_MS),
    weekday: local.getUTCDay(),
    time: `${hh}.${mm}`,
  };
}

// How to label an event relative to `now`: running, today, tomorrow, or a weekday within the week.
export function describeEventTime(startsAt: string, endsAt: string, now: number): EventTime {
  const start = Date.parse(startsAt);
  if (start <= now && now < Date.parse(endsAt)) return { kind: 'now' };
  const s = localParts(start);
  const today = localParts(now).day;
  if (s.day === today) return { kind: 'today', time: s.time };
  if (s.day === today + 1) return { kind: 'tomorrow', time: s.time };
  return { kind: 'weekday', weekday: s.weekday, time: s.time };
}

// Great-circle distance in metres (spherical Earth). The server's PostGIS check stays the rule;
// this only warns before the request (MVP_SPEC §4.2 and SPEC_V2 §4).
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_008.8;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Keşfet with one active venue (the campus pilot) is a single venue card with its events; from two
// active venues on, the list and the map come back (docs/SPEC_V3.md §4.4, S9). Content decides.
export type ExploreLayout = 'single' | 'list';
export const SINGLE_VENUE_MAX = 1;

export function exploreLayout(activeVenueCount: number): ExploreLayout {
  return activeVenueCount === SINGLE_VENUE_MAX ? 'single' : 'list';
}

// Keşfet's list from two venues on (docs/SPEC_V4.md §4.C): venues with an event today first, then
// by name (K-21); the count line says which (K-42). Chosen by city and district, never by position
// (rule 6): the city with the most active venues unless the phone remembers another (K-38).
export type ExploreTimes = { startsAt: string; endsAt: string };

// Today in Istanbul: an event running now, or one that starts before midnight and has not ended.
export function hasEventToday(events: readonly ExploreTimes[], now: number): boolean {
  const today = localParts(now).day;
  return events.some(
    (e) => Date.parse(e.endsAt) > now && localParts(Date.parse(e.startsAt)).day <= today,
  );
}

export type ExploreSort = 'eventsFirst' | 'byName';

export function sortVenues<T extends { name: string; events: readonly ExploreTimes[] }>(
  venues: readonly T[],
  now: number,
): { venues: T[]; sort: ExploreSort } {
  const first = (v: T) => (hasEventToday(v.events, now) ? 0 : 1);
  const sorted = [...venues].sort(
    (a, b) => first(a) - first(b) || a.name.localeCompare(b.name, 'tr'),
  );
  return { venues: sorted, sort: sorted.some((v) => first(v) === 0) ? 'eventsFirst' : 'byName' };
}

export type ExplorePlace = { city: string; district: string | null };
export type ExploreCity = { city: string; districts: string[] };

// The cities with an active venue, each with its districts, both by name.
export function exploreCities(
  venues: readonly { city: string; district: string }[],
): ExploreCity[] {
  const byCity = new Map<string, Set<string>>();
  for (const v of venues) {
    const districts = byCity.get(v.city) ?? new Set<string>();
    districts.add(v.district);
    byCity.set(v.city, districts);
  }
  return [...byCity.entries()]
    .map(([city, districts]) => ({
      city,
      districts: [...districts].sort((a, b) => a.localeCompare(b, 'tr')),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, 'tr'));
}

// The city with the most active venues; a tie goes to the first by name.
export function defaultCity(venues: readonly { city: string }[]): string | null {
  const counts = new Map<string, number>();
  for (const v of venues) counts.set(v.city, (counts.get(v.city) ?? 0) + 1);
  let best: string | null = null;
  for (const [city, n] of counts) {
    const top = best === null ? 0 : (counts.get(best) ?? 0);
    if (n > top || (n === top && best !== null && city.localeCompare(best, 'tr') < 0)) best = city;
  }
  return best;
}

// The remembered place while its city still has an active venue (its district only while that has
// one too); otherwise the default city, every district.
export function explorePlace(
  saved: ExplorePlace | null,
  venues: readonly { city: string; district: string }[],
): ExplorePlace | null {
  if (saved && venues.some((v) => v.city === saved.city)) {
    const district =
      saved.district !== null &&
      venues.some((v) => v.city === saved.city && v.district === saved.district)
        ? saved.district
        : null;
    return { city: saved.city, district };
  }
  const city = defaultCity(venues);
  return city === null ? null : { city, district: null };
}

export const EXPLORE_KINDS = ['all', 'campus', 'cafe'] as const;
export type ExploreKind = (typeof EXPLORE_KINDS)[number];

// The venues of the place, of the kind, whose name holds the search (Turkish, ç and c alike; rule 7).
export function filterVenues<
  T extends { name: string; city: string; district: string; kind: string },
>(
  venues: readonly T[],
  { place, kind, query }: { place: ExplorePlace | null; kind: ExploreKind; query: string },
): T[] {
  const q = normalize(query).replace(/\s+/g, ' ').trim();
  return venues.filter(
    (v) =>
      (place === null ||
        (v.city === place.city && (place.district === null || v.district === place.district))) &&
      (kind === 'all' || v.kind === kind) &&
      (q === '' || normalize(v.name).replace(/\s+/g, ' ').includes(q)),
  );
}

// Aktiviteler's events (docs/SPEC_V4.md K-15, K-37): today's only, running or still to start, each
// with its venue, earliest first.
export function todayEvents<
  E extends ExploreTimes & { title: string },
  V extends { name: string; events: readonly E[] },
>(venues: readonly V[], now: number): { venue: V; event: E }[] {
  return venues
    .flatMap((venue) =>
      venue.events.filter((e) => hasEventToday([e], now)).map((event) => ({ venue, event })),
    )
    .sort(
      (a, b) =>
        Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt) ||
        a.venue.name.localeCompare(b.venue.name, 'tr'),
    );
}
