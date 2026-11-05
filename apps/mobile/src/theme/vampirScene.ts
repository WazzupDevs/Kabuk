import { seatsAround } from './tableGeometry.ts';
import { seatSize, TABLE } from './vampirTableSize.ts';

// Vampir Köylü's capsule table drawn (Aura v83; the reference code's toon2.js, value for value:
// docs/design/vampir/kapsul-masa/kaynak/). The room behind it is a picture for each phase (floor,
// rug, the room's things, the window's light, the phase's colour and vignette: assets/vampir/
// scene/room-*.webp). Over it, in the reference's order: the stools, the table (drawn once into a
// picture for each phase by scripts/art/vampirScene.ts, its lamp light and vignette in it), the
// candles and the time's dial, as SVG text the phone draws (they change with the people and the
// dead). The reference lays the phase's colour (multiply) and the day's light (screen) over all
// of it; on a flat colour both are a sum and a product, so every colour drawn under them goes
// through `paint` instead, which comes to the same. The flames come after the colour, as there.
// No React Native import: the script reads this file.

export type ScenePhase = 'night' | 'dawn' | 'day' | 'end';

export const INK = '#141016';

// Each phase (toon2.js → PAL): the table's top, the colour laid over the scene, the lamp, the
// vignette and the day's light.
export const PAL = {
  night: { top: '#6E3A22', tint: '#6C76C8', lamp: 1.25, vig: 0.66, lift: 0 },
  dawn: { top: '#7A4228', tint: '#F2B09C', lamp: 0.8, vig: 0.42, lift: 0.03 },
  day: { top: '#8A4C2C', tint: null, lamp: 0.35, vig: 0.16, lift: 0.12 },
  end: { top: '#5E2A1E', tint: '#C8606E', lamp: 1.1, vig: 0.58, lift: 0 },
} as const satisfies Record<
  ScenePhase,
  { top: string; tint: string | null; lamp: number; vig: number; lift: number }
>;

export const SCENE_PHASES: readonly ScenePhase[] = ['night', 'dawn', 'day', 'end'];

// A cushion no one sits on yet (VampirYukleniyor, the panel's neutral).
const EMPTY_CUSHION = '#6A5A48';

// The cushions, in the seats' order from the person (build.py → CUSH through P8 and P12; the
// owner's choice, 4 Kasım: by seat, so a colour says nothing about anyone).
export const CUSHIONS = {
  big: ['#7A5AB8', '#C2507A', '#6A5AB0', '#2A7AB8', '#3AA06A', '#1E9A8A', '#3A8A3A', '#D8702A'],
  small: [
    '#7A5AB8',
    '#C2507A',
    '#6A5AB0',
    '#2A7AB8',
    '#B8902A',
    '#3AA06A',
    '#1E9A8A',
    '#8A3AA0',
    '#A03A3A',
    '#3A8A3A',
    '#D8702A',
    '#2A6A9A',
  ],
} as const;

// ---- Colour ----

type Rgba = [number, number, number, number];

function parse(c: string): Rgba {
  if (c.startsWith('#')) {
    const v = parseInt(c.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 1];
  }
  const m = /rgba?\(([^)]+)\)/.exec(c);
  const p = (m?.[1] ?? '0,0,0').split(',').map((s) => Number(s.trim()));
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p[3] ?? 1];
}

const LIFT_RGB = [255, 248, 228] as const;

// A colour as the reference shows it once the phase's colour (multiply) and the day's light
// (screen, rgba(255, 248, 228, lift)) are laid over it.
export function paint(phase: ScenePhase, c: string): string {
  const [r, g, b, a] = parse(c);
  const p = PAL[phase];
  const t = p.tint ? parse(p.tint) : ([255, 255, 255, 1] as Rgba);
  const out = [r, g, b].map((v, i) => {
    const tinted = (v * (t[i] ?? 255)) / 255;
    const s = LIFT_RGB[i] ?? 255;
    const screen = 255 - ((255 - tinted) * (255 - s)) / 255;
    return Math.round(tinted * (1 - p.lift) + screen * p.lift);
  });
  return a === 1
    ? `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
    : `rgba(${out.join(', ')}, ${a})`;
}

// Only the day's light (what the reference draws after the colour and before the light).
export function lift(phase: ScenePhase, c: string): string {
  const [r, g, b, a] = parse(c);
  const l = PAL[phase].lift;
  const out = [r, g, b].map((v, i) => {
    const s = LIFT_RGB[i] ?? 255;
    return Math.round(v * (1 - l) + (255 - ((255 - v) * (255 - s)) / 255) * l);
  });
  return `rgba(${out.join(', ')}, ${a})`;
}

// The vignette over the scene (toon2.js → drawCap's last gradient): clear round the table, out to
// the phase's darkness at 0.8 of the phone's height.
export function vignette(phase: ScenePhase): {
  from: number;
  to: number;
  color: Rgba;
} {
  const p = PAL[phase];
  return {
    from: TABLE.straight * 1.1,
    to: TABLE.frame.height * 0.8,
    color: [0, 0, phase === 'night' ? 20 : 0, p.vig],
  };
}

// The lamp's warm light over the table (lighter), its strength at a distance from (cx, cy − 10).
export const LAMP = { rgb: [255, 196, 130] as const, r: 230, rise: 10 };
export function lampAt(phase: ScenePhase, d: number): number {
  const a = 0.1 * PAL[phase].lamp + 0.02;
  const t = d / LAMP.r;
  if (t >= 1) return 0;
  return t < 0.45 ? a + (0.4 * a - a) * (t / 0.45) : 0.4 * a * (1 - (t - 0.45) / 0.55);
}

// ---- SVG text ----

const n = (v: number) => Number(v.toFixed(2));
const TAU = Math.PI * 2;
const W = TABLE.frame.width;
const H = TABLE.frame.height;
const CX = TABLE.frame.cx;
const CY = TABLE.frame.cy;

// The reference's seeded random (toon2.js → rnd), so the grain falls where it does there.
function rnd(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function stadium(cx: number, cy: number, a: number, h: number): string {
  return `M${n(cx - a)} ${n(cy - h)}A${n(a)} ${n(a)} 0 0 1 ${n(cx + a)} ${n(cy - h)}L${n(cx + a)} ${n(cy + h)}A${n(a)} ${n(a)} 0 0 1 ${n(cx - a)} ${n(cy + h)}Z`;
}

function circle(x: number, y: number, r: number, attrs: string): string {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${attrs}/>`;
}

function arc(x: number, y: number, r: number, from: number, to: number): string {
  const p = (t: number) => `${n(x + r * Math.cos(t))} ${n(y + r * Math.sin(t))}`;
  return `M${p(from)}A${n(r)} ${n(r)} 0 ${to - from > Math.PI ? 1 : 0} 1 ${p(to)}`;
}

// The reference's ink: its width × 1.45, round joins.
const ink = (w: number) =>
  `fill="none" stroke="${INK}" stroke-width="${n(w * 1.45)}" stroke-linejoin="round" stroke-linecap="round"`;

// A flat round with its shadow band (toon2.js → toonDisc): the colour, a soft light at the top
// left and a dark band at the bottom right (the `td` gradient), the ink round it.
function disc(phase: ScenePhase, x: number, y: number, r: number, c: string, w: number): string {
  return `${circle(x, y, r, `fill="${paint(phase, c)}"`)}${circle(x, y, r, 'fill="url(#td)"')}${circle(x, y, r, ink(w))}`;
}

// The band's gradient, in each round's own box (the reference's from (x − .35r, y − .4r, .3r) to
// (x, y, 1.05r); its inner round folded into the stops).
function discGradient(phase: ScenePhase): string {
  const k = 0.3 / 1.05;
  const at = (t: number) => n(k + t * (1 - k));
  return `<radialGradient id="td" cx="0.5" cy="0.5" r="0.525" fx="0.325" fy="0.3"><stop offset="0" stop-color="${paint(phase, '#FFFFFF')}" stop-opacity="0.1"/><stop offset="${at(0)}" stop-color="${paint(phase, '#FFFFFF')}" stop-opacity="0.1"/><stop offset="${at(0.6)}" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="${paint(phase, '#1E0028')}" stop-opacity="0.28"/></radialGradient>`;
}

// The vignette laid over what this layer draws, cut to `shape`.
function vignetteOver(phase: ScenePhase, shape: string): string {
  const v = vignette(phase);
  const [r, g, b, a] = v.color;
  return `<defs><radialGradient id="vg" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${n(v.to)}"><stop offset="${n(v.from / v.to)}" stop-color="rgb(${r}, ${g}, ${b})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${r}, ${g}, ${b})" stop-opacity="${a}"/></radialGradient><clipPath id="vc">${shape}</clipPath></defs><rect width="${W}" height="${H}" fill="url(#vg)" clip-path="url(#vc)"/>`;
}

const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

// The stools round the table for `n` people (toon2.js → stool): the wood, its ring, the cushion
// in the seat's colour and its buttons; `empty` while no one sits yet, every cushion the same
// neutral (VampirYukleniyor).
export function stoolsSvg(phase: ScenePhase, count: number, empty = false): string {
  const R = seatSize(count).stool;
  const seats = seatsAround(count);
  const parts: string[] = [];
  const shapes: string[] = [];
  seats.forEach((s, i) => {
    const [x, y] = s.seat;
    parts.push(circle(x, y + 2.5, R + 1.5, `fill="${paint(phase, 'rgba(10, 4, 0, 0.4)')}"`));
    parts.push(disc(phase, x, y, R, '#C27A42', 1.8));
    parts.push(
      circle(x, y, R - 4, `fill="none" stroke="${paint(phase, 'rgba(90, 44, 16, 0.4)')}"`),
    );
    const cushions = count > TABLE.many ? CUSHIONS.small : CUSHIONS.big;
    const cushion = empty ? EMPTY_CUSHION : (cushions[i % cushions.length] ?? INK);
    parts.push(disc(phase, x, y, R * 0.76, cushion, 1.4));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU - 0.4;
      parts.push(
        circle(
          x + Math.cos(a) * R * 0.4,
          y + Math.sin(a) * R * 0.4,
          1.5,
          `fill="${paint(phase, 'rgba(0, 0, 0, 0.22)')}"`,
        ),
      );
    }
    shapes.push(circle(x, y + 1, R + 3, ''));
  });
  return `${svgOpen}<defs>${discGradient(phase)}</defs>${parts.join('')}${vignetteOver(phase, shapes.join(''))}</svg>`;
}

// The candles (toon2.js → candle): the gold dish, its light, the candle, a drip and the wick; and
// the time's dial (timerDial) when the phase has one, at the table's middle unless `x` is given.
// Under the phase's colour. `noCandles` while no one sits yet (VampirYukleniyor).
export function candlesSvg(
  phase: ScenePhase,
  count: number,
  dial: { x?: number; y: number; r: number } | null,
  noCandles = false,
): string {
  const s = seatSize(count).candle;
  const parts: string[] = [];
  const shapes: string[] = [];
  for (const p of noCandles ? [] : seatsAround(count)) {
    const [x, y] = p.candle;
    parts.push(circle(x + 2, y + 3, 10 * s, `fill="${paint(phase, 'rgba(10, 4, 0, 0.4)')}"`));
    parts.push(disc(phase, x, y, 10 * s, '#F2C25A', 1.4));
    const o = 8 * s;
    const i = 6.6 * s;
    const a0 = Math.PI * 1.05;
    const a1 = Math.PI * 1.5;
    const pt = (r: number, t: number) => `${n(x + r * Math.cos(t))} ${n(y + r * Math.sin(t))}`;
    parts.push(
      `<path d="M${pt(o, a0)}A${n(o)} ${n(o)} 0 0 1 ${pt(o, a1)}L${pt(i, a1)}A${n(i)} ${n(i)} 0 0 0 ${pt(i, a0)}Z" fill="${paint(phase, 'rgba(255, 255, 255, 0.45)')}"/>`,
    );
    parts.push(disc(phase, x, y, 6 * s, '#FFF6E4', 1.3));
    const drip = `cx="${n(x + 5.6 * s)}" cy="${n(y + 2.4 * s)}" rx="${n(1.8 * s)}" ry="${n(2.6 * s)}" transform="rotate(${n((-0.4 * 180) / Math.PI)} ${n(x + 5.6 * s)} ${n(y + 2.4 * s)})"`;
    parts.push(`<ellipse ${drip} fill="${paint(phase, '#FFF6E4')}"/><ellipse ${drip} ${ink(1)}/>`);
    parts.push(circle(x, y, s, `fill="${paint(phase, INK)}"`));
    shapes.push(circle(x + 1, y + 1, 10 * s + 3, ''));
  }
  if (dial) {
    const { y, r } = dial;
    const cx = dial.x ?? CX;
    parts.push(circle(cx + 2, y + 4, r + 4, `fill="${paint(phase, 'rgba(10, 4, 0, 0.45)')}"`));
    parts.push(disc(phase, cx, y, r + 4, '#F2C25A', 1.8));
    parts.push(circle(cx, y, r, `fill="${paint(phase, '#2A1A12')}"`));
    parts.push(circle(cx, y, r, ink(1.3)));
    parts.push(
      `<path d="${arc(cx, y, r + 2, Math.PI * 1.1, Math.PI * 1.45)}" fill="none" stroke="${paint(phase, 'rgba(255, 255, 255, 0.5)')}" stroke-width="1.6" stroke-linecap="round"/>`,
    );
    shapes.push(circle(cx + 1, y + 2, r + 7, ''));
  }
  return `${svgOpen}<defs>${discGradient(phase)}</defs>${parts.join('')}${vignetteOver(phase, shapes.join(''))}</svg>`;
}

// The candles' warm light (toon2.js → flame, lighter): drawn on its own, laid on with screen.
export function candleLightSvg(phase: ScenePhase, count: number, dead: readonly boolean[]): string {
  const s = seatSize(count).candle;
  const a = 0.26 * PAL[phase].lamp + 0.08;
  const r = 32 * s;
  const parts = seatsAround(count)
    .map((p, i) => (dead[i] ? '' : circle(p.candle[0], p.candle[1], r, 'fill="url(#cl)"')))
    .join('');
  return `${svgOpen}<defs><radialGradient id="cl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgb(255, 180, 80)" stop-opacity="${n(a)}"/><stop offset="0.45" stop-color="rgb(255, 180, 80)" stop-opacity="${n(a * 0.4)}"/><stop offset="1" stop-color="rgb(255, 180, 80)" stop-opacity="0"/></radialGradient></defs>${parts}</svg>`;
}

// The flames, and for the dead their smoke (toon2.js → flame), after the phase's colour.
export function flamesSvg(phase: ScenePhase, count: number, dead: readonly boolean[]): string {
  const s = seatSize(count).candle;
  const parts = seatsAround(count).map((p, i) => {
    const [x, y] = p.candle;
    if (dead[i]) {
      return `<path d="M${n(x)} ${n(y - 1)}C${n(x + 6 * s)} ${n(y - 5 * s)} ${n(x - 3 * s)} ${n(y - 11 * s)} ${n(x + 4 * s)} ${n(y - 17 * s)}" fill="none" stroke="${lift(phase, 'rgba(230, 230, 240, 0.55)')}" stroke-width="${n(2.2 * s)}" stroke-linecap="round"/>${circle(x + 5 * s, y - 21 * s, 2.6 * s, `fill="none" stroke="${lift(phase, 'rgba(230, 230, 240, 0.3)')}" stroke-width="${n(3.6 * s)}"`)}`;
    }
    const outer = `M${n(x)} ${n(y - 9 * s)}C${n(x + 4 * s)} ${n(y - 4 * s)} ${n(x + 3.2 * s)} ${n(y + 1.4 * s)} ${n(x)} ${n(y + 1.4 * s)}C${n(x - 3.2 * s)} ${n(y + 1.4 * s)} ${n(x - 4 * s)} ${n(y - 4 * s)} ${n(x)} ${n(y - 9 * s)}Z`;
    const inner = `M${n(x)} ${n(y - 5.4 * s)}C${n(x + 2 * s)} ${n(y - 2.4 * s)} ${n(x + 1.6 * s)} ${n(y + 0.6 * s)} ${n(x)} ${n(y + 0.6 * s)}C${n(x - 1.6 * s)} ${n(y + 0.6 * s)} ${n(x - 2 * s)} ${n(y - 2.4 * s)} ${n(x)} ${n(y - 5.4 * s)}Z`;
    return `<path d="${outer}" fill="${lift(phase, '#FF9A2A')}"/><path d="${outer}" ${ink(1.1)}/><path d="${inner}" fill="${lift(phase, '#FFE88A')}"/>`;
  });
  return `${svgOpen}${parts.join('')}</svg>`;
}

// The table (toon2.js → tableT): its fall of shadow, the wooden edge with its band, grain and
// light, the gold line, and the walnut top's planks with the lamp's warmth in the middle. Drawn
// once into a picture for each phase (scripts/art/vampirScene.ts adds the lamp's light and the
// vignette over it).
export function tableSvg(phase: ScenePhase): string {
  const a = TABLE.half;
  const h = TABLE.straight;
  const ai = TABLE.inner;
  const P = PAL[phase];
  const c = (v: string) => paint(phase, v);
  const edge = stadium(CX, CY, a, h);
  const top = stadium(CX, CY, ai, h);
  const grain: string[] = [];
  const r = rnd(61);
  for (let k = 0; k < 22; k++) {
    const t = r() * TAU;
    const R = a - 7 + (r() - 0.5) * 6;
    const yy = CY + (r() - 0.5) * 2 * h;
    const x0 = CX + Math.cos(t) * R;
    const y0 = Math.abs(Math.sin(t)) < 0.5 ? yy : CY + (Math.sin(t) > 0 ? h : -h) + Math.sin(t) * R;
    grain.push(`M${n(x0)} ${n(y0)}L${n(x0 + Math.sin(t) * 9)} ${n(y0 - Math.cos(t) * 9)}`);
  }
  const pw = (ai * 2) / 6;
  const rr = rnd(9);
  const planks: string[] = [];
  const y0 = CY - h - ai;
  const tall = (ai + h) * 2;
  for (let k = 0; k < 6; k++) {
    const px = CX - ai + k * pw;
    planks.push(
      `<rect x="${n(px)}" y="${n(y0)}" width="${n(pw)}" height="${n(tall)}" fill="${k % 2 ? c('rgba(0, 0, 0, 0.06)') : c('rgba(255, 220, 180, 0.04)')}"/>`,
    );
    const lines: string[] = [];
    for (let j = 0; j < 4; j++) {
      const gx = px + 5 + rr() * (pw - 10);
      const gy = y0 + rr() * tall;
      const gl = 30 + rr() * 60;
      lines.push(
        `M${n(gx)} ${n(gy)}C${n(gx + 4)} ${n(gy + gl * 0.3)} ${n(gx - 4)} ${n(gy + gl * 0.7)} ${n(gx)} ${n(gy + gl)}`,
      );
    }
    planks.push(
      `<path d="${lines.join('')}" fill="none" stroke="${c('rgba(30, 12, 4, 0.35)')}" stroke-width="1.1" stroke-linecap="round"/>`,
    );
    if (k) {
      planks.push(
        `<rect x="${n(px - 0.7)}" y="${n(y0)}" width="1.4" height="${n(tall)}" fill="${c(INK)}" fill-opacity="0.55"/>`,
      );
    }
  }
  return `${svgOpen}<defs><clipPath id="e"><path d="${edge}"/></clipPath><clipPath id="t"><path d="${top}"/></clipPath><radialGradient id="w" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${h + ai}" fx="${CX}" fy="${CY - 10}" fr="20"><stop offset="0" stop-color="${c('#FFD696')}" stop-opacity="0.16"/><stop offset="0.7" stop-color="#000000" stop-opacity="0.05"/><stop offset="1" stop-color="${c('#14000A')}" stop-opacity="0.38"/></radialGradient></defs>
<path d="${stadium(CX + 6, CY + 10, a, h)}" fill="${c('rgba(10, 4, 0, 0.45)')}"/>
<path d="${edge}" fill="${c('#B8743E')}"/>
<g clip-path="url(#e)"><path d="${stadium(CX + 7, CY + 9, a, h)}M0 0H400V800H0Z" fill-rule="evenodd" fill="${c('#9A5C2E')}"/><path d="${grain.join('')}" fill="none" stroke="${c('rgba(90, 44, 16, 0.45)')}" stroke-width="1.3" stroke-linecap="round"/></g>
<path d="${arc(CX, CY - h, a - 4, Math.PI * 1.08, Math.PI * 1.42)}M${CX - a + 4} ${CY - h + 10}L${CX - a + 4} ${CY - h + 60}" fill="none" stroke="${c('rgba(255, 236, 200, 0.55)')}" stroke-width="2.4" stroke-linecap="round"/>
<path d="${edge}" ${ink(2.2)}/>
<path d="${stadium(CX, CY, ai + 5, h)}" fill="none" stroke="${c('#F2C25A')}" stroke-width="3"/>
<path d="${stadium(CX, CY, ai + 7, h)}" fill="none" stroke="${c(INK)}" stroke-width="1"/>
<g clip-path="url(#t)"><rect x="${CX - ai}" y="${n(y0)}" width="${ai * 2}" height="${n(tall)}" fill="${c(P.top)}"/>${planks.join('')}<rect x="${CX - ai}" y="${n(y0)}" width="${ai * 2}" height="${n(tall)}" fill="url(#w)"/></g>
<path d="${top}" ${ink(1.8)}/>
</svg>`;
}

// The pictures drawn once (scripts/art/vampirScene.ts), each by its file's name.
export function SCENE_ART(): Record<string, string> {
  return Object.fromEntries(SCENE_PHASES.map((p) => [`table-${p}`, tableSvg(p)]));
}
