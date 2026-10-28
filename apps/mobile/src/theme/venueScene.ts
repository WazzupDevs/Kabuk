import type { V46ThumbKind } from './parts.generated';

// The venue page's scene (the owner's call, 29 Ekim: no disk with the logo in the middle; the
// buddies do what the place is for): a table in the middle with the type's things on it, two
// buddies behind it and two at its sides, each busy, small things moving on their own (steam,
// a page turning, dice, a lamp swinging). Drawn flat like the buddies (no outlines, a darker side).
// Everything in a 390 × 300 frame, y from its top; the screen scales it to its width and anchors
// it at the scene's bottom (the status bar is above the frame).
export type SceneScheme = 'light' | 'dark';
export type SceneKind = V46ThumbKind;

export const VENUE_FRAME = { width: 390, height: 300 } as const;

// How a piece moves on its own, on the native driver (src/aura/VenueScene.tsx). Times in ms;
// `delay` before the first round; `rest` still between rounds.
export type SceneMotion =
  // Rises and fades (steam, notes): `rise` up over `ms`, again and again.
  | { kind: 'steam'; ms: number; delay: number; rise: number }
  // Up `y` and back (a cup to the mouth, a fork), turning `turn` degrees on the way.
  | { kind: 'bob'; ms: number; delay: number; rest: number; y: number; turn: number }
  // Swings `turn` degrees each way about its top (a lamp, the flags).
  | { kind: 'swing'; ms: number; delay: number; turn: number }
  // Glows and dims to `low` (the bulbs).
  | { kind: 'twinkle'; ms: number; delay: number; low: number }
  // Pops up from its bottom, stays, goes (a speech bubble, a heart).
  | { kind: 'pop'; ms: number; delay: number; rest: number }
  // Turns over about its left edge (a page).
  | { kind: 'flip'; ms: number; delay: number; rest: number }
  // Jumps `y` and spins `spin` degrees (dice, the pan's köfte).
  | { kind: 'hop'; ms: number; delay: number; rest: number; y: number; spin: number }
  // Flies `dx` across on a gentle wave `dy` high (the paper plane).
  | { kind: 'glide'; ms: number; delay: number; rest: number; dx: number; dy: number };

export type ScenePiece = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  xml: (s: SceneScheme) => string;
  motion?: SceneMotion;
};
export type SceneBuddy = { look: string; x: number; bottom: number; height: number };

export type VenueScene = {
  // Behind everything: lamps, lights, flags, the plane.
  back: ScenePiece[];
  // The two behind the table.
  rear: SceneBuddy[];
  // The table, what is on it and what the two behind hold.
  table: ScenePiece[];
  // The two at the table's sides.
  side: SceneBuddy[];
  // What the two at the sides hold, over them.
  held: ScenePiece[];
};

const PAL = {
  light: {
    cord: '#6B5BA8',
    steam: '#7C67D6',
    steamOp: 0.42,
    plain: { top: '#FFFFFF', edge: '#E3DAFF', leg: '#CFC2F5', shine: '#F4F0FF' },
    wood: { top: '#EDC48E', edge: '#C98D50', leg: '#A86F3B', shine: '#F6D9AE' },
    desk: { top: '#F6F1FF', edge: '#D6C8FF', leg: '#C2B3F0', shine: '#FFFFFF' },
    cloth: { top: '#FFFFFF', edge: '#FF8796', leg: '#CFC2F5', shine: '#FFFFFF' },
    check: '#FF6B7A',
    checkOp: 0.3,
    cup: '#FFFFFF',
    cupSide: '#E6E0FA',
    saucer: '#EFEAFF',
    paper: '#FFFFFF',
    paperSide: '#ECE6FB',
    line: '#CFC6EE',
    ink: '#3A2F6E',
    bubble: '#FFFFFF',
    bubbleDot: '#7B5CFF',
    lid: '#BFB3EA',
  },
  dark: {
    cord: '#B9A9F0',
    steam: '#FFFFFF',
    steamOp: 0.34,
    plain: { top: '#463B86', edge: '#30286A', leg: '#272058', shine: '#5A4E9E' },
    wood: { top: '#A97646', edge: '#7E522C', leg: '#664222', shine: '#BD8B58' },
    desk: { top: '#433983', edge: '#2F2768', leg: '#262056', shine: '#544A98' },
    cloth: { top: '#4A3F8C', edge: '#C2475A', leg: '#272058', shine: '#5A4E9E' },
    check: '#FF7A8A',
    checkOp: 0.26,
    cup: '#F4F1FF',
    cupSide: '#CDC4F0',
    saucer: '#DDD6F7',
    paper: '#F4F1FF',
    paperSide: '#CFC6EE',
    line: '#A99DD6',
    ink: '#2A2257',
    bubble: '#F4F1FF',
    bubbleDot: '#6A47F5',
    lid: '#8B6CFF',
  },
} as const;

// The brand's bright colours, the same in both themes (the buddies keep theirs too).
const C = {
  purple: '#6A47F5',
  violet: '#8B6CFF',
  pink: '#FF4F8B',
  pinkSoft: '#FF8DB3',
  orange: '#FFB547',
  gold: '#F2A93B',
  goldDeep: '#D4831C',
  mint: '#35C9A0',
  mintDeep: '#22A07D',
  sky: '#3DA9FF',
  red: '#E5483B',
  redDeep: '#B9322A',
  warm: '#FFD66B',
  coffee: '#6B3E26',
  crema: '#C9895A',
  tea: '#B5361A',
  teaTop: '#D9572E',
  brown: '#8E5529',
  brownDeep: '#6E3F1C',
  cream: '#F7E3BC',
  white: '#FFFFFF',
  dark: '#2E2748',
  steel: '#3A3350',
  steelSide: '#262036',
} as const;

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

// --- The table -----------------------------------------------------------------------------------

type TableKind = 'plain' | 'wood' | 'desk' | 'cloth';
const TABLE_W = 180;
const TABLE_H = 80;

function tableXml(kind: TableKind, s: SceneScheme): string {
  const p = PAL[s];
  const t = p[kind];
  const cloth =
    kind === 'cloth'
      ? `<clipPath id="tc"><ellipse cx="90" cy="18" rx="84" ry="16"/></clipPath><g clip-path="url(#tc)" fill="${p.check}" fill-opacity="${p.checkOp}">${[
          0, 1, 2, 3, 4, 5, 6, 7, 8,
        ]
          .map((i) => `<rect x="${4 + i * 20}" y="0" width="10" height="36"/>`)
          .join(
            '',
          )}<rect x="0" y="5" width="180" height="5"/><rect x="0" y="16" width="180" height="5"/><rect x="0" y="27" width="180" height="5"/></g>`
      : '';
  return svg(
    TABLE_W,
    TABLE_H,
    `<ellipse cx="90" cy="75" rx="30" ry="5" fill="${t.leg}"/>` +
      `<rect x="82" y="30" width="16" height="45" rx="3" fill="${t.leg}"/>` +
      `<path d="M6 18A84 16 0 0 0 174 18V26A84 16 0 0 1 6 26Z" fill="${t.edge}"/>` +
      `<ellipse cx="90" cy="18" rx="84" ry="16" fill="${t.top}"/>` +
      cloth +
      `<ellipse cx="62" cy="11" rx="34" ry="4" fill="${t.shine}" fill-opacity="0.7"/>`,
  );
}

const table = (kind: TableKind): ScenePiece => ({
  id: 'table',
  x: 105,
  y: 220,
  w: TABLE_W,
  h: TABLE_H,
  xml: (s) => tableXml(kind, s),
});

// --- Small things, reused ------------------------------------------------------------------------

const steamXml = (s: SceneScheme) =>
  svg(
    12,
    28,
    `<path d="M6 26C2 21 10 16 6 11C3 7 8 4 6 1" fill="none" stroke="${PAL[s].steam}" stroke-opacity="${PAL[s].steamOp}" stroke-width="2.4" stroke-linecap="round"/>`,
  );

const steam = (id: string, x: number, y: number, delay: number, ms = 2600): ScenePiece => ({
  id,
  x,
  y,
  w: 12,
  h: 28,
  xml: steamXml,
  motion: { kind: 'steam', ms, delay, rise: 12 },
});

const heartPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy + r * 0.9}C${cx - r * 1.6} ${cy - r * 0.1} ${cx - r * 0.9} ${cy - r * 1.3} ${cx} ${cy - r * 0.45}C${cx + r * 0.9} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.1} ${cx} ${cy + r * 0.9}Z`;

const heart = (id: string, x: number, y: number, delay: number): ScenePiece => ({
  id,
  x,
  y,
  w: 18,
  h: 16,
  xml: () => svg(18, 16, `<path d="${heartPath(9, 8, 6)}" fill="${C.pink}"/>`),
  motion: { kind: 'steam', ms: 3000, delay, rise: 18 },
});

// A speech bubble over a buddy, its tail down to the `tail` side; `inner` drawn in it.
function bubbleXml(s: SceneScheme, tail: 'left' | 'right', inner: string): string {
  const p = PAL[s];
  const tx = tail === 'left' ? 7 : 25;
  const tip = tail === 'left' ? 3 : 29;
  return svg(
    32,
    26,
    `<path d="M${tx - 4} 18L${tip} 25L${tx + 4} 18Z" fill="${p.bubble}"/>` +
      `<rect x="1" y="1" width="30" height="19" rx="9.5" fill="${p.bubble}"/>` +
      inner,
  );
}

const dots = (s: SceneScheme) =>
  [10, 16, 22]
    .map((x) => `<circle cx="${x}" cy="10.5" r="2" fill="${PAL[s].bubbleDot}"/>`)
    .join('');

const talk = (id: string, x: number, y: number, tail: 'left' | 'right', delay: number) => ({
  id,
  x,
  y,
  w: 32,
  h: 26,
  xml: (s: SceneScheme) => bubbleXml(s, tail, dots(s)),
  motion: { kind: 'pop', ms: 1500, delay, rest: 1500 } as const,
});

function cupXml(s: SceneScheme, handle: 'left' | 'right', top: string): string {
  const p = PAL[s];
  const hx = handle === 'right' ? 24.5 : 3.5;
  return svg(
    30,
    30,
    `<ellipse cx="14" cy="26" rx="13" ry="3.6" fill="${p.saucer}"/>` +
      `<circle cx="${hx}" cy="16" r="3.6" fill="none" stroke="${p.cup}" stroke-width="2.6"/>` +
      `<path d="M5 12H23V20Q23 26 14 26Q5 26 5 20Z" fill="${p.cup}"/>` +
      `<path d="M18 12H23V20Q23 25 17 25.8Q19.5 23 18 12Z" fill="${p.cupSide}"/>` +
      `<ellipse cx="14" cy="12" rx="9" ry="2.4" fill="${C.coffee}"/>` +
      top,
  );
}

function teaGlassXml(s: SceneScheme): string {
  const p = PAL[s];
  return svg(
    16,
    30,
    `<ellipse cx="8" cy="27" rx="8" ry="2.4" fill="${p.saucer}"/>` +
      `<path d="M3 2H13Q13 6 10.6 10Q9.2 13 10.6 16Q13 20 12.4 26H3.6Q3 20 5.4 16Q6.8 13 5.4 10Q3 6 3 2Z" fill="${C.white}" fill-opacity="0.55"/>` +
      `<path d="M3.6 5.5H12.4Q12 8 10.6 10Q9.2 13 10.6 16Q13 20 12.4 26H3.6Q3 20 5.4 16Q6.8 13 5.4 10Q4 8 3.6 5.5Z" fill="${C.tea}"/>` +
      `<ellipse cx="8" cy="5.5" rx="4.4" ry="1" fill="${C.teaTop}"/>` +
      `<path d="M5 17Q4.4 20 4.8 24" stroke="${C.white}" stroke-opacity="0.6" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  );
}

function dieXml(pips: number[][]): string {
  return svg(
    12,
    12,
    `<rect x="0.5" y="0.5" width="11" height="11" rx="2.6" fill="${C.white}"/>` +
      `<path d="M9 0.5H9Q11.5 0.5 11.5 3V9Q11.5 11.5 9 11.5H8Q10 10 10 7V0.5Z" fill="${C.dark}" fill-opacity="0.12"/>` +
      pips.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.15" fill="${C.dark}"/>`).join(''),
  );
}

// --- Kafe ---------------------------------------------------------------------------------------

function lampXml(s: SceneScheme, shade: string, shadeSide: string): string {
  return svg(
    40,
    184,
    `<line x1="20" y1="0" x2="20" y2="152" stroke="${PAL[s].cord}" stroke-width="1.5"/>` +
      `<circle cx="20" cy="172" r="15" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.32 : 0.28}"/>` +
      `<path d="M3 170Q3 151 20 150Q37 151 37 170Z" fill="${shade}"/>` +
      `<path d="M26 151Q37 154 37 170H29Q30 158 26 151Z" fill="${shadeSide}"/>` +
      `<rect x="17" y="146" width="6" height="5" rx="1.5" fill="${shadeSide}"/>` +
      `<ellipse cx="20" cy="172" rx="5.5" ry="4.5" fill="${C.warm}"/>`,
  );
}

const croissantXml = (s: SceneScheme) =>
  svg(
    40,
    18,
    `<ellipse cx="20" cy="12" rx="18" ry="5" fill="${PAL[s].saucer}"/>` +
      `<path d="M6 10Q9 3 20 2Q31 3 34 10Q30 8 27 9Q24 5 20 5Q16 5 13 9Q10 8 6 10Z" fill="${C.gold}"/>` +
      `<path d="M13 9Q16 5 20 5Q24 5 27 9Q24 11 20 11Q16 11 13 9Z" fill="${C.gold}"/>` +
      `<path d="M16 5.5Q17 8 16.4 10.6M24 5.5Q23 8 23.6 10.6M20 5V11" stroke="${C.goldDeep}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  );

const takeawayXml = () =>
  svg(
    22,
    32,
    `<path d="M3 6H19L17 30H5Z" fill="${C.white}"/>` +
      `<path d="M14 6H19L17 30H13Z" fill="${C.dark}" fill-opacity="0.08"/>` +
      `<path d="M3.6 13H18.4L17.8 21H4.2Z" fill="${C.crema}"/>` +
      `<rect x="1.5" y="2" width="19" height="5" rx="2.2" fill="${C.purple}"/>` +
      `<rect x="6" y="0.5" width="10" height="3" rx="1.2" fill="${C.violet}"/>`,
  );

const latteXml = () =>
  svg(
    20,
    30,
    `<rect x="3" y="2" width="14" height="27" rx="3" fill="${C.white}" fill-opacity="0.6"/>` +
      `<path d="M3.6 16H16.4V25.5Q16.4 28.4 13.5 28.4H6.5Q3.6 28.4 3.6 25.5Z" fill="${C.coffee}"/>` +
      `<rect x="3.6" y="9" width="12.8" height="7" fill="${C.crema}"/>` +
      `<rect x="3.6" y="4.5" width="12.8" height="4.5" fill="${C.cream}"/>` +
      `<path d="M14 4V27" stroke="${C.white}" stroke-opacity="0.7" stroke-width="1.4" stroke-linecap="round"/>`,
  );

const noteXml = (color: string) => () =>
  svg(
    16,
    22,
    `<path d="M6 3L14 1V15" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M6 3V18" stroke="${color}" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="3.6" cy="18.5" rx="3.4" ry="2.6" fill="${color}"/>` +
      `<ellipse cx="11.6" cy="15.5" rx="3.4" ry="2.6" fill="${color}"/>`,
  );

const KAFE: VenueScene = {
  back: [
    {
      id: 'lamp-l',
      x: 106,
      y: -84,
      w: 40,
      h: 184,
      xml: (s) => lampXml(s, C.mint, C.mintDeep),
      motion: { kind: 'swing', ms: 3600, delay: 0, turn: 3 },
    },
    {
      id: 'lamp-r',
      x: 246,
      y: -84,
      w: 40,
      h: 184,
      xml: (s) => lampXml(s, C.pinkSoft, C.pink),
      motion: { kind: 'swing', ms: 4200, delay: 900, turn: 3 },
    },
  ],
  rear: [
    { look: 'c:pembe e:koyu h:kulaklik', x: 122, bottom: 72, height: 92 },
    { look: 'c:limon e:klasik h:berefr', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('plain'),
    {
      id: 'cup-a',
      x: 132,
      y: 212,
      w: 30,
      h: 30,
      xml: (s) => cupXml(s, 'left', ''),
    },
    steam('steam-a1', 136, 186, 0),
    steam('steam-a2', 145, 188, 1300),
    {
      id: 'croissant',
      x: 175,
      y: 226,
      w: 40,
      h: 18,
      xml: croissantXml,
    },
    {
      id: 'cup-b',
      x: 226,
      y: 214,
      w: 30,
      h: 30,
      xml: (s) =>
        cupXml(
          s,
          'right',
          `<ellipse cx="14" cy="12" rx="7.6" ry="1.9" fill="${C.crema}"/><path d="${heartPath(14, 12, 1.6)}" fill="${C.cream}" transform="translate(0 0) scale(1 0.7) translate(0 5.1)"/>`,
        ),
    },
    steam('steam-b1', 234, 190, 700),
    steam('steam-b2', 243, 192, 1900),
    {
      id: 'note-1',
      x: 112,
      y: 120,
      w: 16,
      h: 22,
      xml: noteXml(C.purple),
      motion: { kind: 'steam', ms: 3200, delay: 400, rise: 22 },
    },
    {
      id: 'note-2',
      x: 124,
      y: 132,
      w: 16,
      h: 22,
      xml: noteXml(C.pink),
      motion: { kind: 'steam', ms: 3200, delay: 2000, rise: 22 },
    },
    heart('heart', 258, 124, 1200),
  ],
  side: [
    { look: 'c:mor e:klasik', x: 18, bottom: -6, height: 132 },
    { look: 'c:mercan e:mutlu h:fotr', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    steam('steam-take', 88, 210, 500, 2200),
    {
      id: 'takeaway',
      x: 84,
      y: 238,
      w: 22,
      h: 32,
      xml: takeawayXml,
      motion: { kind: 'bob', ms: 1400, delay: 600, rest: 2600, y: 7, turn: -8 },
    },
    {
      id: 'latte',
      x: 286,
      y: 240,
      w: 20,
      h: 30,
      xml: latteXml,
      motion: { kind: 'bob', ms: 1400, delay: 2400, rest: 2600, y: 7, turn: 8 },
    },
  ],
};

// --- Çay bahçesi ---------------------------------------------------------------------------------

const LIGHTS_W = 410;
const LIGHTS_H = 56;
const BULB_COLORS = [C.warm, C.pinkSoft, C.mint, C.violet] as const;
const BULBS = 11;

// Where the string's bulbs hang: along the curve M0 6 Q205 52 410 10.
function bulbAt(i: number): [number, number] {
  const t = (i + 0.5) / BULBS;
  const x = 2 * (1 - t) * t * 205 + t * t * 410;
  const y = (1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 52 + t * t * 10;
  return [x, y];
}

function lightsXml(s: SceneScheme): string {
  const bulbs = Array.from({ length: BULBS }, (_, i) => {
    const [x, y] = bulbAt(i);
    return (
      `<rect x="${x - 2}" y="${y - 1}" width="4" height="4" rx="1" fill="${PAL[s].cord}"/>` +
      `<ellipse cx="${x}" cy="${y + 7}" rx="3.6" ry="4.6" fill="${BULB_COLORS[i % BULB_COLORS.length]}"/>`
    );
  }).join('');
  return svg(
    LIGHTS_W,
    LIGHTS_H,
    `<path d="M0 6Q205 52 410 10" fill="none" stroke="${PAL[s].cord}" stroke-width="1.5"/>` + bulbs,
  );
}

// One third of the bulbs' glows (every third bulb from `g`): three layers twinkle out of step.
function glowXml(g: number): (s: SceneScheme) => string {
  return (s) => {
    const glows = Array.from({ length: BULBS }, (_, i) => i)
      .filter((i) => i % 3 === g)
      .map((i) => {
        const [x, y] = bulbAt(i);
        return `<circle cx="${x}" cy="${y + 7}" r="11" fill="${BULB_COLORS[i % BULB_COLORS.length]}" fill-opacity="${s === 'dark' ? 0.42 : 0.34}"/>`;
      })
      .join('');
    return svg(LIGHTS_W, LIGHTS_H, glows);
  };
}

function tavlaXml(): string {
  const tri = (x: number, top: boolean, i: number) => {
    const color = i % 2 === 0 ? C.red : C.purple;
    return top
      ? `<path d="M${x} 4.5L${x + 5.4} 4.5L${x + 2.7} 12Z" fill="${color}"/>`
      : `<path d="M${x} 21.5L${x + 5.4} 21.5L${x + 2.7} 14Z" fill="${color}"/>`;
  };
  const left = [9, 15, 21, 27, 33].flatMap((x, i) => [tri(x, true, i), tri(x - 2, false, i + 1)]);
  const right = [48, 54, 60, 66, 72].flatMap((x, i) => [tri(x, true, i), tri(x + 2, false, i + 1)]);
  const checker = (x: number, y: number, light: boolean) =>
    `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="2" fill="${light ? C.white : C.dark}"/>`;
  return svg(
    88,
    26,
    `<path d="M8 0H80L88 26H0Z" fill="${C.brownDeep}"/>` +
      `<path d="M10.5 3H42.5V23H4.5Z" fill="${C.cream}"/>` +
      `<path d="M45.5 3H77.5L83.5 23H45.5Z" fill="${C.cream}"/>` +
      left.join('') +
      right.join('') +
      checker(13, 7, true) +
      checker(19, 7.5, true) +
      checker(61, 18.5, false) +
      checker(67, 19, false) +
      checker(36, 18, false) +
      checker(55, 7, true),
  );
}

function simitXml(): string {
  const seeds = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const x = 13 + Math.cos(a) * 10;
    const y = 13 + Math.sin(a) * 10;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.1" ry="0.7" fill="${C.cream}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join('');
  return svg(
    26,
    26,
    `<circle cx="13" cy="13" r="9.6" fill="none" stroke="${C.goldDeep}" stroke-width="7"/>` +
      `<path d="M5 9A9.6 9.6 0 0 1 17 3.8" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>` +
      seeds,
  );
}

function teapotXml(): string {
  return svg(
    34,
    38,
    `<path d="M3 24Q0 18 4 16" stroke="${C.red}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<path d="M7 20H27V31Q27 37 17 37Q7 37 7 31Z" fill="${C.red}"/>` +
      `<path d="M21 20H27V31Q27 36 20 36.8Q23 33 21 20Z" fill="${C.redDeep}"/>` +
      `<ellipse cx="17" cy="20" rx="10" ry="2.4" fill="${C.redDeep}"/>` +
      `<path d="M10 9H24V17Q24 20.5 17 20.5Q10 20.5 10 17Z" fill="${C.red}"/>` +
      `<path d="M20 9H24V17Q24 20 19.5 20.4Q21 17 20 9Z" fill="${C.redDeep}"/>` +
      `<path d="M24 12Q31 12 30 7" stroke="${C.red}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="17" cy="9" rx="7" ry="1.8" fill="${C.redDeep}"/>` +
      `<circle cx="17" cy="6.6" r="1.8" fill="${C.redDeep}"/>` +
      `<circle cx="13" cy="28" r="1.4" fill="${C.white}" fill-opacity="0.85"/>` +
      `<circle cx="17.5" cy="31" r="1.4" fill="${C.white}" fill-opacity="0.85"/>` +
      `<circle cx="14" cy="14" r="1.2" fill="${C.white}" fill-opacity="0.85"/>`,
  );
}

const DIE_FIVE = [
  [3.4, 3.4],
  [8.6, 3.4],
  [6, 6],
  [3.4, 8.6],
  [8.6, 8.6],
];
const DIE_THREE = [
  [3.4, 3.4],
  [6, 6],
  [8.6, 8.6],
];
const DIE_SIX = [
  [3.6, 3],
  [3.6, 6],
  [3.6, 9],
  [8.4, 3],
  [8.4, 6],
  [8.4, 9],
];

const CAY: VenueScene = {
  back: [
    { id: 'lights', x: -10, y: 62, w: LIGHTS_W, h: LIGHTS_H, xml: lightsXml },
    ...[0, 1, 2].map((g): ScenePiece => ({
      id: `glow-${g}`,
      x: -10,
      y: 62,
      w: LIGHTS_W,
      h: LIGHTS_H,
      xml: glowXml(g),
      motion: { kind: 'twinkle', ms: 1800, delay: g * 600, low: 0.15 },
    })),
  ],
  rear: [
    { look: 'c:nane e:mutlu h:bere', x: 122, bottom: 72, height: 92 },
    { look: 'c:lavanta e:klasik h:fiyonk m:gulumse', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('wood'),
    { id: 'tavla', x: 151, y: 223, w: 88, h: 26, xml: tavlaXml },
    {
      id: 'die-a',
      x: 228,
      y: 214,
      w: 12,
      h: 12,
      xml: () => dieXml(DIE_FIVE),
      motion: { kind: 'hop', ms: 700, delay: 800, rest: 3000, y: 18, spin: 360 },
    },
    {
      id: 'die-b',
      x: 242,
      y: 218,
      w: 12,
      h: 12,
      xml: () => dieXml(DIE_THREE),
      motion: { kind: 'hop', ms: 760, delay: 860, rest: 2940, y: 14, spin: -360 },
    },
    { id: 'tea-a', x: 124, y: 208, w: 16, h: 30, xml: teaGlassXml },
    steam('steam-a', 126, 184, 0),
    { id: 'tea-b', x: 256, y: 212, w: 16, h: 30, xml: teaGlassXml },
    steam('steam-b', 258, 188, 1300),
    {
      id: 'simit',
      x: 132,
      y: 192,
      w: 26,
      h: 26,
      xml: simitXml,
      motion: { kind: 'bob', ms: 1500, delay: 1600, rest: 2400, y: 6, turn: -10 },
    },
    {
      id: 'teapot',
      x: 238,
      y: 178,
      w: 34,
      h: 38,
      xml: teapotXml,
      motion: { kind: 'bob', ms: 1800, delay: 300, rest: 3200, y: 3, turn: -14 },
    },
  ],
  side: [
    { look: 'c:mercan e:klasik h:kasket m:biyik', x: 18, bottom: -6, height: 132 },
    { look: 'c:turkuaz e:klasik h:fotr', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    {
      id: 'duses',
      x: 86,
      y: 168,
      w: 32,
      h: 26,
      xml: (s) =>
        bubbleXml(
          s,
          'left',
          `<g transform="translate(4.5 4.5) scale(0.95)">${dieXml(DIE_SIX).replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(16 4.5) scale(0.95)">${dieXml(DIE_SIX).replace(/<\/?svg[^>]*>/g, '')}</g>`,
        ),
      motion: { kind: 'pop', ms: 1400, delay: 1700, rest: 2300 },
    },
  ],
};

// --- Yemek ---------------------------------------------------------------------------------------

const FLAG_COLORS = [C.pink, C.orange, C.mint, C.sky, C.purple] as const;

function buntingXml(s: SceneScheme): string {
  const flags = Array.from({ length: 13 }, (_, i) => {
    const t = (i + 0.5) / 13;
    const x = 2 * (1 - t) * t * 205 + t * t * 410;
    const y = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 44 + t * t * 8;
    return `<path d="M${(x - 9).toFixed(1)} ${(y - 1).toFixed(1)}L${(x + 9).toFixed(1)} ${(y + 1).toFixed(1)}L${x.toFixed(1)} ${(y + 18).toFixed(1)}Z" fill="${FLAG_COLORS[i % FLAG_COLORS.length]}"/>`;
  }).join('');
  return svg(
    410,
    48,
    `<path d="M0 4Q205 44 410 8" fill="none" stroke="${PAL[s].cord}" stroke-width="1.5"/>` + flags,
  );
}

function pizzaXml(): string {
  const pep = [
    [20, 8],
    [32, 7],
    [26, 13],
    [37, 12],
    [15, 13],
  ]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.7" fill="${C.redDeep}"/>`)
    .join('');
  return svg(
    54,
    24,
    `<ellipse cx="27" cy="14" rx="26" ry="9" fill="${C.brown}"/>` +
      `<rect x="48" y="11" width="8" height="5" rx="2.5" fill="${C.brown}"/>` +
      `<ellipse cx="27" cy="11" rx="22" ry="7.5" fill="${C.gold}"/>` +
      `<ellipse cx="27" cy="10.6" rx="19" ry="6" fill="${C.red}"/>` +
      `<ellipse cx="27" cy="10.4" rx="17" ry="5.2" fill="${C.warm}"/>` +
      pep +
      `<path d="M27 4.5V16.5M10 10.4H44" stroke="${C.goldDeep}" stroke-width="0.8" stroke-opacity="0.6"/>`,
  );
}

function bowlXml(): string {
  return svg(
    28,
    20,
    `<ellipse cx="14" cy="18" rx="7" ry="1.8" fill="${C.mintDeep}"/>` +
      `<path d="M1 6H27Q27 17 14 18Q1 17 1 6Z" fill="${C.mint}"/>` +
      `<path d="M19 6H27Q27 16 16 17.8Q22 14 19 6Z" fill="${C.mintDeep}"/>` +
      `<ellipse cx="14" cy="6" rx="13" ry="3.2" fill="${C.orange}"/>` +
      `<ellipse cx="10" cy="5.6" rx="2" ry="0.8" fill="${C.white}" fill-opacity="0.7"/>`,
  );
}

function ayranXml(s: SceneScheme): string {
  return svg(
    14,
    28,
    `<rect x="1" y="2" width="12" height="25" rx="2.4" fill="${PAL[s].cup}" fill-opacity="0.65"/>` +
      `<rect x="2" y="7" width="10" height="19" rx="1.6" fill="${C.white}"/>` +
      `<rect x="2" y="5" width="10" height="3" rx="1.4" fill="${C.cream}"/>` +
      `<path d="M10 9V24" stroke="${PAL[s].cupSide}" stroke-width="1.6" stroke-linecap="round"/>`,
  );
}

function sliceXml(): string {
  return svg(
    22,
    26,
    `<path d="M11 25L1 4Q11 0 21 4Z" fill="${C.warm}"/>` +
      `<path d="M1 4Q11 0 21 4L20 6.4Q11 2.6 2 6.4Z" fill="${C.goldDeep}"/>` +
      `<ellipse cx="9" cy="10" rx="2.2" ry="1.8" fill="${C.redDeep}"/>` +
      `<ellipse cx="14" cy="14" rx="2.2" ry="1.8" fill="${C.redDeep}"/>` +
      `<ellipse cx="10.4" cy="18" rx="1.8" ry="1.5" fill="${C.redDeep}"/>`,
  );
}

const panXml = () =>
  svg(
    40,
    16,
    `<rect x="0" y="5" width="14" height="4" rx="2" fill="${C.steelSide}"/>` +
      `<path d="M12 4H39Q38 15 25.5 15Q13 15 12 4Z" fill="${C.steel}"/>` +
      `<ellipse cx="25.5" cy="4.5" rx="13.5" ry="2.6" fill="${C.steelSide}"/>`,
  );

const kofteXml = () =>
  svg(
    16,
    8,
    `<ellipse cx="8" cy="4" rx="7.4" ry="3.4" fill="${C.brown}"/>` +
      `<ellipse cx="6" cy="2.8" rx="3" ry="1" fill="${C.crema}"/>`,
  );

const forkXml = () =>
  svg(
    14,
    44,
    `<rect x="5.8" y="16" width="2.4" height="27" rx="1.2" fill="${C.steel}"/>` +
      `<path d="M3 7V13Q3 17 7 17Q11 17 11 13V7" stroke="${C.steel}" stroke-width="1.6" fill="none"/>` +
      `<path d="M5.6 7V14M8.4 7V14" stroke="${C.steel}" stroke-width="1.2"/>` +
      `<circle cx="7" cy="6" r="5.4" fill="${C.brown}"/>` +
      `<ellipse cx="5.4" cy="4.4" rx="2" ry="1" fill="${C.crema}"/>`,
  );

const YEMEK: VenueScene = {
  back: [
    {
      id: 'bunting',
      x: -10,
      y: 60,
      w: 410,
      h: 48,
      xml: buntingXml,
      motion: { kind: 'swing', ms: 4600, delay: 0, turn: 1.2 },
    },
  ],
  rear: [
    { look: 'c:nane e:mutlu', x: 122, bottom: 72, height: 92 },
    { look: 'c:lavanta e:klasik h:fiyonk m:gulumse', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('cloth'),
    { id: 'bowl', x: 118, y: 218, w: 28, h: 20, xml: bowlXml },
    steam('steam-bowl', 126, 192, 0),
    { id: 'pizza', x: 168, y: 224, w: 54, h: 24, xml: pizzaXml },
    steam('steam-p1', 182, 198, 600),
    steam('steam-p2', 198, 200, 1700),
    { id: 'ayran', x: 250, y: 212, w: 14, h: 28, xml: ayranXml },
    {
      id: 'slice',
      x: 134,
      y: 188,
      w: 22,
      h: 26,
      xml: sliceXml,
      motion: { kind: 'bob', ms: 1500, delay: 1200, rest: 2500, y: 8, turn: -12 },
    },
    heart('yum-1', 252, 124, 800),
    heart('yum-2', 262, 136, 2400),
  ],
  side: [
    { look: 'c:krem e:klasik h:ascisapka', x: 18, bottom: -6, height: 132 },
    { look: 'c:gok e:klasik h:terssapka', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    { id: 'pan', x: 76, y: 250, w: 40, h: 16, xml: panXml },
    {
      id: 'kofte',
      x: 94,
      y: 247,
      w: 16,
      h: 8,
      xml: kofteXml,
      motion: { kind: 'hop', ms: 820, delay: 900, rest: 2400, y: 30, spin: 180 },
    },
    {
      id: 'fork',
      x: 288,
      y: 226,
      w: 14,
      h: 44,
      xml: forkXml,
      motion: { kind: 'bob', ms: 1200, delay: 2000, rest: 2000, y: 12, turn: 10 },
    },
  ],
};

// --- Kampüs --------------------------------------------------------------------------------------

const planeXml = () =>
  svg(
    32,
    20,
    `<path d="M1 10L31 1L13 13Z" fill="${C.white}"/>` +
      `<path d="M13 13L31 1L16 19Z" fill="${C.cream}"/>` +
      `<path d="M13 13L15 18L16 19Z" fill="${C.violet}" fill-opacity="0.5"/>` +
      `<path d="M1 10L31 1" stroke="${C.violet}" stroke-width="0.8" stroke-opacity="0.5"/>`,
  );

function stackXml(s: SceneScheme): string {
  const p = PAL[s];
  const book = (y: number, x: number, w: number, color: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="8" rx="1.6" fill="${color}"/>` +
    `<rect x="${x + 3}" y="${y + 1.6}" width="${w - 5}" height="4.8" rx="0.8" fill="${p.paper}"/>` +
    `<path d="M${x + 5} ${y + 3.2}H${x + w - 4}M${x + 5} ${y + 4.8}H${x + w - 4}" stroke="${p.line}" stroke-width="0.6"/>`;
  return svg(
    36,
    30,
    book(21, 1, 34, C.purple) + book(13, 4, 29, C.pink) + book(5, 2, 31, C.orange),
  );
}

function openBookXml(s: SceneScheme, cover: string): string {
  const p = PAL[s];
  const lines = (x0: number, x1: number) =>
    [5, 8, 11]
      .map((y) => `<path d="M${x0} ${y}H${x1}" stroke="${p.line}" stroke-width="0.9"/>`)
      .join('');
  return svg(
    40,
    20,
    `<path d="M0 3L20 5L40 3V18L20 20L0 18Z" fill="${cover}"/>` +
      `<path d="M2 2Q11 0 20 4V18Q11 15 2 16Z" fill="${p.paper}"/>` +
      `<path d="M38 2Q29 0 20 4V18Q29 15 38 16Z" fill="${p.paperSide}"/>` +
      lines(5, 17),
  );
}

// The right page that turns over about the spine (its left edge).
function pageXml(s: SceneScheme): string {
  const p = PAL[s];
  return svg(
    20,
    20,
    `<path d="M0 4Q9 0 18 2V16Q9 15 0 18Z" fill="${p.paper}"/>` +
      [6, 9, 12]
        .map((y) => `<path d="M3 ${y}H15" stroke="${p.line}" stroke-width="0.9"/>`)
        .join(''),
  );
}

function laptopXml(s: SceneScheme): string {
  const p = PAL[s];
  return svg(
    42,
    36,
    `<path d="M0 32H42L39 35H3Z" fill="${p.cupSide}"/>` +
      `<path d="M5 2H37L39 32H3Z" fill="${p.lid}"/>` +
      `<path d="M30 2H37L39 32H33Z" fill="${C.dark}" fill-opacity="0.12"/>` +
      `<circle cx="20" cy="16" r="5.5" fill="${C.pink}"/>` +
      `<path d="${heartPath(20, 16, 2.2)}" fill="${C.white}"/>`,
  );
}

function notebookXml(s: SceneScheme): string {
  const p = PAL[s];
  const rings = [4, 9, 14, 19]
    .map(
      (x) =>
        `<circle cx="${x}" cy="2.6" r="1.4" fill="none" stroke="${C.steel}" stroke-width="1"/>`,
    )
    .join('');
  return svg(
    24,
    20,
    `<rect x="0.5" y="2" width="23" height="17.5" rx="2" fill="${C.sky}"/>` +
      `<rect x="2" y="3.4" width="20" height="15" rx="1.2" fill="${p.paper}"/>` +
      [7, 10, 13, 16]
        .map((y) => `<path d="M4 ${y}H20" stroke="${p.line}" stroke-width="0.7"/>`)
        .join('') +
      rings,
  );
}

const pencilXml = () =>
  svg(
    10,
    28,
    `<rect x="3" y="0" width="4" height="4" rx="1" fill="${C.pinkSoft}"/>` +
      `<rect x="3" y="3.6" width="4" height="2" fill="${C.steel}" fill-opacity="0.5"/>` +
      `<rect x="3" y="5.6" width="4" height="16" fill="${C.orange}"/>` +
      `<path d="M3 21.6H7L5 26.5Z" fill="${C.cream}"/>` +
      `<path d="M4.3 24.4H5.7L5 26.5Z" fill="${C.dark}"/>`,
  );

const KAMPUS: VenueScene = {
  back: [
    {
      id: 'plane',
      x: -34,
      y: 76,
      w: 32,
      h: 20,
      xml: planeXml,
      motion: { kind: 'glide', ms: 6800, delay: 600, rest: 2600, dx: 460, dy: 9 },
    },
  ],
  rear: [
    { look: 'c:nane e:koyu h:anten', x: 122, bottom: 72, height: 92 },
    { look: 'c:hardal e:klasik h:sihirbaz', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('desk'),
    { id: 'stack', x: 120, y: 206, w: 36, h: 30, xml: stackXml },
    { id: 'open', x: 176, y: 224, w: 40, h: 20, xml: (s) => openBookXml(s, C.mint) },
    {
      id: 'open-page',
      x: 196,
      y: 224,
      w: 20,
      h: 20,
      xml: pageXml,
      motion: { kind: 'flip', ms: 900, delay: 1800, rest: 3200 },
    },
    { id: 'laptop', x: 226, y: 202, w: 42, h: 36, xml: laptopXml },
    talk('talk-l', 108, 130, 'right', 0),
    talk('talk-r', 250, 126, 'left', 1500),
  ],
  side: [
    { look: 'c:gok e:klasik f:yuvarlak', x: 18, bottom: -6, height: 132 },
    { look: 'c:pembe e:koyu h:kulaklik', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    { id: 'held-book', x: 72, y: 244, w: 40, h: 20, xml: (s) => openBookXml(s, C.purple) },
    {
      id: 'held-page',
      x: 92,
      y: 244,
      w: 20,
      h: 20,
      xml: pageXml,
      motion: { kind: 'flip', ms: 900, delay: 400, rest: 3600 },
    },
    { id: 'notebook', x: 282, y: 252, w: 24, h: 20, xml: notebookXml },
    {
      id: 'pencil',
      x: 296,
      y: 232,
      w: 10,
      h: 28,
      xml: pencilXml,
      motion: { kind: 'bob', ms: 420, delay: 0, rest: 380, y: 2, turn: 12 },
    },
  ],
};

export const VENUE_SCENES: Record<SceneKind, VenueScene> = {
  kafe: KAFE,
  cay: CAY,
  yemek: YEMEK,
  kampus: KAMPUS,
};
