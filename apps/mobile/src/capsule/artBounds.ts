// Where a capsule picture draws (components/FxSkia.tsx): a still layer's picture kept to the box of
// its own pixels, and the box a group of pictures covers. No dependency: unit-tested
// (features/capsule/artBounds.test.ts).

// A box in whole pixels.
export type PxRect = { x: number; y: number; width: number; height: number };
// A box in points.
export type PtRect = { x: number; y: number; width: number; height: number };

// The smallest box holding every pixel whose alpha is not 0, in `pixels` (four bytes a pixel, its
// alpha the fourth: RGBA and BGRA alike), or null when none is. Reads only the rows and columns it
// has to: the empty rows at the top and the bottom, then each row's empty ends.
export function alphaBounds(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): PxRect | null {
  const at = (x: number, y: number) => pixels[(y * width + x) * 4 + 3] !== 0;
  const rowHas = (y: number) => {
    for (let x = 0; x < width; x++) if (at(x, y)) return true;
    return false;
  };
  let top = 0;
  while (top < height && !rowHas(top)) top++;
  if (top === height) return null;
  let bottom = height - 1;
  while (bottom > top && !rowHas(bottom)) bottom--;
  // None seen yet: each row is read only left of the leftmost and right of the rightmost so far.
  let left = width;
  let right = -1;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < left; x++) {
      if (at(x, y)) {
        left = x;
        break;
      }
    }
    for (let x = width - 1; x > right; x--) {
      if (at(x, y)) {
        right = x;
        break;
      }
    }
  }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

// The box a picture of `width` × `height` pixels is kept to: its pixels' box and `margin` empty
// pixels round it (the edge smoothed as before when the picture is moved: its neighbours are
// empty pixels, as in the whole picture), inside the picture. Nothing drawn: one empty pixel at its
// corner.
export function trimRect(bounds: PxRect | null, width: number, height: number, margin = 1): PxRect {
  if (!bounds) return { x: 0, y: 0, width: 1, height: 1 };
  const x = Math.max(0, bounds.x - margin);
  const y = Math.max(0, bounds.y - margin);
  const r = Math.min(width, bounds.x + bounds.width + margin);
  const b = Math.min(height, bounds.y + bounds.height + margin);
  return { x, y, width: r - x, height: b - y };
}

// A kept box in points at the screen's `ratio`: at its whole pixels, so that it draws on the
// same pixels as the whole picture did.
export function pointsOf(rect: PxRect, ratio: number): PtRect {
  return {
    x: rect.x / ratio,
    y: rect.y / ratio,
    width: rect.width / ratio,
    height: rect.height / ratio,
  };
}

// The box holding all of `rects`, `by` more on every side; null for none.
export function unionRect(rects: readonly PtRect[], by = 0): PtRect | null {
  if (rects.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.x);
    top = Math.min(top, r.y);
    right = Math.max(right, r.x + r.width);
    bottom = Math.max(bottom, r.y + r.height);
  }
  return { x: left - by, y: top - by, width: right - left + 2 * by, height: bottom - top + 2 * by };
}
