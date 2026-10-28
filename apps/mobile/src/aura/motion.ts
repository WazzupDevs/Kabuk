import { createContext, useContext, useEffect, useState } from 'react';
import { Easing, Platform } from 'react-native';

import { MOTION, type Bezier } from '@/theme/aura';
import { blursBehind } from '@/ui/backdrop';

// The motion standard's curves (theme/aura.ts → MOTION) for React Native's Animated, whose native
// driver plays them off the JavaScript thread and without committing the UI tree each frame
// (loopGuard.test.ts explains why that matters on Android).
const bezier = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
export const ARRIVE_RN = bezier(MOTION.curves.arrive);
export const LEAVE_RN = bezier(MOTION.curves.leave);

// A spring of the standard as Animated.spring's config (the same model as Reanimated's).
export function springConfig(s: { stiffness: number; damping: number; mass: number }) {
  return { stiffness: s.stiffness, damping: s.damping, mass: s.mass, useNativeDriver: true };
}

// Blur is drawn by the system from Android 12; below it the dissolve is a plain fade.
export const BLURS = blursBehind(Platform.OS, Platform.Version);

// The film's blur dissolve without a blur on every frame: the blur steps down in three (12, 6,
// none) while the fade runs on the native driver, so it costs three commits instead of one per
// frame. `start` changes start it again; 0 is no blur.
const BLUR_STEPS = [1, 0.5, 0] as const;
const BLUR_STEP_MS = 110;
const SHARP = BLUR_STEPS.length - 1;
export function useSteppedBlur(start: number, on: boolean): number {
  const [state, setState] = useState({ start, step: SHARP });
  // A new start: blurred at once, in the same render (state from props).
  if (state.start !== start) setState({ start, step: on && start !== 0 ? 0 : SHARP });
  const begun = state.step === 0;
  useEffect(() => {
    if (!begun) return undefined;
    const timers = BLUR_STEPS.slice(1).map((_, i) =>
      setTimeout(
        () => setState((s) => (s.start === start ? { ...s, step: i + 1 } : s)),
        BLUR_STEP_MS * (i + 1),
      ),
    );
    return () => timers.forEach(clearTimeout);
    // Each start runs its steps once; the steps themselves must not restart them.
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps
  return BLURS && on ? (BLUR_STEPS[state.step] ?? 0) * MOTION.dissolve.blur : 0;
}

// A tab screen's focus, from TabScene (the tabs' layout) to the screens inside it: the clouds drift
// only while their screen is on top, and a tab's parts arrive again each time it is opened. Outside
// the tabs a screen counts as focused and arrives once.
export type TabFocus = { focused: boolean; opened: number };
export const TabFocusContext = createContext<TabFocus>({ focused: true, opened: 0 });
export function useTabFocus(): TabFocus {
  return useContext(TabFocusContext);
}
