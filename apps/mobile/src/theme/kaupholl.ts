import type { TextStyle } from 'react-native';

import { risoType } from './riso';

// Kaupholl's screens (Aura v89 "Kaupholl (en yakına yatır)" and the §6 panels of
// docs/decisions/kaupholl.md: KaupholOyuncular … KaupholYukleniyor). The panels are 390 × 844,
// KaupholTahta320 320 × 640, the *130 ones at 1.3× text; every number here is theirs. The bar, the
// strip, the deck, the buddies and the foot are the card games' (theme/riso.ts).

const F800 = 'PlusJakartaSans_800ExtraBold';
const F700 = 'PlusJakartaSans_700Bold';
const F600 = 'PlusJakartaSans_600SemiBold';
const F500 = 'PlusJakartaSans_500Medium';
const tabular = (t: TextStyle): TextStyle => ({ ...t, fontVariant: ['tabular-nums'] });

// The guess field's base size and a smaller one that keeps its line in proportion (a number too
// wide for the field shrinks, KaupholTahminYaz320).
export const FIELD_SIZE = 32;
export const fieldType = (size: number): TextStyle => ({
  fontFamily: F800,
  fontSize: size,
  lineHeight: Math.round((size * 38) / FIELD_SIZE),
  fontVariant: ['tabular-nums'],
});

export const KAUPHOLL_TYPE = {
  // The question strip (`.qc`): the eyebrow (700/11, 10 % apart) and the question (800/19/24).
  eyebrow: risoType(F700, 11, 14, 0.1),
  question: risoType(F800, 19, 24),
  // The open card's question (`.card.soru .q`, 800/24/30) and its unit chip (700/13).
  cardQuestion: risoType(F800, 24, 30),
  cardUnit: risoType(F700, 13, 17),
  // The guess field (`.ans .field`, 800/32, tabular) and its unit (`.ans .unit`, 700/15).
  field: fieldType(FIELD_SIZE),
  unit: risoType(F700, 15, 19),
  // Senin tahminin (`.hero`, 800/52/56, −1 apart) and the answer's (`.big-a .hero`, 44/48).
  hero: tabular(risoType(F800, 52, 56, -1 / 52)),
  answer: tabular(risoType(F800, 44, 48, -1 / 44)),
  // A slice (`.slot`): its odds (800/15; 14 compact), its guess (800/21/24; 19/22 compact and at
  // 320), "Hepsinden küçük" (700/15/20), who wrote it (600/12/15).
  odds: risoType(F800, 15, 19),
  oddsCompact: risoType(F800, 14, 18),
  guess: tabular(risoType(F800, 21, 24)),
  guessCompact: tabular(risoType(F800, 19, 22)),
  smaller: risoType(F700, 15, 20),
  who: risoType(F600, 12, 15),
  // A coin's count (`.bet b`, 800/11) and the stack's (`.bstack b`, 800/12).
  count: risoType(F800, 11, 13),
  stackCount: risoType(F800, 12, 14),
  // The answer's line across the board (`.aline`, 800/13, 6 % apart).
  line: risoType(F800, 13, 17, 0.06),
  // The chips' legend (`.leg`, 500/12/16) and the waiting pill (`.wait`, 600/15/20).
  legend: risoType(F500, 12, 16),
  wait: risoType(F600, 15, 20),
  // The pre-game page's numbers (800/12) and its warning rows (`.warn`, `.err`: 600/13/17).
  seatNo: tabular(risoType(F800, 12, 15)),
  warn: risoType(F600, 13, 17),
  // The score table (`.tr`, 600/15/20): this question's gain (700/13) and the points (800/16).
  row: risoType(F600, 15, 20),
  gain: tabular(risoType(F700, 13, 17)),
  points: tabular(risoType(F800, 16, 20)),
} as const;

export const KAUPHOLL = {
  // The riso ink and paper of the board, the strip and the card.
  ink: '#141016',
  white: '#FFFFFF',
  yellow: '#FFE21E',
  // The question strip (`.qc`): 22 round, 14/18 in, the k-soru paper at 50 % 24 % / 130 %, the
  // eyebrow at 70 %, 4 over the question.
  qc: {
    radius: 22,
    padY: 14,
    padX: 18,
    shadow: '0px 10px 24px rgba(0, 0, 0, 0.3)',
    textureScale: 1.3,
    textureY: 0.24,
    eyebrowFade: 0.7,
    gap: 4,
    // Without the eyebrow, under the keyboard at 320 or above 1× text (`.qc.q13`): 10/14 in.
    tight: { padY: 10, padX: 14 },
  },
  // The k-soru picture is 1776 × 2368.
  paperRatio: 2368 / 1776,
  // Under the strip: the question 4 lower, what follows it 22 (the field) or 30 (the panel) lower.
  belowStrip: 4,
  belowQuestion: { field: 22, panel: 30 },
  // The guess row (`.ans`): the field and the unit 64 high, 16 round, 10 apart; the field's edge 2
  // in --accent (--hair once time is up); "En çok 6 hane" 6 under it, the send 10 under that.
  ans: { height: 64, radius: 16, edge: 2, padX: 16, gap: 10, hintGap: 6, sendGap: 10 },
  // At 320 (`.p320 .ans`): 56 high, 12 in; the hint 2 under, the send 7 under that.
  ansNarrow: { height: 56, padX: 12, hintGap: 2, sendGap: 7 },
  // The open card's face (`.card.soru`, on the 296 card, scaled with the deck; nothing in the
  // yellow band): the question 44 in, 66 down and 150 high, the unit chip 228 down, 28 high, 12 in.
  cardFace: {
    question: { side: 44, top: 66, height: 150 },
    unit: { top: 228, height: 28, padX: 12, fill: 'rgba(20, 16, 22, 0.86)' },
  },
  // Senin tahminin (`.gpanel`): 22 round, 18/16/12 in, its tag 14 from the top and the right.
  panel: { radius: 22, padTop: 18, padX: 16, padBottom: 12, tag: 14 },
  // The chips under it (`.done-l`, the person chip of theme/riso.ts): 6 apart; one who has not
  // written at 60 %; its mark 18 round: written a 2 --signal ring with a 10 tick, locked a --signal
  // disc with a 12 tick. The legend's dots 14, 12 apart; "not written" a 1.5 muted ring at 60 %.
  chips: { gap: 6, none: 0.6, mark: 18, tick: 10, tickLocked: 12, ring: 2 },
  legend: { gap: 12, dot: 14, dotGap: 5, noneRing: 1.5, noneFade: 0.6, tick: 10 },
  // The waiting pill (`.wait`): 48 high, 24 round, the spinner 18, 10 apart.
  wait: { height: 48, gap: 10, spinner: 18 },
  // The buddy peeking beside the guess (Gönderildi: 104 high, 24 in, −6°; Süre doldu: 110, 30 in,
  // 7°) and over "Kimse tahmin yazmadı" (130, −5°); on the pre-game page (96, 16 in, 14 under, 6°).
  buddy: {
    sent: { height: 104, side: 24, turn: '-6deg' },
    late: { height: 110, side: 30, turn: '7deg' },
    none: { height: 130, turn: '-5deg' },
    pregame: { height: 96, side: 16, below: 14, turn: '6deg' },
  },
  // The board (`.tahta`): 22 round, the k-tahta baize stretched to it, 18/16 in, 6 between the
  // slices; compact 14/12; at 320 14/10. Locked a little darker, and the other slices' odds paler.
  board: {
    radius: 22,
    padY: 18,
    padX: 16,
    gap: 6,
    shadow: '0px 14px 30px rgba(0, 0, 0, 0.35)',
    compact: { padY: 14, padX: 12 },
    narrow: { padY: 14, padX: 10 },
    // Loading 70 %; under the connection error 45 %.
    loading: 0.7,
    dim: 0.45,
    // When it scrolls inside (KaupholTahta320): its foot fades into 65 % black over 36.
    fade: { height: 36, color: 'rgba(0, 0, 0, 0.65)' },
  },
  // A slice (`.slot`): 56 high at least, 16 round, 6/10/6/6 in, 10 apart, a 2 edge; compact 48,
  // 4/8/4/4, 8 apart. Over the answer 45 %. Its tag 10 from the right, 13 over its top.
  slot: {
    minHeight: 56,
    radius: 16,
    padY: 6,
    padRight: 10,
    padLeft: 6,
    gap: 10,
    edge: 2,
    fill: 'rgba(6, 20, 13, 0.62)',
    lockedFill: 'rgba(6, 20, 13, 0.74)',
    winFill: 'rgba(6, 20, 13, 0.78)',
    winHalo: '0px 0px 0px 6px rgba(255, 181, 71, 0.25)',
    mine: '#FFFFFF',
    mineGuess: 'rgba(255, 255, 255, 0.7)',
    // A slice under the finger (`.slot.press`, `.touch`): 98 %, its edge solid in --accent; a 44
    // disc at 28 % white with a 6 ring at 12 %, 60 % across.
    pressScale: 0.98,
    touch: {
      side: 44,
      at: 0.6,
      fill: 'rgba(255, 255, 255, 0.28)',
      ring: 6,
      ringFill: 'rgba(255, 255, 255, 0.12)',
    },
    over: 0.45,
    tagRight: 10,
    tagLift: 13,
    whoInk: 'rgba(255, 255, 255, 0.82)',
    whoGap: 5,
    lineGap: 2,
    compact: { minHeight: 48, padY: 4, padRight: 8, padLeft: 4, gap: 8 },
    // The odds' disc: 44 (40 compact), a 2 ring in the ink; growing with the text up to 1.3×.
    odds: 44,
    oddsCompact: 40,
    oddsRing: 2,
    // A locked board's other slices: their odds less saturated and darker.
    oddsLocked: [{ saturate: 0.4 }, { brightness: 0.85 }],
    // The loading slice's odds (`.od.sk`): 16 % white.
    oddsSkeleton: 'rgba(255, 255, 255, 0.16)',
    skeleton: { guess: { width: 90, height: 18 }, who: { width: 60, height: 10 }, radius: 6 },
  },
  // Who wrote it (`.who`, `.ostk`): faces 18, overlapping 8, ringed 2 in the ink.
  face: 18,
  faceOverlap: 8,
  faceRing: 2,
  // The coins on a slice (`.bets`): at most 132 wide (140 compact, 92 at 320), 4 apart, from the
  // right. One person's (`.bet`): 34 × 30, the coin 30 four down, their face 18 over its top right,
  // the count's badge 2/4 in, 6 round, at its bottom left; compact 32 × 28, the coin 28 two down.
  bets: { maxWidth: 132, maxWidthCompact: 140, maxWidthNarrow: 92, gap: 4 },
  bet: {
    width: 34,
    height: 30,
    coin: 30,
    coinTop: 4,
    compact: { width: 32, height: 28, coin: 28, coinTop: 2 },
    faceOut: 2,
    // The coin about to land (`.bet.ghost`) at half.
    ghost: 0.5,
    badge: { padY: 2, padX: 4, radius: 6, out: 2, below: 4 },
  },
  // The stack when a person's coins do not fit (`.bstack`): 34 high, one coin 30, "×n" 3/5 in, the
  // faces overlapping, 4 apart.
  stack: { height: 34, coin: 30, gap: 4, badge: { padY: 3, padX: 5, radius: 6 } },
  // The answer's line (`.aline`): 2 high dashes of 6 every 11, 8 from the words, 2/4 out.
  line: { height: 2, dash: '6 5', gap: 8, marginY: 2, marginX: 4 },
  // The wallet (`.wallet`): two coins 40, 8 apart, a shadow under them; a used one at 30 % and
  // grey. Locked: the coins at 55 % (a used one 25 %), a 26 disc in the ink with a 2 white ring
  // at 85 % and the lock 14 over them.
  wallet: {
    coin: 40,
    gap: 8,
    shadow: { y: 4, blur: 6, color: 'rgba(0, 0, 0, 0.4)' },
    used: 0.3,
    // The coin leaving for the slice under the finger (`.wallet img.leaving`).
    leaving: 0.5,
    lockedCoin: 0.55,
    lockedUsed: 0.25,
    lock: { side: 26, ring: 2, ringInk: 'rgba(255, 255, 255, 0.85)', icon: 14 },
  },
  // The answer (`.big-a`): 22 round, 12/16 in; 4 under the bar's end, 12 over the board.
  answer: { radius: 22, padY: 12, padX: 16, gap: 12 },
  // The compact strip (`.strip.one`): the capsule 40 × 60, 10 apart, on one line.
  oneLine: { capsule: { width: 40, height: 60 }, gap: 10 },
  // The connection error (`.errbox`): 40 in, 22 round, 18/16 in, 8 apart.
  error: { side: 40, radius: 22, padY: 18, padX: 16, gap: 8 },
  // The pre-game page's rows: the warning and the error (`.warn`, `.err`): 10/14 in, 16 round, 8
  // apart; the order's numbers 14 wide.
  warn: { padY: 10, padX: 14, radius: 16, gap: 8 },
  seatNo: 14,
  // The scenes (`.scene.ks`, the k-kasa chest): over the end of a question 250, the end 300; the
  // words at 322 and 372 down the panel.
  scene: { summary: 250, end: 300, summaryContent: 322, endContent: 372 },
  // The end's winners (`.hero-s`): 96 down, the stamp 10 over them, turned −6°. One 72 in a 4
  // --signal ring and a 10 halo; two or three 72 overlapping 14, each ringed 3 in the ink and 7
  // --signal.
  hero: {
    top: 96,
    stampGap: 10,
    stampTurn: '-6deg',
    face: 72,
    overlap: 14,
    one: { ring: 4, halo: 10, haloInk: 'rgba(255, 181, 71, 0.28)' },
    shadow: '0px 10px 20px rgba(0, 0, 0, 0.4)',
    many: { ring: 3, signal: 7 },
  },
  // The score table (`.tbl`): 22 round, 4/16 in; rows 8 apart, 10 across, the face 32, the points
  // at least 44 wide; the "+3 tahmin" tag 4 after the name.
  table: { radius: 22, padY: 4, padX: 16, rowPadY: 8, gap: 10, face: 32, points: 44, tagGap: 4 },
  // The table's "Oyun yarıda kaldı" (KaupholYarida): 16 in, 65 under the status bar, 22 round,
  // 14/16 in, the icon's disc 36, 12 apart. It stays as long as Telegram Android's long bulletin
  // (Bulletin.DURATION_LONG, 2750 ms) or until touched.
  notice: { side: 16, top: 65, radius: 22, padY: 14, padX: 16, gap: 12, disc: 36, ms: 2750 },
  // From this many slices (6 guesses and "Hepsinden küçük") or above 1× text the board is compact
  // (docs/decisions/kaupholl.md §5).
  compactFrom: 7,
  // Under this width the board takes the 320 panel's measures.
  narrowBelow: 360,
  // The sides there (`.p320 .top`, `.p320 .strip`, `.p320 .foot`): 16.
  narrowSide: 16,
} as const;
