import { cubicBezier } from './markMotion';

// The game screens' motions (v43 report §5 "Hareket", the v45 file's .tk, .sgc, .hx-big, .sx-rec,
// .sx-eq, .nx-shut, .nbell and IC; docs/SPEC_V4.md §4.C, step 4.2c): the card's tilt, the role
// card's turn, the letter wheel, the record and its equaliser, İbre's cover. Pure,
// so playMotion.test.ts pins them; the components in src/components/game/ play them on the UI thread
// (react-native-reanimated), the card's tilt following the finger there.

// v45's eases as cubic-bezier points: the components pass them to reanimated's Easing.bezier (it
// runs on the UI thread), the tests check them through cubicBezier.
export const CURVES = {
  back: [0.34, 1.56, 0.64, 1], // a pop that overshoots: a new card, the wheel landing
  swap: [0.4, 0, 0.6, 1], // a card leaving
  turn: [0.34, 1.3, 0.64, 1], // the role card turning
  cover: [0.6, 0, 0.3, 1], // İbre's cover swinging away
} as const satisfies Record<string, Curve>;

export type Curve = readonly [number, number, number, number];

// A cubic-bezier ease at `u` (0..1) on the UI thread: markMotion's cubicBezier as a worklet.
export function bezierAt(curve: Curve, u: number): number {
  'worklet';
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const [x1, y1, x2, y2] = curve;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let x = u;
  for (let i = 0; i < 8; i++) {
    const fx = ((ax * x + bx) * x + cx) * x - u;
    const d = (3 * ax * x + 2 * bx) * x + cx;
    if (Math.abs(fx) < 1e-5 || Math.abs(d) < 1e-6) break;
    x = Math.max(0, Math.min(1, x - fx / d));
  }
  return ((ay * x + by) * x + cy) * x;
}

export const EASE_SWAP = cubicBezier(...CURVES.swap);
export const EASE_TURN = cubicBezier(...CURVES.turn);
export const EASE_COVER = cubicBezier(...CURVES.cover);

// ------------------------------------------------------------------ the card (Kapsül Anlat)

// Held, the card leans toward the finger: up to 16° about the vertical axis and 12° about the
// horizontal one, a little smaller (98 %), its shadow moving away from the finger and a glare under
// it. `nx`, `ny` are the finger's place on the card, -1..1 from the centre.
export const TILT = {
  maxY: 16,
  maxX: 12,
  heldScale: 0.98,
  shadowX: 12, // px, opposite the finger
  shadowY: 18, // px, at rest
  shadowYRange: 6,
  perspective: 1000,
  // The held press: in fast, out a little slower; let go, the lean springs back.
  holdInMs: 90,
  holdOutMs: 180,
  release: { damping: 14, stiffness: 180 },
} as const;

export type Tilt = {
  rotateY: number; // degrees
  rotateX: number;
  scale: number;
  shadowX: number;
  shadowY: number;
  glareX: number; // 0..1 across the card
  glareY: number;
};

export function tiltFor(nx: number, ny: number, held = true): Tilt {
  'worklet';
  const x = Math.max(-1, Math.min(1, nx));
  const y = Math.max(-1, Math.min(1, ny));
  return {
    rotateY: x * TILT.maxY,
    rotateX: -y * TILT.maxX,
    scale: held ? TILT.heldScale : 1,
    shadowX: -x * TILT.shadowX,
    shadowY: TILT.shadowY + y * TILT.shadowYRange,
    glareX: (x + 1) / 2,
    glareY: (y + 1) / 2,
  };
}

// The finger's place on a card of `width` x `height`, -1..1 from the centre.
export function fingerOnCard(
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number] {
  'worklet';
  if (width <= 0 || height <= 0) return [0, 0];
  return [
    Math.max(-1, Math.min(1, (x / width - 0.5) * 2)),
    Math.max(-1, Math.min(1, (y / height - 0.5) * 2)),
  ];
}

// The deck: the next two cards show their edges behind the top one.
export const DECK = [
  { y: 7, rotate: -2.4, scale: 0.985 },
  { y: 14, rotate: 2.2, scale: 0.97 },
] as const;

// A new card rises from the first card behind it, over 460 ms with the pop.
export const CARD_IN = { ms: 460, from: DECK[0] } as const;

// How a card leaves: Doğru to the right, Pas to the left, "Yasak!" down and smaller; 260 ms.
export type CardExit = 'correct' | 'pass' | 'forbidden';
export const CARD_OUT_MS = 260;
export const CARD_EXITS: Record<CardExit, { x: number; y: number; rotate: number; scale: number }> =
  {
    correct: { x: 1.2, y: 0, rotate: 14, scale: 1 }, // x in card widths
    pass: { x: -1.2, y: 0, rotate: -14, scale: 1 },
    forbidden: { x: 0, y: 40, rotate: 0, scale: 0.86 }, // y in px
  };

// ------------------------------------------------------------------ the role card (Sahtekar)

// Held, the card turns over to its face in 550 ms with a slight overshoot; let go, it turns back.
// With reduce motion the face fades in and out in 120 ms instead.
export const ROLE_TURN = { ms: 550, degrees: 180, reducedMs: 120 } as const;

// ------------------------------------------------------------------ the letter wheel (Harf Kapmaca)

// The wheel ticks through 13 random letters, each a little slower (50 ms, then 14 ms more every
// tick), and lands on the round's letter with a pop from 130 % over 500 ms. The first question opens
// at 3 s (1.6 s with reduce motion, where the letter shows at once).
export const LETTER_WHEEL = {
  ticks: 14,
  firstMs: 50,
  slowMs: 14,
  landFrom: 1.3,
  landMs: 500,
  openMs: 3000,
  openReducedMs: 1600,
} as const;

// When each tick shows (ms from the start); the last is the round's letter.
export function letterWheelTimes(): number[] {
  const times: number[] = [];
  let t = 0;
  for (let k = 0; k < LETTER_WHEEL.ticks; k++) {
    t += LETTER_WHEEL.firstMs + k * LETTER_WHEEL.slowMs;
    times.push(t);
  }
  return times;
}

// ------------------------------------------------------------------ the record (Şarkıda Geçsin)

// The record turns once every 2.4 s; the equaliser's bars beside the singer rise and fall every
// 0.9 s, each out of step with the next.
export const VINYL_TURN_MS = 2400;
export const EQUALISER = {
  periodMs: 900,
  low: 0.3,
  // Each bar's head start (ms) in v45's order, left group then right group.
  offsets: [
    [0, 450, 200, 650],
    [300, 450, 750, 650],
  ] as const,
} as const;

// A bar's height (0..1) `ms` into the loop: from `low` up to 1 and back, eased.
export function equaliserHeight(ms: number, offset = 0): number {
  'worklet';
  const p = (((ms + offset) % EQUALISER.periodMs) + EQUALISER.periodMs) % EQUALISER.periodMs;
  const u = p / EQUALISER.periodMs;
  const wave = (1 - Math.cos(u * 2 * Math.PI)) / 2;
  return EQUALISER.low + (1 - EQUALISER.low) * wave;
}

// ------------------------------------------------------------------ İbre's cover

// At the result the cover over the dial swings 175° away about the dial's pivot and fades, after a
// 250 ms pause, over 1 s; the result card pops in after it.
export const COVER_OPEN = { delayMs: 250, ms: 1000, degrees: -175, resultDelayMs: 1000 } as const;

// İbre's dial (v45: viewBox 300 x 168): the pivot at (150, 156), the face a half disc of radius 140.
export const DIAL = { width: 300, height: 168, cx: 150, cy: 156, r: 140 } as const;

// The half disc the dial's face and its cover share.
export function dialFacePath(): string {
  const { cx, cy, r } = DIAL;
  return `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`;
}
