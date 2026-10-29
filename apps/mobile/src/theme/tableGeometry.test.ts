import { describe, expect, it } from 'vitest';

import { TABLE } from './vampirTableSize';

import { curveBetween, measure, ring } from './tableGeometry';

const { cx, cy, width, height } = TABLE.frame;

describe('the round table', () => {
  it.each([5, 6, 7, 8, 9, 10, 11, 12])(
    'seats %i people at even steps, the first at the bottom',
    (n) => {
      const pts = ring(n);
      expect(pts).toHaveLength(n);
      expect(pts[0]?.[0]).toBeCloseTo(cx, 0);
      expect(pts[0]?.[1]).toBeCloseTo(cy + TABLE.seat.ry, 0);
      const gaps = pts.map((p, i) => {
        const q = pts[(i + 1) % n] ?? p;
        return Math.hypot(q[0] - p[0], q[1] - p[1]);
      });
      const most = Math.max(...gaps);
      const least = Math.min(...gaps);
      // Even along the ellipse: the straight gaps differ only by the curve's bend (most with five,
      // whose steps are long).
      expect(most / least).toBeLessThan(1.16);
      for (const [x, y] of pts) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(height);
      }
    },
  );

  it('never runs a line under the medallion', () => {
    for (const n of [5, 8, 12]) {
      const pts = ring(n);
      for (const a of pts) {
        for (const b of pts) {
          if (a === b) continue;
          const { length, pointAt } = measure(curveBetween(a, b, TABLE.face.big));
          for (let s = 0; s <= length; s += 2) {
            const [x, y] = pointAt(s);
            expect(Math.hypot(x - cx, y - cy)).toBeGreaterThan(TABLE.medal / 2);
          }
        }
      }
    }
  });
});
