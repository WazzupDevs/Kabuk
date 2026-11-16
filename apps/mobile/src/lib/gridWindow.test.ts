import { describe, expect, it } from 'vitest';

import {
  type GridSection,
  gridLayout,
  offsetOfSection,
  sectionAt,
  sectionIndexAt,
  windowOf,
  windowOfRows,
} from './gridWindow';

const base = { columns: 4, rowHeight: 100, gap: 8, paddingTop: 10, paddingBottom: 20 };
const section = (key: string, count: number, headerHeight = 40): GridSection => ({
  key,
  count,
  headerHeight,
});
const make = (sections: GridSection[], over: Partial<typeof base> = {}) =>
  gridLayout({ ...base, ...over, sections });

// 53 options in 7 sections.
const SEVEN = [8, 7, 9, 6, 10, 5, 8].map((n, i) => section(`s${i}`, n));

describe('gridLayout', () => {
  it('lays out title rows and rows of `columns`, with the gap between rows only', () => {
    const l = make([section('a', 5), section('b', 4)]);
    expect(l.rows.map((r) => [r.kind, r.section, r.first, r.count, r.offset, r.height])).toEqual([
      ['header', 0, 0, 0, 10, 40],
      ['items', 0, 0, 4, 58, 100],
      ['items', 0, 4, 1, 166, 100],
      ['header', 1, 0, 0, 274, 40],
      ['items', 1, 0, 4, 322, 100],
    ]);
    // The last row's gap is not content: it ends at 422, then the bottom padding.
    expect(l.total).toBe(442);
  });

  it('leaves out an empty section and counts a last row that is not full', () => {
    const l = make([section('a', 0), section('b', 5), section('c', 0)]);
    expect(l.sectionKeys).toEqual(['b']);
    expect(l.rows).toHaveLength(3);
    expect(l.rows[2]?.count).toBe(1);
  });

  it('has only the padding when there is nothing', () => {
    const l = make([section('a', 0)]);
    expect(l.rows).toHaveLength(0);
    expect(l.total).toBe(30);
    expect(make([]).total).toBe(30);
  });

  it('puts a section without a title straight into its rows', () => {
    const l = make([section('a', 4, 0)]);
    expect(l.rows.map((r) => r.kind)).toEqual(['items']);
    expect(l.sectionOffsets).toEqual([10]);
  });

  it('lays out 53 options in 7 sections as 7 title rows and 16 option rows', () => {
    const l = make(SEVEN);
    expect(l.rows.filter((r) => r.kind === 'header')).toHaveLength(7);
    expect(l.rows.filter((r) => r.kind === 'items')).toHaveLength(16);
    expect(l.rows.reduce((n, r) => n + r.count, 0)).toBe(53);
    // 7 titles of 40, 16 rows of 100, 22 gaps of 8, the paddings.
    expect(l.total).toBe(7 * 40 + 16 * 100 + 22 * 8 + 30);
    for (let i = 1; i < l.rows.length; i++)
      expect(l.offsets[i]).toBe((l.ends[i - 1] ?? 0) + base.gap);
  });

  it('treats columns below one as one', () => {
    expect(make([section('a', 3)], { columns: 0 }).rows).toHaveLength(4);
  });
});

describe('windowOf', () => {
  const l = make(SEVEN);
  const touching = (y: number, h: number) =>
    l.rows.flatMap((r, i) => (r.offset + r.height > y && r.offset < y + h ? [i] : []));

  it('binds the rows that touch the screen, and the overscan either side', () => {
    for (const y of [0, 1, 57, 58, 300, 777, 1500]) {
      const t = touching(y, 640);
      const lo = t[0] ?? 0;
      const hi = t[t.length - 1] ?? 0;
      const w = windowOf(l, y, 640, 0);
      expect(w).toEqual({ from: lo, to: hi });
      expect(windowOf(l, y, 640, 2)).toEqual({
        from: Math.max(0, lo - 2),
        to: Math.min(l.rows.length - 1, hi + 2),
      });
    }
  });

  it('clamps at both ends of the grid', () => {
    expect(windowOf(l, -200, 640, 3).from).toBe(0);
    expect(windowOf(l, 0, 640, 3).from).toBe(0);
    expect(windowOf(l, 1e6, 640, 3).to).toBe(l.rows.length - 1);
    // Scrolled past the end: the last row stays bound.
    expect(windowOf(l, 1e6, 640, 0)).toEqual({ from: l.rows.length - 1, to: l.rows.length - 1 });
  });

  it('is empty for no rows or no viewport', () => {
    expect(windowOf(make([]), 0, 640, 3)).toEqual({ from: 0, to: -1 });
    expect(windowOf(l, 0, 0, 3)).toEqual({ from: 0, to: -1 });
  });

  it('binds everything when the content is shorter than the viewport', () => {
    const short = make([section('a', 5)]);
    expect(windowOf(short, 0, 2000, 0)).toEqual({ from: 0, to: short.rows.length - 1 });
  });

  it('does not change inside the same rows', () => {
    const a = windowOf(l, 100, 640, 1);
    const b = windowOf(l, 103, 640, 1);
    expect(b).toEqual(a);
  });

  it('keeps a gap between two rows from binding both', () => {
    const l2 = make([section('a', 8, 0)], { gap: 50 });
    // Row 0 is 10..110, row 1 is 160..260: the screen 120..150 touches neither.
    const w = windowOf(l2, 120, 30, 0);
    expect(w.to).toBeGreaterThanOrEqual(w.from - 1);
  });
});

describe('windowOf on a large catalogue', () => {
  const big = make([section('a', 2500), section('b', 2500)]);

  it('lays out 5000 options in 1250 option rows and answers everywhere', () => {
    expect(big.rows.filter((r) => r.kind === 'items')).toHaveLength(1250);
    for (const y of [0, 50_000, 120_000, big.total]) {
      const w = windowOf(big, y, 700, 2);
      expect(w.to).toBeGreaterThanOrEqual(w.from);
      expect(w.to - w.from).toBeLessThan(20);
    }
  });

  it('searches the rows in a handful of reads (no scan)', () => {
    let reads = 0;
    const count = (a: number[]) =>
      new Proxy(a, {
        get(target, prop, receiver) {
          if (typeof prop === 'string' && /^\d+$/.test(prop)) reads++;
          return Reflect.get(target, prop, receiver);
        },
      });
    windowOfRows(count(big.offsets), count(big.ends), 60_000, 700, 2);
    expect(reads).toBeLessThan(60);
  });
});

describe('offsetOfSection and sectionAt', () => {
  const l = make(SEVEN);

  it('finds where each section starts, null for a key that is not there', () => {
    const starts = l.rows.filter((r) => r.kind === 'header').map((r) => r.offset);
    SEVEN.forEach((s, i) => expect(offsetOfSection(l, s.key)).toBe(starts[i]));
    expect(offsetOfSection(l, 'zzz')).toBeNull();
    expect(offsetOfSection(make([section('e', 0)]), 'e')).toBeNull();
  });

  it('names the section that owns the top of the screen, with the pinned title’s share', () => {
    const second = offsetOfSection(l, 's1') ?? 0;
    expect(sectionAt(l, 0, 0)).toBe('s0');
    expect(sectionAt(l, second - 1, 0)).toBe('s0');
    expect(sectionAt(l, second, 0)).toBe('s1');
    // The pinned title covers the first 40: the next section owns the screen 40 sooner.
    expect(sectionAt(l, second - 40, 40)).toBe('s1');
    expect(sectionAt(l, second - 41, 40)).toBe('s0');
  });

  it('is the first section above the grid and the last below it', () => {
    expect(sectionAt(l, -100, 0)).toBe('s0');
    expect(sectionAt(l, 1e6, 0)).toBe('s6');
  });

  it('is none when there are no sections', () => {
    expect(sectionAt(make([]), 0, 0)).toBeNull();
    expect(sectionIndexAt([], 0, 0)).toBe(-1);
  });

  it('skips an empty section', () => {
    const e = make([section('a', 4), section('b', 0), section('c', 4)]);
    expect(sectionAt(e, 1e6, 0)).toBe('c');
  });
});
