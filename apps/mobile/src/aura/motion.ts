import { createContext, useContext } from 'react';
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

// A tab screen's focus, from TabScene (the tabs' layout) to the screens inside it: the clouds drift
// only while their screen is on top, and a tab's parts arrive again each time it is opened. Outside
// the tabs a screen counts as focused and arrives once.
export type TabFocus = { focused: boolean; opened: number };
export const TabFocusContext = createContext<TabFocus>({ focused: true, opened: 0 });
export function useTabFocus(): TabFocus {
  return useContext(TabFocusContext);
}
