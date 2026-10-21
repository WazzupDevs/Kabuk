// v46's pull to refresh as numbers (parts.generated.ts → V46_PULL, read from v46's script): how far
// the list follows the finger, where the indicator sits and how its capsules come together into
// the mark. Every function is a worklet: src/ui/PullScroll.tsx runs them on the UI thread as the
// finger moves (Reanimated), vitest runs them as plain functions.

import type { V46PullScheme } from './parts.generated';

// v46's `ease(t)`: cubic in and out.
export function pullEase(t: number): number {
  'worklet';
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// How far the list follows a finger pulled `d` down: all the way to the lock, then by `stretch`.
export function pullOffset(d: number, p: V46PullScheme): number {
  'worklet';
  if (d <= 0) return 0;
  return d < p.lockAt ? d : p.lockAt + (d - p.lockAt) * p.stretch;
}

// The capsules at pull `y`: the second capsule's offset from the first (window units) and the
// pair's scale. Far apart and small at the start, the mark at the lock and past it.
export function pullMark(y: number, p: V46PullScheme): { dx: number; dy: number; scale: number } {
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
export function pullIndicator(y: number, p: V46PullScheme): { opacity: number; y: number } {
  'worklet';
  return { opacity: Math.max(0, Math.min(1, y / p.fadeOver)), y: y / 2 - p.lift };
}
