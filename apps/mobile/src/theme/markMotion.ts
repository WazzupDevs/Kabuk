// The skall mark and its motion, as numbers: the two capsules, the four loaders (Tahterevalli,
// Kesişme, Buluş, Dönüş) and the empty, error and offline states. Pure (no React Native), so the
// curves are tested; src/components/Mark.tsx, Loader.tsx and EmptyState.tsx draw them with Views
// and native-driven transforms. Source: the skall design system → hareket.md; the drawings are the
// app icon's (scripts/icon/mark.ts → MAIN, SMALL).

// A drawing on the mark's 512 canvas: capsule size and how far the second capsule sits right and
// down of the first.
export type MarkDrawing = { w: number; h: number; dx: number; dy: number };

// Capsule 80 × 240, the second 52 right and 60 down: the overlap is 35 % of a capsule's width.
export const MARK_MAIN: MarkDrawing = { w: 80, h: 240, dx: 52, dy: 60 };
// 48 px and smaller: thicker capsules and a wider overlap, so the overlap stays visible.
export const MARK_SMALL: MarkDrawing = { w: 96, h: 236, dx: 56, dy: 54 };
export const MARK_SMALL_MAX = 48;

// The in-app mark is seen through a 340-unit window centred on the canvas (viewBox 86 86 340 340).
export const MARK_WINDOW = 340;
const CENTRE = 256;
const ORIGIN = CENTRE - MARK_WINDOW / 2;

// The gap the one-colour mark leaves around the second capsule (in a filled button).
export const MONO_GAP = 22;
// The offline state's flash: its full radius (units), at `flareScale` 1.
export const FLARE_RADIUS = 140;

export function drawingFor(size: number): MarkDrawing {
  return size <= MARK_SMALL_MAX ? MARK_SMALL : MARK_MAIN;
}

export type Rect = { x: number; y: number; w: number; h: number };

// The two capsules with the second `dx` right and `dy` down of the first, centred, in window units.
export function capsules(m: MarkDrawing, dx = m.dx, dy = m.dy): [Rect, Rect] {
  const x = CENTRE - (m.w + dx) / 2 - ORIGIN;
  const y = CENTRE - (m.h + dy) / 2 - ORIGIN;
  return [
    { x, y, w: m.w, h: m.h },
    { x: x + dx, y: y + dy, w: m.w, h: m.h },
  ];
}

// The app icon's continuous square (a superellipse, exponent 5) on a `side` canvas: the Mekan
// tab's ink tile.
export function squirclePath(side: number, points = 96): string {
  const r = side / 2;
  const at = (c: number) => Math.sign(c) * Math.abs(c) ** (2 / 5);
  const d: string[] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const x = (r + r * at(Math.cos(t))).toFixed(2);
    const y = (r + r * at(Math.sin(t))).toFixed(2);
    d.push(`${i === 0 ? 'M' : 'L'}${x} ${y}`);
  }
  return `${d.join('')}Z`;
}

// ------------------------------------------------------------------ curves

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const bump = (u: number) => Math.sin(Math.PI * clamp(u));

// CSS cubic-bezier(x1, y1, x2, y2) as a function of progress.
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (u: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let x = u;
    for (let i = 0; i < 8; i++) {
      const fx = ((ax * x + bx) * x + cx) * x - u;
      const d = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(fx) < 1e-5 || Math.abs(d) < 1e-6) break;
      x = clamp(x - fx / d);
    }
    return ((ay * x + by) * x + cy) * x;
  };
}

export const EASE_IN_OUT = cubicBezier(0.65, 0, 0.35, 1);
export const EASE_OUT = cubicBezier(0.2, 0.8, 0.2, 1);
const EASE_IN = cubicBezier(0.55, 0, 0.85, 0.2);

// A damped spring from 0 to 1 (stiffness, damping; mass 1), as a function of milliseconds.
export function spring(stiffness: number, damping: number): (ms: number) => number {
  const w0 = Math.sqrt(stiffness);
  const z = damping / (2 * w0);
  const wd = w0 * Math.sqrt(1 - z * z);
  return (ms) => {
    if (ms <= 0) return 0;
    const t = ms / 1000;
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  };
}
const MEET_SPRING = spring(320, 14);
const POP_SPRING = spring(380, 16);
const recoil = (ms: number) => {
  const t = Math.max(0, ms) / 1000;
  return 1 - Math.exp(-t / 0.11) * Math.cos(22 * t);
};

// Ease in and out over each half of the loop, holding at both ends.
const halves = (u: number) =>
  u < 0.5 ? EASE_IN_OUT(u * 2) / 2 : 0.5 + EASE_IN_OUT((u - 0.5) * 2) / 2;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ motions

// What a frame moves, all optional. Offsets in mark units, relative to the capsules at rest:
// `aX`/`aY` the first capsule, `bX`/`bY` the second (the overlap follows both), `bScale` around the
// second capsule's centre, `bOpacity` the second capsule and its overlap, `outline` the dashed
// outline where the second capsule belongs, `rot` degrees around the centre, `opacity` the whole
// mark, `flareScale`/`flareOpacity` the overlap-coloured flash where the capsules meet again.
export type Channel =
  | 'aX'
  | 'aY'
  | 'bX'
  | 'bY'
  | 'bScale'
  | 'bOpacity'
  | 'outline'
  | 'rot'
  | 'opacity'
  | 'flareScale'
  | 'flareOpacity';

// One looping motion: its period and a curve per channel (`t` in ms, 0 ≤ t < period).
export type Motion = { period: number; channels: Partial<Record<Channel, (t: number) => number>> };

// The capsules at rest: where `channels` move them from.
export type MarkScene = { m: MarkDrawing; dx: number; dy: number };

export type LoaderKind = 'seesaw' | 'swap' | 'meet' | 'spin';

// Moving the second capsule by `d` along one axis: each capsule takes half, so the pair stays
// centred.
const split = (d: (t: number) => number) => ({
  a: (t: number) => -d(t) / 2,
  b: (t: number) => d(t) / 2,
});

// The four loaders: one mark, only the offset changes.
export function loaderMotion(kind: LoaderKind, m: MarkDrawing): Motion {
  switch (kind) {
    case 'seesaw': {
      // Tahterevalli (full-screen loading, lobby): the capsules tip up and down.
      const period = 1400;
      const s = split((t) => m.dy * Math.cos(TAU * halves(t / period)) - m.dy);
      return { period, channels: { aY: s.a, bY: s.b } };
    }
    case 'swap': {
      // Kesişme (waiting for an answer, "yazıyor"): the capsules pass each other.
      const period = 1600;
      const s = split((t) => m.dx * Math.cos(TAU * halves(t / period)) - m.dx);
      return { period, channels: { aX: s.a, bX: s.b } };
    }
    case 'meet': {
      // Buluş (buttons, inline): the capsules part, hold, and snap back together.
      const period = 1500;
      const far = m.w + 26;
      const s = split((t) => {
        const dx =
          t < 480
            ? lerp(m.dx, far, EASE_IN_OUT(t / 480))
            : t < 690
              ? far
              : lerp(far, m.dx, MEET_SPRING(t - 690));
        return dx - m.dx;
      });
      return { period, channels: { aX: s.a, bX: s.b } };
    }
    case 'spin': {
      // Dönüş (refresh): two half turns with a hold after each.
      const period = 1800;
      const rot = (t: number) =>
        t < 700
          ? 180 * EASE_IN_OUT(t / 700)
          : t < 900
            ? 180
            : t < 1600
              ? 180 + 180 * EASE_IN_OUT((t - 900) / 700)
              : 360;
      return { period, channels: { rot } };
    }
  }
}

// Reduce motion: the mark stays put and breathes between full and 45 % opacity.
export const STILL_MOTION: Motion = {
  period: 1200,
  channels: { opacity: (t) => 0.45 + 0.55 * (0.5 + 0.5 * Math.cos((TAU * t) / 1200)) },
};

export type StateKind = 'empty' | 'error' | 'offline' | 'loading';

// The animated mark of the empty, error and offline states (`loading` is Tahterevalli). With reduce
// motion only opacities change.
export function stateMotion(
  kind: Exclude<StateKind, 'loading'>,
  m: MarkDrawing,
  reduce: boolean,
): { scene: MarkScene; motions: Motion[]; outline: boolean; flare: boolean } {
  const rest: MarkScene = { m, dx: m.dx, dy: m.dy };
  switch (kind) {
    case 'empty': {
      // The missing table: the second capsule is a dashed outline that breathes; the first bobs.
      const bob: Motion = {
        period: 2600,
        channels: {
          aY: (t) => (reduce ? 0 : -7 * Math.sin((TAU * t) / 2600)),
          bOpacity: () => 0,
        },
      };
      const breath: Motion = {
        period: 2000,
        channels: { outline: (t) => 0.4 + 0.35 * (0.5 + 0.5 * Math.sin((TAU * t) / 2000)) },
      };
      return { scene: rest, motions: [bob, breath], outline: true, flare: false };
    }
    case 'error': {
      // No meeting: the second capsule runs into the first, which is shoved back; no overlap forms.
      const far = m.w + 34;
      const period = 2800;
      const bX = (t: number) => {
        if (reduce || t < 900) return 0;
        if (t < 1250) return lerp(far, m.w, EASE_IN(seg(t, 900, 1250))) - far;
        return m.w + (far - m.w) * recoil(t - 1250) - far;
      };
      const aX = (t: number) => (reduce || t < 1250 ? 0 : -10 * bump(seg(t, 1250, 1470)));
      const motions: Motion[] = [{ period, channels: { aX, bX } }];
      if (reduce) motions.push(STILL_MOTION);
      return { scene: { m, dx: far, dy: m.dy }, motions, outline: false, flare: false };
    }
    case 'offline': {
      // The table dropped: the second capsule flickers out to a dashed outline, then pops back
      // with a flash where the capsules meet.
      const period = 3400;
      const FLICKER = [1, 0.2, 0.85, 0.12, 0.6, 0.08, 0.35];
      const bOpacity = (t: number) => {
        if (t < 900) return 1;
        if (t < 1500)
          return reduce ? 1 - seg(t, 900, 1500) : (FLICKER[Math.floor((t - 900) / 86) % 7] ?? 0);
        if (t < 2800) return 0;
        return seg(t, 2800, 2900);
      };
      const outline = (t: number) => {
        if (t < 900) return 0;
        if (t < 1500) return 0.5 * seg(t, 1200, 1500);
        if (t < 2800) return 0.55;
        return 0.55 * (1 - seg(t, 2800, 2950));
      };
      const bScale = (t: number) => (reduce || t < 2800 ? 1 : lerp(0.45, 1, POP_SPRING(t - 2800)));
      const flaring = (t: number) => !reduce && t >= 2860;
      return {
        scene: rest,
        motions: [
          {
            period,
            channels: {
              bOpacity,
              outline,
              bScale,
              // The flash grows from 20 to 140 units across (as a scale of 140) and fades.
              flareScale: (t) => (20 + 120 * EASE_OUT(seg(t, 2860, 3300))) / FLARE_RADIUS,
              flareOpacity: (t) => (flaring(t) ? 1 - seg(t, 2860, 3300) : 0),
            },
          },
        ],
        outline: true,
        flare: !reduce,
      };
    }
  }
}

// The centre of the overlap of two rectangles.
export function overlapCentre(a: Rect, b: Rect): { x: number; y: number } {
  return {
    x: (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2,
    y: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2,
  };
}

// A curve as an Animated interpolation over one period: progress 0…1 → value. Sampled every
// `stepMs` (and at the end), so native-driven animations follow eases, springs and holds.
export function sampleCurve(
  period: number,
  curve: (t: number) => number,
  stepMs = 20,
): { inputRange: number[]; outputRange: number[] } {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let t = 0; t < period; t += stepMs) {
    inputRange.push(t / period);
    outputRange.push(Number(curve(t).toFixed(4)));
  }
  inputRange.push(1);
  outputRange.push(Number(curve(period).toFixed(4)));
  return { inputRange, outputRange };
}

// ------------------------------------------------------------------ timing

// A loader shows 300 ms after the wait starts (a quick answer shows none); once shown it stays at
// least 600 ms, so it never flashes.
export const LOADER_SHOW_AFTER_MS = 300;
export const LOADER_MIN_VISIBLE_MS = 600;
