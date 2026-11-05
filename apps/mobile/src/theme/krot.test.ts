import { describe, expect, it } from 'vitest';

import { KROT, KROT_TYPE, krotLineup } from './krot';

const L = KROT.lineup;

describe('krotLineup (Krot line-up)', () => {
  it('keeps the canvas row up to five players', () => {
    for (const n of [3, 4, 5]) {
      const g = krotLineup(390, n);
      expect(g.boxHeight).toBe(L.height);
      expect(g.spots.map((s) => s.left)).toEqual(
        Array.from({ length: n }, (_, i) => L.colLeft + i * L.colWidth),
      );
      expect(g.spots.every((s) => s.fit === 1 && s.top === 0)).toBe(true);
      expect(g.row.faceMid).toBe(L.bigTop + L.big / 2);
      expect(g.row.faceMid).toBe(L.avatarTop + L.avatar / 2);
    }
  });

  for (const n of [6, 7, 8, 9, 10, 11, 12]) {
    describe(`${n} players`, () => {
      const g = krotLineup(390, n);
      const rowTops = [...new Set(g.spots.map((s) => s.top))];

      it('stand in two rows of the 300 box, in clue order', () => {
        expect(g.boxHeight).toBe(L.rows.height);
        expect(g.width).toBe(L.width);
        expect(g.spots).toHaveLength(n);
        expect(rowTops).toHaveLength(2);
        const top = g.spots.filter((s) => s.top === rowTops[0]).length;
        expect(top).toBe(Math.ceil(n / 2));
        // Left to right, the top row first.
        g.spots.forEach((s, i) => {
          const next = g.spots[i + 1];
          if (next && next.top === s.top) expect(next.left).toBeGreaterThan(s.left);
          if (next && next.top !== s.top) expect(next.top).toBeGreaterThan(s.top);
        });
      });

      it('never lets a ring reach a neighbour face, inside the box', () => {
        for (const s of g.spots) {
          const big = (L.big * s.fit) / 2;
          // A chosen one beside a chosen one, the worst case.
          expect(big + L.ring + big).toBeLessThanOrEqual(s.width);
          const mid = s.left + s.width / 2;
          // Five to a row keep the halo inside too; six keep the ring.
          const out = big + L.ring + (s.fit === 1 ? L.halo : 0);
          expect(mid - out).toBeGreaterThanOrEqual(0);
          expect(mid + out).toBeLessThanOrEqual(L.width);
        }
      });

      it('keeps faces and names near the drawn size', () => {
        for (const s of g.spots) {
          expect(L.big * s.fit).toBeGreaterThanOrEqual(54);
          expect(L.avatar * s.fit).toBeGreaterThanOrEqual(45);
          expect(s.width - 2 * L.name.side).toBeGreaterThanOrEqual(KROT.lineup.plate.width + 20);
        }
        // The name keeps its 12 and two lines (it breaks, never "…").
        expect(KROT_TYPE.name.fontSize).toBe(12);
        expect(L.name.minHeight).toBeGreaterThanOrEqual(2 * (KROT_TYPE.name.lineHeight ?? 0));
      });

      it('stacks a row so nothing lands on the next part or row', () => {
        const r = g.row;
        const bigHalf = L.big / 2;
        // "Yakalandı" over the face; the face's ring clears the plate; the plate clears the name.
        expect(r.stampTop).toBeGreaterThanOrEqual(0);
        expect(r.faceMid + bigHalf + L.ring).toBeLessThan(r.plateTop - L.plate.edge);
        expect(r.plateTop + L.plate.height + L.plate.edge).toBeLessThanOrEqual(r.nameTop);
        expect(r.nameTop + L.name.minHeight).toBeLessThanOrEqual(r.height);
        // The second row's halo stays under the first row's name.
        const [a = 0, b = 0] = rowTops;
        expect(a + r.nameTop + L.name.minHeight).toBeLessThan(
          b + r.faceMid - bigHalf - L.ring - L.halo,
        );
        expect(b + r.height).toBeLessThanOrEqual(g.boxHeight);
      });

      it('scales as a whole on 320 dp', () => {
        const narrow = krotLineup(320, n);
        expect(narrow.scale).toBeCloseTo(280 / 350);
        expect(narrow.height).toBeCloseTo(L.rows.height * narrow.scale);
        expect(narrow.spots).toEqual(g.spots);
      });
    });
  }
});
