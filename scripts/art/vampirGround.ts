// Vampir Köylü's grounds (the owner's call, 29 Ekim: fuller, yet easy on the eyes): one still
// picture a time of day, drawn here and kept as WebP (apps/mobile/assets/vampir/ground-*.webp, the
// canvas's 390 × 844 at 3×), laid under the phases like the app's colour clouds. A sky in the
// time's colours with skall's two glows, a soft halftone at the corners (the role cards' comic
// look), the moon or the sun, stars, clouds, and at the foot a village in layers: far hills,
// rooftops with a church, its windows lit at night, trees and a low mist. The middle of the
// screen stays calm for the words. Usage: node --experimental-strip-types scripts/art/vampirGround.ts
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

const W = 390;
const H = 844;
const SCALE = 3;

export type Time = 'night' | 'dawn' | 'day' | 'dusk';

type Look = {
  far: string;
  birds: string | null;
  sky: [number, string][];
  glowA: { x: number; y: number; r: number; color: string; alpha: number };
  glowB: { x: number; y: number; r: number; color: string; alpha: number };
  body: { kind: 'moon' | 'sun'; x: number; y: number; r: number; color: string; halo: string };
  stars: number;
  cloud: { color: string; alpha: number };
  hills: string;
  village: string;
  front: string;
  windows: string | null;
  mist: number;
  dots: number;
};

export const TIMES: Record<Time, Look> = {
  night: {
    far: '#211852',
    birds: null,
    sky: [
      [0, '#17123E'],
      [0.5, '#2A1E62'],
      [1, '#140F35'],
    ],
    glowA: { x: 300, y: 150, r: 260, color: '#9B84FF', alpha: 0.3 },
    glowB: { x: 30, y: 640, r: 280, color: '#FF4F8B', alpha: 0.14 },
    body: { kind: 'moon', x: 302, y: 148, r: 40, color: '#FFE9BF', halo: '#FFE2A8' },
    stars: 46,
    cloud: { color: '#3B2D80', alpha: 0.55 },
    hills: '#251B5A',
    village: '#1A1246',
    front: '#0F0A2B',
    windows: '#FFC96B',
    mist: 0.07,
    dots: 0.07,
  },
  dawn: {
    far: '#6A4282',
    birds: '#3A2258',
    sky: [
      [0, '#33296F'],
      [0.42, '#7E4F92'],
      [0.74, '#D27C8C'],
      [1, '#F4AE84'],
    ],
    glowA: { x: 110, y: 690, r: 320, color: '#FFD3A0', alpha: 0.42 },
    glowB: { x: 360, y: 120, r: 260, color: '#9B84FF', alpha: 0.22 },
    body: { kind: 'sun', x: 112, y: 702, r: 54, color: '#FFE2B0', halo: '#FFD08A' },
    stars: 10,
    cloud: { color: '#FFB9A6', alpha: 0.3 },
    hills: '#7A4A88',
    village: '#553474',
    front: '#3A2258',
    windows: '#FFD9A0',
    mist: 0.1,
    dots: 0.06,
  },
  day: {
    far: '#7A3A6C',
    birds: '#5A2554',
    sky: [
      [0, '#D47D78'],
      [0.32, '#B05473'],
      [0.68, '#8E426D'],
      [1, '#682D60'],
    ],
    glowA: { x: 70, y: 110, r: 300, color: '#FFD28A', alpha: 0.45 },
    glowB: { x: 380, y: 520, r: 300, color: '#FF8DB3', alpha: 0.18 },
    body: { kind: 'sun', x: 72, y: 112, r: 42, color: '#FFE7B5', halo: '#FFD28A' },
    stars: 0,
    cloud: { color: '#FFD9CF', alpha: 0.22 },
    hills: '#86406F',
    village: '#5E2A5C',
    front: '#45204C',
    windows: null,
    mist: 0.06,
    dots: 0.06,
  },
  dusk: {
    far: '#442768',
    birds: '#2A1648',
    sky: [
      [0, '#281C5E'],
      [0.45, '#653883'],
      [0.78, '#B6567E'],
      [1, '#E88470'],
    ],
    glowA: { x: 300, y: 700, r: 320, color: '#FFB07A', alpha: 0.4 },
    glowB: { x: 40, y: 140, r: 260, color: '#7B5CFF', alpha: 0.22 },
    body: { kind: 'sun', x: 298, y: 716, r: 62, color: '#FFC58E', halo: '#FFA772' },
    stars: 18,
    cloud: { color: '#E59AA6', alpha: 0.28 },
    hills: '#4D2A72',
    village: '#371D5C',
    front: '#24123F',
    windows: '#FFC96B',
    mist: 0.08,
    dots: 0.07,
  },
};

// The same picture every time: a small seeded random.
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function stars(count: number, rnd: () => number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r1(rnd() * W);
    const y = r1(rnd() * 470);
    const big = rnd() < 0.18;
    const a = r1(0.35 + rnd() * 0.55);
    if (big) {
      const s = r1(3 + rnd() * 2.5);
      out += `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="#FFF6DD" opacity="${a}"/>`;
    } else {
      out += `<circle cx="${x}" cy="${y}" r="${r1(0.7 + rnd() * 1.1)}" fill="#FFFFFF" opacity="${a}"/>`;
    }
  }
  return out;
}

// A soft cloud: three or four puffs on a flat foot, blurred.
function cloud(x: number, y: number, w: number, color: string, alpha: number): string {
  const h = w * 0.3;
  return (
    `<g filter="url(#soft)" opacity="${alpha}" fill="${color}">` +
    `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}"/>` +
    `<circle cx="${x - w * 0.18}" cy="${y - h * 0.35}" r="${h * 0.55}"/>` +
    `<circle cx="${x + w * 0.12}" cy="${y - h * 0.5}" r="${h * 0.7}"/>` +
    `</g>`
  );
}

// Soft rays from the sun, wide and faint.
function rays(b: Look['body']): string {
  let out = '';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    const len = 520;
    const w = 0.07;
    const x1 = b.x + Math.cos(a - w) * len;
    const y1 = b.y + Math.sin(a - w) * len;
    const x2 = b.x + Math.cos(a + w) * len;
    const y2 = b.y + Math.sin(a + w) * len;
    out += `<path d="M${b.x} ${b.y}L${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}Z"/>`;
  }
  return `<g fill="${b.halo}" opacity="0.07" filter="url(#soft)">${out}</g>`;
}

function body(b: Look['body']): string {
  const halo =
    `<circle cx="${b.x}" cy="${b.y}" r="${b.r * 2.4}" fill="url(#halo)"/>` +
    `<circle cx="${b.x}" cy="${b.y}" r="${b.r * 1.28}" fill="${b.halo}" opacity="0.18"/>`;
  if (b.kind === 'moon') {
    return (
      halo +
      `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="${b.color}"/>` +
      `<circle cx="${b.x - b.r * 0.32}" cy="${b.y - b.r * 0.2}" r="${b.r * 0.2}" fill="#F2D59A" opacity="0.7"/>` +
      `<circle cx="${b.x + b.r * 0.28}" cy="${b.y + b.r * 0.3}" r="${b.r * 0.14}" fill="#F2D59A" opacity="0.6"/>` +
      `<circle cx="${b.x + b.r * 0.12}" cy="${b.y - b.r * 0.42}" r="${b.r * 0.09}" fill="#F2D59A" opacity="0.6"/>`
    );
  }
  return halo + `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="${b.color}"/>`;
}

// A row of houses from `x0` to `x1` standing on `foot`: varied widths and heights, pitched roofs,
// chimneys, and at `church` a tower with its spire; windows when `lit`.
function village(
  foot: number,
  color: string,
  lit: string | null,
  rnd: () => number,
  church: number,
): string {
  let roofs = '';
  let windows = '';
  let x = -10;
  let built = church < 0;
  while (x < W + 10) {
    if (!built && x >= church - 30) {
      built = true;
      // The church: a tall tower and its spire, a round window.
      const tw = 30;
      const th = 92;
      roofs += `<rect x="${x}" y="${foot - th}" width="${tw}" height="${th}"/>`;
      roofs += `<path d="M${x - 3} ${foot - th}L${x + tw / 2} ${foot - th - 46}L${x + tw + 3} ${foot - th}Z"/>`;
      roofs += `<rect x="${x + tw / 2 - 1.2}" y="${foot - th - 62}" width="2.4" height="18"/><rect x="${x + tw / 2 - 6}" y="${foot - th - 56}" width="12" height="2.4"/>`;
      if (lit) {
        windows += `<circle cx="${x + tw / 2}" cy="${foot - th + 22}" r="5"/>`;
        windows += `<rect x="${x + tw / 2 - 3}" y="${foot - 34}" width="6" height="12" rx="3"/>`;
      }
      x += tw + 6;
      continue;
    }
    const w = 26 + Math.floor(rnd() * 26);
    const h = 24 + Math.floor(rnd() * 30);
    const peak = 12 + Math.floor(rnd() * 12);
    roofs += `<rect x="${x}" y="${foot - h}" width="${w}" height="${h}"/>`;
    roofs += `<path d="M${x - 3} ${foot - h}L${x + w / 2} ${foot - h - peak}L${x + w + 3} ${foot - h}Z"/>`;
    if (rnd() < 0.5) {
      roofs += `<rect x="${x + w * 0.68}" y="${foot - h - peak * 0.85}" width="5" height="${peak * 0.6}"/>`;
    }
    if (lit) {
      const count = 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < count; i++) {
        if (rnd() < 0.62) {
          const wx = x + 6 + i * (w / count);
          windows += `<rect x="${r1(wx)}" y="${foot - h + 9}" width="5" height="6" rx="1"/>`;
        }
      }
    }
    x += w + 2 + Math.floor(rnd() * 6);
  }
  const glow = lit
    ? `<g fill="${lit}" filter="url(#glow)" opacity="0.9">${windows}</g><g fill="${lit}">${windows}</g>`
    : '';
  return `<g fill="${color}">${roofs}</g>${glow}`;
}

// A few birds, far away: two curved strokes each.
function birds(color: string, rnd: () => number): string {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const x = r1(150 + rnd() * 220);
    const y = r1(160 + rnd() * 160);
    const s = r1(4 + rnd() * 4);
    out += `<path d="M${x - s} ${y}q${s / 2} ${-s * 0.6} ${s} 0q${s / 2} ${-s * 0.6} ${s} 0"/>`;
  }
  return `<g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" opacity="0.7">${out}</g>`;
}

// The lamp posts along the lane, their light pooled round them when `lit`.
function lamps(foot: number, color: string, lit: string | null): string {
  let out = '';
  for (const x of [34, 196, 352]) {
    out += `<rect x="${x - 1.5}" y="${foot - 40}" width="3" height="40" fill="${color}"/><rect x="${x - 5}" y="${foot - 48}" width="10" height="10" rx="2" fill="${color}"/>`;
    if (lit) {
      out += `<circle cx="${x}" cy="${foot - 43}" r="16" fill="${lit}" opacity="0.22" filter="url(#mist)"/><rect x="${x - 3}" y="${foot - 46}" width="6" height="6" rx="1" fill="${lit}"/>`;
    }
  }
  return out;
}

// Round trees along the foot, in front of the houses.
function trees(foot: number, color: string, rnd: () => number): string {
  let out = '';
  let x = 6;
  while (x < W) {
    const r = 9 + rnd() * 11;
    out += `<circle cx="${r1(x)}" cy="${r1(foot - r * 1.1)}" r="${r1(r)}"/>`;
    out += `<circle cx="${r1(x + r * 0.7)}" cy="${r1(foot - r * 0.8)}" r="${r1(r * 0.75)}"/>`;
    out += `<rect x="${r1(x - 1.5)}" y="${r1(foot - r * 0.4)}" width="3" height="${r1(r * 0.5)}"/>`;
    x += 40 + rnd() * 70;
  }
  return `<g fill="${color}">${out}</g>`;
}

export function groundSvg(time: Time): string {
  const t = TIMES[time];
  const rnd = seeded(time.length * 7919 + 17);
  const sky = t.sky.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const glow = (id: string, g: Look['glowA']) =>
    `<radialGradient id="${id}" cx="${g.x}" cy="${g.y}" r="${g.r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g.color}" stop-opacity="${g.alpha}"/><stop offset="1" stop-color="${g.color}" stop-opacity="0"/></radialGradient>`;
  const corner = (id: string, x: number, y: number) =>
    `<radialGradient id="${id}" cx="${x}" cy="${y}" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
  const defs =
    `<defs>` +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${sky}</linearGradient>` +
    glow('ga', t.glowA) +
    glow('gb', t.glowB) +
    `<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${t.body.halo}" stop-opacity="0.42"/><stop offset="1" stop-color="${t.body.halo}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2" cy="2" r="1.15" fill="#fff"/></pattern>` +
    corner('ca', 0, 0) +
    corner('cb', W, 380) +
    `<mask id="dotsMask"><rect width="${W}" height="${H}" fill="url(#ca)"/><rect width="${W}" height="${H}" fill="url(#cb)"/></mask>` +
    `<filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.5"/></filter>` +
    `<filter id="mist" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>` +
    `<linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.front}" stop-opacity="0"/><stop offset="1" stop-color="${t.front}" stop-opacity="0.85"/></linearGradient>` +
    `</defs>`;
  const hillFoot = 728;
  const hills = `<path d="M0 ${hillFoot - 30}C60 ${hillFoot - 70} 120 ${hillFoot - 62} 180 ${hillFoot - 40}S300 ${hillFoot - 84} ${W} ${hillFoot - 50}V${H}H0Z" fill="${t.hills}"/>`;
  const villageFoot = 772;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    defs +
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#ga)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#gb)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotsMask)" opacity="${t.dots}"/>` +
    stars(t.stars, rnd) +
    (t.body.kind === 'sun' ? rays(t.body) : '') +
    body(t.body) +
    cloud(250, 220, 150, t.cloud.color, t.cloud.alpha) +
    cloud(70, 300, 110, t.cloud.color, t.cloud.alpha * 0.8) +
    cloud(330, 420, 120, t.cloud.color, t.cloud.alpha * 0.6) +
    (t.birds ? birds(t.birds, rnd) : '') +
    hills +
    [0, 0.5]
      .map(
        (at) =>
          `<g transform="translate(${at * W} ${hillFoot - 26 - 742 * 0.5}) scale(0.5)">${village(742, t.far, null, rnd, at === 0 ? 120 : -1)}</g>`,
      )
      .join('') +
    `<ellipse cx="${W / 2}" cy="${hillFoot + 4}" rx="${W}" ry="18" fill="#fff" opacity="${t.mist}" filter="url(#mist)"/>` +
    village(villageFoot, t.village, t.windows, rnd, 262) +
    trees(villageFoot + 6, t.village, rnd) +
    lamps(villageFoot + 8, t.front, t.windows) +
    `<path d="M0 ${villageFoot + 4}C90 ${villageFoot - 8} 170 ${villageFoot + 10} 250 ${villageFoot}S350 ${villageFoot - 6} ${W} ${villageFoot + 2}V${H}H0Z" fill="${t.front}"/>` +
    `<ellipse cx="${W / 2}" cy="${villageFoot + 10}" rx="${W * 0.8}" ry="14" fill="#fff" opacity="${t.mist}" filter="url(#mist)"/>` +
    `<rect y="${villageFoot}" width="${W}" height="${H - villageFoot}" fill="url(#foot)"/>` +
    `</svg>`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = resolve(import.meta.dirname, '../../apps/mobile/assets/vampir');
  mkdirSync(dir, { recursive: true });
  for (const time of Object.keys(TIMES) as Time[]) {
    await sharp(Buffer.from(groundSvg(time)), { density: 72 * SCALE })
      .resize(W * SCALE, H * SCALE)
      .webp({ quality: 82, effort: 6 })
      .toFile(resolve(dir, `ground-${time}.webp`));
    console.log(`ground-${time}.webp`);
  }
}
