import { bezier } from './launchMotion';

// The first screen's scene (yeni arayüz tuvali, pano 47 KayitAcilis: "Aynı mekanda, aynı
// masada."): the riso venue rises in, the table slides up, four buddies come up behind it one after
// another, then the logo pops and the words come up. Once, about 2.3 s (the owner's call, 17 Kasım:
// the whole scene in 2–3 s); after that only the board's endless loops go on (the buddies' bob, the
// lamp's swing, the stars' twinkle). Every entrance is a function of the time since the scene began,
// so its end is one frame whether it ran, was cut short ("Başla") or never ran (reduce motion; back
// from "Başlamadan önce", K-28). Pure; introScene.test.ts pins it. The frame functions are worklets
// (app/(auth)/welcome.tsx, src/aura/IntroStage.tsx).

// The board's stage, in its 390 wide frame (`.stage`, 470 high); the buddies come up inside the
// top 376 (`.kw`), so they rise from behind the table.
export const INTRO_STAGE = { width: 390, height: 470, clip: 376 } as const;

// The pictures' sizes (assets/riso/acilis, drawn at a third of their pixels), as width / height.
const ASPECT = { ground: 1170 / 600, lamp: 420 / 570, table: 1020 / 450, buddy: 282 / 546 };

export type StageBox = { left: number; top: number; width: number; height: number };
const box = (left: number, top: number, width: number, aspect: number): StageBox => ({
  left,
  top,
  width,
  height: width / aspect,
});

// Where everything stands in the stage's frame (KayitAcilis `.stage img` and `.ent`).
export const INTRO_PLACES = {
  ground: box(0, 0, 390, ASPECT.ground),
  lamp: box(125, 0, 140, ASPECT.lamp),
  stars: [box(26, 196, 18, 1), box(356, 186, 16, 1), box(178, 214, 12, 1)],
  buddies: [
    box(28, 200, 94, ASPECT.buddy),
    box(104, 186, 94, ASPECT.buddy),
    box(192, 192, 94, ASPECT.buddy),
    box(268, 204, 94, ASPECT.buddy),
  ],
  table: box(25, 310, 340, ASPECT.table),
} as const;

// When each entrance starts and how long it takes, in ms from the scene's start (the board's
// animation delays and durations).
export const INTRO = {
  // `.bgl`: up .6s ease-out.
  groundAt: 0,
  groundMs: 600,
  // `.msa`: slide .55s cubic-bezier(.2,.8,.2,1) .15s.
  tableAt: 150,
  tableMs: 550,
  // `.ent`: drop .7s cubic-bezier(.3,.7,.3,1), .35s, .5s, .65s, .8s.
  buddyAt: [350, 500, 650, 800],
  buddyMs: 700,
  // `.acx .wm`: pop .6s cubic-bezier(.3,.7,.3,1) 1.25s.
  logoAt: 1250,
  logoMs: 600,
  // `.acx .kh`, `.acx .kd`, `.kft`: up .5s ease-out 1.45s, 1.6s, 1.8s.
  titleAt: 1450,
  bodyAt: 1600,
  footAt: 1800,
  wordsMs: 500,
  // Nothing comes in after this: the foot's 1.8 s + .5 s.
  endMs: 2300,
} as const;

// The board's endless loops (bob, swing, tw), each ease-in-out there and back; with reduce motion
// they stand at rest (no turn, no lift, the star at its full size). Delays in ms from the scene's
// start.
export const INTRO_LOOPS = {
  // `.ent img`: bob 2.6s, up 5 px and turned by its own angle at the middle.
  bob: { ms: 2600, px: 5, delays: [1200, 1600, 2000, 1400], deg: [-2, 2, -1.5, 2.5] },
  // `.lmp`: swing 3.2s .4s, -3° → 3° → -3° around the cord's top (70 px into the lamp).
  swing: { ms: 3200, delay: 400, deg: 3, originX: 70 },
  // `.st`: tw 1.8s, .6 → 1.15 → .6 in size and .4 → 1 → .4 in opacity.
  twinkle: { ms: 1800, delays: [0, 600, 1100], scale: [0.6, 1.15], opacity: [0.4, 1] },
  // CSS ease-in-out.
  curve: [0.42, 0, 0.58, 1],
} as const;

// CSS easings as cubic-bezier control points.
type Curve = readonly [number, number, number, number];
const EASE_OUT: Curve = [0, 0, 0.58, 1];
const SLIDE: Curve = [0.2, 0.8, 0.2, 1];
const DROP: Curve = [0.3, 0.7, 0.3, 1];
const POP: Curve = DROP;

// `up` (16 px), `slide` (40 px) and `drop` (120 px) start this far down.
const UP_PX = 16;
const SLIDE_PX = 40;
const DROP_FROM = 120;

function ease(c: Curve, u: number): number {
  'worklet';
  return bezier(c[0], c[1], c[2], c[3], u);
}
function lerp(a: number, b: number, u: number): number {
  'worklet';
  return a + (b - a) * u;
}
// Progress through a run that starts at `at` and lasts `ms`, not eased: 0 before, 1 after.
function progress(t: number, at: number, ms: number): number {
  'worklet';
  if (t <= at) return 0;
  if (t >= at + ms) return 1;
  return (t - at) / ms;
}

export type RiseFrame = { opacity: number; dy: number };

// A one-step keyframe from `from` px down and unseen to its place (`up`, `slide`): the curve over
// the whole run.
function rise(t: number, at: number, ms: number, from: number, c: Curve): RiseFrame {
  'worklet';
  const u = ease(c, progress(t, at, ms));
  return { opacity: u, dy: from * (1 - u) };
}

// The venue's picture (`.bgl`).
export function groundFrame(t: number): RiseFrame {
  'worklet';
  return rise(t, INTRO.groundAt, INTRO.groundMs, UP_PX, EASE_OUT);
}

// The table (`.msa`).
export function tableFrame(t: number): RiseFrame {
  'worklet';
  return rise(t, INTRO.tableAt, INTRO.tableMs, SLIDE_PX, SLIDE);
}

// A buddy coming up from behind the table (`drop`): 120 → -14 (55 %) → 5 (75 %) → 0, the curve
// over each step, as CSS does; seen by 55 %.
export function buddyFrame(i: number, t: number): RiseFrame {
  'worklet';
  const p = progress(t, INTRO.buddyAt[i] ?? 0, INTRO.buddyMs);
  if (p < 0.55) {
    const u = ease(DROP, p / 0.55);
    return { opacity: u, dy: lerp(DROP_FROM, -14, u) };
  }
  if (p < 0.75) return { opacity: 1, dy: lerp(-14, 5, ease(DROP, (p - 0.55) / 0.2)) };
  return { opacity: 1, dy: lerp(5, 0, ease(DROP, (p - 0.75) / 0.25)) };
}

export type CopyPart = 'logo' | 'title' | 'body' | 'foot';
export const COPY_PARTS: readonly CopyPart[] = ['logo', 'title', 'body', 'foot'];
const COPY_AT: Record<CopyPart, number> = {
  logo: INTRO.logoAt,
  title: INTRO.titleAt,
  body: INTRO.bodyAt,
  foot: INTRO.footAt,
};

export type CopyFrame = { opacity: number; dy: number; scale: number };

// The words come in after the scene: the logo pops (`pop`: .6 → 1.06 at 70 % → 1, seen by 70 %),
// the title, the line under it and the foot come up 16 px (`up`).
export function copyFrame(part: CopyPart, t: number): CopyFrame {
  'worklet';
  if (part === 'logo') {
    const p = progress(t, INTRO.logoAt, INTRO.logoMs);
    if (p < 0.7) {
      const u = ease(POP, p / 0.7);
      return { opacity: u, dy: 0, scale: lerp(0.6, 1.06, u) };
    }
    return { opacity: 1, dy: 0, scale: lerp(1.06, 1, ease(POP, (p - 0.7) / 0.3)) };
  }
  const f = rise(t, COPY_AT[part], INTRO.wordsMs, UP_PX, EASE_OUT);
  return { opacity: f.opacity, dy: f.dy, scale: 1 };
}

// When a piece of the words stands still at full opacity, in ms from the scene's start: from then
// on it is drawn without motion (src/features/onboarding/introGate.ts).
export function copySettledAt(part: CopyPart): number {
  return COPY_AT[part] + (part === 'logo' ? INTRO.logoMs : INTRO.wordsMs);
}

// The scene's least height: it takes the room left over, shrinks on short screens and with large
// text, never under 160 (v45: .obf-scene min-height: max(160px, min(290px, 100svh - 392px))).
const INTRO_SHAPE = { minHeight: 160, maxMinHeight: 290, words: 392 } as const;

export function introMinHeight(windowHeight: number): number {
  return Math.max(
    INTRO_SHAPE.minHeight,
    Math.min(INTRO_SHAPE.maxMinHeight, windowHeight - INTRO_SHAPE.words),
  );
}

// The stage's scale in a box: as wide as the box, smaller when the box is short.
export function stageScale(width: number, height: number): number {
  return Math.min(width / INTRO_STAGE.width, height / INTRO_STAGE.height);
}
