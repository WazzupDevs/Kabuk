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

// The box a still layer's picture of `width` × `height` pixels is cut to, from its pixels as read
// back (`pixels`, null when they could not be read). The whole picture when they could not be read,
// when they are fewer than the picture's, and when no pixel of them is drawn: a part's picture has
// pixels, and none read back is the reading's failure (a surface not read as it was drawn), never
// a reason to keep nothing. Only a box of the read pixels is ever smaller than the picture.
export function keptRect(
  pixels: ArrayLike<number> | null,
  width: number,
  height: number,
  margin = 1,
): PxRect {
  const whole = { x: 0, y: 0, width, height };
  if (!pixels || pixels.length < width * height * 4) return whole;
  const bounds = alphaBounds(pixels, width, height);
  return bounds ? trimRect(bounds, width, height, margin) : whole;
}

// How much smaller the copy a picture's box is read from (the owner's report, 22 Kasım: reading
// every pixel of the whole picture took some 60 ms a layer and held Süsle back for a second): the
// box is read from a copy this many times smaller each way, a sixteenth of the pixels.
export const TRIM_SCALE = 3;
// The copy's pixels added on every side: a soft glow fades to nothing over several of them, and the
// smaller copy loses its faintest edge (a cut there showed as a straight line, 22 Kasım).
export const TRIM_ROOM = 3;

// The kept box read from the smaller copy (`small`, of `smallWidth` × `smallHeight`), in the
// picture's pixels (`width` × `height`): `room` of the copy's pixels more on every side, so that
// what the copy's rounding left out is in; the whole picture when the copy kept all of it.
export function scaleKept(
  small: PxRect,
  smallWidth: number,
  smallHeight: number,
  width: number,
  height: number,
  scale = TRIM_SCALE,
  room = TRIM_ROOM,
): PxRect {
  if (small.x === 0 && small.y === 0 && small.width === smallWidth && small.height === smallHeight)
    return { x: 0, y: 0, width, height };
  const x = Math.max(0, (small.x - room) * scale);
  const y = Math.max(0, (small.y - room) * scale);
  const right = Math.min(width, (small.x + small.width + room) * scale);
  const bottom = Math.min(height, (small.y + small.height + room) * scale);
  return { x, y, width: right - x, height: bottom - y };
}

// A picture the canvas can draw: its box and its pixels are not empty, and the picture is the
// box's size (a cut not of the box asked for draws elsewhere). Else the drawing falls back on its
// SVG (components/FxSkia.tsx → readWhole).
export function pictureUsable(rect: PxRect, imageWidth: number, imageHeight: number): boolean {
  return (
    rect.width > 0 && rect.height > 0 && imageWidth === rect.width && imageHeight === rect.height
  );
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
