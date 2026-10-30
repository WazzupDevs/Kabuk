// Pull to refresh as numbers (v46's, kept when v46 was removed): how far the list follows the
// finger, where the indicator sits and how its capsules come together into the mark. Every
// function is a worklet: components/PullScroll.tsx runs them on the UI thread as the finger moves
// (Reanimated), vitest runs them as plain functions.

export type PullScheme = {
  size: number;
  lockAt: number;
  restAt: number;
  stretch: number;
  fadeOver: number;
  lift: number;
  capsule: { w: number; h: number; dx: number; dy: number };
  gap: number;
  scaleFrom: number;
  settle: { ms: number; ease: readonly [number, number, number, number]; offWhenReduced: boolean };
};

export const PULL: PullScheme = {
  size: 44,
  lockAt: 72,
  restAt: 64,
  stretch: 0.35,
  fadeOver: 30,
  lift: 26,
  capsule: { w: 96, h: 236, dx: 56, dy: 54 },
  gap: 70,
  scaleFrom: 0.55,
  settle: { ms: 450, ease: [0.2, 0.8, 0.2, 1], offWhenReduced: true },
};

// v46's `ease(t)`: cubic in and out.
export function pullEase(t: number): number {
  'worklet';
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// How far the list follows a finger pulled `d` down: all the way to the lock, then by `stretch`.
export function pullOffset(d: number, p: PullScheme): number {
  'worklet';
  if (d <= 0) return 0;
  return d < p.lockAt ? d : p.lockAt + (d - p.lockAt) * p.stretch;
}

// The capsules at pull `y`: the second capsule's offset from the first (window units) and the
// pair's scale. Far apart and small at the start, the mark at the lock and past it.
export function pullMark(y: number, p: PullScheme): { dx: number; dy: number; scale: number } {
  'worklet';
  const e = pullEase(Math.max(0, Math.min(1, y / p.lockAt)));
  const apart = p.capsule.w + p.gap;
  return {
    dx: apart + (p.capsule.dx - apart) * e,
    dy: p.capsule.dy * e,
    scale: p.scaleFrom + (1 - p.scaleFrom) * e,
  };
}

// The indicator at pull `y`: it fades in over the first `fadeOver` and rides at half the pull less
// `lift` (above the list's top until the pull lifts it into view).
export function pullIndicator(y: number, p: PullScheme): { opacity: number; y: number } {
  'worklet';
  return { opacity: Math.max(0, Math.min(1, y / p.fadeOver)), y: y / 2 - p.lift };
}
