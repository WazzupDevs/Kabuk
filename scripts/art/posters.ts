// The posters of the two games on Masa that wait for their riso cover (the owner's call, 29 Ekim;
// the others are assets/riso/game-*.webp), in the small landscape card (3 : 2, apps/mobile/assets/game-poster/<id>.webp
// at 480 × 320), comic book style and full: an action burst and halftone in the game's colours,
// skall's capsule buddies acting the game out, and the game's name lettered over the foot in thick
// ink with an offset shadow (Bangers, OFL, drawn as outlines so nothing depends on a font here).
// The card puts only its corner tag over it. Usage: node --experimental-strip-types scripts/art/posters.ts
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import sharp from 'sharp';

const require = createRequire(import.meta.url);
type Glyph = {
  index: number;
  advanceWidth?: number;
  getPath: (x: number, y: number, size: number) => { toPathData: (d: number) => string };
};
type Font = { unitsPerEm: number; charToGlyph: (c: string) => Glyph };
const opentype = require('opentype.js') as { loadSync: (path: string) => Font };

const FONT_DIR = resolve(import.meta.dirname, '../../node_modules/@fontsource/bangers/files');
const LATIN = opentype.loadSync(resolve(FONT_DIR, 'bangers-latin-400-normal.woff'));
const LATIN_EXT = opentype.loadSync(resolve(FONT_DIR, 'bangers-latin-ext-400-normal.woff'));

const W = 480;
const H = 320;
const INK = '#14112B';

export const POSTERS = ['sprengja', 'kaupholl'] as const;
type Poster = (typeof POSTERS)[number];

const ink = (width = 6) =>
  `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;

// A line of lettering as outlines: centred on `cx`, its baseline at `y`, `size` high; how wide.
function letters(text: string, cx: number, y: number, size: number): { d: string; width: number } {
  const glyphs = [...text].map((c) => {
    const g = LATIN.charToGlyph(c);
    return g.index === 0 ? LATIN_EXT.charToGlyph(c) : g;
  });
  const scale = size / LATIN.unitsPerEm;
  const width = glyphs.reduce((sum, g) => sum + (g.advanceWidth ?? 0) * scale, 0);
  let x = cx - width / 2;
  let d = '';
  for (const g of glyphs) {
    d += g.getPath(x, y, size).toPathData(1);
    x += (g.advanceWidth ?? 0) * scale;
  }
  return { d, width };
}

// The title: thick ink round the letters, a solid shadow below and to the right, the fill with a
// light top; turned a little like a comic's sound word.
function title(
  lines: { text: string; size: number }[],
  cx: number,
  foot: number,
  fill: [string, string],
  turn = -4,
): string {
  let y = foot;
  let out = '';
  const parts = [...lines].reverse().map((l) => {
    const part = letters(l.text, cx, y, l.size);
    // The line above clears this one's accents (Ö, Ü).
    y -= l.size * 1.02;
    return part;
  });
  for (const p of parts) {
    out += `<path d="${p.d}" transform="translate(6 6)" fill="${INK}" ${ink(14)}/>`;
  }
  for (const p of parts) {
    out += `<path d="${p.d}" fill="none" ${ink(14)}/>`;
  }
  for (const p of parts) {
    out += `<path d="${p.d}" fill="url(#letter)"/>`;
  }
  return (
    `<linearGradient id="letter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fill[0]}"/><stop offset="1" stop-color="${fill[1]}"/></linearGradient>` +
    `<g transform="rotate(${turn} ${cx} ${foot})">${out}</g>`
  );
}

function burst(a: string, b: string, cx: number, cy: number, n = 26): string {
  let out = `<rect width="${W}" height="${H}" fill="${a}"/>`;
  for (let i = 0; i < n; i += 2) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    const r = 700;
    out += `<path d="M${cx} ${cy}L${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}L${(cx + Math.cos(a2) * r).toFixed(1)} ${(cy + Math.sin(a2) * r).toFixed(1)}Z" fill="${b}"/>`;
  }
  return out;
}

// A capsule buddy standing with its foot at (x, foot), `h` high: a body in its colour with a hard
// shade at the right and halftone in it, the visor with two eyes, a solid offset shadow; `top`
// and `over` are drawn behind and over it (a hat, a cape, a prop), in its own coordinates (0, 0 at
// the top left of the body, 100 wide, 166 high), scaled with it.
function buddy(
  x: number,
  foot: number,
  h: number,
  fill: string,
  shade: string,
  opts: { back?: string; over?: string; eyes?: string; face?: string; tilt?: number } = {},
): string {
  const s = h / 166;
  const body = 'M50 0a50 50 0 0 1 50 50v66a50 50 0 0 1-100 0V50A50 50 0 0 1 50 0Z';
  const id = `b${Math.round(x)}${Math.round(foot)}`;
  const face =
    opts.face ??
    `<rect x="12" y="38" width="76" height="32" rx="16" fill="${INK}"/>` +
      `<ellipse cx="34" cy="54" rx="8" ry="10" fill="${opts.eyes ?? '#fff'}"/><ellipse cx="66" cy="54" rx="8" ry="10" fill="${opts.eyes ?? '#fff'}"/>` +
      `<circle cx="37" cy="50" r="2.6" fill="#fff" opacity="0.9"/><circle cx="69" cy="50" r="2.6" fill="#fff" opacity="0.9"/>`;
  return (
    `<g transform="translate(${x - 50 * s} ${foot - h}) scale(${s}) rotate(${opts.tilt ?? 0} 50 166)">` +
    `<clipPath id="${id}"><path d="${body}"/></clipPath>` +
    (opts.back ?? '') +
    `<path d="${body}" transform="translate(7 6)" fill="${INK}"/>` +
    `<path d="${body}" fill="${fill}"/>` +
    `<g clip-path="url(#${id})"><path d="M64 -6C80 60 80 120 62 172H110V-6Z" fill="${shade}"/><rect width="100" height="166" fill="url(#inkDots)" opacity="0.2"/>` +
    `<path d="M18 40C12 70 12 100 16 126" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.5"/></g>` +
    `<path d="${body}" fill="none" ${ink(5.5)}/>` +
    face +
    (opts.over ?? '') +
    `</g>`
  );
}

function sparkle(x: number, y: number, s: number, color: string): string {
  return `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${color}" ${ink(2.5)}/>`;
}

function bubble(
  x: number,
  y: number,
  w: number,
  h: number,
  inside: string,
  tail: 'l' | 'r' = 'l',
): string {
  const tx = tail === 'l' ? x + w * 0.25 : x + w * 0.75;
  const dir = tail === 'l' ? -14 : 14;
  return (
    `<path d="M${x + h / 2} ${y}H${x + w - h / 2}a${h / 2} ${h / 2} 0 0 1 0 ${h}H${tx + 10}l${dir} 16 ${-dir / 2 - 2} -16H${x + h / 2}a${h / 2} ${h / 2} 0 0 1 0 ${-h}Z" fill="#fff" ${ink(5)}/>` +
    inside
  );
}

// The floor's halftone shadow under the buddies.
const floor = (cx: number, y: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="12" fill="${INK}" opacity="0.32"/>`;

const DRAW: Record<Poster, () => string> = {
  sprengja: () =>
    burst('#0E6B5C', '#138873', 240, 140) +
    `<path d="M240 40l20 50 50-30-20 50 54 8-48 26 34 40-54-16-6 54-30-44-30 44-6-54-54 16 34-40-48-26 54-8-20-50 50 30Z" fill="#FFB547" ${ink(5)}/>` +
    floor(250, 250, 190) +
    buddy(120, 248, 140, '#9C86FF', '#7A62E0', {
      over: `<path d="M34 88q16 -12 32 0" fill="none" ${ink(4)}/><path d="M-6 26l-14 -6M-8 46h-16" ${ink(4)}/>`,
      tilt: -6,
    }) +
    // The bomb with its fuse alight, between them.
    `<circle cx="250" cy="196" r="40" fill="#2A2342" ${ink()}/><path d="M236 176a20 20 0 0 1 16 -8" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.6"/><rect x="242" y="146" width="20" height="16" rx="4" fill="#5A5470" ${ink(4)}/><path d="M252 146c4 -18 18 -22 28 -30" fill="none" ${ink(4)}/>` +
    sparkle(286, 112, 14, '#FFD27A') +
    buddy(380, 248, 132, '#FF7EA8', '#D9508A', {
      over: `<path d="M30 86q20 14 40 0" fill="none" ${ink(4)}/><path d="M8 -4l30 10M92 -4l-30 10" ${ink(5)}/><rect x="10" y="-10" width="80" height="16" rx="6" fill="#14112B"/><circle cx="66" cy="54" r="12" fill="${INK}"/>`,
      tilt: 5,
    }) +
    bubble(
      330,
      26,
      92,
      52,
      `<path d="M350 64V40M350 52l14 -12M350 52l14 12M380 64l9 -24 9 24M383 56h12" fill="none" ${ink(5)}/>`,
      'r',
    ) +
    title([{ text: 'SPRENGJA', size: 72 }], 240, 304, ['#FFF3B0', '#FFB547']),
  kaupholl: () =>
    burst('#0F4A3A', '#145E49', 260, 120) +
    // The market's line going up, its bars.
    Array.from(
      { length: 9 },
      (_, i) =>
        `<rect x="${30 + i * 50}" y="${200 - i * 12}" width="26" height="${60 + i * 12}" rx="5" fill="#1E7A5E" ${ink(3)}/>`,
    ).join('') +
    `<path d="M20 210L90 180L150 196L220 140L290 152L360 96L440 60" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 210L90 180L150 196L220 140L290 152L360 96L440 60" fill="none" stroke="#7CF0B0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M420 44l30 10-18 24Z" fill="#7CF0B0" ${ink(4)}/>` +
    floor(240, 252, 200) +
    buddy(130, 250, 130, '#43C59E', '#2E9A7A', { tilt: -4 }) +
    buddy(250, 252, 156, '#FFF4E0', '#E5D4B5', {
      over: `<rect x="18" y="-34" width="64" height="40" rx="4" fill="#241634" ${ink(5)}/><path d="M-2 6h104" ${ink(7)}/><rect x="18" y="-12" width="64" height="8" fill="#B0174F"/><circle cx="68" cy="54" r="13" fill="none" stroke="#FFD27A" stroke-width="4"/><path d="M76 66l8 26" stroke="#FFD27A" stroke-width="3"/><path d="M36 96l14 8 14 -8-14 -6Z" fill="#B0174F" ${ink(3)}/>`,
      tilt: 2,
    }) +
    buddy(370, 250, 132, '#9C86FF', '#7A62E0', { tilt: 5 }) +
    // The coins and the bets.
    [380, 400, 420]
      .map(
        (cx, i) =>
          `<ellipse cx="${cx}" cy="${252 - i * 8}" rx="18" ry="7" fill="#FFB547" ${ink(3.5)}/>`,
      )
      .join('') +
    `<rect x="300" y="26" width="64" height="38" rx="10" fill="#FFB547" ${ink(4)}/><path d="${letters('2X', 332, 56, 30).d}" fill="${INK}"/>` +
    title([{ text: 'KAUPHOLL', size: 72 }], 240, 304, ['#FFFFFF', '#C9FFE2']),
};

export function posterSvg(poster: Poster): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="2.2" fill="#fff"/></pattern>` +
    `<pattern id="inkDots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="1.4" fill="${INK}"/></pattern>` +
    `<radialGradient id="edge" cx="240" cy="160" r="300" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>` +
    `<mask id="edgeMask"><rect width="${W}" height="${H}" fill="url(#edge)"/></mask>` +
    `<linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity="0.45"/></linearGradient></defs>` +
    DRAW[poster]() +
    `<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#edgeMask)" opacity="0.22"/>` +
    `</svg>`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = resolve(import.meta.dirname, '../../apps/mobile/assets/game-poster');
  mkdirSync(dir, { recursive: true });
  for (const poster of POSTERS) {
    await sharp(Buffer.from(posterSvg(poster)))
      .resize(W, H)
      .webp({ quality: 88, effort: 6 })
      .toFile(resolve(dir, `${poster}.webp`));
    console.log(`${poster}.webp`);
  }
}
