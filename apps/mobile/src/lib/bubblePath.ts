// A chat bubble and its tail as one outline (Telegram Android draws the bubble, its tail and its
// line as a single path, so the tail is part of the bubble and not a piece laid beside it; the
// owner's report, 6 Kasım). The tail is on the left: the viewer's own bubble draws it mirrored.
//
// `w` × `h`: the bubble without its tail; the outline is `tailW` wider, the bubble starting at
// x = tailW. `radii`: [top left, top right, bottom right, bottom left] of the tailed (left) form;
// the bottom left is the tail's corner and is ignored. `inset`: half the line's width, so a line
// drawn on the outline stays inside the bubble's box.
export function bubblePath(
  w: number,
  h: number,
  radii: readonly [number, number, number, number],
  tailW: number,
  tailH: number,
  inset = 0,
): string {
  const fit = (r: number) => Math.max(0, Math.min(r, w / 2, h / 2) - inset);
  const tl = fit(radii[0]);
  const tr = fit(radii[1]);
  const br = fit(radii[2]);
  const x0 = tailW;
  const x1 = tailW + w - inset;
  const y0 = inset;
  const y1 = h - inset;
  // The tail in its 7 × 12 drawing (the old BubbleTail), scaled to tailW × tailH, its top on the
  // bubble's left edge tailH above the foot.
  const sx = tailW / 7;
  const sy = tailH / 12;
  const tx = (x: number) => n(x * sx);
  const ty = (y: number) => n(y1 - tailH + y * sy);
  return [
    `M${n(x0 + tl)} ${n(y0)}`,
    `H${n(x1 - tr)}`,
    tr > 0 ? `A${n(tr)} ${n(tr)} 0 0 1 ${n(x1)} ${n(y0 + tr)}` : '',
    `V${n(y1 - br)}`,
    br > 0 ? `A${n(br)} ${n(br)} 0 0 1 ${n(x1 - br)} ${n(y1)}` : '',
    `H${tx(0.7)}`,
    `C${tx(0.3)} ${ty(12)} ${tx(0.2)} ${ty(11.6)} ${tx(0.6)} ${ty(11.4)}`,
    `C${tx(4.8)} ${ty(9.6)} ${tx(7)} ${ty(5.6)} ${tx(7)} ${ty(0)}`,
    `V${n(y0 + tl)}`,
    tl > 0 ? `A${n(tl)} ${n(tl)} 0 0 1 ${n(x0 + tl)} ${n(y0)}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join('');
}

const n = (v: number) => Math.round(v * 100) / 100;
