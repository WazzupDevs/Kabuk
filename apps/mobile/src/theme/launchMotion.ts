// The skall launch (the design system → hareket.md → "Soğuk açılış", "İlk açılış", "Hızlı açılış";
// choreography from the "skall Hareket" page): from the system splash's frame the mark turns into
// the wordmark (cold, first) or breathes once (quick), and the app opens through a window that grows
// from the capsules' overlap. Every function is a worklet: src/features/launch/LaunchCurtain.tsx runs
// them on the UI thread each frame (Reanimated), vitest runs them as plain functions. Units are dp;
// times are ms from the start of the system splash, which ends at `N`.

import { MARK_MAIN, type MarkDrawing } from './markMotion';
import { WORDMARK_BOX, WORDMARK_L } from './wordmark';

export type Rect = [x: number, y: number, w: number, h: number];
export type LaunchKind = 'cold' | 'first' | 'quick';

// The system splash (scripts/icon/mark.ts → SPLASH_REACH): the mark's farthest point 70 dp from the
// centre. The wordmark the mark turns into is 264 dp wide.
export const SPLASH_REACH_DP = 70;
export const LAUNCH_WORD_WIDTH = 264;
// The window's last scale: the mark's or the ll's capsules grown past the screen.
const WORD_WINDOW = 90;
const MARK_WINDOW = 60;
// The waits while the app is not ready yet: the ll's seesaw, the mark's Tahterevalli, the reduced
// breath.
const WORD_WAIT = 1200;
const MARK_WAIT = 1400;
const STILL_WAIT = 1200;

// ------------------------------------------------------------------ curves

function clamp(v: number, a = 0, b = 1): number {
  'worklet';
  return v < a ? a : v > b ? b : v;
}
export function seg(t: number, a: number, b: number): number {
  'worklet';
  return clamp((t - a) / (b - a));
}
function lerp(a: number, b: number, u: number): number {
  'worklet';
  return a + (b - a) * u;
}
function bump(u: number): number {
  'worklet';
  return Math.sin(Math.PI * clamp(u));
}
// CSS cubic-bezier(x1, y1, x2, y2) at progress u.
function bezier(x1: number, y1: number, x2: number, y2: number, u: number): number {
  'worklet';
  if (u <= 0) return 0;
  if (u >= 1) return 1;
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
    x = clamp(x - fx / d);
  }
  return ((ay * x + by) * x + cy) * x;
}
function easeInOut(u: number): number {
  'worklet';
  return bezier(0.65, 0, 0.35, 1, u);
}
function easeOut(u: number): number {
  'worklet';
  return bezier(0.2, 0.8, 0.2, 1, u);
}
// The window's exponential growth.
function easeIn(u: number): number {
  'worklet';
  return bezier(0.55, 0, 0.85, 0.2, u);
}
// A damped spring from 0 to 1 (stiffness, damping; mass 1) after `ms`.
export function spring(stiffness: number, damping: number, ms: number): number {
  'worklet';
  if (ms <= 0) return 0;
  const w0 = Math.sqrt(stiffness);
  const z = damping / (2 * w0);
  const wd = w0 * Math.sqrt(1 - z * z);
  const t = ms / 1000;
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
}

// ------------------------------------------------------------------ rectangles

function rectsAt(m: MarkDrawing, cx: number, cy: number, s: number): [Rect, Rect] {
  'worklet';
  const ax = cx - ((m.w + m.dx) * s) / 2;
  const ay = cy - ((m.h + m.dy) * s) / 2;
  return [
    [ax, ay, m.w * s, m.h * s],
    [ax + m.dx * s, ay + m.dy * s, m.w * s, m.h * s],
  ];
}
function scaleR(r: Rect, ox: number, oy: number, sx: number, sy = sx): Rect {
  'worklet';
  return [ox + (r[0] - ox) * sx, oy + (r[1] - oy) * sy, r[2] * sx, r[3] * sy];
}
function shiftR(r: Rect, dx: number, dy: number): Rect {
  'worklet';
  return [r[0] + dx, r[1] + dy, r[2], r[3]];
}
function lerpR(a: Rect, b: Rect, u: number): Rect {
  'worklet';
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
}
export function overlapOf(a: Rect, b: Rect): [number, number] {
  'worklet';
  return [
    (Math.max(a[0], b[0]) + Math.min(a[0] + a[2], b[0] + b[2])) / 2,
    (Math.max(a[1], b[1]) + Math.min(a[1] + a[3], b[1] + b[3])) / 2,
  ];
}

// How far the mark reaches from its centre, in mark units: the far side of a cap (the same as
// scripts/icon/mark.ts → reach, checked by launchMotion.test.ts).
export function markReach(m: MarkDrawing): number {
  const [a, b] = rectsAt(m, 0, 0, 1);
  return Math.max(
    ...[a, b].flatMap(([x, y, w, h]) =>
      [y + w / 2, y + h - w / 2].map((capY) => Math.hypot(x + w / 2, capY) + w / 2),
    ),
  );
}

// ------------------------------------------------------------------ geometry

// Everything the frames need, for a screen centred on (cx, cy). Built once on the JS thread.
export type LaunchGeometry = {
  cx: number;
  cy: number;
  // The mark as the system splash draws it.
  a0: Rect;
  b0: Rect;
  // The wordmark: its ll and where its letters sit (offset and scale of its 1000-unit drawing).
  llA: Rect;
  llB: Rect;
  wordX: number;
  wordY: number;
  wordScale: number;
  // How far right (wordmark units) the letters start: behind the first l's middle.
  letterStart: number;
};

export function launchGeometry(cx: number, cy: number): LaunchGeometry {
  const sM = SPLASH_REACH_DP / markReach(MARK_MAIN);
  const [a0, b0] = rectsAt(MARK_MAIN, cx, cy, sM);
  const k = LAUNCH_WORD_WIDTH / WORDMARK_BOX.w;
  const wordX = cx - (WORDMARK_BOX.x + WORDMARK_BOX.w / 2) * k;
  const wordY = cy - (WORDMARK_BOX.y + WORDMARK_BOX.h / 2) * k;
  const llA: Rect = [
    wordX + WORDMARK_L.x * k,
    wordY + WORDMARK_L.y * k,
    WORDMARK_L.w * k,
    WORDMARK_L.h * k,
  ];
  return {
    cx,
    cy,
    a0,
    b0,
    llA,
    llB: shiftR(llA, WORDMARK_L.offset * k, 0),
    wordX,
    wordY,
    wordScale: k,
    letterStart: WORDMARK_L.x + WORDMARK_L.w / 2 - WORDMARK_BOX.x,
  };
}

// ------------------------------------------------------------------ timelines

// Phase starts (ms). `gate`: where the launch waits for the app; times from it on move by `wait`
// (whole cycles of the wait motion), times before it do not.
export type LaunchTimeline = {
  N: number;
  gate: number;
  cycle: number;
  R0: number;
  R1: number;
  // cold and first
  C0: number;
  C1: number;
  M0: number;
  L0: number;
  G0: number;
  G1: number;
  // first
  S0: number;
  J0: number;
  // quick
  P0: number;
  P1: number;
  // reduced
  F0: number;
  F1: number;
};

export function launchTimeline(kind: LaunchKind, reduce: boolean, wait: number): LaunchTimeline {
  'worklet';
  const none = { C0: -1, C1: -1, M0: -1, L0: -1, G0: -1, G1: -1, S0: -1, J0: -1, P0: -1, P1: -1 };
  if (reduce) {
    if (kind === 'quick') {
      return {
        ...none,
        N: 500,
        F0: -1,
        F1: -1,
        gate: 600,
        cycle: STILL_WAIT,
        R0: 600 + wait,
        R1: 850 + wait,
      };
    }
    const gate = kind === 'cold' ? 1250 : 1600;
    return {
      ...none,
      N: 500,
      F0: 500,
      F1: 760,
      gate,
      cycle: STILL_WAIT,
      R0: gate + wait,
      R1: gate + 250 + wait,
    };
  }
  if (kind === 'quick') {
    return {
      ...none,
      N: 500,
      F0: -1,
      F1: -1,
      P0: 500,
      P1: 800,
      gate: 760,
      cycle: MARK_WAIT,
      R0: 760 + wait,
      R1: 1160 + wait,
    };
  }
  // The first launch parts and meets the capsules first; then both write the word.
  const d = kind === 'first' ? 1000 : 0;
  return {
    ...none,
    N: 500,
    F0: -1,
    F1: -1,
    S0: kind === 'first' ? 500 : -1,
    J0: kind === 'first' ? 1150 : -1,
    C0: 500 + d,
    C1: 620 + d,
    M0: 620 + d,
    L0: 760 + d,
    G0: 1240 + d,
    G1: 1480 + d,
    gate: 1480 + d,
    cycle: WORD_WAIT,
    R0: 1530 + d + wait,
    R1: 1950 + d + wait,
  };
}

// ------------------------------------------------------------------ frames

export type LaunchWindow = {
  // The window's capsules, grown from the overlap; inside them the app shows.
  a: Rect;
  b: Rect;
  // The white that fills the window as it opens, and its thin rim.
  white: number;
  rim: number;
};

export type LaunchScene = {
  a: Rect; // the first capsule
  b: Rect; // the second capsule
  marks: number; // opacity of the capsules, the letters and the glint
  letters: [number, number, number]; // each letter's offset to the right (wordmark units)
  lettersClip: number; // letters show only left of this x (behind the first l)
  glow: number;
  glint: { x: number; opacity: number } | null;
  ring: { cx: number; cy: number; r: number; width: number; opacity: number } | null;
  flare: { cx: number; cy: number; r: number; opacity: number } | null;
  window: LaunchWindow | null;
  curtain: number; // the whole curtain's opacity (the reduced launch fades it out)
  appScale: number; // the app settles from 1.06 as the window opens
  origin: [number, number]; // around this point the app scales
  done: boolean;
};

// A scene that draws nothing: the curtain clear. A frame that throws gives it, and the curtain is
// dropped (src/lib/launchGuard.ts).
export const CLEAR_SCENE: LaunchScene = {
  a: [0, 0, 0, 0],
  b: [0, 0, 0, 0],
  marks: 0,
  letters: [0, 0, 0],
  lettersClip: 0,
  glow: 0,
  glint: null,
  ring: null,
  flare: null,
  window: null,
  curtain: 0,
  appScale: 1,
  origin: [0, 0],
  done: true,
};

// Whether the launch is waiting for the app at `t` (the wait motion plays).
export function launchWaiting(T: LaunchTimeline, t: number, wait: number): boolean {
  'worklet';
  return t >= T.gate && t < T.gate + wait;
}

function opening(A: Rect, B: Rect, u: number, top: number): LaunchWindow {
  'worklet';
  const [ox, oy] = overlapOf(A, B);
  const s = Math.pow(top, easeIn(u));
  return {
    a: scaleR(A, ox, oy, s),
    b: scaleR(B, ox, oy, s),
    white: 1 - seg(u, 0.06, 0.42),
    rim: 1 - seg(u, 0.35, 0.9),
  };
}

// The mark becomes the ll: a crouch, a springing rise, the letters out from behind the first l.
function wordStage(
  g: LaunchGeometry,
  T: LaunchTimeline,
  t: number,
): [Rect, Rect, [number, number, number]] {
  'worklet';
  let A: Rect;
  let B: Rect;
  if (t < T.C1) {
    const c = bump(seg(t, T.C0, T.C1));
    A = scaleR(g.a0, g.cx, g.cy, 1 + 0.05 * c, 1 - 0.07 * c);
    B = scaleR(g.b0, g.cx, g.cy, 1 + 0.05 * c, 1 - 0.07 * c);
  } else {
    A = lerpR(g.a0, g.llA, spring(220, 20, t - T.M0));
    B = lerpR(g.b0, g.llB, spring(220, 20, t - T.M0 - 40));
  }
  const letter = (delay: number) => {
    'worklet';
    return g.letterStart * (1 - spring(260, 26, t - T.L0 - delay));
  };
  return [A, B, [letter(0), letter(24), letter(48)]];
}

export function launchFrame(
  kind: LaunchKind,
  reduce: boolean,
  g: LaunchGeometry,
  t: number,
  wait: number,
): LaunchScene {
  'worklet';
  const T = launchTimeline(kind, reduce, wait);
  const waiting = launchWaiting(T, t, wait);
  const away: [number, number, number] = [g.letterStart, g.letterStart, g.letterStart];
  const scene: LaunchScene = {
    a: g.a0,
    b: g.b0,
    marks: 1,
    letters: away,
    lettersClip: g.a0[0] + g.a0[2] / 2 + 10,
    glow: 0,
    glint: null,
    ring: null,
    flare: null,
    window: null,
    curtain: 1,
    appScale: reduce ? 1 : 1.06,
    origin: overlapOf(g.a0, g.b0),
    done: t >= T.R1,
  };

  if (reduce) {
    // Only opacities: the mark fades into the wordmark, then the curtain fades from the app.
    if (kind !== 'quick' && t >= T.F0) {
      const u = seg(t, T.F0, T.F1);
      if (u < 0.45) scene.marks = 1 - u / 0.45;
      else {
        scene.a = g.llA;
        scene.b = g.llB;
        scene.letters = [0, 0, 0];
        scene.marks = (u - 0.45) / 0.55;
      }
    }
    if (waiting) {
      scene.marks *= 0.45 + 0.55 * (0.5 + 0.5 * Math.cos((2 * Math.PI * (t - T.gate)) / T.cycle));
    }
    if (t >= T.R0) scene.curtain = 1 - seg(t, T.R0, T.R1);
    scene.lettersClip = scene.a[0] + scene.a[2] / 2 + 10;
    return scene;
  }

  scene.glow = 0.9 * easeOut(seg(t, T.N, T.N + 700));
  let A = g.a0;
  let B = g.b0;
  const om = overlapOf(g.a0, g.b0);

  if (kind === 'quick') {
    // One breath; the window opens straight from the mark's overlap.
    const s = 1 + 0.075 * bump(seg(t, T.P0, T.P1));
    A = scaleR(g.a0, g.cx, g.cy, s);
    B = scaleR(g.b0, g.cx, g.cy, s);
    if (t >= T.P0 + 90) {
      const uf = seg(t, T.P0 + 90, T.P0 + 520);
      scene.flare = { cx: om[0], cy: om[1], r: 14 + 60 * easeOut(uf), opacity: 0.8 * (1 - uf) };
    }
    if (waiting) {
      // Tahterevalli on the mark.
      const u = ((t - T.gate) % T.cycle) / T.cycle;
      const p = u < 0.5 ? easeInOut(u * 2) / 2 : 0.5 + easeInOut((u - 0.5) * 2) / 2;
      const k = A[3] / MARK_MAIN.h;
      const d = (MARK_MAIN.dy * Math.cos(2 * Math.PI * p) - MARK_MAIN.dy) * k;
      A = shiftR(A, 0, -d / 2);
      B = shiftR(B, 0, d / 2);
    }
    if (t >= T.R0) scene.window = opening(A, B, seg(t, T.R0, T.R1), MARK_WINDOW);
  } else {
    if (kind === 'first' && t >= T.S0 && t < T.C0) {
      // Two tables: the capsules part, bob, and meet with a flash where they overlap.
      const aA = shiftR(g.a0, -64, 0);
      const aB = shiftR(g.b0, 64, 0);
      if (t < T.J0) {
        const u = spring(180, 18, t - T.S0);
        const bob =
          3.2 *
          Math.sin((2 * Math.PI * (t - T.S0 - 260)) / 900) *
          seg(t, T.S0 + 260, T.S0 + 420) *
          (1 - seg(t, T.J0 - 160, T.J0));
        A = shiftR(lerpR(g.a0, aA, u), 0, -bob);
        B = shiftR(lerpR(g.b0, aB, u), 0, bob);
      } else {
        const u = spring(320, 14, t - T.J0);
        A = lerpR(aA, g.a0, u);
        B = lerpR(aB, g.b0, u);
        const tc = T.J0 + 105;
        if (t >= tc) {
          const ur = seg(t, tc, tc + 650);
          const uf = seg(t, tc, tc + 520);
          scene.ring = {
            cx: om[0],
            cy: om[1],
            r: 14 + 150 * easeOut(ur),
            width: 6 * (1 - ur) + 0.5,
            opacity: 0.85 * (1 - ur),
          };
          scene.flare = { cx: om[0], cy: om[1], r: 18 + 90 * easeOut(uf), opacity: 1 - uf };
        }
      }
    } else if (t >= T.C0) {
      const [wa, wb, letters] = wordStage(g, T, t);
      A = wa;
      B = wb;
      scene.letters = letters;
    }
    if (waiting) {
      // The ll seesaw until the app is ready.
      const u = ((t - T.gate) % T.cycle) / T.cycle;
      const p = u < 0.5 ? easeInOut(u * 2) / 2 : 0.5 + easeInOut((u - 0.5) * 2) / 2;
      const dy = 0.22 * g.llA[3] * Math.sin(2 * Math.PI * p);
      A = shiftR(A, 0, -dy / 2);
      B = shiftR(B, 0, dy / 2);
    }
    if (t >= T.G0 && t <= T.G1) {
      const u = seg(t, T.G0, T.G1);
      scene.glint = {
        x: lerp(g.llA[0] - 44, g.llB[0] + g.llB[2] + 14, easeInOut(u)),
        opacity: 0.9 * bump(u),
      };
    }
    if (t >= T.R0) scene.window = opening(A, B, seg(t, T.R0, T.R1), WORD_WINDOW);
  }

  scene.a = A;
  scene.b = B;
  scene.lettersClip = A[0] + A[2] / 2 + 10;
  scene.origin = overlapOf(A, B);
  if (t >= T.R0) scene.appScale = 1.06 - 0.06 * easeOut(seg(t, T.R0, T.R1));
  return scene;
}

// ------------------------------------------------------------------ which launch

// `stored`: what the last launch saved (null: never launched since install). `build`: the running
// update's id. `inMemory`: this JS context launched before (the app was reopened while in memory).
export function launchKindFrom(
  stored: string | null,
  build: string,
  inMemory: boolean,
): LaunchKind {
  if (inMemory) return 'quick';
  if (stored === null) return 'first';
  try {
    const last: unknown = JSON.parse(stored);
    const lastBuild =
      typeof last === 'object' && last !== null && 'build' in last ? last.build : undefined;
    // An update was applied since: quick.
    return lastBuild === build ? 'cold' : 'quick';
  } catch {
    return 'cold';
  }
}

export function launchRecord(build: string): string {
  return JSON.stringify({ build });
}

// ------------------------------------------------------------------ paths

// A letter outline (absolute M, L, Q and Z only) as commands and their numbers, parsed once.
export type ParsedPath = { cmds: string[]; nums: number[][] };

export function parsePath(d: string): ParsedPath {
  const cmds: string[] = [];
  const nums: number[][] = [];
  for (const [, cmd, args] of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
    cmds.push(cmd ?? '');
    nums.push(
      (args ?? '')
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number),
    );
  }
  return { cmds, nums };
}

// The outline moved `dx` to the right (every x coordinate; the paths have x y pairs only).
export function shiftedPath(p: ParsedPath, dx: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < p.cmds.length; i++) {
    d += p.cmds[i];
    const n = p.nums[i] ?? [];
    for (let j = 0; j < n.length; j++) {
      const v = (n[j] ?? 0) + (j % 2 === 0 ? dx : 0);
      d += (j > 0 ? ' ' : '') + Math.round(v * 10) / 10;
    }
  }
  return d;
}

// The flare's circle. It is filled with a radial gradient, and Android's RadialGradient refuses a
// zero radius (it throws, and the app goes down): with no flare the circle keeps a 1 dp radius,
// unseen at opacity 0.
const HIDDEN_FLARE_R = 1;

export function flareCircle(f: LaunchScene['flare']): {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
} {
  'worklet';
  return f
    ? { cx: f.cx, cy: f.cy, r: Math.max(HIDDEN_FLARE_R, f.r), opacity: f.opacity }
    : { cx: 0, cy: 0, r: HIDDEN_FLARE_R, opacity: 0 };
}

// The glint: a 30 dp bar leaning 16° (left edge at `x` on the screen's middle line), drawn between
// `top` and `bottom`.
export function glintPath(x: number, cy: number, top: number, bottom: number): string {
  'worklet';
  const lean = Math.tan((16 * Math.PI) / 180);
  const at = (y: number) => {
    'worklet';
    return x + lean * (cy - y);
  };
  return `M${at(top)} ${top}L${at(top) + 30} ${top}L${at(bottom) + 30} ${bottom}L${at(bottom)} ${bottom}Z`;
}
