import { cubicBezier } from './markMotion';

// The game parts' timings and layout (v43 report §5; the v45 file's .tg-cd, .tg-flash, .tg-timer,
// .bx-ring and .conf; docs/SPEC_V4.md §4.C, step 4.2). Pure, so gameMotion.test.ts pins them; the
// components in src/components/game/ play them.

// The overshooting pop of the 3-2-1 steps and the toast (CSS cubic-bezier(.34,1.56,.64,1)).
export const EASE_BACK = cubicBezier(0.34, 1.56, 0.64, 1);
// A confetti piece's fall (CSS cubic-bezier(.3,.6,.5,1)).
export const EASE_FALL = cubicBezier(0.3, 0.6, 0.5, 1);

// "3", "2", "1", then "Başla": a step every 650 ms, each popping in from 40 % over 700 ms; the turn
// starts 250 ms after "Başla".
export const COUNT_IN = { steps: 4, stepMs: 650, tailMs: 250, popMs: 700, popFrom: 0.4 } as const;
export const COUNT_IN_MS = COUNT_IN.steps * COUNT_IN.stepMs + COUNT_IN.tailMs;

// The step showing `ms` after the start: 0, 1 and 2 are the numbers, 3 is "Başla"; null once done.
export function countInStep(ms: number): number | null {
  if (ms >= COUNT_IN_MS) return null;
  return Math.min(COUNT_IN.steps - 1, Math.floor(Math.max(0, ms) / COUNT_IN.stepMs));
}

// A timed turn's last seconds: the timer bar, its number and the ring turn orange.
export const LOW_SECONDS = 5;

export function isLow(secondsLeft: number): boolean {
  return secondsLeft > 0 && secondsLeft <= LOW_SECONDS;
}

// The bar and the ring move a second at a time, linearly (CSS: transition 1s linear).
export const TICK_MS = 1000;

// The share of the bar or ring still full. It runs a second ahead, as in v43: by the time the next
// tick arrives the bar has reached it, and it is empty when the time is up.
export function timeShare(secondsLeft: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, (secondsLeft - 1) / totalSeconds));
}

// The number's pulse in the last seconds: up to 108 % and back, once a second.
export const LOW_PULSE = { scale: 1.08, periodMs: 1000 } as const;

// The short notice at the top of a game: in with the pop over 400 ms (from 85 %, 10 px higher),
// gone after 1.6 s.
export const TOAST = { showMs: 1600, inMs: 400, fromScale: 0.85, fromY: -10 } as const;

// The ring counter around the person speaking or grabbing (viewBox 120): radius 53, stroke 6; the
// face sits 13 % in from the edge.
export const RING = { box: 120, radius: 53, stroke: 6, faceInset: 0.13 } as const;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING.radius;

// Confetti for the winners: 26 pieces 8 x 20 with round ends, each starting up to 0.9 s late,
// drifting up to 40 px sideways and turning up to 270° either way while it falls for 2.6 s.
export const CONFETTI = {
  count: 26,
  piece: { width: 8, height: 20, radius: 4 },
  fallMs: 2600,
  maxDelayMs: 900,
  driftPx: 40,
  turnDeg: 270,
  startY: -24,
} as const;

export type ConfettiPiece = {
  left: number; // 0..1 across the screen
  delayMs: number;
  dx: number;
  turnDeg: number;
  color: number; // an index into CONFETTI_COLORS (gameColors.ts)
};

// The pieces, the same for the same seed (v43 draws them at random; a seed keeps the E2E
// screenshots and the tests steady).
export function confettiPieces(seed = 1, colors = 4): ConfettiPiece[] {
  const next = mulberry32(seed);
  return Array.from({ length: CONFETTI.count }, (_, i) => ({
    left: next(),
    delayMs: Math.round(next() * CONFETTI.maxDelayMs),
    dx: Math.round(next() * 2 * CONFETTI.driftPx - CONFETTI.driftPx),
    turnDeg: Math.round(next() * 2 * CONFETTI.turnDeg - CONFETTI.turnDeg),
    color: i % colors,
  }));
}

// Mulberry32: a small seeded generator, uniform in [0, 1).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
