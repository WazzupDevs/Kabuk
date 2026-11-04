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

// A tab switch measured on the phone (Çizim ölçümü → Geçiş ölçümü, docs/denetim/olcum-protokolu.md):
// the gaps between frames over the switch's window. The frame budget is the screen's own (60, 90
// or 120 Hz: withHighRefreshRate), read from the fastest frames of the same window; a frame longer
// than one and a half budgets is jank, and each budget past the first is a frame the screen missed.
export type SwitchStats = {
  frames: number;
  budgetMs: number;
  p50Ms: number;
  p95Ms: number;
  worstMs: number;
  jank: number; // frames longer than 1.5 budgets
  jankRate: number; // jank / frames, 0 to 1
  missed: number; // budgets missed over the window
};

// The fastest frames come at the screen's rate; never under 144 Hz's.
const MIN_BUDGET_MS = 1000 / 144;
const BUDGET_PERCENTILE = 0.1;
export const JANK_BUDGETS = 1.5;

// The p-th percentile (0 to 1) by nearest rank.
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[rank] ?? 0;
}

export function switchStats(gapsMs: readonly number[]): SwitchStats {
  const frames = gapsMs.length;
  if (frames === 0) {
    return {
      frames: 0,
      budgetMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      worstMs: 0,
      jank: 0,
      jankRate: 0,
      missed: 0,
    };
  }
  const budget = Math.max(MIN_BUDGET_MS, percentile(gapsMs, BUDGET_PERCENTILE));
  let jank = 0;
  let missed = 0;
  let worst = 0;
  for (const gap of gapsMs) {
    if (gap > worst) worst = gap;
    if (gap > budget * JANK_BUDGETS) jank += 1;
    missed += Math.max(0, Math.round(gap / budget) - 1);
  }
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    frames,
    budgetMs: round1(budget),
    p50Ms: round1(percentile(gapsMs, 0.5)),
    p95Ms: round1(percentile(gapsMs, 0.95)),
    worstMs: Math.round(worst),
    jank,
    jankRate: Math.round((jank / frames) * 1000) / 1000,
    missed,
  };
}
