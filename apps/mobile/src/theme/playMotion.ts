import { BAR_ICONS, type BarState } from './barIcons';
import { cubicBezier, EASE_IN_OUT, spring } from './markMotion';

// The game screens' motions (v43 report §5 "Hareket", the v45 file's .tk, .sgc, .hx-big, .sx-rec,
// .sx-eq, .nx-shut, .nbell and IC; docs/SPEC_V4.md §4.C, step 4.2c): the card's tilt, the role
// card's turn, the letter wheel, the record and its equaliser, İbre's cover, the bell's ring and the
// bar icons' springs. Pure, so playMotion.test.ts pins them; the components in src/components/game/
// and BarIcon.tsx play them on the UI thread (react-native-reanimated), the card's tilt following
// the finger there. The icons' springs are drawn frame by frame (BarIcon.tsx).

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

// Keyframes: a value at each point `at` (0..1) of the motion.
export type Keys = { at: readonly number[]; v: readonly number[] };

// A value through keyframes at `u` (0..1), each step eased by `curve` like a CSS animation's
// timing function (v45 animates the bell and the badge that way). The curve is passed, never a
// default: a worklet does not carry a default parameter's module constants to the UI thread.
export function keyAt(u: number, keys: Keys, curve: Curve): number {
  'worklet';
  const t = Math.max(0, Math.min(1, u));
  const { at, v } = keys;
  for (let i = 1; i < at.length; i++) {
    const b = at[i] as number;
    if (t <= b) {
      const a = at[i - 1] as number;
      const from = v[i - 1] as number;
      const to = v[i] as number;
      return from + (to - from) * bezierAt(curve, (t - a) / (b - a));
    }
  }
  return v[v.length - 1] as number;
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

// İbre's dial (v45: viewBox 300 x 168): the pivot at (150, 156), the face a half disc of radius 140.
export const DIAL = { width: 300, height: 168, cx: 150, cy: 156, r: 140 } as const;

// The half disc the dial's face and its cover share.
export function dialFacePath(): string {
  const { cx, cy, r } = DIAL;
  return `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`;
}

// ------------------------------------------------------------------ the bell (Mesajlar)

// A new notification rings the bell: it swings about its top, smaller each time, over 900 ms, each
// swing with the pop; the clapper swings the other way. The badge bumps from 50 % past full size.
export const BELL_RING_MS = 900;
export const BELL_RING = {
  rotate: { at: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1], v: [0, 16, -13, 9, -6, 3, 0] }, // degrees
  clapper: { at: [0, 0.15, 0.3, 0.45, 0.6, 1], v: [0, -2, 2, -1.4, 1, 0] }, // in the 24-unit box
} as const satisfies Record<string, Keys>;
export const BADGE_BUMP = { ms: 450, keys: { at: [0, 0.6, 1], v: [0.5, 1.22, 1] } } as const;

// ------------------------------------------------------------------ the bar icons' springs

// v45's icon springs (IC; kept from the earlier trials, v43 report §5). A two-bar icon forms from
// the logo's crossing: its bars start as the mark (two short bars, one down and right of the other)
// and spring into place after 120 ms. Pressed, it folds into the mark over 220 ms and springs out
// again. The lobby icon's bar turns flat with a softer spring when the table opens to the lobby, its
// dashed slot shrinking away at once; closed, the slot comes back after 120 ms.
export const ICON_SPRINGS = {
  hit: [320, 14], // stiffness, damping
  morph: [220, 20],
  formDelayMs: 120,
  formMs: 900,
  foldMs: 220,
  pressMs: 1000,
  morphMs: 900,
  slotAwayMs: 220,
  slotBackDelayMs: 120,
  slotBackMs: 260,
} as const;

// The mark's two bars in the icons' 24-unit box.
export const MARK_BARS = {
  a: { c: [10.3, 10.4], L: 14, r: 0 },
  b: { c: [13.7, 13.6], L: 14, r: 0 },
} as const satisfies Record<'a' | 'b', BarState>;

const HIT = spring(...ICON_SPRINGS.hit);
const MORPH = spring(...ICON_SPRINGS.morph);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// A bar between `from` (u = 0) and `to` (u = 1); a spring takes u past 1 and back.
export function mixBar(from: BarState, to: BarState, u: number): BarState {
  const lerp = (a: number, b: number) => a + (b - a) * u;
  return {
    c: [lerp(from.c[0], to.c[0]), lerp(from.c[1], to.c[1])],
    L: lerp(from.L, to.L),
    r: lerp(from.r, to.r),
    o: lerp(from.o ?? 1, to.o ?? 1),
    k: lerp(from.k ?? 1, to.k ?? 1),
  };
}

export type TwoBars = { a: BarState; b: BarState };
export type TwoBarKind = 'plus' | 'cross' | 'check';

// A two-bar icon `ms` into its forming spring (or, `pressed`, its fold and spring).
export function iconFormAt(kind: TwoBarKind, ms: number, pressed = false): TwoBars {
  const rest = BAR_ICONS[kind];
  const mix = (from: TwoBars, to: TwoBars, u: number): TwoBars => ({
    a: mixBar(from.a, to.a, u),
    b: mixBar(from.b, to.b, u),
  });
  if (pressed && ms < ICON_SPRINGS.foldMs) {
    return mix(rest, MARK_BARS, EASE_IN_OUT(ms / ICON_SPRINGS.foldMs));
  }
  const from = pressed ? ICON_SPRINGS.foldMs : ICON_SPRINGS.formDelayMs;
  return mix(MARK_BARS, rest, HIT(ms - from));
}

export type LobbyBars = { a: BarState; s: BarState };

// The lobby icon `ms` into turning to `to` from the other drawing ('lobby' ↔ 'minus').
export function lobbyMorphAt(to: 'lobby' | 'minus', ms: number): LobbyBars {
  const from = BAR_ICONS[to === 'minus' ? 'lobby' : 'minus'];
  const target = BAR_ICONS[to];
  const slot =
    to === 'minus'
      ? EASE_IN_OUT(clamp01(ms / ICON_SPRINGS.slotAwayMs))
      : EASE_IN_OUT(clamp01((ms - ICON_SPRINGS.slotBackDelayMs) / ICON_SPRINGS.slotBackMs));
  return { a: mixBar(from.a, target.a, MORPH(ms)), s: mixBar(from.s, target.s, slot) };
}
