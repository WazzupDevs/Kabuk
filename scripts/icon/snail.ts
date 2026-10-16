// The snail ("Çıkartma", Oyun Gecesi) as SVG: a lemon body, a purple shell with a lemon spiral, ink
// outline and a hard ink shadow, for the in-app images (apps/mobile/assets/brand). The app icon,
// splash and notification icon are the skall mark (scripts/icon/mark.ts). Pure, so the geometry is
// tested; scripts/build-icons.ts rasterises it with sharp.
// Design source: the Claude Design canvas, "Aşama 1 · Son".

export type IconTokens = {
  cream: string; // light canvas
  ink: string; // outline and shadow
  purple: string; // shell
  lemon: string; // body and spiral
  paper: string; // outline and shadow on dark grounds
  night: string; // dark canvas
};

export type Point = [number, number];

// ------------------------------------------------------------------ geometry (local units)
const W = 5; // outline
export const SHADOW = 5; // hard shadow offset, right and down
const PAD = 3;
const BODY =
  'M 8 88 C 8 83 16 79 28 79 L 50 79 L 50 60 L 68 60 L 68 50 C 68 40 74 34 82 34 C 90 34 96 40 96 50 ' +
  'L 96 81 C 96 88.5 91 93 84 93 L 14 93 C 10.5 93 8 91 8 88 Z';
const SHELL = { cx: 42, cy: 55, r: 31 };
const ANTENNAE: [number, number, number, number][] = [
  [77, 38, 71, 17],
  [88, 38, 95, 18],
];
const DOT = 5.2;
const EYE = { cx: 86.5, cy: 53, r: 3.6 };
const SMILE = 'M 81.5 63 Q 86.5 67.5 91.5 63';

const f = (n: number) => Number(n.toFixed(2));

// Two-centre spiral from the outside in: upper arcs centred on (cx, cy), lower arcs on
// (cx + g/2, cy); each half turn shrinks the radius by g/2.
export function spiral(
  cx: number,
  cy: number,
  radius: number,
  gap: number,
  halfTurns: number,
): string {
  let d = `M ${f(cx - radius)} ${f(cy)}`;
  for (let i = 0; i < halfTurns; i++) {
    const upper = i % 2 === 0;
    const r = radius - (i * gap) / 2;
    const centre = upper ? cx : cx + gap / 2;
    d += ` A ${f(r)} ${f(r)} 0 0 1 ${f(upper ? centre + r : centre - r)} ${f(cy)}`;
  }
  return d;
}
const SPIRAL = spiral(43.5, 56.5, 20, 9.5, 4);

// Every point that carries ink (before the outline, dot radii and shadow are added).
export function inkPoints(): Point[] {
  return [
    [8, 90],
    [96, 50],
    [96, 81],
    [84, 93],
    [14, 93],
    [SHELL.cx - SHELL.r, SHELL.cy],
    [SHELL.cx, SHELL.cy - SHELL.r],
    [20.1, 33.1],
    [71, 12],
    [95, 13],
    [66, 12],
    [100, 18],
  ];
}

// The tight box of the drawing in local units (for the in-app images).
export function box(shadow = SHADOW): [number, number, number, number] {
  const points = inkPoints();
  const x0 = Math.min(...points.map((p) => p[0])) - PAD;
  const y0 = Math.min(...points.map((p) => p[1])) - PAD;
  const x1 = Math.max(...points.map((p) => p[0])) + PAD + shadow;
  const y1 = Math.max(...points.map((p) => p[1])) + PAD + shadow;
  return [f(x0), f(y0), f(x1 - x0), f(y1 - y0)];
}

// ------------------------------------------------------------------ drawing
type Palette = {
  line: string;
  shadow: string;
  body: string;
  shell: string;
  swirl: string;
  detail: string;
};
export function palette(tokens: IconTokens, ground: 'light' | 'dark'): Palette {
  const line = ground === 'light' ? tokens.ink : tokens.paper;
  return {
    line,
    shadow: line,
    body: tokens.lemon,
    shell: tokens.purple,
    swirl: tokens.lemon,
    detail: tokens.ink,
  };
}

export type Layer = 'all' | 'body' | 'shell' | 'antennae';
type DrawOptions = { face?: boolean; shadow?: boolean; layer?: Layer };

// The snail in local units. `layer` draws one part only, in the same place (the crawl animation
// moves the parts separately): the body with its face and shadow, the shell with its shadow, or the
// antennae.
export function snail(
  p: Palette,
  { face = true, shadow = true, layer = 'all' }: DrawOptions = {},
): string {
  const has = (l: Layer) => layer === 'all' || layer === l;
  const antennae = ANTENNAE.map(
    ([x1, y1, x2, y2]) =>
      `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${p.line}" stroke-width="${W}" stroke-linecap="round"/>` +
      `<circle cx="${x2}" cy="${y2}" r="${DOT}" fill="${p.line}"/>`,
  ).join('');
  const shadowGroup = (inner: string) =>
    shadow
      ? `<g transform="translate(${SHADOW} ${SHADOW})" fill="${p.shadow}" stroke="${p.shadow}" stroke-width="${W}" stroke-linejoin="round">${inner}</g>`
      : '';
  const shellDisc = `<circle cx="${SHELL.cx}" cy="${SHELL.cy}" r="${SHELL.r}"/>`;
  const bodyPath = `<path d="${BODY}"/>`;
  let out = '';
  // With every part: one shadow under the whole silhouette. Alone: each part's own shadow.
  if (layer === 'all') out += shadowGroup(bodyPath + shellDisc);
  if (layer === 'body') out += shadowGroup(bodyPath);
  if (layer === 'shell') out += shadowGroup(shellDisc);
  if (has('antennae')) out += antennae;
  if (has('body')) {
    out += `<path d="${BODY}" fill="${p.body}" stroke="${p.line}" stroke-width="${W}" stroke-linejoin="round"/>`;
    if (face)
      out +=
        `<circle cx="${EYE.cx}" cy="${EYE.cy}" r="${EYE.r}" fill="${p.detail}"/>` +
        `<path d="${SMILE}" fill="none" stroke="${p.detail}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (has('shell'))
    out +=
      `<circle cx="${SHELL.cx}" cy="${SHELL.cy}" r="${SHELL.r}" fill="${p.shell}" stroke="${p.line}" stroke-width="${W}"/>` +
      `<path d="${SPIRAL}" fill="none" stroke="${p.swirl}" stroke-width="6.2" stroke-linecap="round"/>`;
  return out;
}

// ------------------------------------------------------------------ in-app images
// The snail on its tight box (aspect `box()[2] / box()[3]`), for the app: empty states, the Mekan
// tab, avatars and the crawl animation. `height` in px.
export function brandSvg(
  tokens: IconTokens,
  height: number,
  {
    ground = 'light',
    face = true,
    layer = 'all',
  }: { ground?: 'light' | 'dark'; face?: boolean; layer?: Layer } = {},
): string {
  const [x, y, w, h] = box();
  const width = Math.round((w / h) * height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}">` +
    snail(palette(tokens, ground), { face, layer }) +
    `</svg>`
  );
}

// The Mekan tab's line icon (24 dp, 1.8 stroke like the other tab icons), white: the app tints it.
export function lineIconSvg(size: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
    '<path d="M 2.4 18 C 2.9 18.9 3.6 19.3 4.6 19.3 L 18.6 19.3 C 19.8 19.3 20.6 18.5 20.6 17.3 L 20.6 11.3 C 20.6 9.9 19.6 8.9 18.4 8.9 C 17.2 8.9 16.2 9.9 16.2 11.3 L 16.2 14.2"/>' +
    '<circle cx="9.6" cy="12.3" r="6.2"/><path d="M 9.6 14.9 A 2.6 2.6 0 1 1 12.2 12.3"/>' +
    '<path d="M 17.3 9.1 L 16.4 5.4"/><path d="M 19.6 9.1 L 20.7 5.5"/></svg>'
  );
}

// Where the crawl animation turns the antennae: the top of the head, as a fraction of the box.
export function antennaPivot(): [number, number] {
  const [x, y, w, h] = box();
  return [f((82.5 - x) / w), f((38 - y) / h)];
}
