// Usage: node --experimental-strip-types scripts/art/walls.ts → the chat walls
// (apps/mobile/assets/wall/<dm|masa|mekan>-<light|dark>.webp): one picture the size of a tall
// phone's screen (430 × 932 dp at 3×), laid once behind the whole chat (ChatWallpaper.tsx). The
// owner's call, 30 Ekim: Telegram's quality and logic, one piece from the top of the screen to its
// foot (a tile laid edge to edge left seams where its edges fell between pixels). As Telegram
// Android draws its chat backgrounds: a soft gradient of four colours from four points, a quiet
// pattern over it; in the dark the ground is near black and the pattern shows the gradient through
// it. The pattern is skall's own shape (the owner's call, 29 Ekim): capsules, some in the mark's
// overlapping pair, a few dots and sparkles, in the chat's colour (DM blue, Mekan sohbeti green,
// Masa sohbeti purple). JavaScript assets: they go out with an update.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

// The canvas in dp and the picture's pixels per dp.
export const WALL_W = 430;
export const WALL_H = 932;
const SCALE = 3;
const PW = WALL_W * SCALE;
const PH = WALL_H * SCALE;

type Scheme = 'light' | 'dark';
type Wall = {
  ink: string;
  second: string;
  // The light ground's four colours and the dark one's (the gradient the pattern shows there).
  light: [string, string, string, string];
  dark: [string, string, string, string];
  alpha: Record<Scheme, [number, number]>;
};

// The dark ground under the pattern, and how much of the gradient shows through it everywhere.
const NIGHT = '#0C0A1C';
const NIGHT_GLOW = 0.1;
// How strongly a shape shows the gradient in the dark.
const NIGHT_PATTERN = 2.6;
// The noise against banding, in levels (the encoder keeps some of it).
const NOISE = 2;

export const WALLS: Record<'dm' | 'masa' | 'mekan', Wall> = {
  dm: {
    ink: '#2F6FE0',
    second: '#6E9BF2',
    light: ['#CFE1FF', '#EEF4FF', '#BFD3FF', '#E2DCFF'],
    dark: ['#3D74E8', '#283FA6', '#5D50DB', '#1E62BD'],
    alpha: { light: [0.09, 0.17], dark: [0.12, 0.22] },
  },
  masa: {
    ink: '#6A47F5',
    second: '#A58BFF',
    light: ['#E1D7FF', '#F4EFFF', '#D0C1FF', '#FADFF0'],
    dark: ['#6E4BF6', '#3A2AA0', '#9B4FD2', '#4B37C9'],
    alpha: { light: [0.09, 0.17], dark: [0.12, 0.22] },
  },
  mekan: {
    ink: '#1E8F57',
    second: '#5CC491',
    light: ['#CDEFDC', '#EDF9F2', '#BDE6D0', '#E3F2D6'],
    dark: ['#21A063', '#156B49', '#2FA98C', '#1C7F56'],
    alpha: { light: [0.09, 0.17], dark: [0.12, 0.22] },
  },
};

// The four colours' points (fractions of the canvas), as Telegram's default backgrounds place
// theirs: top right, upper left, bottom left, lower right.
const POINTS: [number, number][] = [
  [0.8, 0.1],
  [0.35, 0.25],
  [0.2, 0.9],
  [0.65, 0.75],
];

// A fixed seed per wall: the same picture every time the script runs.
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function capsule(w: number, h: number, angle: number, fill: string, opacity: number) {
  return (x: number, y: number) =>
    `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${fill}" fill-opacity="${opacity.toFixed(3)}" transform="rotate(${angle.toFixed(1)} ${x} ${y})"/>`;
}

// The mark's pair: a second capsule a little smaller, beside and below the first, overlapping.
function pair(w: number, angle: number, a: string, b: string, opacity: number) {
  const h = w * 3;
  const first = capsule(w, h, 0, a, opacity);
  const second = capsule(w * 0.65, h * 0.65, 0, b, opacity * 1.15);
  return (x: number, y: number) =>
    `<g transform="rotate(${angle.toFixed(1)} ${x} ${y})">${first(x, y)}${second(x + w * 0.65, y + h * 0.25)}</g>`;
}

function dot(r: number, fill: string, opacity: number) {
  return (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="${opacity.toFixed(3)}"/>`;
}

function sparkle(r: number, fill: string, opacity: number) {
  return (x: number, y: number) => {
    const k = r * 0.28;
    return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="${fill}" fill-opacity="${opacity.toFixed(3)}"/>`;
  };
}

// Spread over the canvas with room between them (each new one the farthest of a few tries).
function places(n: number, rnd: () => number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    let best = { x: rnd() * WALL_W, y: rnd() * WALL_H };
    let bestGap = -1;
    for (let t = 0; t < 14; t++) {
      const p = { x: rnd() * WALL_W, y: rnd() * WALL_H };
      const gap = Math.min(Infinity, ...out.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));
      if (gap > bestGap) {
        best = p;
        bestGap = gap;
      }
    }
    out.push(best);
  }
  return out;
}

// As many shapes as the old 300 dp tile held (22), for the canvas's area.
const SHAPES = Math.round((22 * WALL_W * WALL_H) / (300 * 300));

// The pattern alone: each shape in white, its strength in its opacity (the mask the ground is
// coloured through).
export function wallMaskSvg(kind: keyof typeof WALLS, scheme: Scheme): string {
  const wall = WALLS[kind];
  const rnd = random({ dm: 11, masa: 29, mekan: 47 }[kind] * (scheme === 'light' ? 1 : 3));
  const [lo, hi] = wall.alpha[scheme];
  const alpha = () => lo + rnd() * (hi - lo);
  const white = '#FFFFFF';
  const body = places(SHAPES, rnd)
    .map((p, i) => {
      const angle = -40 + rnd() * 80;
      // The second colour is a softer shape (the old tiles' two inks).
      const soft = rnd() < 0.4 ? 0.7 : 1;
      const kindOf = i % 6;
      // Two sizes of capsule: small and bright, larger and softer (depth without clutter).
      const big = kindOf === 3;
      const w = big ? 11 + rnd() * 5 : 4.5 + rnd() * 3.5;
      const draw =
        kindOf === 0
          ? pair(9 + rnd() * 4, angle, white, white, alpha() * 0.9)
          : kindOf === 2
            ? dot(1.6 + rnd() * 1.4, white, alpha() * 1.4 * soft)
            : kindOf === 5
              ? sparkle(3.5 + rnd() * 2.5, white, alpha() * 1.3 * soft)
              : capsule(w, w * (2.6 + rnd() * 0.6), angle, white, alpha() * (big ? 0.6 : 1) * soft);
      return draw(p.x, p.y);
    })
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WALL_W} ${WALL_H}" width="${PW}" height="${PH}">` +
    body +
    `</svg>`
  );
}

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The four-colour gradient at a point (fractions): each colour weighs by how near its point is,
// falling off steeply, with a slight turn round the middle so the blend curves.
function gradientAt(
  colors: [number, number, number][],
  u: number,
  v: number,
): [number, number, number] {
  const cu = u - 0.5;
  const cv = v - 0.5;
  const turn = 0.9 * Math.hypot(cu, cv) ** 2;
  const pu = 0.5 + cu * Math.cos(turn) - cv * Math.sin(turn);
  const pv = 0.5 + cu * Math.sin(turn) + cv * Math.cos(turn);
  let sum = 0;
  const out: Rgb = [0, 0, 0];
  const first = colors[0] ?? out;
  POINTS.forEach(([x, y], i) => {
    const near = Math.max(0, 0.95 - Math.hypot(pu - x, pv - y)) ** 4;
    sum += near;
    const c = colors[i] ?? first;
    out[0] += near * c[0];
    out[1] += near * c[1];
    out[2] += near * c[2];
  });
  return sum > 0 ? [out[0] / sum, out[1] / sum, out[2] / sum] : first;
}

export async function wallPicture(kind: keyof typeof WALLS, scheme: Scheme): Promise<Buffer> {
  const wall = WALLS[kind];
  const mask = await sharp(Buffer.from(wallMaskSvg(kind, scheme)))
    .resize(PW, PH)
    .ensureAlpha()
    .raw()
    .toBuffer();
  const colors = (scheme === 'light' ? wall.light : wall.dark).map(rgb);
  const ink = rgb(wall.ink);
  const night = rgb(NIGHT);
  const rnd = random(7);
  const px = Buffer.alloc(PW * PH * 3);
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      const i = y * PW + x;
      const g = gradientAt(colors, x / PW, y / PH);
      const a = (mask[i * 4 + 3] ?? 0) / 255;
      // A little noise against banding in the soft gradient.
      const noise = (rnd() - 0.5) * NOISE;
      const show = Math.min(1, NIGHT_GLOW + a * NIGHT_PATTERN);
      g.forEach((gc, ch) => {
        const base = scheme === 'light' ? (ink[ch] ?? 0) : (night[ch] ?? 0);
        const v = scheme === 'light' ? gc * (1 - a) + base * a : base + (gc - base) * show;
        px[i * 3 + ch] = Math.max(0, Math.min(255, Math.round(v + noise)));
      });
    }
  }
  return (
    sharp(px, { raw: { width: PW, height: PH, channels: 3 } })
      // High enough that the dark's soft ground keeps no blocks (about 80 KB a picture).
      .webp({ quality: 95, effort: 6, smartSubsample: true })
      .toBuffer()
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = resolve(import.meta.dirname, '../../apps/mobile/assets/wall');
  mkdirSync(dir, { recursive: true });
  for (const kind of Object.keys(WALLS) as (keyof typeof WALLS)[]) {
    for (const scheme of ['light', 'dark'] as const) {
      const out = resolve(dir, `${kind}-${scheme}.webp`);
      writeFileSync(out, await wallPicture(kind, scheme));
      console.log(`${kind}-${scheme}.webp`);
    }
  }
}
