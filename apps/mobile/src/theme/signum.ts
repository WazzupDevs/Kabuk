import type { TextStyle } from 'react-native';

import { KINSHI, PEEK_PAIRS } from './kinshi';

// Signum's word board and captain (Aura v87, the "Signum (kelime ızgarası ve kaptan)" row; the
// acceptance report of 4 Kasım, revize 1). The panels are 390 × 844 and share Kinshi's frame (the
// top bar, the time strip, the deck, the foot): those numbers are `theme/kinshi.ts`'s. Every number
// here is the Signum panels'.

const F800 = 'PlusJakartaSans_800ExtraBold';
const F700 = 'PlusJakartaSans_700Bold';
const F600 = 'PlusJakartaSans_600SemiBold';
const t = (family: string, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export const SIGNUM_TYPE = {
  // A closed tile's word (`.tl .w`): 800 12/14, 2 %, one line (the word list fits 320 dp:
  // SIGNUM.tileTextPx).
  tile: t(F800, 12, 14, 0.02),
  // An opened tile's label (`.tl .lb`).
  label: t(F700, 11, 11),
  // The eyebrow over the clue and "Kalan tahmin" (`.eb`): 700 11/14, 10 %, capitals.
  eyebrow: t(F700, 11, 14, 0.1),
  // The clue's word (`.cw`) and its number (`.cn`).
  clue: t(F800, 21, 27, 0.04),
  clueNumber: { ...t(F800, 15, 15), fontVariant: ['tabular-nums'] } as TextStyle,
  // The clue field (`.field`): 800 21, 6 %.
  field: t(F800, 21, 26, 0.06),
  // The number picker (`.seg button`).
  seg: { ...t(F800, 16, 16), fontVariant: ['tabular-nums'] } as TextStyle,
  // The colour legend (`.leg`).
  legend: t(F600, 12, 16),
  // The top bar's phase pill (`.phase`).
  phase: t(F700, 15, 15),
  // The role card (`.card .kick`, `.card .w`, `.card .ktag`, `.card .kb`).
  kick: t(F800, 11, 11, 0.12),
  roleWord: t(F800, 30, 34, 0.01),
  roleWordGuesser: t(F800, 26, 34, 0.01),
  roleTag: t(F700, 14, 14),
  roleNote: t(F700, 16, 22),
  hold: t(F700, 14, 14),
  // The captain mark beside a name on Takımlar (`.cap`).
  cap: t(F700, 11, 11),
} as const;

export const SIGNUM = {
  // The word board (`.board`): 350 wide (the screen less 20 a side), 22 round, 10 in, 5 × 5 tiles
  // 6 apart in rows of 50; the masa cloth stretched to it; its shadow.
  board: { radius: 22, pad: 10, gap: 6, row: 50, columns: 5 },
  boardShadow: '0px 14px 30px rgba(0, 0, 0, 0.35)',
  // The tile (`.tl`): 10 round, a 2 hard shadow under it; an opened one's label 3 from its foot.
  tile: { radius: 10, labelBottom: 3 },
  tileShadow: '0px 2px 0px rgba(0, 0, 0, 0.25)',
  tileInk: '#141016',
  // An opened tile's label (`.lb`): white on the ink at 78 %, 2/5 in, 5 round.
  label: { ink: '#FFFFFF', ground: 'rgba(20, 16, 22, 0.78)', padY: 2, padX: 5, radius: 5 },
  // The captain's colour over a closed tile (`.tl.kt`, revize 1): Mor 42 % #8E6CF0 inside a 3
  // #7B5CFF line, Pembe 36 % #FF3478 inside a 3 #E8336F line, Nötr 22 % #F1D96A; Kara the ink
  // itself with white words, a 3 white line and 2 of the ink inside it (not a team's colour).
  captain: {
    a: { fill: 'rgba(142, 108, 240, 0.42)', line: '#7B5CFF', width: 3 },
    b: { fill: 'rgba(255, 52, 120, 0.36)', line: '#E8336F', width: 3 },
    n: { fill: 'rgba(241, 217, 106, 0.22)' },
    x: { ground: '#141016', ink: '#FFFFFF', line: '#FFFFFF', width: 3, inner: 2 },
  },
  // A tile the guesser marked (`.tl.sel`): a 3 --buzz ring, 7 of it at 30 %, a shadow.
  selRing: 3,
  selHalo: 7,
  selHaloColor: 'rgba(255, 79, 139, 0.3)',
  selShadow: '0px 6px 14px rgba(0, 0, 0, 0.4)',
  // Who points at it (`.tl .pt`): faces of 18 at its top right (6 out, 8 up), ringed 2 in the ink,
  // overlapping 5.
  pointers: { face: 18, right: -6, top: -8, ring: 2, ringColor: '#141016', overlap: 5 },
  // The clue panel (`.clue`): glass 22 round, 12/16 in, 12 apart, the captain's face 36; its number
  // label 30 round (the team's tag colours).
  clue: { radius: 22, padY: 12, padX: 16, gap: 12, face: 36, number: 30 },
  // İpucu ver's panel (`.gp`): glass 22 round, 16 in, 10 apart; the field 48 high, 16 round, a 2
  // accent line, 16 in; four numbers 40 high, 12 round, 6 apart, 1 line; the legend 6 apart, its
  // squares 12, 3 round (the black one ringed 1.5 white).
  input: { radius: 22, pad: 16, gap: 10 },
  field: { height: 48, radius: 16, line: 2, padX: 16 },
  seg: { height: 40, radius: 12, gap: 6, line: 1 },
  legend: { gap: 6, square: 12, radius: 3, itemGap: 5, blackRing: 1.5, blackRingColor: '#FFFFFF' },
  // The key's colours (`.mini i`, `.leg i`): Mor, Pembe, Nötr, Kara.
  key: { a: '#8E6CF0', b: '#FF3478', n: '#F1D96A', x: '#141016' },
  // The 5 × 5 key map (`.mini`): 22 cells 5 apart, 6 round, a 1.5 inner line of the ink at 85 %;
  // on the captain's card 83 in and 116 down; small on Oyun sonu (12, 3 apart, 3 round). An opened
  // tile's cell is striped white at 55 % (2 every 6, 45°).
  mini: { cell: 22, gap: 5, radius: 6, left: 83, top: 116 },
  miniSm: { cell: 12, gap: 3, radius: 3 },
  miniLine: 'inset 0px 0px 0px 1.5px rgba(20, 16, 22, 0.85)',
  miniOpened:
    'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.55) 0px 2px, transparent 2px 6px)',
  // The role card's words (`.card`): the kick 25 down, 20 high; the word 30 in, 50 down, 54 high;
  // the guesser's tag 122 down, 30 high, 12 in, 15 round on the ink at 86 %; its note 40 in, 164
  // down; the role words' shadow.
  card: {
    kickTop: 25,
    kickHeight: 20,
    wordSide: 30,
    wordTop: 50,
    wordHeight: 54,
    tagTop: 122,
    tagHeight: 30,
    tagPadX: 12,
    tagGround: 'rgba(20, 16, 22, 0.86)',
    noteSide: 40,
    noteTop: 164,
    ink: '#141016',
    wordInk: '#FFFFFF',
    wordShadow: { color: 'rgba(20, 16, 22, 0.45)', y: 2 },
    // The back's "Basılı tut" (`.card .hold`): 228 down, 36 high, 14 in, 6 apart, black at 72 %.
    holdTop: 228,
    holdHeight: 36,
    holdPadX: 14,
    holdGap: 6,
    holdGround: 'rgba(0, 0, 0, 0.72)',
    holdInk: '#FFFFFF',
  },
  // The top bar's phase pill (`.phase`): glass 44 high, 18 in.
  phase: { height: 44, padX: 18 },
  // "Hazır: n/m" in the foot (`.chip.hz`): 48 high, 16 in.
  readyChip: { height: 48, padX: 16 },
  // The captain mark (`.cap`): 3/6 in, 6 round, 2 after the name, --signal.
  cap: { padY: 3, padX: 6, radius: 6, gap: 2 },
  // Kara kart açıldı (`.flash`): a pink glow over the screen, the winner's glass (`.nx`) 16 in, 6
  // apart; its tag the ink with a 1 white line at 20 %.
  flash: 'radial-gradient(circle at 50% 45%, rgba(255, 52, 120, 0.22), transparent 60%)',
  winner: { pad: 16, gap: 6, radius: 22 },
  blackTag: { ground: '#141016', ink: '#FFFFFF', line: 'rgba(255, 255, 255, 0.2)' },
  // Oyun sonu (`.scene.sg`): the cloth 300 high, 36 round at its foot; the winners' faces 64
  // stacked 12 over each other, ringed 3 in the ink, under the "Kazanan" stamp (−6°, 10 above
  // them) 96 down; two buddies 140 high, 20 in, 14 under; the words after a 250 spacer; two boxes
  // of the opened cards 10 apart.
  end: {
    height: 300,
    radius: 36,
    heroTop: 96,
    face: 64,
    faceOverlap: 12,
    faceRing: 3,
    faceRingColor: '#141016',
    stampTurn: '-6deg',
    stampGap: 10,
    buddies: { height: 140, side: 20, below: 14 },
    spacer: 250,
    gap: 10,
    confetti: [
      { left: 40, top: 74, color: '#FFB547', turn: '-24deg' },
      { left: 92, top: 46, color: '#9C86FF', turn: '30deg' },
      { left: 300, top: 58, color: '#FFB547', turn: '-38deg' },
      { left: 338, top: 112, color: '#9C86FF', turn: '18deg' },
      { left: 196, top: 34, color: '#FF7EA8', turn: '-8deg' },
      { left: 24, top: 150, color: '#9C86FF', turn: '40deg' },
      { left: 250, top: 130, color: '#FFB547', turn: '-30deg' },
      { left: 140, top: 120, color: '#FF7EA8', turn: '22deg' },
    ],
  },
} as const;

// The board on this screen: as wide as the screen less its two sides, never wider than drawn (350);
// the rows stay 50 and the tiles share the width (about 47 on 320 dp, where the longest word of the
// list still fits: SIGNUM.tileTextPx).
export const SIGNUM_BOARD_WIDTH = 350;
export function signumBoard(screenWidth: number, side: number) {
  const B = SIGNUM.board;
  const width = Math.max(0, Math.min(SIGNUM_BOARD_WIDTH, Math.round(screenWidth - 2 * side)));
  const tile = (width - 2 * B.pad - (B.columns - 1) * B.gap) / B.columns;
  const height = 2 * B.pad + B.columns * B.row + (B.columns - 1) * B.gap;
  return { width, height, tile };
}

// The buddies over the board (`.peek`): Kinshi's, 58 from the screen's sides.
export const SIGNUM_PEEK = { ...KINSHI.peek, fromScreen: 58 } as const;

// A tile as one phone draws it: closed (its word on the closed riso tile), closed under the
// captain's colour, or opened (the kind's riso tile with its word's label).
export type SignumKindKey = 'a' | 'b' | 'n' | 'x';
export type TileLook =
  | { kind: 'closed' }
  | { kind: 'captain'; key: SignumKindKey }
  | { kind: 'open'; key: SignumKindKey };

// `open` is the tile's open kind (the open state's), `key` the captain's map or, once the game is
// over, the open key; anyone else has none (rule 3).
export function tileLook(
  open: SignumKindKey | null,
  key: readonly SignumKindKey[] | null,
  index: number,
): TileLook {
  if (open) return { kind: 'open', key: open };
  const known = key?.[index];
  return known ? { kind: 'captain', key: known } : { kind: 'closed' };
}

// The captain's line over a tile as an inset shadow (`box-shadow: inset 0 0 0 3px …`).
export function captainLine(key: SignumKindKey): string | undefined {
  const C = SIGNUM.captain;
  if (key === 'a') return `inset 0px 0px 0px ${C.a.width}px ${C.a.line}`;
  if (key === 'b') return `inset 0px 0px 0px ${C.b.width}px ${C.b.line}`;
  if (key === 'x') {
    return `inset 0px 0px 0px ${C.x.width}px ${C.x.line}, inset 0px 0px 0px ${C.x.width + C.x.inner}px ${C.x.ground}`;
  }
  return undefined;
}

// The marked tile's ring in this scheme's --buzz.
export function selShadow(buzz: string): string {
  return `0px 0px 0px ${SIGNUM.selRing}px ${buzz}, 0px 0px 0px ${SIGNUM.selHalo}px ${SIGNUM.selHaloColor}, ${SIGNUM.selShadow}`;
}

// Which buddies peek on which screen (the panels as drawn): the guesser's and Takımlar's one pair,
// the role cards', the waiting's and Oyun sonu's the other (Kinshi's files).
export const SIGNUM_PEEK_PAIRS = PEEK_PAIRS;
