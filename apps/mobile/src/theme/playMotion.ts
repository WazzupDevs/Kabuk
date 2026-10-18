import { cubicBezier, spring } from './markMotion';

// The game screens' motions (v43 report §5 "Hareket", the v45 file's .tk, .sgc, .hx-big, .sx-rec,
// .sx-eq, .nx-shut and .nbell; docs/SPEC_V4.md §4.C, step 4.2c): the card's tilt, the role card's
// turn, the letter wheel, the record and its equaliser, İbre's cover and the bell's ring. Pure, so
// playMotion.test.ts pins them; the components in src/components/game/ and BarIcon.tsx play them,
// the tilt and the needle on the UI thread (react-native-reanimated).

// v45's eases.
export const EASE_SWAP = cubicBezier(0.4, 0, 0.6, 1); // a card leaving
export const EASE_TURN = cubicBezier(0.34, 1.3, 0.64, 1); // the role card turning
export const EASE_COVER = cubicBezier(0.6, 0, 0.3, 1); // İbre's cover swinging away

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
export const ROLE_TURN = { ms: 550, degrees: 180 } as const;

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

// ------------------------------------------------------------------ the bell (Mesajlar)

// A new notification rings the bell: it swings about its top, smaller each time, over 900 ms; the
// clapper swings the other way.
export const BELL_RING_MS = 900;
export const BELL_RING = {
  at: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
  rotate: [0, 16, -13, 9, -6, 3, 0], // degrees
  clapper: [0, -2, 2, -1.4, 1, 0, 0], // in the 24-unit box
} as const;

// The bell's turn (or the clapper's shift) at `u` (0..1) through the ring: straight between keys.
export function bellAt(u: number, track: readonly number[] = BELL_RING.rotate): number {
  'worklet';
  const t = Math.max(0, Math.min(1, u));
  const at = BELL_RING.at;
  for (let i = 1; i < at.length; i++) {
    const b = at[i] as number;
    if (t <= b) {
      const a = at[i - 1] as number;
      const f = (t - a) / (b - a);
      const from = track[i - 1] as number;
      const to = track[i] as number;
      return from + (to - from) * f;
    }
  }
  return track[track.length - 1] as number;
}

// ------------------------------------------------------------------ the bar icons' springs

// Shown for the first time, a bar icon's two bars start in the mark's place and spring into the
// icon after 120 ms (v45: IC → form); the lobby icon morphs between lobby and minus.
export const ICON_FORM = { delayMs: 120, settleMs: 900 } as const;
export const ICON_HIT = spring(320, 14); // forming
export const ICON_MORPH = spring(220, 20); // lobby ↔ minus

// The mark's two bars, where a forming icon starts.
export const ICON_MARK = {
  a: { c: [10.3, 10.4], L: 14, r: 0 },
  b: { c: [13.7, 13.6], L: 14, r: 0 },
} as const;
