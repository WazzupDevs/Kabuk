// The options a snapping row binds: the ones on the screen and a few either side (so a flick finds
// them drawn). The rest are an empty stretch of the row's width.
export const CAROUSEL_BUFFER = 3;

export type CarouselWindow = { from: number; to: number };

// `offset` is the row's scroll, `step` one option's width, `count` the options, `viewport` the row's
// width; `from` and `to` are the first and last bound index (to < from when there are none).
export function carouselWindow(
  offset: number,
  step: number,
  count: number,
  viewport: number,
  buffer: number = CAROUSEL_BUFFER,
): CarouselWindow {
  if (count <= 0 || step <= 0) return { from: 0, to: -1 };
  // The option at the centre is at offset / step; the screen reaches half a viewport either side.
  const reach = Math.ceil(viewport / 2 / step);
  const centre = Math.round(offset / step);
  const from = Math.max(0, centre - reach - buffer);
  const to = Math.min(count - 1, centre + reach + buffer);
  return { from: Math.min(from, count - 1), to };
}
