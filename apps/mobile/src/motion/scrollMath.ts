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
