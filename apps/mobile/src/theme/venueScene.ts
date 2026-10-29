import type { V46ThumbKind } from './parts.generated';

// The venue page's scene (the owner's calls, 29 Ekim: no disk with the logo in the middle; the
// buddies play one of skall's games at a table, a different game for each kind of place): Kampüs
// plays Vampir Köylü in the campus garden at night, Kafe Kinshi, Çay bahçesi Krot, Yemek Sprengja.
// A table in the middle with the place's things and the game's on it, two buddies behind it and
// two at its sides, small things moving on their own (steam, bats, the bomb going hand to hand).
// Drawn flat like the buddies (no outlines, a darker side). Everything in a 390 × 300 frame, y from
// its top; the screen scales it to its width and anchors it at the scene's bottom (the status bar
// is above the frame).
export type SceneScheme = 'light' | 'dark';
export type SceneKind = V46ThumbKind;

export const VENUE_FRAME = { width: 390, height: 300 } as const;

// How a piece moves on its own, on the native driver (src/aura/VenueScene.tsx). Times in ms;
// `delay` before the first round; `rest` still between rounds.
export type SceneMotion =
  // Rises and fades (steam, notes, question marks): `rise` up over `ms`, again and again.
  | { kind: 'steam'; ms: number; delay: number; rise: number }
  // Up `y` and back (a cup to the mouth, a card held up), turning `turn` degrees on the way.
  | { kind: 'bob'; ms: number; delay: number; rest: number; y: number; turn: number }
  // Swings `turn` degrees each way about its top (a lamp, the flags, a lantern).
  | { kind: 'swing'; ms: number; delay: number; turn: number }
  // Glows and dims to `low` (the bulbs, the moon, the stars).
  | { kind: 'twinkle'; ms: number; delay: number; low: number }
  // Pops up from its bottom, stays, goes (a speech bubble, a card shown, a drop of sweat).
  | { kind: 'pop'; ms: number; delay: number; rest: number }
  // Turns over about its left edge (a page).
  | { kind: 'flip'; ms: number; delay: number; rest: number }
  // Jumps `y` and spins `spin` degrees (the sand timer turned over).
  | { kind: 'hop'; ms: number; delay: number; rest: number; y: number; spin: number }
  // Flies `dx` across on a gentle wave `dy` high (the bats).
  | { kind: 'glide'; ms: number; delay: number; rest: number; dx: number; dy: number }
  // Thrown `dx` across on an arc `y` high and back again, spinning `spin` degrees each way (the
  // bomb).
  | { kind: 'toss'; ms: number; delay: number; rest: number; dx: number; y: number; spin: number };

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
  // Behind everything: the moon, trees, lamps, lights, flags, bats.
  back: ScenePiece[];
  // The two behind the table.
  rear: SceneBuddy[];
  // The table, what is on it and what the two behind hold or say.
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
    cloth: { top: '#FFFFFF', edge: '#FF8796', leg: '#CFC2F5', shine: '#FFFFFF' },
    check: '#FF6B7A',
    checkOp: 0.3,
    cup: '#FFFFFF',
    cupSide: '#E6E0FA',
    saucer: '#EFEAFF',
    paper: '#FFFFFF',
    line: '#CFC6EE',
    bubble: '#FFFFFF',
    bubbleDot: '#7B5CFF',
    bat: '#3A2F6E',
    star: '#FFB547',
    canopy: '#6FCF9E',
    canopyDeep: '#3FAE7E',
    canopyShine: '#A6E8C4',
    trunk: '#A86F3B',
    post: '#6B5BA8',
  },
  dark: {
    cord: '#B9A9F0',
    steam: '#FFFFFF',
    steamOp: 0.34,
    plain: { top: '#463B86', edge: '#30286A', leg: '#272058', shine: '#5A4E9E' },
    wood: { top: '#A97646', edge: '#7E522C', leg: '#664222', shine: '#BD8B58' },
    cloth: { top: '#4A3F8C', edge: '#C2475A', leg: '#272058', shine: '#5A4E9E' },
    check: '#FF7A8A',
    checkOp: 0.26,
    cup: '#F4F1FF',
    cupSide: '#CDC4F0',
    saucer: '#DDD6F7',
    paper: '#F4F1FF',
    line: '#A99DD6',
    bubble: '#F4F1FF',
    bubbleDot: '#6A47F5',
    bat: '#0E0A22',
    star: '#FFE9A8',
    canopy: '#2F8A68',
    canopyDeep: '#1F6450',
    canopyShine: '#47A983',
    trunk: '#6A4426',
    post: '#8C7DD6',
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
  skySoft: '#CFEBFF',
  red: '#E5483B',
  redDeep: '#B9322A',
  warm: '#FFD66B',
  moon: '#FFF3C9',
  moonSide: '#F4DE9A',
  coffee: '#6B3E26',
  crema: '#C9895A',
  tea: '#B5361A',
  teaTop: '#D9572E',
  brown: '#8E5529',
  brownDeep: '#6E3F1C',
  cream: '#F7E3BC',
  garlic: '#FFF8EC',
  garlicSide: '#EBDDC6',
  white: '#FFFFFF',
  dark: '#2E2748',
  steel: '#3A3350',
  steelSide: '#262036',
} as const;

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

// --- The table -----------------------------------------------------------------------------------

type TableKind = 'plain' | 'wood' | 'cloth';
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

// What a speech bubble says, drawn in its 32 × 19 body (centre 16, 10.5).
type Say = (s: SceneScheme) => string;

const ask: Say = (s) =>
  `<path d="M12.6 7.6Q12.6 4.2 16 4.2Q19.4 4.2 19.4 7.2Q19.4 9.3 17 10.5Q16 11.1 16 12.6" fill="none" stroke="${PAL[s].bubbleDot}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="16" cy="16" r="1.5" fill="${PAL[s].bubbleDot}"/>`;

const bang: Say = () =>
  `<path d="M16 4.6V11.6" stroke="${C.pink}" stroke-width="2.8" stroke-linecap="round"/>` +
  `<circle cx="16" cy="15.8" r="1.6" fill="${C.pink}"/>`;

// "Vampir!": a mouth with two fangs.
const fangs: Say = () =>
  `<path d="M8.5 6H23.5Q23.5 15.6 16 15.6Q8.5 15.6 8.5 6Z" fill="${C.redDeep}"/>` +
  `<path d="M10.8 6L12.5 10.8L14.2 6ZM17.8 6L19.5 10.8L21.2 6Z" fill="${C.white}"/>`;

// Kinshi: the word that must not be said, struck out.
const forbidden: Say = (s) =>
  `<rect x="4.5" y="8.5" width="10" height="4" rx="2" fill="${PAL[s].line}"/>` +
  `<circle cx="22" cy="10.5" r="5.2" fill="none" stroke="${C.red}" stroke-width="2"/>` +
  `<path d="M18.3 14.2L25.7 6.8" stroke="${C.red}" stroke-width="2"/>`;

// Sprengja: a syllable said fast before the bomb goes on ("KA"), drawn in strokes.
const syllable: Say = (s) =>
  `<path d="M8 4.8V16.2M8 11L13.6 4.8M9.9 9.2L13.9 16.2M16.4 16.2L20.4 4.8L24.4 16.2M17.9 12.4H22.9" fill="none" stroke="${PAL[s].bubbleDot}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;

// A speech bubble over a buddy, its tail down to the `tail` side.
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

const talk = (
  id: string,
  x: number,
  y: number,
  tail: 'left' | 'right',
  say: Say,
  delay: number,
  rest = 2400,
): ScenePiece => ({
  id,
  x,
  y,
  w: 32,
  h: 26,
  xml: (s) => bubbleXml(s, tail, say(s)),
  motion: { kind: 'pop', ms: 1600, delay, rest },
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

// Game cards lying face down on the table, seen from the side: three, fanned.
function cardsDownXml(back: string, backSide: string): string {
  const card = (x: number, turn: number) =>
    `<g transform="translate(${x} 4) rotate(${turn} 11 8)">` +
    `<path d="M4 1H20Q22 1 21.4 3L19 14Q18.6 15.6 16.6 15.6H2.6Q0.6 15.6 1 13.8L3.4 2.6Q3.8 1 4 1Z" fill="${backSide}"/>` +
    `<path d="M4.6 0H20.4Q22.4 0 21.9 2L19.6 12.4Q19.2 14 17.2 14H2.4Q0.4 14 0.9 12L3 1.6Q3.4 0 4.6 0Z" fill="${back}"/>` +
    `<rect x="8.6" y="3.6" width="3.2" height="8" rx="1.6" fill="${C.white}" fill-opacity="0.85" transform="skewX(-12)"/>` +
    `<rect x="12.8" y="5.4" width="2.4" height="5.6" rx="1.2" fill="${C.white}" fill-opacity="0.6" transform="skewX(-12)"/>` +
    `</g>`;
  return svg(66, 24, card(2, -8) + card(22, 2) + card(42, 10));
}

// A question mark on its own, rising over the table (Krot: who is it?).
const questionXml = (color: string) => () =>
  svg(
    16,
    22,
    `<path d="M4.4 7Q4.4 2.4 8.5 2.4Q12.6 2.4 12.6 6.4Q12.6 9.2 9.6 10.7Q8.5 11.3 8.5 13.8" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="8.5" cy="18.6" r="1.9" fill="${color}"/>`,
  );

const sweatXml = () =>
  svg(
    10,
    14,
    `<path d="M5 1Q9 7 9 9.6A4 4 0 0 1 1 9.6Q1 7 5 1Z" fill="${C.sky}"/>` +
      `<ellipse cx="3.6" cy="9.4" rx="1" ry="1.6" fill="${C.white}" fill-opacity="0.7"/>`,
  );

const sweat = (id: string, x: number, y: number, delay: number): ScenePiece => ({
  id,
  x,
  y,
  w: 10,
  h: 14,
  xml: sweatXml,
  motion: { kind: 'pop', ms: 1200, delay, rest: 2200 },
});

const noteXml = (color: string) => () =>
  svg(
    16,
    22,
    `<path d="M6 3L14 1V15" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M6 3V18" stroke="${color}" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="3.6" cy="18.5" rx="3.4" ry="2.6" fill="${color}"/>` +
      `<ellipse cx="11.6" cy="15.5" rx="3.4" ry="2.6" fill="${color}"/>`,
  );

// --- Kampüs: Vampir Köylü in the campus garden, at night -----------------------------------------

const MOON = 56;

const moonXml = () =>
  svg(
    MOON,
    MOON,
    `<circle cx="28" cy="28" r="19" fill="${C.moon}"/>` +
      `<path d="M28 9A19 19 0 0 1 28 47A13 19 0 0 0 28 9Z" fill="${C.moonSide}"/>` +
      `<circle cx="21.5" cy="21" r="3.6" fill="${C.moonSide}"/>` +
      `<circle cx="30" cy="35" r="2.8" fill="${C.moonSide}"/>` +
      `<circle cx="20" cy="33.5" r="1.8" fill="${C.moonSide}"/>`,
  );

const moonGlowXml = (s: SceneScheme) =>
  svg(
    80,
    80,
    `<circle cx="40" cy="40" r="38" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.16 : 0.2}"/>` +
      `<circle cx="40" cy="40" r="29" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.2 : 0.24}"/>`,
  );

const starXml = (s: SceneScheme) =>
  svg(14, 14, `<path d="M7 0Q8 6 14 7Q8 8 7 14Q6 8 0 7Q6 6 7 0Z" fill="${PAL[s].star}"/>`);

const star = (id: string, x: number, y: number, delay: number): ScenePiece => ({
  id,
  x,
  y,
  w: 14,
  h: 14,
  xml: starXml,
  motion: { kind: 'twinkle', ms: 2200, delay, low: 0.2 },
});

const batXml = (s: SceneScheme) => {
  const b = PAL[s].bat;
  return svg(
    36,
    18,
    `<path d="M15 9Q10 2 1 4Q4.5 7 3.5 10.5Q6.5 8.5 8.5 11.5Q10.5 9 12.5 12.5Q14 10.5 15 11Z" fill="${b}"/>` +
      `<path d="M21 9Q26 2 35 4Q31.5 7 32.5 10.5Q29.5 8.5 27.5 11.5Q25.5 9 23.5 12.5Q22 10.5 21 11Z" fill="${b}"/>` +
      `<path d="M15.4 6.6L15.6 3.2L17.4 5.6ZM20.6 6.6L20.4 3.2L18.6 5.6Z" fill="${b}"/>` +
      `<ellipse cx="18" cy="10" rx="3.8" ry="4.8" fill="${b}"/>` +
      `<circle cx="16.6" cy="9" r="0.95" fill="${C.warm}"/>` +
      `<circle cx="19.4" cy="9" r="0.95" fill="${C.warm}"/>`,
  );
};

const treeXml = (s: SceneScheme) => {
  const p = PAL[s];
  return svg(
    100,
    170,
    `<path d="M44 92H56L59 170H41Z" fill="${p.trunk}"/>` +
      `<path d="M50 120L66 100" stroke="${p.trunk}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="50" cy="60" r="42" fill="${p.canopyDeep}"/>` +
      `<circle cx="34" cy="70" r="27" fill="${p.canopy}"/>` +
      `<circle cx="68" cy="66" r="25" fill="${p.canopy}"/>` +
      `<circle cx="48" cy="40" r="28" fill="${p.canopy}"/>` +
      `<circle cx="38" cy="30" r="10" fill="${p.canopyShine}"/>` +
      `<circle cx="24" cy="58" r="6" fill="${p.canopyShine}"/>`,
  );
};

const lampPostXml = (s: SceneScheme) => {
  const p = PAL[s];
  return svg(
    40,
    200,
    `<rect x="18" y="34" width="4" height="160" fill="${p.post}"/>` +
      `<rect x="13" y="188" width="14" height="12" rx="3" fill="${p.post}"/>` +
      `<rect x="15.5" y="32" width="9" height="5" rx="1.5" fill="${p.post}"/>` +
      `<path d="M11 14H29L26.5 33H13.5Z" fill="${p.post}"/>` +
      `<path d="M13.6 16H26.4L24.6 31H15.4Z" fill="${C.warm}"/>` +
      `<path d="M8 15L20 4L32 15Z" fill="${p.post}"/>` +
      `<circle cx="20" cy="3.5" r="2.5" fill="${p.post}"/>`,
  );
};

const glowXml = (r: number, s: SceneScheme) =>
  svg(
    r * 2,
    r * 2,
    `<circle cx="${r}" cy="${r}" r="${r}" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.34 : 0.3}"/>` +
      `<circle cx="${r}" cy="${r}" r="${r * 0.6}" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.3 : 0.26}"/>`,
  );

// Held by its handle, so it swings about its top.
const lanternXml = (s: SceneScheme) =>
  svg(
    26,
    40,
    `<circle cx="13" cy="22" r="12" fill="${C.warm}" fill-opacity="${s === 'dark' ? 0.36 : 0.32}"/>` +
      `<path d="M8 10Q13 0 18 10" stroke="${C.steel}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `<rect x="6" y="9" width="14" height="4" rx="1.6" fill="${C.steel}"/>` +
      `<rect x="7" y="13" width="12" height="17" rx="3" fill="${C.warm}"/>` +
      `<path d="M13 16Q16 20.5 13 26Q10 20.5 13 16Z" fill="${C.orange}"/>` +
      `<path d="M10.2 13V30M15.8 13V30" stroke="${C.steel}" stroke-opacity="0.5" stroke-width="1"/>` +
      `<rect x="6" y="29" width="14" height="4" rx="1.6" fill="${C.steel}"/>`,
  );

const garlicXml = () =>
  svg(
    26,
    30,
    `<path d="M13 6Q13.4 2 16 1" stroke="${C.mintDeep}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `<path d="M13 5Q3.5 10 3.5 18.5Q3.5 27 13 27Q22.5 27 22.5 18.5Q22.5 10 13 5Z" fill="${C.garlic}"/>` +
      `<path d="M13 5Q22.5 10 22.5 18.5Q22.5 27 13 27Q18.5 24 18.5 17Q18.5 10 13 5Z" fill="${C.garlicSide}"/>` +
      `<path d="M13 6.5Q8.6 13 9.6 26M13 6.5Q16.6 13 16 26" stroke="${C.garlicSide}" stroke-width="1.2" fill="none"/>` +
      `<path d="M10 27.2L9 29.4M13 27.4V29.8M16 27.2L17 29.4" stroke="${C.garlicSide}" stroke-width="1.1" stroke-linecap="round"/>`,
  );

// The card turned over at the end of the night: "Vampir".
const vampireCardXml = (s: SceneScheme) =>
  svg(
    26,
    34,
    `<rect x="1" y="1" width="24" height="32" rx="4" fill="${PAL[s].paper}"/>` +
      `<rect x="2.6" y="2.6" width="20.8" height="28.8" rx="3" fill="none" stroke="${C.red}" stroke-width="1.4"/>` +
      `<path d="M5 9Q13 4 21 9L19 23Q13 27 7 23Z" fill="${C.redDeep}"/>` +
      `<path d="M6.4 11H19.6Q19.6 20 13 20Q6.4 20 6.4 11Z" fill="${C.dark}"/>` +
      `<path d="M8.6 11L10.2 15.2L11.8 11ZM14.2 11L15.8 15.2L17.4 11Z" fill="${C.white}"/>` +
      `<rect x="8" y="26" width="10" height="2.4" rx="1.2" fill="${C.red}"/>`,
  );

// Vampir Köylü's night sky (src/features/games/vampir): the Kampüs night's stars and bats over the
// game's ground, in a frame as wide as the venue's and SKY_HEIGHT high, from its top.
export const SKY_HEIGHT = 300;
export const NIGHT_SKY: ScenePiece[] = [
  star('sky-star-1', 34, 96, 0),
  star('sky-star-2', 352, 120, 700),
  star('sky-star-3', 70, 230, 1500),
  star('sky-star-4', 318, 250, 2300),
  {
    id: 'sky-bat-1',
    x: -40,
    y: 150,
    w: 36,
    h: 18,
    xml: batXml,
    motion: { kind: 'glide', ms: 9000, delay: 1200, rest: 5200, dx: 470, dy: 10 },
  },
  {
    id: 'sky-bat-2',
    x: -40,
    y: 200,
    w: 36,
    h: 18,
    xml: batXml,
    motion: { kind: 'glide', ms: 10400, delay: 6400, rest: 4600, dx: 470, dy: 7 },
  },
];

const KAMPUS: VenueScene = {
  back: [
    { id: 'tree', x: -24, y: 66, w: 100, h: 170, xml: treeXml },
    {
      id: 'post-glow',
      x: 328,
      y: 60,
      w: 60,
      h: 60,
      xml: (s) => glowXml(30, s),
      motion: { kind: 'twinkle', ms: 2600, delay: 300, low: 0.55 },
    },
    { id: 'post', x: 338, y: 70, w: 40, h: 200, xml: lampPostXml },
    {
      id: 'moon-glow',
      x: 210,
      y: 46,
      w: 80,
      h: 80,
      xml: moonGlowXml,
      motion: { kind: 'twinkle', ms: 3600, delay: 0, low: 0.45 },
    },
    { id: 'moon', x: 222, y: 58, w: MOON, h: MOON, xml: moonXml },
    star('star-1', 98, 66, 0),
    star('star-2', 176, 90, 900),
    star('star-3', 306, 128, 1700),
    {
      id: 'bat-1',
      x: -40,
      y: 92,
      w: 36,
      h: 18,
      xml: batXml,
      motion: { kind: 'glide', ms: 7200, delay: 400, rest: 1800, dx: 470, dy: 10 },
    },
    {
      id: 'bat-2',
      x: -40,
      y: 132,
      w: 36,
      h: 18,
      xml: batXml,
      motion: { kind: 'glide', ms: 8400, delay: 3800, rest: 1200, dx: 470, dy: 7 },
    },
  ],
  rear: [
    { look: 'c:limon e:mutlu h:hasir', x: 122, bottom: 72, height: 92 },
    { look: 'c:mor e:kirp m:vampir n:pelerin', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('wood'),
    { id: 'cards', x: 124, y: 214, w: 66, h: 24, xml: () => cardsDownXml(C.purple, C.dark) },
    {
      id: 'reveal',
      x: 214,
      y: 188,
      w: 26,
      h: 34,
      xml: vampireCardXml,
      motion: { kind: 'pop', ms: 1800, delay: 2600, rest: 2800 },
    },
    talk('ask', 160, 116, 'left', ask, 0),
  ],
  side: [
    { look: 'c:gok e:sert h:kasket f:monokl', x: 18, bottom: -6, height: 132 },
    { look: 'c:nane e:saskin m:ohh h:bere', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    {
      id: 'lantern',
      x: 96,
      y: 208,
      w: 26,
      h: 40,
      xml: lanternXml,
      motion: { kind: 'swing', ms: 3000, delay: 0, turn: 7 },
    },
    talk('accuse', 80, 150, 'left', fangs, 1500, 2600),
    {
      id: 'garlic',
      x: 282,
      y: 234,
      w: 26,
      h: 30,
      xml: garlicXml,
      motion: { kind: 'bob', ms: 1400, delay: 900, rest: 2200, y: 8, turn: -12 },
    },
  ],
};

// --- Kafe: Kinshi (don't say the forbidden words) ------------------------------------------------

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

// The card the describer holds up: the word to get across on top, the forbidden ones under it.
const kinshiCardXml = (s: SceneScheme) =>
  svg(
    32,
    44,
    `<rect x="1" y="1" width="30" height="42" rx="4.5" fill="${PAL[s].paper}"/>` +
      `<path d="M1 5.5Q1 1 5.5 1H26.5Q31 1 31 5.5V12H1Z" fill="${C.purple}"/>` +
      `<rect x="7" y="4.8" width="18" height="3.4" rx="1.7" fill="${C.white}"/>` +
      [16, 21.5, 27, 32.5]
        .map(
          (y, i) =>
            `<rect x="5.5" y="${y}" width="${[15, 12, 16, 11][i]}" height="2.6" rx="1.3" fill="${C.red}" fill-opacity="0.55"/>`,
        )
        .join('') +
      `<circle cx="24.4" cy="36.4" r="4.4" fill="none" stroke="${C.red}" stroke-width="1.6"/>` +
      `<path d="M21.3 39.5L27.5 33.3" stroke="${C.red}" stroke-width="1.6"/>`,
  );

const hourglassXml = () =>
  svg(
    18,
    28,
    `<path d="M3.5 3.7H14.5Q14.5 10 10 14Q14.5 18 14.5 24.3H3.5Q3.5 18 8 14Q3.5 10 3.5 3.7Z" fill="${C.white}" fill-opacity="0.65"/>` +
      `<path d="M5 7H13Q12.5 10.5 9 13Q5.5 10.5 5 7Z" fill="${C.gold}"/>` +
      `<path d="M9 13V20" stroke="${C.gold}" stroke-width="0.9"/>` +
      `<path d="M4.2 24.3Q5 19.6 9 18.6Q13 19.6 13.8 24.3Z" fill="${C.gold}"/>` +
      `<path d="M2.2 3.7V24.3M15.8 3.7V24.3" stroke="${C.brownDeep}" stroke-width="1.3"/>` +
      `<rect x="1" y="0.5" width="16" height="3.4" rx="1.5" fill="${C.brown}"/>` +
      `<rect x="1" y="24.1" width="16" height="3.4" rx="1.5" fill="${C.brown}"/>`,
  );

const buzzerXml = () =>
  svg(
    30,
    19,
    `<ellipse cx="15" cy="15.6" rx="14" ry="3.2" fill="${C.steelSide}"/>` +
      `<path d="M2 9.6H28V15.4Q28 18.2 15 18.2Q2 18.2 2 15.4Z" fill="${C.steel}"/>` +
      `<ellipse cx="15" cy="9.6" rx="13" ry="3" fill="${C.steelSide}"/>` +
      `<path d="M6 9.6Q6 2 15 2Q24 2 24 9.6Q24 11.6 15 11.6Q6 11.6 6 9.6Z" fill="${C.red}"/>` +
      `<path d="M18 2.8Q24 4 24 9.6Q24 11.2 19 11.5Q20.4 7 18 2.8Z" fill="${C.redDeep}"/>` +
      `<ellipse cx="11.4" cy="5.4" rx="3" ry="1.4" fill="${C.white}" fill-opacity="0.6"/>`,
  );

// The buzzer going off.
const burstXml = () =>
  svg(
    34,
    22,
    `<path d="M17 12V2M9.4 14L4.4 7.4M24.6 14L29.6 7.4M5.4 19.6H0.8M28.6 19.6H33.2" stroke="${C.orange}" stroke-width="2.4" stroke-linecap="round"/>`,
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
    { look: 'c:pembe e:mutlu h:barista', x: 122, bottom: 72, height: 92 },
    { look: 'c:limon e:saskin h:berefr', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('plain'),
    { id: 'cup', x: 116, y: 214, w: 30, h: 30, xml: (s) => cupXml(s, 'left', '') },
    steam('steam-1', 120, 188, 0),
    steam('steam-2', 129, 190, 1300),
    {
      id: 'hourglass',
      x: 212,
      y: 204,
      w: 18,
      h: 28,
      xml: hourglassXml,
      motion: { kind: 'hop', ms: 700, delay: 1600, rest: 3800, y: 12, spin: 180 },
    },
    { id: 'buzzer', x: 238, y: 216, w: 30, h: 19, xml: buzzerXml },
    {
      id: 'burst',
      x: 236,
      y: 194,
      w: 34,
      h: 22,
      xml: burstXml,
      motion: { kind: 'pop', ms: 900, delay: 3200, rest: 3600 },
    },
    {
      id: 'card',
      x: 174,
      y: 174,
      w: 32,
      h: 44,
      xml: kinshiCardXml,
      motion: { kind: 'bob', ms: 1800, delay: 400, rest: 1400, y: 5, turn: -5 },
    },
    talk('ask', 252, 120, 'left', ask, 700),
  ],
  side: [
    { look: 'c:mor e:klasik f:maske', x: 18, bottom: -6, height: 132 },
    { look: 'c:mercan e:mutlu m:kahkaha h:fotr', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    talk('forbidden', 80, 150, 'left', forbidden, 2400, 2600),
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

// --- Çay bahçesi: Krot (who among us?) -----------------------------------------------------------

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
function bulbGlowXml(g: number): (s: SceneScheme) => string {
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

const magnifierXml = () =>
  svg(
    34,
    34,
    `<path d="M20.5 20.5L31 31" stroke="${C.brown}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="13" cy="13" r="10" fill="${C.skySoft}" fill-opacity="0.75"/>` +
      `<circle cx="13" cy="13" r="10" fill="none" stroke="${C.gold}" stroke-width="3"/>` +
      `<path d="M7.6 11Q8.6 7.4 12.4 6.8" stroke="${C.white}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  );

const CAY: VenueScene = {
  back: [
    { id: 'lights', x: -10, y: 62, w: LIGHTS_W, h: LIGHTS_H, xml: lightsXml },
    ...[0, 1, 2].map((g): ScenePiece => ({
      id: `glow-${g}`,
      x: -10,
      y: 62,
      w: LIGHTS_W,
      h: LIGHTS_H,
      xml: bulbGlowXml(g),
      motion: { kind: 'twinkle', ms: 1800, delay: g * 600, low: 0.15 },
    })),
    {
      id: 'q-1',
      x: 36,
      y: 132,
      w: 16,
      h: 22,
      xml: questionXml(C.pink),
      motion: { kind: 'steam', ms: 3400, delay: 0, rise: 26 },
    },
    {
      id: 'q-2',
      x: 346,
      y: 124,
      w: 16,
      h: 22,
      xml: questionXml(C.violet),
      motion: { kind: 'steam', ms: 3400, delay: 1700, rise: 26 },
    },
  ],
  rear: [
    { look: 'c:nane e:sert h:bere', x: 122, bottom: 72, height: 92 },
    { look: 'c:lavanta e:saskin h:fiyonk', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('wood'),
    { id: 'cards', x: 162, y: 214, w: 66, h: 24, xml: () => cardsDownXml(C.pink, C.redDeep) },
    { id: 'tea-a', x: 124, y: 208, w: 16, h: 30, xml: teaGlassXml },
    steam('steam-a', 126, 184, 0),
    { id: 'tea-b', x: 256, y: 212, w: 16, h: 30, xml: teaGlassXml },
    steam('steam-b', 258, 188, 1300),
    {
      id: 'teapot',
      x: 236,
      y: 178,
      w: 34,
      h: 38,
      xml: teapotXml,
      motion: { kind: 'bob', ms: 1800, delay: 300, rest: 3200, y: 3, turn: -14 },
    },
    talk('ask', 100, 124, 'right', ask, 0),
    talk('bang', 252, 116, 'left', bang, 1600),
  ],
  side: [
    { look: 'c:mercan e:sert h:kasket m:biyik', x: 18, bottom: -6, height: 132 },
    { look: 'c:turkuaz e:kirp f:gunes m:kivrik h:fotr', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    {
      id: 'magnifier',
      x: 92,
      y: 198,
      w: 34,
      h: 34,
      xml: magnifierXml,
      motion: { kind: 'bob', ms: 1600, delay: 600, rest: 1600, y: 6, turn: -12 },
    },
    // The one it is whistles, as if nothing.
    {
      id: 'whistle',
      x: 276,
      y: 214,
      w: 16,
      h: 22,
      xml: noteXml(C.purple),
      motion: { kind: 'steam', ms: 3000, delay: 800, rise: 24 },
    },
    sweat('sweat', 350, 200, 2200),
  ],
};

// --- Yemek: Sprengja (throw the bomb on, fast) ---------------------------------------------------

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

// The bomb, its fuse lit.
const bombXml = () =>
  svg(
    32,
    36,
    `<g transform="rotate(38 20 12.5)"><rect x="16.5" y="9.5" width="7" height="6.4" rx="1.6" fill="${C.steel}"/></g>` +
      `<circle cx="13" cy="23" r="11.5" fill="${C.dark}"/>` +
      `<circle cx="13" cy="23" r="11" fill="none" stroke="${C.white}" stroke-opacity="0.18" stroke-width="1.2"/>` +
      `<ellipse cx="8.6" cy="18.6" rx="3.4" ry="2.2" fill="${C.white}" fill-opacity="0.38" transform="rotate(-34 8.6 18.6)"/>` +
      `<path d="M22 9Q23.6 4.4 27.6 5" stroke="${C.cream}" stroke-width="1.7" fill="none" stroke-linecap="round"/>` +
      `<path d="M27.6 0.6L28.7 3.9L32 5L28.7 6.1L27.6 9.4L26.5 6.1L23.2 5L26.5 3.9Z" fill="${C.orange}"/>` +
      `<circle cx="27.6" cy="5" r="1.4" fill="${C.warm}"/>`,
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
    { look: 'c:nane e:saskin m:ohh', x: 122, bottom: 72, height: 92 },
    { look: 'c:lavanta e:mutlu h:fiyonk m:gulumse', x: 198, bottom: 72, height: 92 },
  ],
  table: [
    table('cloth'),
    { id: 'bowl', x: 118, y: 218, w: 28, h: 20, xml: bowlXml },
    steam('steam-bowl', 126, 192, 0),
    { id: 'pizza', x: 168, y: 224, w: 54, h: 24, xml: pizzaXml },
    steam('steam-p1', 182, 198, 600),
    steam('steam-p2', 198, 200, 1700),
    { id: 'ayran', x: 250, y: 212, w: 14, h: 28, xml: ayranXml },
    sweat('sweat-rear', 116, 146, 1400),
  ],
  side: [
    { look: 'c:krem e:saskin h:ascisapka', x: 18, bottom: -6, height: 132 },
    { look: 'c:pembe e:klasik h:korsan f:gozbandi', x: 272, bottom: -6, height: 132 },
  ],
  held: [
    talk('syllable', 80, 146, 'left', syllable, 300, 2200),
    sweat('sweat-chef', 104, 186, 900),
    {
      id: 'bomb',
      x: 88,
      y: 212,
      w: 32,
      h: 36,
      xml: bombXml,
      motion: { kind: 'toss', ms: 1000, delay: 600, rest: 900, dx: 192, y: 86, spin: 300 },
    },
  ],
};

export const VENUE_SCENES: Record<SceneKind, VenueScene> = {
  kafe: KAFE,
  cay: CAY,
  yemek: YEMEK,
  kampus: KAMPUS,
};
