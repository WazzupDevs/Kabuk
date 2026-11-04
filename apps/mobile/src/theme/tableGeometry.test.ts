import { describe, expect, it } from 'vitest';

import { TABLE } from './vampirTableSize';

import { seatsAround } from './tableGeometry';

const { cx, cy, width, height } = TABLE.frame;

describe('the capsule table', () => {
  it('seats eight where the design does (VampirOylama)', () => {
    const s = seatsAround(8);
    const near = (p: readonly [number, number], q: [number, number]) => {
      expect(p[0]).toBeCloseTo(q[0], 1);
      expect(p[1]).toBeCloseTo(q[1], 1);
    };
    near(s[0]!.seat, [180, 628]);
    near(s[1]!.seat, [53.4, 541.6]);
    near(s[2]!.seat, [44, 380]);
    near(s[4]!.seat, [180, 132]);
    near(s[6]!.seat, [316, 380]);
    // The cards' middles (the panel's left/top plus half of 24 × 33) and turns.
    near(s[0]!.card, [180, 583]);
    near(s[2]!.card, [89, 380]);
    near(s[1]!.card, [95.3, 525.2]);
    expect(s[0]!.turn).toBeCloseTo(0, 1);
    expect(s[1]!.turn).toBeCloseTo(68.6, 1);
    expect(s[2]!.turn).toBeCloseTo(90, 1);
  });

  it.each([5, 6, 7, 8, 9, 10, 11, 12])('seats %i at even steps, the first at the bottom', (n) => {
    const s = seatsAround(n);
    expect(s).toHaveLength(n);
    expect(s[0]!.seat[0]).toBeCloseTo(cx, 5);
    expect(s[0]!.seat[1]).toBeGreaterThan(cy);
    for (const p of s) {
      const [x, y] = p.seat;
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(height);
      // The card lies on the table, the candle beside it.
      const [kx, ky] = p.card;
      const inside =
        Math.abs(ky - cy) <= TABLE.straight
          ? Math.abs(kx - cx) < TABLE.half
          : Math.hypot(kx - cx, Math.abs(ky - cy) - TABLE.straight) < TABLE.half;
      expect(inside).toBe(true);
    }
  });
});
