import { describe, expect, it } from 'vitest';

import { alphaBounds, pointsOf, trimRect, unionRect } from '../../capsule/artBounds';

// A picture of `width` × `height` pixels with the alpha of the pixels at `on` set.
function picture(width: number, height: number, on: readonly [number, number, number?][]) {
  const px = new Uint8Array(width * height * 4);
  for (const [x, y, a = 255] of on) px[(y * width + x) * 4 + 3] = a;
  return px;
}

// The box read the slow way: every pixel.
function slowBounds(px: Uint8Array, width: number, height: number) {
  let l = Infinity;
  let t = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (px[(y * width + x) * 4 + 3] !== 0) {
        l = Math.min(l, x);
        t = Math.min(t, y);
        r = Math.max(r, x);
        b = Math.max(b, y);
      }
  return l === Infinity ? null : { x: l, y: t, width: r - l + 1, height: b - t + 1 };
}

describe('alphaBounds', () => {
  it('is null for an empty picture', () => {
    expect(alphaBounds(picture(5, 4, []), 5, 4)).toBeNull();
  });

  it('holds one pixel', () => {
    expect(alphaBounds(picture(5, 4, [[2, 1]]), 5, 4)).toEqual({ x: 2, y: 1, width: 1, height: 1 });
    expect(alphaBounds(picture(5, 4, [[0, 0]]), 5, 4)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(alphaBounds(picture(5, 4, [[4, 3]]), 5, 4)).toEqual({ x: 4, y: 3, width: 1, height: 1 });
  });

  it('counts a faint pixel and only the alpha', () => {
    const px = picture(6, 6, [[1, 4, 1]]);
    // Colour without alpha (an unpremultiplied empty pixel) is not drawn.
    px[(0 * 6 + 5) * 4] = 255;
    expect(alphaBounds(px, 6, 6)).toEqual({ x: 1, y: 4, width: 1, height: 1 });
  });

  it('finds the ends on different rows', () => {
    const on: [number, number][] = [
      [3, 1],
      [1, 2],
      [6, 3],
      [2, 5],
    ];
    expect(alphaBounds(picture(8, 7, on), 8, 7)).toEqual({ x: 1, y: 1, width: 6, height: 5 });
  });

  it('matches reading every pixel', () => {
    let seed = 7;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    for (let i = 0; i < 200; i++) {
      const w = 1 + rand(12);
      const h = 1 + rand(12);
      const on: [number, number][] = [];
      const count = rand(5);
      for (let k = 0; k < count; k++) on.push([rand(w), rand(h)]);
      const px = picture(w, h, on);
      expect(alphaBounds(px, w, h)).toEqual(slowBounds(px, w, h));
    }
  });
});

describe('trimRect', () => {
  it('keeps a pixel of margin inside the picture', () => {
    expect(trimRect({ x: 3, y: 4, width: 2, height: 5 }, 20, 20)).toEqual({
      x: 2,
      y: 3,
      width: 4,
      height: 7,
    });
  });

  it('stops at the picture’s edges', () => {
    expect(trimRect({ x: 0, y: 0, width: 10, height: 8 }, 10, 8)).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 8,
    });
    expect(trimRect({ x: 9, y: 7, width: 1, height: 1 }, 10, 8)).toEqual({
      x: 8,
      y: 6,
      width: 2,
      height: 2,
    });
  });

  it('keeps one empty pixel for an empty picture', () => {
    expect(trimRect(null, 10, 8)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});

describe('pointsOf', () => {
  it('draws on the whole pixels it was cut at', () => {
    const at = pointsOf({ x: 7, y: 11, width: 30, height: 4 }, 2.625);
    expect(at.x * 2.625).toBeCloseTo(7, 9);
    expect(at.y * 2.625).toBeCloseTo(11, 9);
    expect((at.x + at.width) * 2.625).toBeCloseTo(37, 9);
    expect((at.y + at.height) * 2.625).toBeCloseTo(15, 9);
  });
});

describe('unionRect', () => {
  it('is null for none', () => {
    expect(unionRect([])).toBeNull();
  });

  it('holds every box, with room round it', () => {
    expect(
      unionRect(
        [
          { x: 2, y: 3, width: 4, height: 1 },
          { x: -1, y: 5, width: 2, height: 2 },
        ],
        1,
      ),
    ).toEqual({ x: -2, y: 2, width: 9, height: 6 });
  });
});
