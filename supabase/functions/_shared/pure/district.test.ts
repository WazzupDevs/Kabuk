import { describe, expect, it } from 'vitest';

import {
  clockText,
  DISTRICT,
  distanceToRing,
  type DistrictShape,
  insideRing,
  istanbulDay,
  locate,
  nextIstanbulMidnight,
  parseRing,
  pickRoom,
  secondsUntil,
} from './district.ts';
import { GECIT_SAMPLES, sampleFor } from './gecitSamples.ts';

// Two squares sharing the edge lng = 28.70.
const WEST: DistrictShape = {
  ref: 'bati',
  name: 'Batı',
  ring: [
    [28.6, 40.95],
    [28.7, 40.95],
    [28.7, 41.05],
    [28.6, 41.05],
  ],
};
const EAST: DistrictShape = {
  ref: 'dogu',
  name: 'Doğu',
  ring: [
    [28.7, 40.95],
    [28.8, 40.95],
    [28.8, 41.05],
    [28.7, 41.05],
  ],
};

describe('Istanbul day', () => {
  it('turns at 21:00 UTC', () => {
    expect(istanbulDay(new Date('2026-11-08T20:59:59Z'))).toBe('2026-11-08');
    expect(istanbulDay(new Date('2026-11-08T21:00:00Z'))).toBe('2026-11-09');
  });

  it('finds the next 00:00 in Istanbul', () => {
    expect(nextIstanbulMidnight(new Date('2026-11-08T10:00:00Z')).toISOString()).toBe(
      '2026-11-08T21:00:00.000Z',
    );
    expect(nextIstanbulMidnight(new Date('2026-11-08T21:00:00Z')).toISOString()).toBe(
      '2026-11-09T21:00:00.000Z',
    );
  });

  it('counts down in sa:dk:sn', () => {
    const now = new Date('2026-11-08T13:17:42Z');
    expect(secondsUntil(nextIstanbulMidnight(now), now)).toBe(7 * 3600 + 42 * 60 + 18);
    expect(clockText(7 * 3600 + 42 * 60 + 18)).toBe('07:42:18');
    expect(clockText(-5)).toBe('00:00:00');
    expect(secondsUntil('2020-01-01T00:00:00Z', now)).toBe(0);
  });
});

describe('finding the district', () => {
  it('tells inside from outside and measures the distance to the edge', () => {
    expect(insideRing([28.65, 41.0], WEST.ring)).toBe(true);
    expect(insideRing([28.75, 41.0], WEST.ring)).toBe(false);
    // 0.001° of longitude at 41° is about 84 m.
    expect(distanceToRing([28.701, 41.0], WEST.ring)).toBeGreaterThan(70);
    expect(distanceToRing([28.701, 41.0], WEST.ring)).toBeLessThan(100);
  });

  it('finds one district, offers both near a shared border, and knows outside', () => {
    expect(locate([28.62, 41.0], [WEST, EAST])).toEqual({ kind: 'found', ref: 'bati' });
    expect(locate([28.702, 41.0], [WEST, EAST])).toEqual({
      kind: 'choose',
      refs: ['bati', 'dogu'],
    });
    // Within the outer tolerance, outside the ring.
    expect(locate([28.595, 41.0], [WEST, EAST])).toEqual({ kind: 'found', ref: 'bati' });
    expect(locate([29.0, 41.0], [WEST, EAST])).toEqual({ kind: 'outside' });
    expect(DISTRICT.borderToleranceM).toBe(500);
  });

  it('reads only rings of at least three valid points', () => {
    expect(
      parseRing([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    expect(
      parseRing([
        [1, 2],
        [3, 4],
      ]),
    ).toBeNull();
    expect(
      parseRing([
        [1, 2],
        [3, 4],
        [500, 6],
      ]),
    ).toBeNull();
    expect(parseRing('x')).toBeNull();
  });
});

describe('placing in a room', () => {
  it('takes the fullest room with a seat, the older on a tie, none when all are full', () => {
    const full = DISTRICT.roomCapacity;
    expect(
      pickRoom([
        { id: 'a', people: 3, createdAt: '2026-11-08T10:00:00Z' },
        { id: 'b', people: 9, createdAt: '2026-11-08T11:00:00Z' },
        { id: 'c', people: full, createdAt: '2026-11-08T09:00:00Z' },
      ]),
    ).toBe('b');
    expect(
      pickRoom([
        { id: 'a', people: 5, createdAt: '2026-11-08T11:00:00Z' },
        { id: 'b', people: 5, createdAt: '2026-11-08T10:00:00Z' },
      ]),
    ).toBe('b');
    expect(pickRoom([{ id: 'a', people: full, createdAt: '2026-11-08T10:00:00Z' }])).toBeNull();
  });
});

describe('dev sample questions', () => {
  it('have four options and a valid answer, one per day in turn', () => {
    for (const s of GECIT_SAMPLES) {
      expect(s.options).toHaveLength(4);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(4);
    }
    expect(sampleFor('2026-11-08')).toEqual(sampleFor('2026-11-08'));
    expect(sampleFor('2026-11-09')).not.toEqual(sampleFor('2026-11-08'));
  });
});
