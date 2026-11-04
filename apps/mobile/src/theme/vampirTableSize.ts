// Vampir Köylü's capsule table (Aura v83, VampirRolun … VampirOylama12; the reference code's
// build.py → T, G8, G12): the table, the seats, the cards and the candles on a 360 × 760 phone, the
// whole scene scaled to the screen. Apart from colours and type, so the geometry, its test and the
// picture script read no React Native types (vampirTable.ts re-exports it).
export const TABLE = {
  // The scene: the design's phone, the table's middle on it.
  frame: { width: 360, height: 760, cx: 180, cy: 380 },
  // The table: a stadium standing up, half its width and half its straight part.
  half: 118,
  straight: 112,
  // The gold line and the top inside it (toon2.js → tableT).
  inner: 102,
  // Up to eight people the big seats, more the small (build.py → G8, G12): the seat's distance out
  // of the table's edge, the stool, the face, the card (size, distance in from the edge), the
  // candle's scale and its distance beside the card.
  many: 8,
  big: { off: 18, stool: 27, face: 38, card: [24, 33], cardIn: 27, candle: 0.62, candleBy: 22 },
  small: { off: 15, stool: 22, face: 30, card: [19, 26], cardIn: 22, candle: 0.5, candleBy: 17 },
  // The name pill's top under the seat's middle.
  nameTop: { big: 27, small: 19 },
  // The middle's stage: from x 105, 150 wide.
  stage: { left: 105, width: 150 },
  // The time's dial for each phase that has one: its middle's height and its radius.
  dial: {
    night: { y: 392, r: 34 },
    morning: { y: 470, r: 26 },
    vote: { y: 258, r: 22 },
  },
  // Where each phase's stage starts (build.py → screen).
  stageTop: { role: 212, night: 220, morning: 232, vote: 212, voteText: 290, end: 250, day: 212 },
  // The night's target under the dial, the vote's candidates.
  target: { top: 442, face: 44 },
  victim: 56,
  candidates: { top: 420, below: 86, face: 46, voter: 18, small: 30, smallVoter: 15 },
  winners: 48,
  // The role card at the middle (the panel's .rolec).
  card: { width: 104, height: 139, radius: 9, turn: -2 },
  cardCorner: 3,
  mate: 22,
  // The day's and the verdict's medallion (their panels are not redrawn: the table's middle as
  // before).
  medal: 148,
  medalFace: 72,
  // The round buttons at the top, and the foot.
  round: 44,
  roundTop: 22,
  side: 14,
  footBottom: 26,
  footGap: 10,
  foot: 130,
  sign: 40,
  secondary: 126,
} as const;

export type SeatSize = typeof TABLE.big | typeof TABLE.small;

export function seatSize(n: number): SeatSize {
  return n > TABLE.many ? TABLE.small : TABLE.big;
}
