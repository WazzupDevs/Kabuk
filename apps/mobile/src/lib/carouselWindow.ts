// The options a snapping row binds: the ones on the screen and a few either side (so a flick finds
// them drawn). The rest are an empty stretch of the row's width.
// The default `buffer` below is this, written out (a worklet takes literal defaults only).
export const CAROUSEL_BUFFER = 3;

export type CarouselWindow = { from: number; to: number };

// `offset` is the row's scroll, `step` one option's width, `count` the options, `viewport` the row's
// width; `from` and `to` are the first and last bound index (to < from when there are none).
export function carouselWindow(
  offset: number,
  step: number,
  count: number,
  viewport: number,
  buffer: number = 3,
): CarouselWindow {
  // Called on the UI thread from the row's scroll handler (motion/SnapStrip.tsx).
  'worklet';
  if (count <= 0 || step <= 0) return { from: 0, to: -1 };
  // The option at the centre is at offset / step; the screen reaches half a viewport either side.
  const reach = Math.ceil(viewport / 2 / step);
  const centre = Math.round(offset / step);
  const from = Math.max(0, centre - reach - buffer);
  const to = Math.min(count - 1, centre + reach + buffer);
  return { from: Math.min(from, count - 1), to };
}

// How far past the window (carouselWindow) the row keeps its bound options: each step of a scroll
// only binds a new option when it is not bound yet (every one is a few hundred native views, a
// suit's tile), and a step back binds none again. At most the window and `keep` either side.
export const CAROUSEL_KEEP = 6;

const empty = (w: CarouselWindow) => w.to < w.from;

// The options bound once the window is `need`: what was bound and the window, past the window by
// `keep` at most; the window alone when the two do not touch (a jump far along the row). The same
// object when nothing changes (React keeps its state).
export function carouselBound(
  bound: CarouselWindow,
  need: CarouselWindow,
  keep: number,
): CarouselWindow {
  if (empty(need)) return empty(bound) ? bound : need;
  if (empty(bound) || bound.to < need.from - 1 || bound.from > need.to + 1)
    return { from: need.from, to: need.to };
  const from = Math.max(Math.min(bound.from, need.from), need.from - keep);
  const to = Math.min(Math.max(bound.to, need.to), need.to + keep);
  return from === bound.from && to === bound.to ? bound : { from, to };
}

// One more option bound past the window while the row rests (in idle time): on the side with less
// bound past the window (after it on a tie), up to `keep` and the row's ends. The same object when
// both sides are full.
export function carouselGrow(
  bound: CarouselWindow,
  need: CarouselWindow,
  count: number,
  keep: number,
): CarouselWindow {
  const base = carouselBound(bound, need, keep);
  if (empty(base)) return bound;
  const top = Math.min(count - 1, need.to + keep);
  const bottom = Math.max(0, need.from - keep);
  const after = base.to < top;
  const before = base.from > bottom;
  if (!after && !before) return base;
  const growAfter = after && (!before || base.to - need.to <= need.from - base.from);
  return growAfter ? { from: base.from, to: base.to + 1 } : { from: base.from - 1, to: base.to };
}
