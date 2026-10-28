import { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { MOTION, type Bezier } from '@/theme/aura';
import { blursBehind } from '@/ui/backdrop';

// The motion standard's curves as Reanimated easings (theme/aura.ts → MOTION).
const bezier = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
export const ARRIVE = bezier(MOTION.curves.arrive);
export const LEAVE = bezier(MOTION.curves.leave);
export const SWAP = bezier(MOTION.curves.swap);
export const SPRING = MOTION.springs;

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
