// Scrolling measured on the phone (docs/SPEC_V4.md §4.M, 4.3: the capsule avatar in long lists,
// the CTO's 4.2b review): the gaps between the JS thread's frames while a list scrolls. A frame
// that takes longer than one and a half frame budgets (16.7 ms at 60 Hz) counts as a stall. Pure,
// so frameStats.test.ts pins it; the component preview shows it.
export const FRAME_MS = 1000 / 60;
export const STALL_MS = FRAME_MS * 1.5;

export type FrameStats = {
  frames: number;
  stalls: number; // frames longer than STALL_MS
  worstMs: number;
  fps: number; // frames per second over the measured time
};

export function frameStats(gapsMs: readonly number[]): FrameStats {
  const frames = gapsMs.length;
  if (frames === 0) return { frames: 0, stalls: 0, worstMs: 0, fps: 0 };
  let total = 0;
  let worst = 0;
  let stalls = 0;
  for (const gap of gapsMs) {
    total += gap;
    if (gap > worst) worst = gap;
    if (gap > STALL_MS) stalls += 1;
  }
  return {
    frames,
    stalls,
    worstMs: Math.round(worst),
    fps: Math.round((frames * 1000) / total),
  };
}
