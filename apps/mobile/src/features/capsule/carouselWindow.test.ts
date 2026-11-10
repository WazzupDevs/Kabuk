import { describe, expect, it } from 'vitest';

import { CAROUSEL_BUFFER, carouselWindow } from './carouselWindow';

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
