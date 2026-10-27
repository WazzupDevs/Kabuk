import { cubicBezier } from '@/theme/markMotion';

// The capsule editor's moves (v46: `.cp-b` keyframes, about the capsule's feet: transform-origin
// 24px 48px of the 60 × 57 stage). Each is a few channels of keyframes; CSS eases every step with
// the animation's timing function, so `sample` does too. Lengths are in the stage's units (60 of
// them across); the screen multiplies them.
export type Channel = 'tx' | 'ty' | 'rot' | 'sx' | 'sy';
type Track = { at: readonly number[]; v: readonly number[] };
export type Move = {
  ms: number;
  ease: readonly [number, number, number, number];
  tracks: Partial<Record<Channel, Track>>;
};

const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const;
const LINEAR = [0, 0, 1, 1] as const;
const POP = [0.3, 0.7, 0.4, 1] as const;

const steps = (n: number) => Array.from({ length: n + 1 }, (_, i) => i / n);
const alternate = (n: number, a: number, b: number) =>
  steps(n).map((_, i) => (i === 0 || i === n ? 0 : i % 2 === 1 ? a : b));

// The feelings (v46 `.cp.em-*`), keyed like LOOK.EMOS.
export const FEELING_MOVES: Record<string, Move> = {
  // emHop .8s: two hops.
  mutlu: {
    ms: 800,
    ease: POP,
    tracks: { ty: { at: [0, 0.2, 0.4, 0.6, 0.8, 1], v: [0, -4, 0, -2.4, 0, 0] } },
  },
  // emJolt .5s: up and stretched.
  saskin: {
    ms: 500,
    ease: [0.2, 0.8, 0.3, 1.2],
    tracks: {
      ty: { at: [0, 0.3, 1], v: [0, -3.5, 0] },
      sx: { at: [0, 0.3, 1], v: [1, 0.97, 1] },
      sy: { at: [0, 0.3, 1], v: [1, 1.06, 1] },
    },
  },
  // emSway 1.6s.
  asik: {
    ms: 1600,
    ease: EASE_IN_OUT,
    tracks: { rot: { at: [0, 0.25, 0.75, 1], v: [0, -5, 5, 0] } },
  },
  // emLaugh .9s: shaking with laughter.
  kahkaha: {
    ms: 900,
    ease: LINEAR,
    tracks: {
      ty: { at: steps(10), v: alternate(10, -1.6, 0.4) },
      rot: { at: steps(10), v: alternate(10, -1.5, 1.5) },
    },
  },
  // emShy 1.6s: turns away, smaller.
  utangac: {
    ms: 1600,
    ease: EASE_IN_OUT,
    tracks: {
      rot: { at: [0, 0.2, 0.8, 1], v: [0, -7, -7, 0] },
      ty: { at: [0, 0.2, 0.8, 1], v: [0, 1, 1, 0] },
      sx: { at: [0, 0.2, 0.8, 1], v: [1, 0.97, 0.97, 1] },
      sy: { at: [0, 0.2, 0.8, 1], v: [1, 0.97, 0.97, 1] },
    },
  },
  // emSag 1.7s: sinks.
  uzgun: {
    ms: 1700,
    ease: EASE_IN_OUT,
    tracks: {
      ty: { at: [0, 0.2, 0.8, 1], v: [0, 1.6, 1.6, 0] },
      sx: { at: [0, 0.2, 0.8, 1], v: [1, 1.02, 1.02, 1] },
      sy: { at: [0, 0.2, 0.8, 1], v: [1, 0.95, 0.95, 1] },
    },
  },
  // emShake .6s.
  kizgin: { ms: 600, ease: LINEAR, tracks: { tx: { at: steps(10), v: alternate(10, -1.3, 1.3) } } },
  // emNod 1.7s: nods off.
  uykulu: {
    ms: 1700,
    ease: EASE_IN_OUT,
    tracks: {
      rot: { at: [0, 0.3, 0.7, 1], v: [0, 6, 6, 0] },
      ty: { at: [0, 0.3, 0.7, 1], v: [0, 0.6, 0.6, 0] },
    },
  },
};

// A part put on (v46 `.ced-fig.jump`, cpJump .5s): a small jump.
export const JUMP: Move = {
  ms: 500,
  ease: POP,
  tracks: {
    ty: { at: [0, 0.4, 0.8, 1], v: [0, -5, 0.6, 0] },
    sy: { at: [0, 0.4, 0.8, 1], v: [1, 1.03, 0.97, 1] },
  },
};

// "Karıştır" (the owner's call, 27 Ekim: no abrupt swap): the jump with a little wobble while the
// new look fades in.
export const SHUFFLE: Move = {
  ms: 560,
  ease: POP,
  tracks: {
    ty: { at: [0, 0.4, 0.8, 1], v: [0, -5, 0.6, 0] },
    sy: { at: [0, 0.4, 0.8, 1], v: [1, 1.03, 0.97, 1] },
    rot: { at: [0, 0.2, 0.45, 0.7, 1], v: [0, -6, 5, -2, 0] },
  },
};

// The circle's beat with a feeling (v46 `.ced-ring.beat`, cedBeat .45s ease-out).
export const BEAT: Move = {
  ms: 450,
  ease: [0, 0, 0.58, 1],
  tracks: { sx: { at: [0, 0.4, 1], v: [1, 1.035, 1] } },
};

// The value of a channel at u (0…1 of the move), each keyframe step eased as CSS does.
export function valueAt(move: Move, channel: Channel, u: number): number {
  const track = move.tracks[channel];
  const rest = channel === 'sx' || channel === 'sy' ? 1 : 0;
  if (!track) return rest;
  const ease = cubicBezier(...move.ease);
  const { at, v } = track;
  for (let i = 0; i < at.length - 1; i++) {
    const a = at[i] ?? 0;
    const b = at[i + 1] ?? 1;
    if (u <= b) {
      const from = v[i] ?? rest;
      const to = v[i + 1] ?? rest;
      const t = b > a ? (u - a) / (b - a) : 1;
      return from + (to - from) * ease(Math.min(1, Math.max(0, t)));
    }
  }
  return v[v.length - 1] ?? rest;
}

// A channel sampled for an Animated interpolation over 0…1 (`scale` multiplies lengths).
export function sample(
  move: Move,
  channel: Channel,
  scale = 1,
  points = 32,
): { inputRange: number[]; outputRange: number[] } {
  const inputRange = steps(points);
  const length = channel === 'tx' || channel === 'ty' ? scale : 1;
  return { inputRange, outputRange: inputRange.map((u) => valueAt(move, channel, u) * length) };
}
