import { createContext, useContext } from 'react';
import { Easing } from 'react-native';

import type { TabOpenings } from '@/lib/tabOpenings';
import { MOTION, type Bezier } from '@/theme/aura';

// The motion standard's curves (theme/aura.ts → MOTION) for React Native's Animated, whose native
// driver plays them off the JavaScript thread and without committing the UI tree each frame
// (loopGuard.test.ts explains why that matters on Android).
const bezier = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
export const ARRIVE_RN = bezier(MOTION.curves.arrive);
export const LEAVE_RN = bezier(MOTION.curves.leave);
export const SWAP_RN = bezier(MOTION.curves.swap);

// A spring of the standard as Animated.spring's config (the same model as Reanimated's).
export function springConfig(s: { stiffness: number; damping: number; mass: number }) {
  return { stiffness: s.stiffness, damping: s.damping, mass: s.mass, useNativeDriver: true };
}

// A tab's openings, from TabScene (the tabs' layout) to the screens inside it: a tab's parts arrive
// again each time it is opened (lib/tabOpenings.ts). One object for the tab's life, so an opening
// renders nothing under it. Outside the tabs there is none and a screen arrives once.
export const TabOpeningsContext = createContext<TabOpenings | null>(null);
export function useTabOpenings(): TabOpenings | null {
  return useContext(TabOpeningsContext);
}
