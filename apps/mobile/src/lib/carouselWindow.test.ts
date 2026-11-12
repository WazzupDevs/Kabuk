import { describe, expect, it } from 'vitest';

import {
  CAROUSEL_BUFFER,
  CAROUSEL_KEEP,
  carouselBound,
  carouselGrow,
  carouselWindow,
} from './carouselWindow';

describe('carouselBound', () => {
  const K = CAROUSEL_KEEP;
  it('keeps what was bound as the window moves a step, and binds only the new one', () => {
    const a = { from: 10, to: 20 };
    const b = carouselBound(a, { from: 11, to: 21 }, K);
    expect(b).toEqual({ from: 10, to: 21 });
    // A step back binds nothing new: the same object.
    expect(carouselBound(b, { from: 10, to: 20 }, K)).toBe(b);
  });
  it('lets go of what is more than `keep` past the window', () => {
    let bound = { from: 10, to: 20 };
    for (let s = 1; s <= 20; s++) bound = carouselBound(bound, { from: 10 + s, to: 20 + s }, K);
    expect(bound).toEqual({ from: 30 - K, to: 40 });
  });
  it('binds the window alone after a jump far along the row', () => {
    expect(carouselBound({ from: 0, to: 10 }, { from: 50, to: 60 }, K)).toEqual({
      from: 50,
      to: 60,
    });
    expect(carouselBound({ from: 0, to: -1 }, { from: 3, to: 8 }, K)).toEqual({ from: 3, to: 8 });
  });
  it('binds nothing for an empty row', () => {
    const none = { from: 0, to: -1 };
    expect(carouselBound(none, none, K)).toBe(none);
  });
});

describe('carouselGrow', () => {
  const K = CAROUSEL_KEEP;
  it('binds one more at a time, both sides, up to `keep` and the row ends', () => {
    const need = { from: 10, to: 20 };
    let bound = need;
    const seen: { from: number; to: number }[] = [];
    for (;;) {
      const next = carouselGrow(bound, need, 140, K);
      if (next === bound) break;
      expect(next.to - next.from).toBe(bound.to - bound.from + 1);
      seen.push(next);
      bound = next;
    }
    expect(bound).toEqual({ from: 10 - K, to: 20 + K });
    expect(seen).toHaveLength(2 * K);
    // After the window first on a tie.
    expect(seen[0]).toEqual({ from: 10, to: 21 });
    expect(seen[1]).toEqual({ from: 9, to: 21 });
  });
  it('stops at the row ends', () => {
    let bound = { from: 0, to: 4 };
    for (let i = 0; i < 20; i++) bound = carouselGrow(bound, { from: 0, to: 4 }, 7, K);
    expect(bound).toEqual({ from: 0, to: 6 });
  });
  it('follows a window that moved', () => {
    const grown = carouselGrow({ from: 0, to: 30 }, { from: 40, to: 50 }, 140, K);
    expect(grown.from).toBeGreaterThanOrEqual(40 - K);
    expect(grown.to).toBeLessThanOrEqual(50 + K);
  });
});

describe('carouselWindow', () => {
  it('binds only the screen and a buffer, whatever the count', () => {
    const w = carouselWindow(60 * 90, 90, 140, 360);
    const reach = Math.ceil(360 / 2 / 90);
    expect(w).toEqual({ from: 60 - reach - CAROUSEL_BUFFER, to: 60 + reach + CAROUSEL_BUFFER });
    expect(w.to - w.from + 1).toBeLessThan(20);
  });
  it('stays inside the row at both ends', () => {
    expect(carouselWindow(0, 90, 140, 360).from).toBe(0);
    expect(carouselWindow(139 * 90, 90, 140, 360).to).toBe(139);
    expect(carouselWindow(5000 * 90, 90, 10, 360)).toEqual({ from: 9, to: 9 });
  });
  it('binds all of a short row and none of an empty one', () => {
    expect(carouselWindow(0, 90, 4, 360)).toEqual({ from: 0, to: 3 });
    const none = carouselWindow(0, 90, 0, 360);
    expect(none.to).toBeLessThan(none.from);
  });
  it('covers every option the screen shows', () => {
    for (let at = 0; at < 140; at++) {
      const w = carouselWindow(at * 90, 90, 140, 360);
      for (let i = Math.max(0, at - 2); i <= Math.min(139, at + 2); i++) {
        expect(i).toBeGreaterThanOrEqual(w.from);
        expect(i).toBeLessThanOrEqual(w.to);
      }
    }
  });
});
