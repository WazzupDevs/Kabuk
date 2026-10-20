import { describe, expect, it } from 'vitest';

import { CHECKIN_RADIUS_M } from './checkin.ts';
import {
  activityBucket,
  defaultCity,
  describeEventTime,
  distanceMeters,
  exploreCities,
  exploreLayout,
  explorePlace,
  filterVenues,
  hasEventToday,
  isActivityBucket,
  sortVenues,
  todayEvents,
} from './explore.ts';

describe('activityBucket', () => {
  it('shows 0–2 active tables as calm, so a single table cannot be inferred', () => {
    expect([0, 1, 2].map(activityBucket)).toEqual(['calm', 'calm', 'calm']);
  });

  it('shows 3–5 as lively and 6 or more as buzzing', () => {
    expect([3, 5, 6, 40].map(activityBucket)).toEqual(['lively', 'lively', 'buzzing', 'buzzing']);
  });

  it('recognises bucket names', () => {
    expect(isActivityBucket('lively')).toBe(true);
    expect(isActivityBucket('3')).toBe(false);
  });
});

describe('describeEventTime', () => {
  // Friday 26 September 2026, 12:00 in Istanbul.
  const now = Date.parse('2026-09-26T09:00:00Z');

  it('labels a running event as now', () => {
    expect(describeEventTime('2026-09-26T08:00:00Z', '2026-09-26T11:00:00Z', now)).toEqual({
      kind: 'now',
    });
  });

  it('uses Istanbul time for today, tomorrow and weekdays', () => {
    expect(describeEventTime('2026-09-26T17:00:00Z', '2026-09-26T20:00:00Z', now)).toEqual({
      kind: 'today',
      time: '20.00',
    });
    // 22:30 UTC is already Saturday 01:30 in Istanbul.
    expect(describeEventTime('2026-09-26T22:30:00Z', '2026-09-27T01:30:00Z', now)).toEqual({
      kind: 'tomorrow',
      time: '01.30',
    });
    expect(describeEventTime('2026-09-29T17:00:00Z', '2026-09-29T20:00:00Z', now)).toEqual({
      kind: 'weekday',
      weekday: 2,
      time: '20.00',
    });
  });

  it('does not call an event that has ended "now"', () => {
    expect(describeEventTime('2026-09-26T05:00:00Z', '2026-09-26T09:00:00Z', now).kind).toBe(
      'today',
    );
  });
});

describe('distanceMeters', () => {
  it('is zero for the same point and close to PostGIS for short distances', () => {
    const a = { lat: 40.98819, lng: 28.66821 };
    expect(distanceMeters(a, a)).toBe(0);
    // 0.0027° of latitude is about 300 m.
    const d = distanceMeters(a, { lat: a.lat + 0.0027, lng: a.lng });
    expect(d).toBeGreaterThan(295);
    expect(d).toBeLessThan(305);
    expect(d > CHECKIN_RADIUS_M).toBe(true);
  });
});

describe('exploreLayout', () => {
  it('shows a single venue card for one active venue', () => {
    expect(exploreLayout(1)).toBe('single');
  });

  it('brings the list and the map back from two venues on, and for none', () => {
    expect([0, 2, 3, 40].map(exploreLayout)).toEqual(['list', 'list', 'list', 'list']);
  });
});

describe('Keşfet list (docs/SPEC_V4.md K-21, K-38, K-42)', () => {
  // Friday 26 September 2026, 12:00 in Istanbul.
  const now = Date.parse('2026-09-26T09:00:00Z');
  const at = (iso: string, hours = 3) => ({
    startsAt: iso,
    endsAt: new Date(Date.parse(iso) + hours * 3_600_000).toISOString(),
  });

  it('counts an event running now or starting before midnight as today, not one that ended', () => {
    expect(hasEventToday([at('2026-09-26T08:00:00Z')], now)).toBe(true); // running
    expect(hasEventToday([at('2026-09-26T18:00:00Z')], now)).toBe(true); // 21:00 today
    expect(hasEventToday([at('2026-09-25T20:00:00Z', 16)], now)).toBe(true); // since last night
    expect(hasEventToday([at('2026-09-26T21:30:00Z')], now)).toBe(false); // 00:30 tomorrow
    expect(hasEventToday([at('2026-09-26T04:00:00Z', 1)], now)).toBe(false); // ended at 08:00
    expect(hasEventToday([], now)).toBe(false);
  });

  it('puts venues with an event today first, then sorts by name in Turkish', () => {
    const venues = [
      { name: 'Zeytin', events: [] },
      { name: 'Çınar', events: [] },
      { name: 'Şahin', events: [at('2026-09-26T18:00:00Z')] },
      { name: 'Cadde', events: [at('2026-09-27T18:00:00Z')] },
    ];
    const sorted = sortVenues(venues, now);
    expect(sorted.venues.map((v) => v.name)).toEqual(['Şahin', 'Cadde', 'Çınar', 'Zeytin']);
    expect(sorted.sort).toBe('eventsFirst');
    expect(sortVenues(venues.slice(0, 2), now)).toEqual({
      venues: [venues[1], venues[0]],
      sort: 'byName',
    });
  });

  const venues = [
    { name: 'Kampüs', city: 'Sakarya', district: 'Serdivan', kind: 'campus' },
    { name: 'Köşe Kahve', city: 'İstanbul', district: 'Beylikdüzü', kind: 'cafe' },
    { name: 'Liman Çay', city: 'İstanbul', district: 'Avcılar', kind: 'cafe' },
  ];

  it('lists the cities and their districts by name', () => {
    expect(exploreCities(venues)).toEqual([
      { city: 'İstanbul', districts: ['Avcılar', 'Beylikdüzü'] },
      { city: 'Sakarya', districts: ['Serdivan'] },
    ]);
  });

  it('picks the city with the most active venues, the first by name on a tie', () => {
    expect(defaultCity(venues)).toBe('İstanbul');
    expect(defaultCity(venues.slice(0, 2))).toBe('İstanbul');
    expect(defaultCity([])).toBeNull();
  });

  it('keeps a remembered place while it still has a venue, else falls back to the default city', () => {
    expect(explorePlace({ city: 'Sakarya', district: 'Serdivan' }, venues)).toEqual({
      city: 'Sakarya',
      district: 'Serdivan',
    });
    expect(explorePlace({ city: 'Sakarya', district: 'Adapazarı' }, venues)).toEqual({
      city: 'Sakarya',
      district: null,
    });
    expect(explorePlace({ city: 'Ankara', district: null }, venues)).toEqual({
      city: 'İstanbul',
      district: null,
    });
    expect(explorePlace(null, venues)).toEqual({ city: 'İstanbul', district: null });
    expect(explorePlace(null, [])).toBeNull();
  });

  it('filters by place, kind and the name, Turkish letters alike', () => {
    const names = (r: { name: string }[]) => r.map((v) => v.name);
    const istanbul = { city: 'İstanbul', district: null };
    expect(names(filterVenues(venues, { place: istanbul, kind: 'all', query: '' }))).toEqual([
      'Köşe Kahve',
      'Liman Çay',
    ]);
    expect(
      names(
        filterVenues(venues, {
          place: { ...istanbul, district: 'Avcılar' },
          kind: 'all',
          query: '',
        }),
      ),
    ).toEqual(['Liman Çay']);
    expect(names(filterVenues(venues, { place: istanbul, kind: 'campus', query: '' }))).toEqual([]);
    expect(names(filterVenues(venues, { place: istanbul, kind: 'all', query: '  KOSE ' }))).toEqual(
      ['Köşe Kahve'],
    );
    expect(names(filterVenues(venues, { place: istanbul, kind: 'all', query: 'çay' }))).toEqual([
      'Liman Çay',
    ]);
    expect(names(filterVenues(venues, { place: null, kind: 'campus', query: '' }))).toEqual([
      'Kampüs',
    ]);
  });
});

describe('todayEvents (docs/SPEC_V4.md K-15)', () => {
  // Friday 26 September 2026, 12:00 in Istanbul.
  const now = Date.parse('2026-09-26T09:00:00Z');
  const ev = (title: string, iso: string, hours = 3) => ({
    title,
    startsAt: iso,
    endsAt: new Date(Date.parse(iso) + hours * 3_600_000).toISOString(),
  });

  it("lists today's events of every venue, earliest first, and leaves tomorrow and the ended out", () => {
    const venues = [
      {
        name: 'Zeytin',
        events: [ev('Akşam', '2026-09-26T17:00:00Z'), ev('Yarın', '2026-09-27T10:00:00Z')],
      },
      { name: 'Çınar', events: [ev('Sabah', '2026-09-26T05:00:00Z', 1)] },
      {
        name: 'Ada',
        events: [ev('Öğle', '2026-09-26T08:30:00Z'), ev('Akşam', '2026-09-26T17:00:00Z')],
      },
    ];
    expect(todayEvents(venues, now).map((e) => `${e.venue.name}/${e.event.title}`)).toEqual([
      'Ada/Öğle',
      'Ada/Akşam',
      'Zeytin/Akşam',
    ]);
    expect(todayEvents([], now)).toEqual([]);
  });
});
