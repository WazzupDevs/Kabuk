import { describe, expect, it } from 'vitest';

import { FACE_MOVERS, faceMovers, sameKeys } from './faceMovers';

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `k${i}`, index: i }));

describe('faceMovers', () => {
  it('moves only the newest few of the rows on the screen', () => {
    const got = faceMovers(rows(10));
    expect(got.size).toBe(FACE_MOVERS);
    expect([...got].sort()).toEqual(['k0', 'k1', 'k2', 'k3']);
  });
  it('counts the viewable rows only, whatever their order', () => {
    const visible = [
      { key: 'c', index: 9 },
      { key: 'a', index: 7 },
      { key: 'b', index: 8 },
    ];
    expect([...faceMovers(visible, 2)].sort()).toEqual(['a', 'b']);
  });
  it('skips rows with no index and moves none with nothing on the screen', () => {
    expect(faceMovers([{ key: 'x', index: null }]).size).toBe(0);
    expect(faceMovers([]).size).toBe(0);
  });
  it('compares sets by content', () => {
    expect(sameKeys(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(sameKeys(new Set(['a']), new Set(['b']))).toBe(false);
  });
});
