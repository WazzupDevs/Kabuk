import type { TextStyle } from 'react-native';

import { risoType } from './riso';

// Kibrit's screens (Aura v90, the "Kibrit (gizli soru, gizli oy)" row: KibritOyuncular …
// KibritOyAcik). The panels are 390 × 844; every number here is theirs. The bar, the strip, the
// deck, the buddies and the foot are the card games' (theme/riso.ts).

const F800 = 'PlusJakartaSans_800ExtraBold';
const F700 = 'PlusJakartaSans_700Bold';
const F600 = 'PlusJakartaSans_600SemiBold';
const F500 = 'PlusJakartaSans_500Medium';

export const KIBRIT_TYPE = {
  // The writing field (`.note`): the paper's eyebrow (`.eb`, 700/11, 10 % apart), the question
  // (800/21/28), the count (`.cnt2`, 600/12, tabular).
  eyebrow: risoType(F700, 11, 14, 0.1),
  field: risoType(F800, 21, 28),
  count: { ...risoType(F600, 12, 15), fontVariant: ['tabular-nums'] } as TextStyle,
  // The question on the drawn paper (`.card.kagit .q`, 800/23/29) and its "Yazan: gizli" (700/13).
  paperTag: risoType(F700, 13, 16),
  // The jar's "3/5 kâğıt" (`.cntb`, 800/13, tabular).
  jarCount: { ...risoType(F800, 13, 16), fontVariant: ['tabular-nums'] } as TextStyle,
  // The question strip (`.qc .qt`, 800/19/24).
  stripQuestion: risoType(F800, 19, 24),
  // A vote tile's name (`.vt`, 700/13/17) and "Senin oyun"'s name (`.my .nm`, 800/21/26).
  tileName: risoType(F700, 13, 17),
  myName: risoType(F800, 21, 26),
  // A result row (`.tr`, 600/15/20) and its count (`.pt`, 800/16, tabular).
  row: risoType(F600, 15, 20),
  rowCount: { ...risoType(F800, 16, 20), fontVariant: ['tabular-nums'] } as TextStyle,
  // The night's papers (`.ql .qq`, 600/14/19; `.ww`, 700/13).
  pastQuestion: risoType(F600, 14, 19),
  pastWho: risoType(F700, 13, 16),
  // The page's fine line under its title in the result scene (500/13).
  fine: risoType(F500, 13, 18),
} as const;

export const KIBRIT = {
  // The paper's ink on the paper pictures, in both schemes (#141016); its muted words 62 % and 70 %.
  ink: '#141016',
  inkSoft: 'rgba(20, 16, 22, 0.62)',
  inkEyebrow: 0.7,
  // The dark pills over a picture (`.cntb`, `.u span`): rgba(20,16,22,.86), white words.
  pill: 'rgba(20, 16, 22, 0.86)',
  onPill: '#FFFFFF',
  // The pictures' size (b-kagit, 3:4: 1184 × 1579, drawn at 1480 × 1973) for the paper texture.
  paperRatio: 1973 / 1480,
  // Between the strip (106 + 90) and what follows at 206; between the bar (98) and the heading at
  // 110.
  belowStrip: 10,
  belowBar: 12,
  // The writing field (`.note`): 20 in, at least 150 high, 22 round, 16/18 in and 34 below for the
  // count; the paper texture 150 % wide at 50 % 22 %; 2 accent inside; the count 16 from the right,
  // 12 from the bottom; the eyebrow 6 above the words. The button 16 below, the hint 12 below it.
  note: {
    minHeight: 150,
    radius: 22,
    padTop: 16,
    padX: 18,
    padBottom: 34,
    textureScale: 1.5,
    textureY: 0.22,
    edge: 2,
    countRight: 16,
    countBottom: 12,
    eyebrowGap: 6,
    buttonGap: 16,
    hintGap: 12,
    shadow: '0px 10px 24px rgba(0, 0, 0, 0.3)',
  },
  // The jar box (`.jarbox`): 350 × 330, 22 round; its pill 14 in, 32 high, 12 in, 16 round.
  jar: {
    width: 350,
    height: 330,
    radius: 22,
    shadow: '0px 14px 30px rgba(0, 0, 0, 0.35)',
    pill: { inset: 14, height: 32, padX: 12 },
    // The lines under it (`.mid` at 556): 20 below, 8 apart.
    below: 20,
    lineGap: 8,
  },
  // The drawn paper's face (`.card.kagit`) on the 296 card: the question 46 / 30 in, 50 down, 146
  // high; "Yazan: gizli" 14 from the left and the bottom, 28 high, 12 in, 14 round.
  paper: {
    left: 46,
    right: 30,
    top: 50,
    height: 146,
    tag: { inset: 14, height: 28, padX: 12 },
  },
  // The heading over the deck (`.hd`): 110 down, 4 between its lines; the buddies peek at 184.
  heading: { gap: 4, toPeek: 25 },
  // The question strip (`.qc`): 22 round, 14/18 in, 4 between the eyebrow and the question; the
  // texture at 50 % 20 %.
  strip: {
    radius: 22,
    padY: 14,
    padX: 18,
    gap: 4,
    textureY: 0.2,
    shadow: '0px 10px 24px rgba(0, 0, 0, 0.3)',
  },
  // The vote grid (`.vg` at 310: 34 under the strip): 3 columns, 12 apart; a tile at least 112
  // high, 10/6 in, 22 round, 8 between the capsule (56) and the name, 2 edge; chosen: the --buzz
  // edge with a 6 halo at 22 %, the capsule ringed 3 in --buzz, the 24 tick 8 from the corner.
  vote: {
    below: 34,
    columns: 3,
    gap: 12,
    tile: { minHeight: 112, padY: 10, padX: 6, radius: 22, gap: 8, edge: 2 },
    face: 56,
    faceShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
    halo: 6,
    haloColor: 'rgba(255, 79, 139, 0.22)',
    ring: 3,
    tick: { size: 24, inset: 8, icon: 14 },
  },
  // "Senin oyun" (`.my` at 312: 36 under the strip): 264 wide, 16 in, 22 round, 8 apart, the
  // capsule 64 ringed 3 in --buzz.
  mine: { below: 36, width: 264, pad: 16, radius: 22, gap: 8, face: 64, ring: 3 },
  // The buddy in the corner of a screen without the deck (96 high).
  corner: 96,
  // The result's and the end's scene: 270 (the light) and 240 (the jar), 36 round below; the top
  // 110 shaded black 55 % to clear; the content 218 and 188 under the bar's top (54).
  scene: {
    result: 270,
    end: 240,
    radius: 36,
    shade: 110,
    shadeFrom: 'rgba(0, 0, 0, 0.55)',
    resultContent: 218,
    endContent: 188,
    // The jar's picture sits at 40 % on the end's scene.
    endY: 0.4,
  },
  // The winner in the light (`.hero-s` at 100): the stamp turned −6°, 10 above the capsule (72,
  // ringed 4 in --buzz with a 10 halo at 28 %).
  hero: {
    top: 100,
    face: 72,
    ring: 4,
    halo: 10,
    haloColor: 'rgba(255, 79, 139, 0.28)',
    shadow: '0px 10px 20px rgba(0, 0, 0, 0.4)',
    stampGap: 10,
    stampTurn: '-6deg',
    // Two or more at the top (a tie): side by side, 16 apart.
    apart: 16,
  },
  // The result table (`.tbl`, `.tr`): 4/16 in, 22 round; a row 8/0 in, 10 apart, the capsule 32;
  // a stick 22 × 30, 6 over the one before, at most 110 wide; the count at least 28 wide.
  table: {
    padY: 4,
    padX: 16,
    radius: 22,
    rowPadY: 8,
    rowGap: 10,
    face: 32,
    stick: { width: 22, height: 30, overlap: 6, maxWidth: 110 },
    stickShadow: { y: 2, blur: 2, color: 'rgba(0, 0, 0, 0.35)' },
    countWidth: 28,
    // The night's papers (`.ql`): 10/0 in, the capsule 24, 6 beside the name.
    pastPadY: 10,
    pastFace: 24,
    pastGap: 6,
  },
  // The vote's corner buddy: 34 from the right, turned 8°; Oy verildi's: 24 from the left, 96
  // over the bottom, turned −6°.
  voteBuddy: { right: 34, turn: '8deg' },
  votedBuddy: { left: 24, turn: '-6deg' },
} as const;

// The question on the drawn paper (`.card.kagit .q`, 800/23/29), scaled with the deck.
export function kibritPaperType(scale: number): TextStyle {
  return risoType(F800, 23 * scale, 29 * scale);
}

// The yeni arayüz boards KibritOy (gizli oy) and KibritSonuc (oyun sonu), 390 × 844, value for
// value (docs/design/yeni-arayuz/project/): the head (`.gt`), the paper card (`.card.paper`), the
// chip grid (`.pg`, `.pc`) and the night's rows (`.rr`). The buttons' heights are the kit's.
export const KIBRIT_BOARD_TYPE = {
  headTitle: risoType(F700, 17, 22),
  headSub: risoType(F500, 13, 18),
  timer: { ...risoType(F700, 15, 20), fontVariant: ['tabular-nums'] } as TextStyle,
  kick: risoType(F700, 12, 16, 0.4 / 12),
  question: risoType(F700, 24, 30, -0.4 / 24),
  questionNote: risoType(F500, 14, 20),
  chipName: risoType(F600, 11, 14),
  hint: risoType(F500, 13, 18),
  heading: risoType(F800, 30, 36, -0.6 / 30),
  headingNote: risoType(F500, 14, 20),
  rowQuestion: risoType(F600, 15, 20),
  rowWho: risoType(F500, 13, 17),
} as const;

export const KIBRIT_BOARD = {
  // The head: 5 under the status bar, 16 from the sides, 10 apart; the poster 56 × 40, 12 round;
  // the timer 40 high, 8 / 12 in, its icon 22 and 4 from the time.
  head: {
    top: 5,
    side: 16,
    gap: 10,
    logoW: 56,
    logoH: 40,
    logoRadius: 12,
    pillHeight: 40,
    pillPadLeft: 8,
    pillPadRight: 12,
    pillIcon: 22,
    pillGap: 4,
  },
  // The stage (`.gs`): 12 between the card, the grid and the hint.
  gap: 12,
  // The paper card: 28 round, 20 in, turned −1.2°; the question 4 under the eyebrow, its note 6.
  card: { radius: 28, pad: 20, turn: '-1.2deg', questionTop: 4, noteTop: 6 },
  // The chip grid: 4 columns, 6 apart across and 10 down; a chip 18 round, 8 / 2 in, the face
  // 52, the name 4 under it; the chosen one's 2 ring inside.
  grid: { columns: 4, gapX: 6, gapY: 10, radius: 18, padY: 8, padX: 2, face: 52, gap: 4, ring: 2 },
  // The result page: its heading 4 between lines, the page 14 between its parts; a row 56 high at
  // least, 12 inside, the hairline from 56; the foot's buttons 8 apart.
  end: { gap: 14, headGap: 4, rowMin: 56, rowGap: 12, hairIn: 56, footGap: 8 },
} as const;

// The paper card's colours (`.paper`, `.dark .paper`) and the dark ring of a raised pill.
export const KIBRIT_BOARD_COLORS = {
  light: { paper: '#FFF8E4', ink: '#2B2618', soft: '#8A7F5C', paperRing: 'transparent' },
  dark: {
    paper: '#2B2618',
    ink: '#FFF3C4',
    soft: '#8A7F5C',
    paperRing: 'rgba(255, 255, 255, 0.08)',
  },
} as const;
