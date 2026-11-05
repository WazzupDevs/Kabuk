// Vampir Köylü's capsule table (Aura v83 and v93, VampirRolKarti … VampirHata; the reference code's
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
  // The time's dial for each phase that has one: its middle (x the table's middle unless given)
  // and its radius. `narrow` the vote's with the large type, at the pill's right (VampirOylamaDar).
  dial: {
    night: { y: 392, r: 34 },
    morning: { y: 470, r: 26 },
    day: { y: 420, r: 34 },
    vote: { y: 258, r: 22 },
    verdict: { y: 488, r: 26 },
    narrow: { x: 222, y: 216, r: 22 },
  },
  // Where each phase's stage starts (build.py → screen): `card` the closed role card's
  // (VampirRolKarti), `role` the open one's (VampirRolun).
  stageTop: {
    card: 206,
    role: 212,
    night: 220,
    morning: 232,
    day: 258,
    vote: 212,
    voteText: 290,
    verdict: 236,
    end: 250,
  },
  // The vote with the large type (VampirOylamaDar): the pill and the dial on one row, the words
  // under them, only the first candidate at the middle; a seat's name at most 84 wide (75 on a
  // 320 phone), its distance from the screen's edge, "Sen" at the face's right.
  narrow: {
    pill: { top: 203, left: 96, width: 92 },
    words: { top: 250, left: 104, width: 152 },
    candidate: 482,
    name: 84,
    nameTop: 26,
    edge: 4,
    you: { top: -12, left: 25 },
  },
  // The night's target under the dial, the vote's candidates.
  target: { top: 442, face: 44 },
  victim: 56,
  candidates: { top: 420, below: 86, face: 46, voter: 18, small: 30, smallVoter: 15 },
  winners: 48,
  // The role card at the middle (the panel's .rolec).
  card: { width: 104, height: 139, radius: 9, turn: -2 },
  cardCorner: 3,
  // The ring to hold at the closed card's middle: 46 across, its 2 edge and 9 halo.
  hold: { size: 46, edge: 2, halo: 9 },
  mate: 22,
  // The verdict's vote count under the face (.vict .oy), how far it sits over the face's foot.
  votes: { height: 17, over: 7 },
  // The loader at the middle while the phone's own view is on its way (.spin), and its top.
  loader: { size: 56, top: 352 },
  // The connection error's glass block (.err): its sides, top, corner, padding, the mark.
  error: { side: 40, top: 300, radius: 24, padTop: 22, padSide: 20, padBottom: 20, mark: 40 },
  // The owner's "Geceyi başlat" beside "Hazırım" (.btn.sec, 150 wide).
  begin: 150,
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
