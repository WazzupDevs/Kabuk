import type { ColorScheme as Scheme } from './tokens';

// The progress pill (the owner's call, 22 Kasım): a capsule whose colour fills from the left as a
// count goes up ("0/3" → "3/3"), the count's words on it. One shared part for every "n of all" on a
// screen (components/ProgressPill.tsx); the set balloon's count was its first.
export const PROGRESS_PILL = {
  height: 26,
  minWidth: 96,
  padX: 12,
  // One step of the fill (1/3 → 2/3); several steps run one after another.
  stepMs: 320,
  // The fill: the app's green into its cyan and its violet.
  fill: 'linear-gradient(90deg, #3DDC84, #3FD0E0, #9B7CFF)',
  // Past this much filled, the words stand on the fill and take its ink.
  inkOnFillFrom: 0.5,
  onFill: '#06130B',
  light: { track: 'rgba(3, 27, 11, 0.06)' },
  dark: { track: 'rgba(255, 255, 255, 0.08)' },
} as const satisfies Record<Scheme, { track: string }> & Record<string, unknown>;
