import { MOTION } from '../theme/aura';

// A sheet's opening (iskelet.md → 3.5, 4.3): on springs.sheet from MOTION.sheetOpen.fromY below
// and MOTION.sheetOpen.fromOpacity, to its place. `p` is the opening's progress (0 to 1, past 1 on
// the spring's overshoot, where the sheet goes a little above its place and stays opaque).
export const SHEET_OPEN_Y = [MOTION.sheetOpen.fromY, 0] as const;
export const SHEET_OPEN_OPACITY = [MOTION.sheetOpen.fromOpacity, 1] as const;

export function sheetOpenAt(p: number): { translateY: number; opacity: number } {
  const o = Math.min(Math.max(p, 0), 1);
  return {
    translateY: SHEET_OPEN_Y[0] + (SHEET_OPEN_Y[1] - SHEET_OPEN_Y[0]) * p,
    opacity: SHEET_OPEN_OPACITY[0] + (SHEET_OPEN_OPACITY[1] - SHEET_OPEN_OPACITY[0]) * o,
  };
}
