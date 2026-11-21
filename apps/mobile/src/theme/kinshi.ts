import type { TextStyle } from 'react-native';

import type { KinshiBand } from './kinshiWord';
import {
  RISO,
  RISO_CARD_SIDE,
  RISO_PANEL_WIDTH,
  RISO_TYPE,
  risoDeck,
  risoDeckHeight,
  risoType,
} from './riso';

// Kinshi's tabu layout (Aura v85, the "Kinshi (tabu düzeni)" row and the `Kinshi` panel; the
// acceptance report of 4 Kasım). The panels are 390 × 844; every number here is theirs. What the
// card games share (the bar, the strip, the deck, the buddies) is theme/riso.ts.

const F800 = 'PlusJakartaSans_800ExtraBold';
const F600 = 'PlusJakartaSans_600SemiBold';
const t = risoType;

export const KINSHI_TYPE = {
  ...RISO_TYPE,
  // The card's word in its pink band (`.card .w`) and its five forbidden words (`.card li`).
  word: t(F800, 30, 34, 0.01),
  forbidden: t(F800, 20, 24, 0.02),
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
  // The others' Tur sonu count (`.rocnt`): 800/20, tabular.
  readOnlyCount: { ...t(F800, 20, 20), fontVariant: ['tabular-nums'] } as TextStyle,
  endScore: { ...t(F800, 30, 34), fontVariant: ['tabular-nums'] } as TextStyle,
} as const;

export const KINSHI = {
  ...RISO,
  // The score pill (`.score`): 44 high, 16 in on the left, 6 on the right, 10 apart; the team
  // bar 8 × 16, the divider 1 × 18, the turn chip 32 high.
  score: { height: 44, padLeft: 16, padRight: 6, gap: 10, bar: { w: 8, h: 16, r: 4 }, rule: 18 },
  // Where the pill's spaces may close to when the bar is short of room (320 dp): 8 on the left, 3
  // between; it keeps 4 clear of each round. Its chip ("Tur n/6", 13, not growing) is at most 70.
  scoreTight: { padLeft: 8, gap: 3, clear: 4, chipMax: 70 },
  scoreChip: 32,
  // Between the rounds' line and the pill when the pill goes under them.
  scoreLineGap: 8,
  // The card's words: the band 36 in, 24 down, 62 high; the list 44 in, 112 down, 206 high, a
  // 14 % line between rows.
  wordBand: { side: 36, top: 24, height: 62 },
  // Inside the ribbon's black outline in `kart-on.webp` (measured on the 888 px picture, row medians
  // across the words' width): the top line ends at 27.0 down the 296 card, the bottom one starts at
  // 86.33; so 3 under the band's top and 59.33 high (the pink proper starts at 28 under a light rim).
  wordPink: { top: 3, height: 59.33 },
  wordShadow: { color: 'rgba(20, 16, 22, 0.45)', y: 2 },
  list: { side: 44, top: 112, height: 206 },
  listInk: '#141016',
  listRule: 'rgba(20, 16, 22, 0.14)',
  wordInk: '#FFFFFF',
  // The counters under the deck (`.stats`): 37 under it (23 on the rival's), 8 apart.
  statsGap: 8,
  statsBelow: 37,
  statsBelowRival: 23,
  // The bell (`.buzzer`): 96 round, 22 from the bottom, a 6 ring of --buzz at 18 %.
  buzzer: { size: 96, bottom: 22, ring: 6, ringColor: 'rgba(255, 79, 139, 0.18)' },
  buzzerShadow: '0px 12px 26px rgba(0, 0, 0, 0.35)',
  // The guesser's panel (`.gpanel`): 264 wide, 48 below the deck's top, 18/16/12 in, 22 round.
  panel: { width: 264, top: 48, padTop: 18, padX: 16, padBottom: 12, radius: 22 },
  row: { padY: 10, padX: 4, gap: 10 },
  // The 3-2-1 (`KinshiGeriSayim`): a 220 glass round 250 from the top; its line 10 under it.
  countdown: { size: 220, top: 250, lineGap: 10 },
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
  // The others' read-only count (`.rocnt`, Aura v94 KinshiTurSonuDiger): glass, 48 high, at least
  // 48 wide, 24 round, 16 in.
  readOnlyCount: { size: 48, padX: 16 },
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
} as const;

// The deck at 320 dp and the largest text (Aura v95, kinshiSource; the project owner's decision of
// 5 Kasım): the card is the screen's width less 94 (296 on the 390 panels; never wider than that),
// 3:4, and its edges, fanned backs, shadow, word band, list, buddies and the guesser's panel scale
// with it. The words don't: 800/30 and 800/20, shrinking on one line to no less than 22 and 16.
export const KINSHI_CARD_SIDE = RISO_CARD_SIDE;
export const KINSHI_MIN_TYPE = { word: 22, forbidden: 16 } as const;

export function kinshiDeck(screenWidth: number) {
  const d = risoDeck(screenWidth);
  const z = (n: number) => n * d.scale;
  return {
    ...d,
    wordBand: {
      side: z(KINSHI.wordBand.side),
      top: z(KINSHI.wordBand.top),
      height: z(KINSHI.wordBand.height),
    },
    list: { side: z(KINSHI.list.side), top: z(KINSHI.list.top), height: z(KINSHI.list.height) },
    wordPink: { top: z(KINSHI.wordPink.top), height: z(KINSHI.wordPink.height) },
    // The guesser's panel keeps its 16 on each side of the card.
    panel: {
      width: d.card.width - (KINSHI.card.width - KINSHI.panel.width),
      top: z(KINSHI.panel.top),
    },
  };
}
export type KinshiDeck = ReturnType<typeof kinshiDeck>;

// The score pill's numbers (800/18, tabular): Plus Jakarta Sans's tabular figures (`zero.tf` …)
// and its hyphen, in font units of 1000 (`kinshiDeck.test.ts` reads them from the font file).
export const KINSHI_SCORE_FONT = { unitsPerEm: 1000, figure: 600, minus: 634 } as const;

function scoreWidth(n: number): number {
  const text = String(n);
  let units = 0;
  for (const ch of text) units += ch === '-' ? KINSHI_SCORE_FONT.minus : KINSHI_SCORE_FONT.figure;
  return (units / KINSHI_SCORE_FONT.unitsPerEm) * (KINSHI_TYPE.score.fontSize ?? 18);
}

// The pill at its tightest (every space at its least) and the room between the two 44 rounds.
// When even that does not fit (a team at −100 or under on 320 dp: 40 cards a turn, 3 turns a team,
// so the scores run from −120 to 120) the pill goes under the rounds on its own line rather than
// over them; otherwise it stays between them and its spaces close only as far as needed.
export function kinshiScorePill(
  a: number,
  b: number,
  screenWidth: number,
  kit: { side: number; round: number; edge: number },
): { fits: boolean; tightest: number; room: number } {
  const T = KINSHI.scoreTight;
  const S = KINSHI.score;
  const tightest =
    2 * kit.edge +
    T.padLeft +
    2 * S.bar.w +
    scoreWidth(a) +
    scoreWidth(b) +
    1 +
    5 * T.gap +
    T.chipMax +
    S.padRight;
  const room = screenWidth - 2 * kit.side - 2 * kit.round - 2 * T.clear;
  return { fits: tightest <= room, tightest, room };
}

// The 3-2-1's buddies and Oyun sonu's scene on a screen narrower than the 390 panels: the scene
// scales as a whole across (the buddies' sizes and places, the confetti's places; the confetti's
// bars and every height down the screen stay), so it is laid out as drawn rather than crowding.
// Never larger than drawn.
export function kinshiScene(screenWidth: number) {
  const k = Math.min(1, screenWidth / KINSHI_PANEL_WIDTH);
  const B = KINSHI.countdownBuddies;
  const E = KINSHI.endScene;
  return {
    scale: k,
    countdownBuddies: {
      height: B.height * k,
      places: B.places.map((p) => ({
        ...p,
        height: p.height * k,
        top: p.top * k,
        ...('left' in p ? { left: p.left * k } : { right: p.right * k }),
      })),
    },
    endBuddies: E.buddies.map((p) => ({
      ...p,
      height: p.height * k,
      below: p.below * k,
      ...('left' in p ? { left: p.left * k } : { right: p.right * k }),
    })),
    confetti: E.confetti.map((b) => ({ ...b, left: b.left * k })),
  };
}
export const KINSHI_PANEL_WIDTH = RISO_PANEL_WIDTH;

// The word's band on this deck, for `kinshiWordLayout`.
export function kinshiBand(d: KinshiDeck): KinshiBand {
  return {
    width: d.card.width - 2 * d.wordBand.side,
    height: d.wordBand.height,
    pink: d.wordPink,
    scale: d.scale,
  };
}

// The deck's box: its buddies, the card and the shadow under it, or, when what lies over it (the
// guesser's panel, its height measured) reaches lower than the card, down to that, so the counters
// under the deck keep their 37 below whichever is lower instead of sliding under the panel.
export const kinshiDeckHeight = (d: KinshiDeck, overlayBottom = 0): number =>
  risoDeckHeight(d, overlayBottom);

// Which buddies peek on which screen (the panels as drawn): the describer's, Tur öncesi's, the
// guesser's and the watcher's one pair; the waiting and the rival's the other.
export const PEEK_PAIRS = {
  near: ['1a80a9', '9c96bd'],
  far: ['d2fbb5', 'f280a5'],
} as const;
// Tur sonu's two buddies.
export const SUMMARY_BUDDIES = ['1a80a9', 'f280a5'] as const;
