// What a screen's scroll moves (docs/design/iskelet.md → 3.1 to 3.3, 4.1): every part follows the
// finger one to one, linear and clamped, no curve. Worklets: the scroll's handler and the parts'
// styles call them on the UI thread, so their defaults are literals only (worklets.test.ts).

// 0 before `from`, 1 after `to`, linear between.
export function ramp(v: number, from: number, to: number): number {
  'worklet';
  if (to <= from) return v >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (v - from) / (to - from)));
}

// A title (or anything) that fades over [from, to] and shrinks to `scaleTo` as it does.
export function fadeAt(
  y: number,
  from: number,
  to: number,
  scaleTo: number = 1,
): { opacity: number; scale: number } {
  'worklet';
  const t = ramp(y, from, to);
  return { opacity: 1 - t, scale: 1 + (scaleTo - 1) * t };
}

// What comes in over [from, to] (the band, the bar's small title).
export function arriveAt(y: number, from: number, to: number): number {
  'worklet';
  return ramp(y, from, to);
}

// A sticky field (3.2): `pinAt` the offset at which it reaches its place under the bar; past it,
// it stays there (moved down by what scrolled past). -1: no field measured yet.
export function stickyLift(y: number, pinAt: number): number {
  'worklet';
  return pinAt < 0 ? 0 : Math.max(0, y - pinAt);
}

// What is above the field fades out and shrinks over the last `fadePx` before the field pins.
export function stickyFadeAt(
  y: number,
  pinAt: number,
  fadePx: number,
  scaleTo: number,
): { opacity: number; scale: number } {
  'worklet';
  if (pinAt < 0) return { opacity: 1, scale: 1 };
  return fadeAt(y, pinAt - fadePx, pinAt, scaleTo);
}

// A sticky field that thins as it pins (Keşfet's capsule, iskelet.md → 5.1): its height goes from
// `from` to `to` over the same last `fadePx` before the pin, and stays `to` once pinned.
export function stickyShrinkAt(
  y: number,
  pinAt: number,
  fadePx: number,
  from: number,
  to: number,
): number {
  'worklet';
  if (pinAt < 0) return from;
  return from + (to - from) * ramp(y, pinAt - fadePx, pinAt);
}

// The band reaches `reach` further down once the field pins (drawn that much taller and moved up
// by it until then): its move, from -reach to 0 over the last `reach` before the pin.
export function bandReachAt(y: number, pinAt: number, reach: number): number {
  'worklet';
  if (pinAt < 0 || reach <= 0) return 0;
  return -reach * (1 - ramp(y, pinAt - reach, pinAt));
}

// A cover under the content (the `kapak` bar, iskelet.md → 5.2): it moves up at `speed` of the
// scroll, linear; pulled past the top it stays.
export function coverShift(y: number, speed: number): number {
  'worklet';
  return -Math.max(0, y) * speed;
}

// Something in the scrolling content that moves at `speed` of the scroll instead (the own profile's
// upper part, iskelet.md → 5.7): the content carries it up by y, so it is moved back by y less its
// own move. Pulled past the top it stays where it is.
export function riseInContent(y: number, speed: number): number {
  'worklet';
  return y - Math.max(0, y) * speed;
}

// The own profile's flight into the bar (5.7): t from 0 to 1 over [0, arrive], linear.
export function flightAt(y: number, arrive: number): number {
  'worklet';
  return ramp(y, 0, arrive);
}

// A point's x on the flight, `from` to `to`.
export function flyX(t: number, from: number, to: number): number {
  'worklet';
  return from + (to - from) * t;
}

// A point's y on the flight: it starts riding the upper part (`from` moved up at `speed`, less as t
// grows) and ends at `to`: (from − speed·y·(1 − t))·(1 − t) + to·t.
export function flyY(y: number, t: number, from: number, to: number, speed: number): number {
  'worklet';
  return (from - speed * Math.max(0, y) * (1 - t)) * (1 - t) + to * t;
}

// The photo on the flight: its white disc `from` → `to` across and its ring `ringFrom` → `ringTo`,
// as the scales of the disc (drawn `from` across) and of the face in it (drawn from − 2·ringFrom).
export function flyFace(
  t: number,
  from: number,
  to: number,
  ringFrom: number,
  ringTo: number,
): { disc: number; face: number } {
  'worklet';
  const side = from + (to - from) * t;
  const ring = ringFrom + (ringTo - ringFrom) * t;
  return { disc: side / from, face: (side - 2 * ring) / (from - 2 * ringFrom) };
}

// The name's centre in the bar: its own `x`, kept `half` (its scaled half width) clear of the photo
// on its left (`left`) and the button on its right (`right`); centred between them if it is wider.
export function barNameX(x: number, half: number, left: number, right: number): number {
  'worklet';
  if (right - left < 2 * half) return (left + right) / 2;
  return Math.min(right - half, Math.max(left + half, x));
}

// The tab bar shrinking (3.3, MOTION.tabMin): `dy` the offset's change since the last frame. Below
// `openPx` it is open; scrolled up it opens; past `thresholdPx`, scrolled down faster than
// `speedPx` a frame, it shrinks; otherwise it stays as it is.
export function tabShrinks(
  shrunk: boolean,
  y: number,
  dy: number,
  thresholdPx: number,
  speedPx: number,
  openPx: number,
): boolean {
  'worklet';
  if (y < openPx) return false;
  if (dy < 0) return false;
  if (y > thresholdPx && dy > speedPx) return true;
  return shrunk;
}

// The shrunk bar (3.3): the row of tabs moved so the chosen one's centre is the shrunk bar's
// centre, `p` from 0 (open, the row `pad` in) to 1 (shrunk to `shrunkWidth`).
export function tabRowShift(
  p: number,
  index: number,
  tabWidth: number,
  pad: number,
  shrunkWidth: number,
): number {
  'worklet';
  const shrunk = shrunkWidth / 2 - (index + 0.5) * tabWidth;
  return pad + (shrunk - pad) * p;
}
