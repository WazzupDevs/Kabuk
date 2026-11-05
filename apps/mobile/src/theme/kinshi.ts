import type { TextStyle } from 'react-native';

import type { ColorScheme } from './tokens';

// Kinshi's tabu layout (Aura v85, the "Kinshi (tabu düzeni)" row and the `Kinshi` panel; the
// acceptance report of 4 Kasım). The panels are 390 × 844; every number here is theirs.

const F800 = 'PlusJakartaSans_800ExtraBold';
const F600 = 'PlusJakartaSans_600SemiBold';
const t = (family: string, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export const KINSHI_TYPE = {
  // The card's word in its pink band (`.card .w`) and its five forbidden words (`.card li`).
  word: t(F800, 30, 34, 0.01),
  forbidden: t(F800, 20, 24, 0.02),
  // The time beside the capsule (`.strip .num`), tabular.
  clock: { ...t(F800, 30, 34), fontVariant: ['tabular-nums'] } as TextStyle,
  // The score pill's numbers (`.score b`).
  score: { ...t(F800, 18, 18), fontVariant: ['tabular-nums'] } as TextStyle,
  // The 3-2-1 (`.big`).
  big: { ...t(F800, 120, 120), fontVariant: ['tabular-nums'] } as TextStyle,
  // The guesser's count of Doğru (`.hero`).
  hero: { ...t(F800, 52, 56, -1 / 52), fontVariant: ['tabular-nums'] } as TextStyle,
  // The bell's word (`.buzzer`).
  buzz: t(F800, 16, 20),
  // A played card's row (`.res`).
  row: t(F600, 15, 22, 0.02),
  // The count in Sonraki tura geç (`.cnt`) and the scores at the end (800 30/34).
  count: { ...t(F800, 13, 13), fontVariant: ['tabular-nums'] } as TextStyle,
  endScore: { ...t(F800, 30, 34), fontVariant: ['tabular-nums'] } as TextStyle,
} as const;

export const KINSHI = {
  // The panels' status bar: the safe area's top on the phone.
  statusBar: 47,
  // Top bar (`.top`): 54 from the panel's top (the status bar is 47), 20 in.
  barTop: 7,
  // The time strip (`.strip`): 106 from the top, 14 between the capsule and the words.
  stripGap: 14,
  stripLineGap: 6,
  stripWordGap: 8,
  capsule: { width: 60, height: 90 },
  // The score pill (`.score`): 44 high, 16 in on the left, 6 on the right, 10 apart; the team
  // bar 8 × 16, the divider 1 × 18, the turn chip 32 high.
  score: { height: 44, padLeft: 16, padRight: 6, gap: 10, bar: { w: 8, h: 16, r: 4 }, rule: 18 },
  scoreChip: 32,
  // The faces of the guessers (`.stk`): 26, overlapping 6, ringed 2 in the canvas's colour.
  face: 26,
  faceOverlap: 6,
  faceRing: 2,
  // The deck (`.d3`): 296 × 395, 16 round; perspective(1100px) rotateX(13deg) rotateZ(-1.2deg)
  // from 50 % 60 %.
  card: { width: 296, height: 395, radius: 16 },
  deck: { perspective: 1100, rotateX: '13deg', rotateZ: '-1.2deg', originY: 0.6 },
  // Six paper edges under the card, each 2.2 lower (4.0 … 15.0): #D9D0BA, then every other one
  // #CFC5AD (`.edge:nth-of-type(odd)`).
  edges: [4.0, 6.2, 8.4, 10.6, 12.8, 15.0],
  edgeColors: ['#D9D0BA', '#CFC5AD'],
  edgeShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.18)',
  edgeOuter: '0px 1px 0px rgba(0, 0, 0, 0.12)',
  // The two backs fanned behind (`.f1`, `.f2`).
  fans: [
    { x: 14, y: 18, rotate: '5deg' },
    { x: -12, y: 12, rotate: '-4deg' },
  ],
  fanShadow: '0px 8px 18px rgba(0, 0, 0, 0.35)',
  fanEdge: 'inset 0px 0px 0px 1px rgba(255, 255, 255, 0.12)',
  cardEdge: 'inset 0px 0px 0px 1px rgba(255, 255, 255, 0.35)',
  cardOuter: '0px 1px 0px rgba(0, 0, 0, 0.2)',
  // The blurred shadow under the deck (`.dsh`): 6 % in on both sides, 34 below, 60 high, 18 blur;
  // black 55 % in the dark, #031B0B 28 % in the light.
  deckShadow: {
    inset: 0.06,
    below: 34,
    height: 60,
    blur: 18,
    color: { dark: 'rgba(0, 0, 0, 0.55)', light: 'rgba(3, 27, 11, 0.28)' } satisfies Record<
      ColorScheme,
      string
    >,
  },
  // The card's words: the band 36 in, 24 down, 62 high; the list 44 in, 112 down, 206 high, a
  // 14 % line between rows.
  wordBand: { side: 36, top: 24, height: 62 },
  wordShadow: { color: 'rgba(20, 16, 22, 0.45)', y: 2 },
  list: { side: 44, top: 112, height: 206 },
  listInk: '#141016',
  listRule: 'rgba(20, 16, 22, 0.14)',
  wordInk: '#FFFFFF',
  // The two buddies peeking from behind the card (`.peek`): 118 high (320 × 420), 78 above the
  // card, 58 in from the screen's sides (11 inside the card's, which is 47 in); the left one turned
  // −8°, the right one 7° and 6 lower.
  peek: { height: 118, above: 78, inset: 11, leftTurn: '-8deg', rightTurn: '7deg', rightDrop: 6 },
  buddyRatio: 320 / 420,
  // The counters under the deck (`.stats`): 37 under it (23 on the rival's), 8 apart.
  statsGap: 8,
  statsBelow: 37,
  statsBelowRival: 23,
  // The foot (`.foot`): 34 from the bottom, 12 apart. The bell (`.buzzer`): 96 round, 22 from the
  // bottom, a 6 ring of --buzz at 18 %.
  footBottom: 34,
  footGap: 12,
  buzzer: { size: 96, bottom: 22, ring: 6, ringColor: 'rgba(255, 79, 139, 0.18)' },
  buzzerShadow: '0px 12px 26px rgba(0, 0, 0, 0.35)',
  // The guesser's panel (`.gpanel`): 264 wide, 48 below the deck's top, 18/16/12 in, 22 round.
  panel: { width: 264, top: 48, padTop: 18, padX: 16, padBottom: 12, radius: 22 },
  row: { padY: 10, padX: 4, gap: 10 },
  // The 3-2-1 (`KinshiGeriSayim`): a 220 glass round 250 from the top; its line 10 under it.
  countdown: { size: 220, top: 250, lineGap: 10 },
  // Where the top bar ends on the panel (54 + 44): the 3-2-1's round is placed from here.
  barBottom: 98,
  countdownBuddies: {
    top: 640,
    height: 204,
    places: [
      { buddy: '1a80a9', left: 28, height: 150, top: 40 },
      { buddy: 'd2fbb5', left: 140, height: 170, top: 30 },
      { buddy: '9c96bd', right: 28, height: 150, top: 44 },
    ],
  },
  // Tur sonu (`KinshiTurSonu`): 12 between parts; the buddies 130 high, 30 in, 8 under.
  summary: { gap: 12, buddies: 130, buddySide: 30, buddyBelow: 8, minBuddies: 120 },
  // The count in Sonraki tura geç (`.cnt`): 30 round, 8 in, black 22 %.
  countPill: { size: 30, padX: 8, fill: 'rgba(0, 0, 0, 0.22)' },
  // Oyun sonu: the scene 300 high, 36 round at the foot; the confetti bars 8 × 18.
  endScene: {
    height: 300,
    radius: 36,
    // The words start 304 from the panel's top (54 + the 250 spacer).
    contentTop: 304,
    buddies: [
      { buddy: '1a80a9', left: 24, height: 150, below: 14 },
      { buddy: 'd2fbb5', left: 135, height: 170, below: 24 },
      { buddy: '9c96bd', right: 24, height: 150, below: 14 },
    ],
    confetti: [
      { left: 40, top: 74, color: '#9C86FF', turn: '-24deg' },
      { left: 92, top: 46, color: '#FF7EA8', turn: '30deg' },
      { left: 300, top: 58, color: '#FFB547', turn: '-38deg' },
      { left: 338, top: 112, color: '#9C86FF', turn: '18deg' },
      { left: 196, top: 34, color: '#FF7EA8', turn: '-8deg' },
      { left: 24, top: 150, color: '#FFB547', turn: '40deg' },
      { left: 250, top: 130, color: '#9C86FF', turn: '-30deg' },
      { left: 140, top: 120, color: '#FFB547', turn: '22deg' },
    ],
    bar: { width: 8, height: 18, radius: 4 },
    scoreGap: 18,
    scoreRule: 28,
  },
  // Takımlar: the poster 84 × 56, 16 round, 14 beside its words; the person chip 32 high, 3/10 in.
  poster: { width: 84, height: 56, radius: 16, gap: 14 },
  person: { height: 32, padLeft: 3, padRight: 10, gap: 6, face: 26 },
  box: { padY: 12, padX: 14, gap: 10, radius: 22 },
  warn: { padY: 10, padX: 14, radius: 16, gap: 8 },
  // The capsule's drop shadow (`.kap`: drop-shadow(0 4px 8px rgba(0,0,0,.35))).
  capsuleShadow: { y: 4, blur: 8, color: 'rgba(0, 0, 0, 0.35)' },
  // The time capsule's last stage: the last 10 seconds (and the number in --buzz).
  lowSeconds: 10,
} as const;

// Which buddies peek on which screen (the panels as drawn): the describer's, Tur öncesi's, the
// guesser's and the watcher's one pair; the waiting and the rival's the other.
export const PEEK_PAIRS = {
  near: ['1a80a9', '9c96bd'],
  far: ['d2fbb5', 'f280a5'],
} as const;
// Tur sonu's two buddies.
export const SUMMARY_BUDDIES = ['1a80a9', 'f280a5'] as const;
