// Usage: node --experimental-strip-types scripts/art/walls.ts → the chat walls
// (apps/mobile/assets/wall/<dm|masa|mekan>-<light|dark>.webp, a 300 dp tile at 3×), laid edge to
// edge behind the messages (ChatWallpaper.tsx). The owner's call, 29 Ekim: the dense line drawings
// were ugly. Now a calm field of the brand's own shape, capsules, some in the mark's overlapping
// pair, in the chat's colour (DM blue, Mekan sohbeti green, Masa sohbeti purple), on a see-through
// tint of it over the colour clouds; a few dots and sparkles between them. Seamless: what crosses
// an edge comes back on the other side. JavaScript assets: they go out with an update.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

const TILE = 300;
const PX = 900;

type Scheme = 'light' | 'dark';
type Wall = {
  ink: string;
  second: string;
  tint: Record<Scheme, string>;
  tintAlpha: Record<Scheme, number>;
  alpha: Record<Scheme, [number, number]>;
};

export const WALLS: Record<'dm' | 'masa' | 'mekan', Wall> = {
  dm: {
    ink: '#2F7CF6',
    second: '#7FB2FF',
    tint: { light: '#E9F1FF', dark: '#0F1B3D' },
    tintAlpha: { light: 0.55, dark: 0.5 },
    alpha: { light: [0.08, 0.16], dark: [0.12, 0.22] },
  },
  masa: {
    ink: '#6A47F5',
    second: '#B49CFF',
    tint: { light: '#EFEAFF', dark: '#1B1440' },
    tintAlpha: { light: 0.55, dark: 0.5 },
    alpha: { light: [0.08, 0.16], dark: [0.12, 0.22] },
  },
  mekan: {
    ink: '#1E9A5C',
    second: '#6FD3A0',
    tint: { light: '#E7F6EE', dark: '#0D2619' },
    tintAlpha: { light: 0.55, dark: 0.5 },
    alpha: { light: [0.08, 0.16], dark: [0.12, 0.22] },
  },
};

// A fixed seed per wall: the same picture every time the script runs.
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

type Shape = { x: number; y: number; draw: (x: number, y: number) => string };

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

// Spread over the tile with room between them (each new one the farthest of a few tries).
function places(n: number, rnd: () => number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    let best = { x: rnd() * TILE, y: rnd() * TILE };
    let bestGap = -1;
    for (let t = 0; t < 14; t++) {
      const p = { x: rnd() * TILE, y: rnd() * TILE };
      const gap = Math.min(
        Infinity,
        ...out.map((q) => {
          const dx = Math.min(Math.abs(p.x - q.x), TILE - Math.abs(p.x - q.x));
          const dy = Math.min(Math.abs(p.y - q.y), TILE - Math.abs(p.y - q.y));
          return Math.hypot(dx, dy);
        }),
      );
      if (gap > bestGap) {
        best = p;
        bestGap = gap;
      }
    }
    out.push(best);
  }
  return out;
}

export function wallSvg(kind: keyof typeof WALLS, scheme: Scheme): string {
  const wall = WALLS[kind];
  const rnd = random({ dm: 11, masa: 29, mekan: 47 }[kind] * (scheme === 'light' ? 1 : 3));
  const [lo, hi] = wall.alpha[scheme];
  const alpha = () => lo + rnd() * (hi - lo);
  const shapes: Shape[] = [];
  const spots = places(22, rnd);
  spots.forEach((p, i) => {
    const angle = -40 + rnd() * 80;
    const color = rnd() < 0.6 ? wall.ink : wall.second;
    const kindOf = i % 6;
    // Two sizes of capsule: small and bright, larger and softer (depth without clutter).
    const big = kindOf === 3;
    const w = big ? 11 + rnd() * 5 : 4.5 + rnd() * 3.5;
    const draw =
      kindOf === 0
        ? pair(9 + rnd() * 4, angle, wall.ink, wall.second, alpha())
        : kindOf === 2
          ? dot(1.6 + rnd() * 1.4, color, alpha() * 1.4)
          : kindOf === 5
            ? sparkle(3.5 + rnd() * 2.5, color, alpha() * 1.3)
            : capsule(w, w * (2.6 + rnd() * 0.6), angle, color, alpha() * (big ? 0.6 : 1));
    shapes.push({ x: p.x, y: p.y, draw });
  });
  // Every shape near an edge is drawn again across it, so tiles meet without a seam.
  const body = shapes
    .flatMap((s) =>
      [-TILE, 0, TILE].flatMap((dx) =>
        [-TILE, 0, TILE].map((dy) => {
          const x = s.x + dx;
          const y = s.y + dy;
          return x > -40 && x < TILE + 40 && y > -40 && y < TILE + 40 ? s.draw(x, y) : '';
        }),
      ),
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}">` +
    `<rect width="${TILE}" height="${TILE}" fill="${wall.tint[scheme]}" fill-opacity="${wall.tintAlpha[scheme]}"/>` +
    body +
    `</svg>`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = resolve(import.meta.dirname, '../../apps/mobile/assets/wall');
  mkdirSync(dir, { recursive: true });
  for (const kind of Object.keys(WALLS) as (keyof typeof WALLS)[]) {
    for (const scheme of ['light', 'dark'] as const) {
      await sharp(Buffer.from(wallSvg(kind, scheme)), { density: (72 * PX) / TILE })
        .resize(PX, PX)
        .webp({ quality: 90, alphaQuality: 90, effort: 6 })
        .toFile(resolve(dir, `${kind}-${scheme}.webp`));
      console.log(`${kind}-${scheme}.webp`);
    }
  }
}
