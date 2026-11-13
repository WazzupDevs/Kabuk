import { useState } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';

import { springConfig } from '@/aura/motion';
import { SHEET_FROSTED } from '@/components/LiquidGlass';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useReduceTransparency } from '@/lib/useReduceTransparency';
import { MOTION } from '@/theme/aura';

import { SHEET_OPEN_OPACITY, SHEET_OPEN_Y } from './sheetOpen';

// A sheet leaves in 320 ms on the standard's leaving curve (hareket.json → curves.leave: it starts
// slowly and speeds up), down by its own height, so it is seen sliding the whole way and the scrim
// is gone as its top edge leaves the screen (docs/denetim/pano-fark-2026-11.md → K1: on an ease
// out over the window's height it was off the screen in three frames and the scrim faded after it).
// It opens on springs.sheet (sheetOpen.ts).
export const SHEET_LEAVE_MS = 320;
const LEAVE = Easing.bezier(...MOTION.curves.leave);

// A sheet's motion (Sheet, RouteSheet), on the native driver: `open` springs in, `leave` slides it
// out; the scrim follows both. With reduce motion (`still`) it appears and goes at once.
// `travel`: how far down it leaves (its own height and what stands over it); the window's height
// until it is known.
export function useSheetMotion(travel = 0) {
  const { height } = useWindowDimensions();
  const out = travel > 0 ? Math.min(travel, height) : height;
  const reduce = useReduceMotion();
  // One set of values and plays for the sheet's life, so an effect that plays them runs only when
  // the sheet opens or closes.
  const [m] = useState(() => {
    const open = new Animated.Value(0);
    const leave = new Animated.Value(0);
    const spring = springConfig(MOTION.springs.sheet);
    return {
      open,
      leave,
      // In, from wherever it is (a sheet opened again while it was leaving comes back up).
      show: (still: boolean): Animated.CompositeAnimation =>
        still
          ? Animated.parallel([
              Animated.timing(open, { toValue: 1, duration: 0, useNativeDriver: true }),
              Animated.timing(leave, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
          : Animated.parallel([
              Animated.spring(open, { ...spring, toValue: 1 }),
              Animated.spring(leave, { ...spring, toValue: 0 }),
            ]),
      hide: (still: boolean): Animated.CompositeAnimation =>
        Animated.timing(leave, {
          toValue: 1,
          duration: still ? 0 : SHEET_LEAVE_MS,
          easing: LEAVE,
          useNativeDriver: true,
        }),
      // Gone: the next opening starts from below again.
      reset: () => {
        open.setValue(0);
        leave.setValue(0);
      },
    };
  });
  const { open, leave } = m;
  const shown = open.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const kept = leave.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  return {
    reduce,
    leaveMs: reduce ? 0 : SHEET_LEAVE_MS,
    show: m.show,
    hide: m.hide,
    reset: m.reset,
    translateY: Animated.add(
      open.interpolate({ inputRange: [0, 1], outputRange: [...SHEET_OPEN_Y] }),
      leave.interpolate({ inputRange: [0, 1], outputRange: [0, out] }),
    ),
    opacity: open.interpolate({
      inputRange: [0, 1],
      outputRange: [...SHEET_OPEN_OPACITY],
      extrapolate: 'clamp',
    }),
    scrim: Animated.multiply(shown, kept).interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
  };
}

// Whether a sheet's or a menu's card is on the live glass here (iskelet.md → 2.2): where the glass
// blurs, unless the system asks to reduce transparency (a solid card, iskelet.md → 6.6) or Çizim
// ölçümü's `buzlu` is off.
export function useSheetFrost(): boolean {
  const solid = useReduceTransparency();
  const labOff = useLabOff('buzlu');
  return SHEET_FROSTED && !solid && !labOff;
}
