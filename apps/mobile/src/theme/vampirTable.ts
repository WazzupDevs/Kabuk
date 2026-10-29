import type { VampirRole } from '../../../../supabase/functions/_shared/pure/vampir.ts';
import type { TextStyle } from 'react-native';

// Vampir Köylü's round table (the owner's choice, 29 Ekim: docs/design/vampir/yuvarlak-masa.html,
// "birebir, animations too"): the table seen from above with everyone round it, picks and votes as
// lines across it, the time in an hourglass in a medallion at its middle. Every value here is the
// file's; the design is drawn on a 360 dp wide phone and the table scales with the screen.

const F = {
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

// A text style: size and line (the face's own height, 1.26 of the size, where the file has none).
const t = (w: keyof typeof F, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export type TableTime = 'night' | 'dawn' | 'day' | 'dusk';
export type SandTone = 'night' | 'day' | 'vote';

export const TABLE = {
  // The table's own frame: as wide as the file's phone, from the top seat's face to the bottom
  // seat's role chip; its middle where the file's table is (180, 420 on the phone).
  frame: { width: 360, height: 484, cx: 180, cy: 222 },
  // The seats' ellipse, the wood and the felt (the file's tableSvg).
  seat: { rx: 134, ry: 196, width: 76 },
  rim: { rx: 118, ry: 182 },
  felt: { rx: 101, ry: 165 },
  // Faces: up to eight people 46, more 40 (the file's twelve).
  face: { many: 8, big: 46, small: 40, ring: 2, pickRing: 3 },
  // A line keeps this far from the middle, so it never runs under the medallion.
  clear: 90,
  medal: 148,
  card: { width: 150, height: 200, edge: 4, radius: 14, back: -4, front: 3 },
  endCard: { width: 120, height: 160, turn: -3 },
  // The medallion's face for the morning's dead and the voted out.
  medalFace: 72,
  // The page round the table (the file's .m: status 32, bar 38, prompt 90, foot 20 from the end).
  bar: 42,
  barTop: 6,
  promptTop: 10,
  promptSide: 22,
  side: 16,
  footGap: 10,
  footBottom: 20,
  button: 52,
} as const;

export const TABLE_INK = {
  white: '#FFFFFF',
  ink: '#14112B',
  round: 'rgba(255, 255, 255, 0.14)',
  roundOn: 'rgba(255, 255, 255, 0.3)',
  namePill: 'rgba(12, 8, 22, 0.66)',
  pick: '#FFD58A',
  ally: '#E0245E',
  count: '#FFB547',
  fang: '#E0245E',
  tick: '#2FBF7F',
  cross: '#4A4458',
  mainFill: '#FFF4E2',
  mainInk: '#2A1A4A',
  ghostEdge: 'rgba(255, 255, 255, 0.5)',
  cardEdge: '#FFF4E2',
  // The lines: a vampire's mate's pick, the person's own pick at night, the day's votes, the
  // person's vote before "Oyumu ver".
  line: { mate: '#FF5C8A', mine: '#FFD58A', vote: '#FF9F5A', myVote: '#FFE3A6' },
  medalLabel: 'rgba(255, 255, 255, 0.72)',
  danger: '#FFB4B4',
  // Each role's colour on the table (the file's ROLE).
  roles: {
    vampir: '#E0245E',
    doktor: '#1FA463',
    gozcu: '#1990BE',
    koylu: '#6E4FF0',
    soytari: '#E07F12',
  } satisfies Record<VampirRole, string>,
} as const;

export const TABLE_SHADOW = {
  button: '0px 8px 22px rgba(0, 0, 0, 0.3)',
  card: '0px 24px 48px rgba(0, 0, 0, 0.55)',
  pick: '0px 0px 22px 6px rgba(255, 213, 138, 0.65)',
  pickOn: '0px 0px 30px 10px rgba(255, 213, 138, 0.9)',
  low: '0px 0px 34px 8px rgba(255, 77, 109, 0.45)',
} as const;

// The light running at the end of the medallion's edge, in the sand's colour.
export function sparkShadow(tone: SandTone): string {
  return `0px 0px 10px 3px ${GLASS.sand[tone].top}`;
}

export const TABLE_TYPE = {
  bar: t(800, 16, 20),
  title: {
    ...t(800, 21, 26, -0.01),
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  } as TextStyle,
  note: { ...t(600, 13, 18), opacity: 0.82 } as TextStyle,
  roleName: t(800, 22, 28),
  name: t(800, 10, 13),
  role: t(800, 10, 13),
  badge: t(800, 11, 14),
  foot: { ...t(700, 13, 17), opacity: 0.88 } as TextStyle,
  medal: t(700, 11, 14),
  btn: t(800, 16, 20),
} as const;

// How the table's parts move (the file's CSS, value for value).
export const TABLE_MOTION = {
  // The chosen seat's glow breathes (glow 2s ease-in-out infinite).
  pickMs: 2000,
  // The person's own line before it counts flows towards its end (flow 1.2s linear: 28 along).
  flowMs: 1200,
  flowRun: 28,
  flowDash: 2,
  flowGap: 8,
  // The sand's stream (.32s linear: 6 along), the grains (.9s ease-in, the second .45s later).
  streamMs: 320,
  grainMs: 900,
  grainDelay: 450,
  grainShow: 0.15,
  grainFall: 30,
  // The last ten seconds: the glass shakes (.5s, 4°), the edge turns red (.4s), the medallion
  // throbs (1s).
  lowSeconds: 10,
  shakeMs: 500,
  shakeDeg: 4,
  rimRedMs: 400,
  pulseMs: 1000,
  // Time's up: the glass turns over (.8s, cubic-bezier(.6,-.35,.3,1.35)).
  flipMs: 800,
  flip: [0.6, -0.35, 0.3, 1.35] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  // The role card turns over while held (as before).
  cardMs: 550,
  card: [0.34, 1.3, 0.64, 1] as const,
  // One time of day crosses into the next.
  groundMs: 450,
} as const;

// The hourglass (viewBox 64 × 100): the glass, the two bulbs the sand stays in, the sand's shapes
// and how far it runs, and in the medallion its width and place.
export const GLASS = {
  width: 70,
  mini: 15,
  outline:
    'M16 10H48C48 31 35 40 33.4 50C35 60 48 69 48 90H16C16 69 29 60 30.6 50C29 40 16 31 16 10Z',
  topBulb: 'M16.8 10.5H47.2C47.2 31 34.4 40 32.8 50H31.2C29.6 40 16.8 31 16.8 10.5Z',
  bottomBulb: 'M31.2 50H32.8C34.4 60 47.2 69 47.2 89.5H16.8C16.8 69 29.6 60 31.2 50Z',
  topBox: { x: 16.8, y: 10.5, w: 30.4, h: 39.5 },
  bottomBox: { x: 16.8, y: 50, w: 30.4, h: 39.5 },
  topSand: 'M0 16Q32 22 64 16V52H0Z',
  bottomSand: 'M0 92V72Q32 56 64 72V92Z',
  topRun: 34,
  bottomRun: 36,
  stream: { x: 32, y1: 49, y2: 89, width: 1.7, dash: 3, gap: 3 },
  grains: [
    { x: 31, y: 52, r: 1 },
    { x: 33.2, y: 52, r: 0.9 },
  ],
  rim: { r: 69, width: 3, spark: 8 },
  sand: {
    night: { top: '#FF8AAE', bottom: '#C2184F', glow: 'rgba(255, 70, 120, 0.55)' },
    day: { top: '#FFE39A', bottom: '#E3992A', glow: 'rgba(255, 200, 90, 0.55)' },
    vote: { top: '#FFC58A', bottom: '#E0582A', glow: 'rgba(255, 130, 70, 0.55)' },
  } satisfies Record<SandTone, { top: string; bottom: string; glow: string }>,
  rimTrack: 'rgba(255, 255, 255, 0.12)',
  rimLow: '#FF4D6D',
  lowRing: 'rgba(255, 77, 109, 0.7)',
  spark: '#FFFFFF',
} as const;

// The glass's place in the medallion, and its scale from the viewBox.
export const GLASS_IN_MEDAL = {
  x: (TABLE.medal - GLASS.width) / 2,
  y: (TABLE.medal - GLASS.width * 1.5625) / 2,
  k: GLASS.width / 64,
};

// ---- The pictures, as SVG text (CachedSvg reads each once) ----

const n = (v: number) => Number(v.toFixed(2));

// The ground behind everything (the file's .m.night, .dawn, .day, .dusk without the lamp, which
// the table draws round itself), at the screen's size.
export function groundSvg(time: TableTime, w: number, h: number): string {
  const base = {
    night: radialFill('b', w, h, 0.5, 0, 1.3, 0.8, [
      ['#2A3466', 1, 0],
      ['#121836', 1, 0.55],
      ['#080B1A', 1, 1],
    ]),
    dawn: linearFill('b', 0, 0, 0, h, [
      ['#5B3B7E', 1, 0],
      ['#8A4E78', 1, 0.4],
      ['#4A2440', 1, 1],
    ]),
    day: radialFill('b', w, h, 0.5, 0, 1.3, 0.8, [
      ['#C98A54', 1, 0],
      ['#84492A', 1, 0.55],
      ['#3F2112', 1, 1],
    ]),
    dusk: radialFill('b', w, h, 0.5, 0, 1.3, 0.8, [
      ['#A2506A', 1, 0],
      ['#57264A', 1, 0.55],
      ['#24112A', 1, 1],
    ]),
  }[time];
  let over = '';
  if (time === 'night') {
    // The floor's boards: a faint line every 46.
    for (let x = 0; x < w; x += 46)
      over += `<rect x="${x}" y="0" width="1" height="${h}" fill="#FFFFFF" fill-opacity="0.022"/>`;
  } else if (time === 'dawn' || time === 'day') {
    // The window's light falling across the room (115°).
    const [c, a1, a2, s] =
      time === 'dawn'
        ? ['#FFD6B4', 0.13, 0.1, [0.28, 0.4, 0.5, 0.57]]
        : ['#FFECBE', 0.17, 0.13, [0.26, 0.39, 0.49, 0.57]];
    const a = (115 * Math.PI) / 180;
    const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    const dx = (Math.sin(a) * len) / 2;
    const dy = (-Math.cos(a) * len) / 2;
    const stops = [
      [c, 0, 0],
      [c, 0, s[0]],
      [c, a1, s[0]],
      [c, a1, s[1]],
      [c, 0, s[1]],
      [c, 0, s[2]],
      [c, a2, s[2]],
      [c, a2, s[3]],
      [c, 0, s[3]],
      [c, 0, 1],
    ] as [string, number, number][];
    over = `<defs>${gradient('linearGradient', 'l', `gradientUnits="userSpaceOnUse" x1="${n(w / 2 - dx)}" y1="${n(h / 2 - dy)}" x2="${n(w / 2 + dx)}" y2="${n(h / 2 + dy)}"`, stops)}</defs><rect width="${w}" height="${h}" fill="url(#l)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${base}${over}</svg>`;
}

type Stop = [color: string, opacity: number, offset: number];

function gradient(kind: string, id: string, attrs: string, stops: Stop[]): string {
  return `<${kind} id="${id}" ${attrs}>${stops.map(([c, o, at]) => `<stop offset="${at}" stop-color="${c}" stop-opacity="${o}"/>`).join('')}</${kind}>`;
}

// A CSS radial-gradient(rx% ry% at cx% cy%) over the whole box, as a filled rectangle.
function radialFill(
  id: string,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stops: Stop[],
): string {
  const g = gradient(
    'radialGradient',
    id,
    `gradientUnits="userSpaceOnUse" cx="${n(cx * w)}" cy="${n(cy * h)}" r="${n(rx * w)}" gradientTransform="translate(${n(cx * w)} ${n(cy * h)}) scale(1 ${n((ry * h) / (rx * w))}) translate(${n(-cx * w)} ${n(-cy * h)})"`,
    stops,
  );
  return `<defs>${g}</defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
}

function linearFill(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stops: Stop[],
): string {
  const g = gradient(
    'linearGradient',
    id,
    `gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`,
    stops,
  );
  return `<defs>${g}</defs><rect width="100%" height="100%" fill="url(#${id})"/>`;
}

// The lamp over the table, its shadow, the wood, the felt and the light on it (the file's
// tableSvg and its .m lamp), in the table's frame.
export function tableSvg(time: TableTime): string {
  const { width: W, height: H, cx, cy } = TABLE.frame;
  const { rx, ry } = TABLE.rim;
  const f = TABLE.felt;
  const lamp = {
    night: ['#FFBA68', 0.26],
    dawn: ['#FFC896', 0.28],
    day: ['#FFEEC8', 0.3],
    dusk: ['#FFAA78', 0.26],
  }[time] as [string, number];
  const lit = time === 'dawn' || time === 'day' ? ['#FFF0CD', 0.22] : ['#FFBE6E', 0.2];
  // The lamp: radial-gradient(62% 40%) of the file's phone (360 × 760), its edge at 72%.
  const lrx = 0.62 * 360;
  const lry = 0.4 * 760;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${gradient(
  'radialGradient',
  'lamp',
  `gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy + 5}" r="${lrx}" gradientTransform="translate(${cx} ${cy + 5}) scale(1 ${n(lry / lrx)}) translate(${-cx} ${-(cy + 5)})"`,
  [
    [lamp[0], lamp[1], 0],
    [lamp[0], 0, 0.72],
  ],
)}
${gradient('radialGradient', 'w', 'cx="0.5" cy="0.38" r="0.62"', [
  ['#A56A43', 1, 0],
  ['#6A3B20', 1, 0.7],
  ['#43220F', 1, 1],
])}
${gradient('radialGradient', 'f', 'cx="0.5" cy="0.42" r="0.6"', [
  ['#8A2C4C', 1, 0],
  ['#561730', 1, 0.72],
  ['#3A0D1F', 1, 1],
])}
<pattern id="g" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><path d="M0 3.5h7" stroke="#FFDCB4" stroke-opacity="0.07" stroke-width="1"/></pattern>
<pattern id="v" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.6" fill="#FFFFFF" fill-opacity="0.06"/></pattern>
<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#lamp)"/>
<ellipse cx="${cx}" cy="${cy + 18}" rx="${rx + 4}" ry="${ry + 2}" fill="#000000" fill-opacity="0.55" filter="url(#s)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#w)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx - 1.5}" ry="${ry - 1.5}" fill="none" stroke="#FFE6C8" stroke-opacity="0.18" stroke-width="1.5"/>
<ellipse cx="${cx}" cy="${cy}" rx="${f.rx}" ry="${f.ry}" fill="url(#f)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${f.rx}" ry="${f.ry}" fill="url(#v)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${f.rx - 3}" ry="${f.ry - 3}" fill="none" stroke="#000000" stroke-opacity="0.35" stroke-width="6"/>
<ellipse cx="${cx}" cy="${cy}" rx="${f.rx}" ry="${f.ry}" fill="none" stroke="#FFD58A" stroke-opacity="0.35" stroke-width="1.2"/>
<ellipse cx="${cx}" cy="${cy - 40}" rx="80" ry="110" fill="${lit[0]}" fill-opacity="${lit[1]}" filter="url(#s)"/>
</svg>`;
}

// The medallion's face under the glass: its dark round with the lamp's light a little above the
// middle, its inner shadow, the gold ring and the darker ring round it; and the edge's track.
// Opaque (the file's 95 per cent over the felt, the felt mixed in), so the glass can hide its
// sand outside the bulbs with the very same colour (MEDAL_FILL).
export const MEDAL_FILL = {
  // radial-gradient(circle at 50% 38%) of the 148 round, out to its farthest corner.
  cx: 74,
  cy: 56.24,
  r: 117.9,
  from: '#491329',
  to: '#240915',
};

export function medalSvg(): string {
  const m = TABLE.medal;
  const c = m / 2;
  const pad = 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${m + pad * 2}" height="${m + pad * 2}" viewBox="${-pad} ${-pad} ${m + pad * 2} ${m + pad * 2}">
<defs>
${gradient(
  'radialGradient',
  'd',
  `gradientUnits="userSpaceOnUse" cx="${MEDAL_FILL.cx}" cy="${MEDAL_FILL.cy}" r="${MEDAL_FILL.r}"`,
  [
    [MEDAL_FILL.from, 1, 0],
    [MEDAL_FILL.to, 1, 1],
  ],
)}
${gradient(
  'radialGradient',
  'i',
  `gradientUnits="userSpaceOnUse" cx="${c}" cy="${c + 4}" r="${c}"`,
  [
    ['#000000', 0, 0.78],
    ['#000000', 0.5, 1],
  ],
)}
</defs>
<circle cx="${c}" cy="${c}" r="${c + 4}" fill="none" stroke="#000000" stroke-opacity="0.14" stroke-width="8"/>
<circle cx="${c}" cy="${c}" r="${c + 1}" fill="none" stroke="#FFD58A" stroke-opacity="0.35" stroke-width="2"/>
<circle cx="${c}" cy="${c}" r="${c}" fill="url(#d)"/>
<circle cx="${c}" cy="${c}" r="${c}" fill="url(#i)"/>
<circle cx="${c}" cy="${c}" r="${GLASS.rim.r}" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="${GLASS.rim.width}"/>
</svg>`;
}

// The glass's see-through inside, under the sand.
export function glassBackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 100"><path d="${GLASS.outline}" fill="#FFFFFF" fill-opacity="0.07"/></svg>`;
}

// One heap of sand (`top` the upper bulb's, as full; `bottom` the lower's, as full), its colour
// running down it. `clip`: cut to its bulb (the small glass, which has no medallion behind it).
export function sandSvg(tone: SandTone, part: 'top' | 'bottom', clip: boolean): string {
  const s = GLASS.sand[tone];
  const bulb = part === 'top' ? GLASS.topBulb : GLASS.bottomBulb;
  const d = part === 'top' ? GLASS.topSand : GLASS.bottomSand;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 100"><defs>${gradient(
    'linearGradient',
    's',
    'x1="0" y1="0" x2="0" y2="1"',
    [
      [s.top, 1, 0],
      [s.bottom, 1, 1],
    ],
  )}${clip ? `<clipPath id="c"><path d="${bulb}"/></clipPath>` : ''}</defs><path d="${d}" fill="url(#s)"${clip ? ' clip-path="url(#c)"' : ''}/></svg>`;
}

// The glass over its sand: in the medallion, first the medallion's own colour round the bulbs (the
// sand's square windows show nothing outside its glass) and the glow round the glass (the file's
// drop-shadow, kept off the bulbs' inside); then the glass, its lights and the brass frame. The
// small glass (`mini`) has no medallion behind it and draws its sand already cut to the bulbs.
export function glassFrontSvg(tone: SandTone, mini: boolean): string {
  const glow = GLASS.sand[tone].glow;
  const k = GLASS_IN_MEDAL.k;
  // The medallion's colour in the glass's units (the same round, through the glass's place).
  const mcx = n((MEDAL_FILL.cx - GLASS_IN_MEDAL.x) / k);
  const mcy = n((MEDAL_FILL.cy - GLASS_IN_MEDAL.y) / k);
  const mr = n(MEDAL_FILL.r / k);
  const tb = GLASS.topBox;
  const bb = GLASS.bottomBox;
  const blur = mini ? n(1.5 / (GLASS.mini / 64)) : n(6 / k);
  const frame = `<rect x="6.5" y="9" width="3.4" height="82" rx="1.5" fill="url(#b)"/><rect x="54.1" y="9" width="3.4" height="82" rx="1.5" fill="url(#b)"/>${mini ? '' : '<rect x="5.2" y="47.5" width="6" height="5" rx="1.6" fill="#D9A653"/><rect x="52.8" y="47.5" width="6" height="5" rx="1.6" fill="#D9A653"/>'}<rect x="2" y="2" width="60" height="9" rx="3.5" fill="url(#b)"/><rect x="2" y="89" width="60" height="9" rx="3.5" fill="url(#b)"/>${mini ? '' : '<rect x="6" y="4" width="52" height="1.6" rx="0.8" fill="#FFFFFF" fill-opacity="0.45"/><rect x="6" y="91" width="52" height="1.6" rx="0.8" fill="#FFFFFF" fill-opacity="0.45"/>'}`;
  const silhouette = `<rect x="6.5" y="9" width="3.4" height="82"/><rect x="54.1" y="9" width="3.4" height="82"/><rect x="2" y="2" width="60" height="9"/><rect x="2" y="89" width="60" height="9"/><path d="${GLASS.outline}" fill-opacity="0.6"/>`;
  const view = mini ? 'viewBox="0 0 64 100"' : `viewBox="0 0 ${TABLE.medal} ${TABLE.medal}"`;
  const place = mini
    ? ''
    : ` transform="translate(${n(GLASS_IN_MEDAL.x)} ${n(GLASS_IN_MEDAL.y)}) scale(${n(k)})"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${view}>
<defs>
<linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#7A4A17"/><stop offset="0.35" stop-color="#F6D592"/><stop offset="0.6" stop-color="#C08A3C"/><stop offset="1" stop-color="#6A3F12"/></linearGradient>
${
  mini
    ? ''
    : gradient(
        'radialGradient',
        'm',
        `gradientUnits="userSpaceOnUse" cx="${mcx}" cy="${mcy}" r="${mr}"`,
        [
          [MEDAL_FILL.from, 1, 0],
          [MEDAL_FILL.to, 1, 1],
        ],
      )
}
<filter id="g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${blur}"/></filter>
<mask id="o" maskUnits="userSpaceOnUse" x="-30" y="-30" width="124" height="160"><rect x="-30" y="-30" width="124" height="160" fill="#FFFFFF"/><path d="${GLASS.outline}" fill="#000000"/></mask>
</defs>
<g${place}>
${mini ? '' : `<path fill="url(#m)" fill-rule="evenodd" d="M${tb.x - 1} ${tb.y - 1}H${tb.x + tb.w + 1}V${bb.y + bb.h + 1}H${tb.x - 1}Z${GLASS.topBulb}${GLASS.bottomBulb}"/>`}
<g mask="url(#o)"><g filter="url(#g)" fill="${glow}">${silhouette}</g></g>
<path d="${GLASS.outline}" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.3"/>
${mini ? '' : '<path d="M19.5 14C19.5 28 26 37 29.2 45.5M19.5 86C19.5 72 26 63 29.2 54.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.42" stroke-width="1.8" stroke-linecap="round"/>'}
${frame}
</g>
</svg>`;
}

// Half of the medallion's edge (`right` from twelve to six o'clock, `left` from six to twelve), in
// the sand's colour; it turns in its half to show what is left.
export function rimHalfSvg(color: string, half: 'right' | 'left'): string {
  const m = TABLE.medal;
  const c = m / 2;
  const r = GLASS.rim.r;
  const d =
    half === 'right'
      ? `M${c} ${c - r}A${r} ${r} 0 0 1 ${c} ${c + r}`
      : `M${c} ${c + r}A${r} ${r} 0 0 1 ${c} ${c - r}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m} ${m}"><path d="${d}" fill="none" stroke="${color}" stroke-width="${GLASS.rim.width}" stroke-linecap="round"/></svg>`;
}

// The marks on a seat's badges.
export const FANG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 6c0 0 4 3 9 3s9-3 9-3l-3 9-2-5-4 2-4-2-2 5Z" fill="#FFFFFF"/></svg>';
export const TICK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const X_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/></svg>';
export const SEAT_X_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/></svg>';
// "Rolüm": the card with a question on it, a little turned (the file's ICON.card, its cut #3A2560).
export const PEEK_CARD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(-10 12 12)"><rect x="5.5" y="3" width="13" height="18" rx="3" fill="#FFFFFF"/><path d="M10.2 9.4c0-1.3.9-2.1 2-2.1s1.9.7 1.9 1.7c0 1.4-1.8 1.6-1.8 3.1" fill="none" stroke="#3A2560" stroke-width="1.9" stroke-linecap="round"/><circle cx="12.3" cy="15.4" r="1.1" fill="#3A2560"/></g></svg>';
