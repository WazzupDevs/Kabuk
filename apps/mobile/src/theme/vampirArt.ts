import { TABLE } from './vampirTableSize.ts';

// Vampir Köylü's round table, its pictures (theme/vampirTable.ts holds the rest): the ground as
// React Native's own gradients (groundCss), and the drawn parts as SVG text. The table, the
// medallion and the glass over the sand are drawn once into pictures (scripts/art/vampirTable.ts →
// apps/mobile/assets/vampir/table/; vampirArt.test.ts keeps them in step with the text here), so
// the phone does not blur them on its main thread at every phase. No React Native import: the
// script reads this file.

export type TableTime = 'night' | 'dawn' | 'day' | 'dusk';
export type SandTone = 'night' | 'day' | 'vote';

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
// the table draws round itself), as React Native's own gradients (theme/gradient.ts), top layer
// first: CSS's own ellipse (130 % × 80 % at the top middle), the dawn's fall from the top, and the
// window's light falling across the room at 115° in two bands. At night the floor's boards, a faint
// line every 46 (GROUND_BOARDS), are views over it.
export function groundCss(time: TableTime): string {
  const base = {
    night: radialCss([
      ['#2A3466', 0],
      ['#121836', 0.55],
      ['#080B1A', 1],
    ]),
    dawn: 'linear-gradient(180deg, #5B3B7E 0%, #8A4E78 40%, #4A2440 100%)',
    day: radialCss([
      ['#C98A54', 0],
      ['#84492A', 0.55],
      ['#3F2112', 1],
    ]),
    dusk: radialCss([
      ['#A2506A', 0],
      ['#57264A', 0.55],
      ['#24112A', 1],
    ]),
  }[time];
  if (time !== 'dawn' && time !== 'day') return base;
  const [c, a1, a2, s] =
    time === 'dawn'
      ? (['#FFD6B4', 0.13, 0.1, [0.28, 0.4, 0.5, 0.57]] as const)
      : (['#FFECBE', 0.17, 0.13, [0.26, 0.39, 0.49, 0.57]] as const);
  const at = (a: number, o: number) => `${rgbaOf(c, a)} ${n(o * 100)}%`;
  const light = [
    at(0, 0),
    at(0, s[0]),
    at(a1, s[0]),
    at(a1, s[1]),
    at(0, s[1]),
    at(0, s[2]),
    at(a2, s[2]),
    at(a2, s[3]),
    at(0, s[3]),
    at(0, 1),
  ].join(', ');
  return `linear-gradient(115deg, ${light}), ${base}`;
}

export const GROUND_BOARDS = { every: 46, width: 1, color: 'rgba(255, 255, 255, 0.022)' } as const;

function radialCss(stops: [string, number][]): string {
  return `radial-gradient(ellipse 130% 80% at 50% 0%, ${stops.map(([c, o]) => `${c} ${n(o * 100)}%`).join(', ')})`;
}

function rgbaOf(hex: string, alpha: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

type Stop = [color: string, opacity: number, offset: number];

function gradient(kind: string, id: string, attrs: string, stops: Stop[]): string {
  return `<${kind} id="${id}" ${attrs}>${stops.map(([c, o, at]) => `<stop offset="${at}" stop-color="${c}" stop-opacity="${o}"/>`).join('')}</${kind}>`;
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

// The pictures drawn once (scripts/art/vampirTable.ts), each by its file's name.
export const TABLE_TIMES: readonly TableTime[] = ['night', 'dawn', 'day', 'dusk'];
export const SAND_TONES: readonly SandTone[] = ['night', 'day', 'vote'];

export function TABLE_ART(): Record<string, string> {
  return {
    ...Object.fromEntries(TABLE_TIMES.map((time) => [`table-${time}`, tableSvg(time)])),
    medal: medalSvg(),
    ...Object.fromEntries(SAND_TONES.map((tone) => [`glass-${tone}`, glassFrontSvg(tone, false)])),
  };
}
