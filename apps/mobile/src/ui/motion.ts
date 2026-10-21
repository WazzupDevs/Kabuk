import { useEffect, useState } from 'react';
import {
  cubicBezier,
  Easing,
  ReduceMotion,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { V46Channel, V46KeyframeMotion, V46Transition } from '@/theme/parts.generated';

// What a keyframe animation's steps need: its channels, easing and delay (a button's motion or
// another part's animation: V46_EXPLORE_MOTION).
type Keyframes = Pick<V46KeyframeMotion, 'channels' | 'ease' | 'delayMs'>;

// CSS property names as React Native style keys, for the properties v46 transitions.
const STYLE_KEY = new Map([
  ['background-color', 'backgroundColor'],
  ['border-color', 'borderColor'],
  ['box-shadow', 'boxShadow'],
  ['color', 'color'],
  ['opacity', 'opacity'],
  ['transform', 'transform'],
]);

// v46's transitions (parts.generated.ts: property, duration, delay, cubic-bezier) as Reanimated's
// CSS transition style, for an Animated component. Empty when there are none: a change then shows
// at once, as in v46. `as` names the style a property becomes where the app draws the part another
// way (an SVG `fill` drawn as a View's background).
export function transitionStyle(
  list: readonly V46Transition[],
  as: Readonly<Record<string, string>> = {},
) {
  const key = (prop: string) => as[prop] ?? STYLE_KEY.get(prop);
  const known = list.filter((t) => key(t.prop) !== undefined);
  if (!known.length) return {};
  return {
    transitionProperty: known.map((t) => key(t.prop) as 'opacity'),
    transitionDuration: known.map((t) => t.ms),
    transitionDelay: known.map((t) => t.delayMs),
    transitionTimingFunction: known.map((t) => cubicBezier(...t.ease)),
  };
}

// A part that fades in and out with v46's transition (the loader in a busy button): mounted while
// `on`, and `exitMs` longer so it can fade out; `shown` turns on a frame after mounting, so the
// fade in runs instead of starting at its end.
export function usePresence(on: boolean, exitMs: number): { mounted: boolean; shown: boolean } {
  const [was, setWas] = useState(on);
  const [mounted, setMounted] = useState(on);
  const [shown, setShown] = useState(on);
  // Mounted at once when turned on (state from props, in render).
  if (on !== was) {
    setWas(on);
    if (on) setMounted(true);
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(on));
    if (on) return () => cancelAnimationFrame(frame);
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [on, exitMs]);
  return { mounted, shown };
}

// When the last of a list of transitions ends, its delay included: a part that fades out is taken
// away after it (v46's `.ld.mini`: 160 ms after 60 ms).
export function transitionsEnd(list: readonly V46Transition[]): number {
  return Math.max(0, ...list.map((t) => t.ms + t.delayMs));
}

// Where a part rests between plays of a v46 keyframe animation: its own value, which CSS returns to
// when the animation ends (the last step), not the first keyframe (`vbump` starts at half size).
export function keyframeRest(motion: Keyframes, channel: V46Channel): number {
  const c = motion.channels[channel];
  return c?.steps.at(-1)?.to ?? (channel === 'scale' || channel === 'opacity' ? 1 : 0);
}

// One channel of a v46 keyframe animation (parts.generated.ts → V46_BUTTON_MOTION) as a Reanimated
// value: from its start, each step to the next keyframe, every step eased with the animation's
// timing function, as CSS plays it. `scale` multiplies lengths (keyframes in a drawing's units).
// v46 plays it whatever the system asks unless its own rule drops it (`offWhenReduced`, checked by
// the caller), so the system's reduce motion does not cut it here.
export function keyframeSequence(motion: Keyframes, channel: V46Channel, scale = 1) {
  const run = keyframeSteps(motion, channel, scale);
  if (!run) return undefined;
  return motion.delayMs ? withDelay(motion.delayMs, run, ReduceMotion.Never) : run;
}

function keyframeSteps(motion: Keyframes, channel: V46Channel, scale: number) {
  const c = motion.channels[channel];
  if (!c) return undefined;
  const easing = Easing.bezier(...motion.ease);
  const at = (v: number) => (channel === 'translateX' || channel === 'translateY' ? v * scale : v);
  return withSequence(
    withTiming(at(c.from), { duration: 0, reduceMotion: ReduceMotion.Never }),
    ...c.steps.map((s) =>
      withTiming(at(s.to), { duration: s.ms, easing, reduceMotion: ReduceMotion.Never }),
    ),
  );
}
