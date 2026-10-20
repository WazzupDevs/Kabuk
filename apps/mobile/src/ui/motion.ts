import { useEffect, useState } from 'react';
import { cubicBezier } from 'react-native-reanimated';

import type { V46Transition } from '@/theme/parts.generated';

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
// at once, as in v46.
export function transitionStyle(list: readonly V46Transition[]) {
  const known = list.filter((t) => STYLE_KEY.has(t.prop));
  if (!known.length) return {};
  return {
    transitionProperty: known.map((t) => STYLE_KEY.get(t.prop) as 'opacity'),
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
