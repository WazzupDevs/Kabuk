// skall's own pictures in the aura look (the owner's call, 29 Ekim: the table pictures and the
// venue icons did not speak the app's language): a soft violet-to-pink ground with glows, the
// thing itself drawn flat with a darker side and a light edge, and an aura buddy (the same capsule
// as everywhere in the app). Each picture is an SVG on a 120 × 120 canvas; scripts/art/build.ts
// renders them. Table pictures replace v46's by id (docs/design/aura/masa-simgeleri/, read by
// `pnpm seed`); venue icons and map pins are the app's own assets.
import LOOK, { type LookParts } from '../../apps/mobile/src/theme/capsuleDrawing.js';

const SLOTS = ['c', 'e', 'h', 'f', 'm', 'n'] as const;
type Slot = (typeof SLOTS)[number];
const isSlot = (s: string): s is Slot => (SLOTS as readonly string[]).includes(s);

function parts(code: string): LookParts {
  const out: LookParts = {};
  for (const token of code.split(/\s+/)) {
    const [slot, value] = token.split(':');
    if (slot && value && isSlot(slot)) out[slot] = value;
  }
  return out;
}

// An aura buddy `h` high with its feet at (x + its width / 2, bottom).
export function buddy(code: string, cx: number, bottom: number, h: number): string {
  const w = (h * 64) / 84;
  const fig = LOOK.svg(parts(code), 'fig').replace(
    /^<svg[^>]*>/,
    `<svg x="${cx - w / 2}" y="${bottom - h}" width="${w}" height="${h}" viewBox="-8 -16 64 84" overflow="visible">`,
  );
  return fig;
}

// The bright colours (the app's brand and the buddies' world).
export const C = {
  purple: '#6A47F5',
  violet: '#8B6CFF',
  lilac: '#C9B8FF',
  pink: '#FF4F8B',
  pinkSoft: '#FF9DBE',
  orange: '#FFB547',
  gold: '#F2A93B',
  goldDeep: '#D4831C',
  mint: '#35C9A0',
  mintDeep: '#22A07D',
  sky: '#3DA9FF',
  skyDeep: '#2A86D6',
  red: '#E8493C',
  redDeep: '#BE3529',
  warm: '#FFD66B',
  coffee: '#5E3520',
  coffeeLight: '#8A5332',
  crema: '#C9895A',
  cream: '#F8E6C2',
  copper: '#D9773A',
  copperDeep: '#AE5A26',
  copperLight: '#F4A66C',
  brass: '#E2B24B',
  wood: '#8A5530',
  tea: '#B5361A',
  teaTop: '#DC5A2D',
  white: '#FFFFFF',
  ink: '#2E2748',
  steel: '#3A3350',
  steelSide: '#262036',
  steelLight: '#6C6487',
  glass: '#EAF4FF',
} as const;

// A pack's ground: two colours top to bottom, two glows, and its floor.
type Ground = { top: string; bottom: string; glowA: string; glowB: string };

function ground(g: Ground): string {
  return (
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.top}"/><stop offset="1" stop-color="${g.bottom}"/></linearGradient>` +
    `<radialGradient id="ga" cx="0.15" cy="0.08" r="0.7"><stop offset="0" stop-color="${g.glowA}" stop-opacity="0.75"/><stop offset="1" stop-color="${g.glowA}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="gb" cx="0.9" cy="0.12" r="0.65"><stop offset="0" stop-color="${g.glowB}" stop-opacity="0.7"/><stop offset="1" stop-color="${g.glowB}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="gl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>` +
    `</defs>` +
    `<rect width="120" height="120" fill="url(#bg)"/>` +
    `<rect width="120" height="120" fill="url(#ga)"/>` +
    `<rect width="120" height="120" fill="url(#gb)"/>`
  );
}

// A soft white glow behind the hero.
const halo = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gl)"/>`;

// A wooden counter from `y` down.
function counter(y: number, top: string, front: string, line: string): string {
  const planks = [14, 34, 54, 74, 94, 114]
    .map((x) => `<path d="M${x} ${y + 6}V120" stroke="${line}" stroke-width="0.8"/>`)
    .join('');
  return (
    `<rect x="0" y="${y + 5}" width="120" height="${120 - y - 5}" fill="${front}"/>` +
    planks +
    `<rect x="0" y="${y + 5}" width="120" height="2.2" fill="${line}" fill-opacity="0.7"/>` +
    `<rect x="0" y="${y}" width="120" height="5.4" rx="1" fill="${top}"/>` +
    `<rect x="0" y="${y}" width="120" height="1.2" fill="#FFFFFF" fill-opacity="0.7"/>`
  );
}

// A gingham cloth from `y` down.
function gingham(y: number, base: string, check: string): string {
  const cols = Array.from({ length: 12 }, (_, i) => i * 10 + 2)
    .map(
      (x) =>
        `<rect x="${x}" y="${y}" width="5" height="${120 - y}" fill="${check}" fill-opacity="0.35"/>`,
    )
    .join('');
  const rows = Array.from({ length: 6 }, (_, i) => y + 3 + i * 6)
    .map(
      (yy) => `<rect x="0" y="${yy}" width="120" height="3" fill="${check}" fill-opacity="0.35"/>`,
    )
    .join('');
  return (
    `<rect x="0" y="${y}" width="120" height="${120 - y}" fill="${base}"/>` +
    cols +
    rows +
    `<rect x="0" y="${y}" width="120" height="1.4" fill="#FFFFFF" fill-opacity="0.8"/>`
  );
}

// A wisp of steam rising from (x, y), `s` its size.
const steam = (x: number, y: number, s = 1, op = 0.85) =>
  `<path d="M${x} ${y}c${-3 * s} ${-5 * s} ${3 * s} ${-8 * s} ${0} ${-13 * s}c${-2.4 * s} ${-4 * s} ${1.6 * s} ${-6.5 * s} ${0} ${-10 * s}" fill="none" stroke="#FFFFFF" stroke-opacity="${op}" stroke-width="${2.2 * s}" stroke-linecap="round"/>`;

// A four-point sparkle.
const sparkle = (x: number, y: number, r: number, color = '#FFFFFF', op = 0.95) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${color}" fill-opacity="${op}"/>`;

const heart = (cx: number, cy: number, r: number, color: string) =>
  `<path d="M${cx} ${cy + r * 0.9}C${cx - r * 1.6} ${cy - r * 0.1} ${cx - r * 0.9} ${cy - r * 1.3} ${cx} ${cy - r * 0.45}C${cx + r * 0.9} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.1} ${cx} ${cy + r * 0.9}Z" fill="${color}"/>`;

// A soft shadow on the floor under something `w` wide.
const shadow = (cx: number, y: number, w: number) =>
  `<ellipse cx="${cx}" cy="${y}" rx="${w / 2}" ry="${w / 12}" fill="#3A1F5C" fill-opacity="0.14"/>`;

// A shelf with jars far behind (low contrast).
function shelf(y: number, color: string): string {
  const jars = [
    [16, 9, '#FFFFFF'],
    [27, 12, '#FFFFFF'],
    [86, 10, '#FFFFFF'],
    [97, 7, '#FFFFFF'],
    [106, 11, '#FFFFFF'],
  ] as const;
  return (
    `<rect x="6" y="${y}" width="108" height="2.4" rx="1.2" fill="${color}" fill-opacity="0.55"/>` +
    jars
      .map(
        ([x, h, c]) =>
          `<rect x="${x - 3.5}" y="${y - h}" width="7" height="${h}" rx="2" fill="${c}" fill-opacity="0.45"/>`,
      )
      .join('')
  );
}

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${body}</svg>`;

// --- The Kafe pack -----------------------------------------------------------------------------

const KAFE_GROUND: Ground = {
  top: '#FFE6D8',
  bottom: '#FFD2E1',
  glowA: '#FFC489',
  glowB: '#CDB8FF',
};
const KAFE_COUNTER = ['#FFF3EA', '#EDB892', '#DB9F78'] as const;

function espresso(): string {
  return svg(
    ground(KAFE_GROUND) +
      shelf(30, '#E7A985') +
      halo(48, 60, 42) +
      buddy('c:krem e:mutlu h:berefr', 96, 100, 54) +
      counter(87, ...KAFE_COUNTER) +
      shadow(47, 88.5, 64) +
      // cups on top
      `<path d="M23 25H31V29Q31 32 27 32Q23 32 23 29Z" fill="${C.white}"/><path d="M34 25H42V29Q42 32 38 32Q34 32 34 29Z" fill="${C.white}"/>` +
      // body
      `<rect x="15" y="33" width="66" height="7" rx="2.5" fill="${C.steel}"/>` +
      `<rect x="17" y="38" width="62" height="50" rx="7" fill="${C.red}"/>` +
      `<path d="M66 38H72Q79 38 79 45V81Q79 88 72 88H66Z" fill="${C.redDeep}"/>` +
      `<rect x="20" y="41" width="3" height="40" rx="1.5" fill="#FFFFFF" fill-opacity="0.35"/>` +
      // gauge
      `<circle cx="30" cy="51" r="7.2" fill="${C.steel}"/><circle cx="30" cy="51" r="5.8" fill="${C.white}"/>` +
      `<path d="M30 51L33.4 47.6" stroke="${C.red}" stroke-width="1.3" stroke-linecap="round"/><circle cx="30" cy="51" r="1" fill="${C.ink}"/>` +
      // buttons
      `<circle cx="60" cy="47" r="2.4" fill="${C.warm}"/><circle cx="67" cy="47" r="2.4" fill="#FFFFFF" fill-opacity="0.85"/>` +
      // group head and handle
      `<rect x="40" y="56" width="18" height="6" rx="2" fill="${C.steelLight}"/>` +
      `<rect x="56" y="57.5" width="16" height="3.6" rx="1.8" fill="${C.wood}"/>` +
      // the recess
      `<rect x="31" y="64" width="36" height="22" rx="4" fill="${C.steel}"/>` +
      `<rect x="31" y="82" width="36" height="4" rx="1.5" fill="${C.steelLight}"/>` +
      // the stream and the cup
      `<path d="M49 62V74" stroke="${C.coffeeLight}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M43 74H55V79Q55 82.5 49 82.5Q43 82.5 43 79Z" fill="${C.white}"/>` +
      `<path d="M55 75.5Q58.5 75.5 58.5 78Q58.5 80.5 55 80.5" fill="none" stroke="${C.white}" stroke-width="1.6"/>` +
      `<ellipse cx="49" cy="74" rx="6" ry="1.3" fill="${C.crema}"/>` +
      // steam wand
      `<path d="M22 60V76Q22 79 25 79" fill="none" stroke="${C.steelLight}" stroke-width="2" stroke-linecap="round"/>` +
      steam(27, 23, 0.7) +
      steam(38, 23, 0.7, 0.7) +
      steam(49, 72, 0.5, 0.8) +
      sparkle(108, 22, 3.5) +
      sparkle(12, 66, 2.4),
  );
}

function cezve(): string {
  return svg(
    ground(KAFE_GROUND) +
      shelf(30, '#E7A985') +
      halo(44, 64, 38) +
      buddy('c:mor e:klasik h:fotr', 98, 100, 52) +
      counter(87, ...KAFE_COUNTER) +
      // a round copper tray
      `<ellipse cx="46" cy="88" rx="30" ry="5" fill="${C.copperDeep}"/><ellipse cx="46" cy="87" rx="28" ry="4.2" fill="${C.copperLight}"/>` +
      // the cezve
      `<path d="M58 60L84 40" stroke="${C.brass}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M78 44.5L86 38.5" stroke="${C.wood}" stroke-width="4.4" stroke-linecap="round"/>` +
      `<path d="M30 56Q31 54 33 54H55Q57 54 58 56L56 61Q60 70 60 78Q60 87 46 87Q32 87 32 78Q32 70 36 61Z" fill="${C.copper}"/>` +
      `<path d="M50 54H55Q57 54 58 56L56 61Q60 70 60 78Q60 86 49 86.8Q55 82 54 72Q53 63 50 54Z" fill="${C.copperDeep}"/>` +
      `<path d="M37 64Q35 72 36 80" stroke="${C.copperLight}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="44" cy="55" rx="12.5" ry="2.6" fill="${C.crema}"/>` +
      `<circle cx="40" cy="54.6" r="1.1" fill="${C.cream}"/><circle cx="46" cy="55.4" r="0.9" fill="${C.cream}"/><circle cx="50" cy="54.4" r="0.8" fill="${C.cream}"/>` +
      // the cup on its saucer
      `<ellipse cx="74" cy="87.5" rx="10" ry="2.6" fill="${C.white}"/>` +
      `<path d="M67 76H81V82Q81 86.5 74 86.5Q67 86.5 67 82Z" fill="${C.white}"/>` +
      `<rect x="67" y="78.5" width="14" height="2.2" fill="${C.sky}"/>` +
      `<ellipse cx="74" cy="76" rx="7" ry="1.6" fill="${C.coffee}"/>` +
      // lokum
      `<rect x="13" y="81" width="7" height="7" rx="1.6" fill="${C.pinkSoft}"/><rect x="20.5" y="82" width="6.4" height="6" rx="1.5" fill="${C.white}"/><rect x="16" y="76" width="6.4" height="6" rx="1.5" fill="${C.pinkSoft}"/>` +
      `<circle cx="15" cy="83" r="0.5" fill="#FFFFFF"/><circle cx="18" cy="78" r="0.5" fill="#FFFFFF"/>` +
      steam(42, 50, 0.85) +
      steam(50, 50, 0.7, 0.7) +
      steam(74, 73, 0.5, 0.8) +
      sparkle(108, 22, 3.5) +
      sparkle(14, 46, 2.4),
  );
}

function demlik(): string {
  return svg(
    ground({ top: '#FFE3DA', bottom: '#FFD0D6', glowA: '#FFBE7A', glowB: '#C8B4FF' }) +
      // a window behind with lights
      `<rect x="70" y="10" width="38" height="34" rx="5" fill="#FFFFFF" fill-opacity="0.45"/><path d="M89 10V44M70 27H108" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1.6"/>` +
      `<circle cx="78" cy="19" r="2" fill="${C.warm}" fill-opacity="0.9"/><circle cx="99" cy="35" r="2" fill="${C.warm}" fill-opacity="0.9"/>` +
      halo(44, 62, 40) +
      buddy('c:nane e:mutlu h:bere', 98, 100, 50) +
      gingham(87, '#FFFFFF', C.red) +
      shadow(44, 88.5, 50) +
      // the double teapot
      `<path d="M23 74Q15 72 15 64" stroke="${C.red}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
      `<path d="M26 64H62V80Q62 88 44 88Q26 88 26 80Z" fill="${C.red}"/>` +
      `<path d="M52 64H62V80Q62 87.5 50 87.9Q55 82 52 64Z" fill="${C.redDeep}"/>` +
      `<ellipse cx="44" cy="64" rx="18" ry="3.6" fill="${C.redDeep}"/>` +
      `<path d="M33 45H55V58Q55 63 44 63Q33 63 33 58Z" fill="${C.red}"/>` +
      `<path d="M48 45H55V58Q55 62.5 47 62.9Q50 56 48 45Z" fill="${C.redDeep}"/>` +
      `<path d="M55 50Q65 50 64 41" stroke="${C.red}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="44" cy="45" rx="11" ry="2.6" fill="${C.redDeep}"/><circle cx="44" cy="41.6" r="2.4" fill="${C.redDeep}"/>` +
      `<path d="M30 52Q44 34 58 52" stroke="${C.steel}" stroke-width="1.8" fill="none"/>` +
      [
        [32, 72],
        [40, 79],
        [50, 71],
        [37, 52],
        [45, 57],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#FFFFFF" fill-opacity="0.9"/>`)
        .join('') +
      `<path d="M29.5 68Q29 74 30 79" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      // the tea glass
      `<ellipse cx="74" cy="88" rx="9" ry="2.4" fill="${C.white}"/>` +
      `<path d="M68.5 66H79.5Q79.5 70 77 74Q75.6 77 77 80Q79.5 84 79 87H69Q68.5 84 71 80Q72.4 77 71 74Q68.5 70 68.5 66Z" fill="#FFFFFF" fill-opacity="0.6"/>` +
      `<path d="M69 69.5H79Q78.6 72 77 74Q75.6 77 77 80Q79.5 84 79 87H69Q68.5 84 71 80Q72.4 77 71 74Q69.4 72 69 69.5Z" fill="${C.tea}"/>` +
      `<ellipse cx="74" cy="69.5" rx="5" ry="1.1" fill="${C.teaTop}"/>` +
      `<path d="M70.6 80.5Q70 83 70.4 86" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
      steam(64, 38, 0.7) +
      steam(74, 65, 0.55, 0.8) +
      sparkle(14, 22, 3.2) +
      sparkle(110, 54, 2.4),
  );
}

function frenchpress(): string {
  return svg(
    ground(KAFE_GROUND) +
      // a plant on the shelf
      `<rect x="14" y="28" width="30" height="2.4" rx="1.2" fill="#E7A985" fill-opacity="0.55"/>` +
      `<path d="M22 28H32L31 20H23Z" fill="${C.copper}" fill-opacity="0.75"/>` +
      `<path d="M27 20Q22 10 18 12M27 20Q28 8 32 6M27 20Q33 12 37 14" stroke="${C.mintDeep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-opacity="0.85"/>` +
      halo(48, 60, 40) +
      buddy('c:hardal e:klasik f:yuvarlak', 98, 100, 52) +
      counter(87, ...KAFE_COUNTER) +
      shadow(48, 88.5, 40) +
      // the press
      `<path d="M61 52Q71 52 71 64Q71 76 61 76" fill="none" stroke="${C.steel}" stroke-width="3.2"/>` +
      `<rect x="47" y="31" width="2.4" height="14" fill="${C.steelLight}"/><circle cx="48.2" cy="30" r="3.2" fill="${C.steel}"/>` +
      `<rect x="33" y="44" width="30" height="5" rx="2" fill="${C.steel}"/>` +
      `<rect x="35" y="49" width="26" height="36" fill="${C.glass}" fill-opacity="0.7"/>` +
      `<rect x="35" y="58" width="26" height="27" fill="${C.coffee}"/>` +
      `<rect x="35" y="56" width="26" height="3.2" fill="${C.crema}"/>` +
      `<rect x="35" y="53" width="26" height="1.6" fill="${C.steelLight}"/>` +
      `<rect x="37.5" y="50" width="2.6" height="34" rx="1.3" fill="#FFFFFF" fill-opacity="0.55"/>` +
      `<rect x="55" y="50" width="4" height="34" fill="#000000" fill-opacity="0.12"/>` +
      `<rect x="33" y="84" width="30" height="4" rx="1.6" fill="${C.steel}"/>` +
      // a mug and beans
      `<path d="M70 75H82V84Q82 88 76 88Q70 88 70 84Z" fill="${C.pink}"/><path d="M82 77Q86 77 86 80.5Q86 84 82 84" fill="none" stroke="${C.pink}" stroke-width="2"/>` +
      `<ellipse cx="76" cy="75" rx="6" ry="1.4" fill="${C.coffee}"/>` +
      (
        [
          [18, 86],
          [23, 87.2],
          [14, 88],
          [26, 85.4],
        ] as const
      )
        .map(
          ([x, y]) =>
            `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.5" fill="${C.coffeeLight}"/><path d="M${x - 1.2} ${y}H${x + 1.2}" stroke="${C.coffee}" stroke-width="0.6"/>`,
        )
        .join('') +
      steam(76, 72, 0.55, 0.8) +
      sparkle(108, 22, 3.5) +
      sparkle(12, 60, 2.4),
  );
}

function fanus(): string {
  return svg(
    ground({ top: '#FFE5F0', bottom: '#FFD3E4', glowA: '#FFC0D8', glowB: '#CDB8FF' }) +
      // bunting of small hearts
      [16, 34, 52, 70, 88, 104]
        .map((x, i) => heart(x, 14 + (i % 2) * 3, 3, i % 2 ? C.pinkSoft : '#FFFFFF'))
        .join('') +
      halo(46, 62, 40) +
      buddy('c:lavanta e:kalp h:fiyonk m:gulumse', 98, 100, 50) +
      counter(87, '#FFF6FA', '#F7C4D6', '#EBA9C0') +
      shadow(46, 88.5, 44) +
      // stand
      `<path d="M40 87H52L49 80H43Z" fill="#FFFFFF"/><ellipse cx="46" cy="80" rx="22" ry="3.2" fill="#FFFFFF"/><ellipse cx="46" cy="79.4" rx="22" ry="2.4" fill="#F4ECFF"/>` +
      // the cake
      `<rect x="31" y="60" width="30" height="19" rx="3" fill="${C.cream}"/>` +
      `<rect x="31" y="67" width="30" height="3" fill="${C.pinkSoft}"/>` +
      `<rect x="31" y="73" width="30" height="2.4" fill="${C.pinkSoft}"/>` +
      `<path d="M31 63V60Q31 57 34 57H58Q61 57 61 60V63Q58 66 55 63Q52 66 49 63Q46 66 43 63Q40 66 37 63Q34 66 31 63Z" fill="${C.pink}"/>` +
      `<rect x="54" y="60" width="7" height="19" fill="#000000" fill-opacity="0.07"/>` +
      `<circle cx="46" cy="53.5" r="4" fill="${C.red}"/><path d="M44 50Q46 48 48 50L46 51Z" fill="${C.mintDeep}"/><circle cx="44.6" cy="53" r="0.9" fill="#FFFFFF" fill-opacity="0.8"/>` +
      // the dome
      `<path d="M22 79Q22 38 46 38Q70 38 70 79Z" fill="#FFFFFF" fill-opacity="0.22"/>` +
      `<path d="M22 79Q22 38 46 38Q70 38 70 79" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1.6"/>` +
      `<path d="M29 66Q29 49 40 44" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="2.6" stroke-linecap="round"/>` +
      `<circle cx="46" cy="35.5" r="3" fill="#FFFFFF"/>` +
      sparkle(66, 46, 3) +
      sparkle(14, 50, 2.4) +
      sparkle(110, 34, 3),
  );
}

export const TABLE_ART: Record<string, () => string> = {
  'kafe-espresso': espresso,
  'kafe-cezve': cezve,
  'kafe-demlik': demlik,
  'kafe-frenchpress': frenchpress,
  'kafe-fanus': fanus,
};

// --- Venue icons: the type's thing alone on its ground (Keşfet's list, 56 × 56; the map pins) ---

type VenueKind = 'kafe' | 'cay' | 'yemek' | 'kampus';

const VENUE_GROUND: Record<VenueKind, Ground> = {
  kafe: { top: '#FFE6D8', bottom: '#FFC9DC', glowA: '#FFC489', glowB: '#CDB8FF' },
  cay: { top: '#E2F8EC', bottom: '#BFEBD6', glowA: '#FFE08A', glowB: '#9FE3C6' },
  yemek: { top: '#FFF0D6', bottom: '#FFD0B0', glowA: '#FFE08A', glowB: '#FFB0A0' },
  kampus: { top: '#E8E4FF', bottom: '#CFE3FF', glowA: '#C9B8FF', glowB: '#A8D8FF' },
};

function venueKafe(): string {
  return (
    halo(60, 64, 44) +
    `<ellipse cx="58" cy="90" rx="34" ry="8" fill="#FFFFFF"/><ellipse cx="58" cy="88.5" rx="30" ry="6" fill="#F4EEFF"/>` +
    `<path d="M84 58Q100 58 100 70Q100 82 84 80" fill="none" stroke="#FFFFFF" stroke-width="7"/>` +
    `<path d="M30 52H86V72Q86 89 58 89Q30 89 30 72Z" fill="#FFFFFF"/>` +
    `<path d="M74 52H86V72Q86 88 66 88.8Q76 80 74 52Z" fill="#E9E2FA"/>` +
    `<ellipse cx="58" cy="52" rx="28" ry="6" fill="${C.coffee}"/>` +
    `<ellipse cx="58" cy="52.6" rx="22" ry="4" fill="${C.crema}"/>` +
    `<g transform="translate(58 52.6) scale(1 0.5) translate(-58 -52.6)">${heart(58, 52.6, 6, C.cream)}</g>` +
    `<path d="M36 60Q35 70 38 78" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity="0.9"/>` +
    steam(50, 40, 1.15) +
    steam(66, 42, 1, 0.75) +
    sparkle(96, 26, 5)
  );
}

function venueCay(): string {
  return (
    halo(60, 62, 44) +
    `<ellipse cx="60" cy="92" rx="30" ry="7" fill="#FFFFFF"/><ellipse cx="60" cy="90.6" rx="26" ry="5" fill="#F0FFF7"/>` +
    `<path d="M44 34H76Q76 46 69 55Q65 62 69 69Q76 79 74.5 90H45.5Q44 79 51 69Q55 62 51 55Q44 46 44 34Z" fill="#FFFFFF" fill-opacity="0.65"/>` +
    `<path d="M45.4 43H74.6Q73.4 49 69 55Q65 62 69 69Q76 79 74.5 90H45.5Q44 79 51 69Q55 62 51 55Q46.6 49 45.4 43Z" fill="${C.tea}"/>` +
    `<path d="M66 43H74.6Q73.4 49 69 55Q65 62 69 69Q76 79 74.5 90H64Q71 80 64 69Q60 62 64 55Q68 49 66 43Z" fill="#000000" fill-opacity="0.12"/>` +
    `<ellipse cx="60" cy="43" rx="14.6" ry="3" fill="${C.teaTop}"/>` +
    `<path d="M50 71Q47 79 48 87" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<path d="M44 34H76" stroke="#FFFFFF" stroke-width="1.8"/>` +
    steam(56, 30, 1) +
    steam(66, 31, 0.9, 0.75) +
    sparkle(96, 28, 5) +
    sparkle(22, 52, 3)
  );
}

function venueYemek(): string {
  return (
    halo(60, 62, 46) +
    // fork and knife
    `<path d="M20 34V56Q20 60 24 60V92" stroke="${C.steel}" stroke-width="3.4" stroke-linecap="round" fill="none"/>` +
    `<path d="M16 34V52M24 34V52M28 34V54Q28 60 24 60" stroke="${C.steel}" stroke-width="2.4" stroke-linecap="round" fill="none"/>` +
    `<path d="M98 34Q90 46 92 62H96V92" stroke="${C.steel}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    // plate
    `<ellipse cx="60" cy="66" rx="30" ry="30" fill="#FFFFFF"/>` +
    `<circle cx="60" cy="66" r="22" fill="#F4EEFF"/>` +
    `<path d="M82 52A26 26 0 0 1 72 90" stroke="#E2D8FA" stroke-width="3" fill="none"/>` +
    // food: köfte, rice, salad
    `<ellipse cx="50" cy="70" rx="9" ry="7" fill="${C.cream}"/>` +
    `<ellipse cx="66" cy="62" rx="6" ry="5" fill="${C.wood}"/><ellipse cx="72" cy="70" rx="6" ry="5" fill="${C.wood}"/><ellipse cx="63" cy="73" rx="5.6" ry="4.6" fill="${C.wood}"/>` +
    `<ellipse cx="64.6" cy="60.6" rx="2" ry="1" fill="${C.crema}"/><ellipse cx="70.6" cy="68.6" rx="2" ry="1" fill="${C.crema}"/>` +
    `<circle cx="54" cy="58" r="4" fill="${C.mint}"/><circle cx="49" cy="61" r="3.4" fill="${C.mintDeep}"/><circle cx="57" cy="78" r="2.8" fill="${C.red}"/>` +
    steam(60, 40, 1) +
    sparkle(100, 22, 4.4)
  );
}

function venueKampus(): string {
  const book = (y: number, x: number, w: number, color: string, side: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="13" rx="2.6" fill="${color}"/>` +
    `<rect x="${x + 4}" y="${y + 2.4}" width="${w - 7}" height="8" rx="1.2" fill="#FFFFFF"/>` +
    `<path d="M${x + 7} ${y + 5}H${x + w - 6}M${x + 7} ${y + 8}H${x + w - 6}" stroke="#D9D2F2" stroke-width="1"/>` +
    `<rect x="${x + w - 7}" y="${y}" width="7" height="13" rx="2.6" fill="${side}"/>`;
  return (
    halo(60, 64, 46) +
    book(78, 24, 72, C.purple, '#5434D6') +
    book(65, 30, 62, C.pink, '#E03A74') +
    book(52, 26, 66, C.orange, '#E39A2E') +
    // the cap
    `<path d="M60 22L92 34L60 46L28 34Z" fill="${C.ink}"/>` +
    `<path d="M44 40V48Q60 56 76 48V40L60 46Z" fill="${C.steel}"/>` +
    `<path d="M88 35.5V48" stroke="${C.gold}" stroke-width="2"/><circle cx="88" cy="50" r="3" fill="${C.gold}"/>` +
    `<path d="M60 22L92 34L88 35.5L60 25Z" fill="#FFFFFF" fill-opacity="0.18"/>` +
    sparkle(100, 64, 4.4) +
    sparkle(20, 40, 3)
  );
}

const VENUE_DRAW: Record<VenueKind, () => string> = {
  kafe: venueKafe,
  cay: venueCay,
  yemek: venueYemek,
  kampus: venueKampus,
};

export const VENUE_KINDS = Object.keys(VENUE_DRAW) as VenueKind[];

// The list's icon (square; the app rounds it) and the map's pin (round, a white ring).
export function venueIcon(kind: VenueKind): string {
  return svg(ground(VENUE_GROUND[kind]) + VENUE_DRAW[kind]());
}

export function venuePin(kind: VenueKind): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">` +
    `<defs><clipPath id="round"><circle cx="60" cy="60" r="52"/></clipPath></defs>` +
    `<circle cx="60" cy="62" r="57" fill="#2A1A5E" fill-opacity="0.18"/>` +
    `<circle cx="60" cy="60" r="58" fill="#FFFFFF"/>` +
    `<g clip-path="url(#round)">${ground(VENUE_GROUND[kind])}${VENUE_DRAW[kind]()}</g>` +
    `</svg>`
  );
}
