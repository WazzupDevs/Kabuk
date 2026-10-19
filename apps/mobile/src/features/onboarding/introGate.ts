// The first screen's words and buttons (the logo, the title, the line under it, "Başla", "Geç")
// stand on React's side, apart from the scene's motion and the launch curtain (docs/decisions/
// 4.3-ilk-ekran-yazilari.md). The motion draws them coming in on the UI thread; React shows each one
// still at the time its motion ends, and "Geç" for as long as the scene plays. With reduce motion,
// or the scene seen before, everything stands from the first frame. The scene waits for the curtain
// to open; if it has not opened by the cap, everything stands and the scene goes to its end.
// Pure (no React Native): app/(auth)/welcome.tsx drives it with timers.
import { SPLASH_CAP_MS } from '../../lib/launchGuard';
import { COPY_PARTS, type CopyPart, copySettledAt, INTRO } from '../../theme/introScene';

// How long the scene waits for the curtain, from the screen's first frame: as long as the system
// splash may wait for it.
export const INTRO_WAIT_CAP_MS = SPLASH_CAP_MS;

export type IntroClock = {
  // Since the screen's first frame, in ms.
  sinceMount: number;
  // Since the scene began to play; null while it waits for the curtain.
  sinceStart: number | null;
  // Reduce motion, the scene seen before this launch, or skipped: no motion to wait for.
  still: boolean;
};

export type IntroCopy = {
  // The pieces drawn still and in full, whatever the UI thread does.
  shown: CopyPart[];
  // "Geç" is on screen.
  skip: boolean;
  // When the next piece is due, in ms from now; null once nothing changes any more.
  next: number | null;
  // The curtain did not open in time: the scene goes to its end and does not play.
  giveUp: boolean;
};

const ALL = (): CopyPart[] => [...COPY_PARTS];

export function introCopy({ sinceMount, sinceStart, still }: IntroClock): IntroCopy {
  if (still) return { shown: ALL(), skip: false, next: null, giveUp: false };
  if (sinceStart === null) {
    if (sinceMount >= INTRO_WAIT_CAP_MS) {
      return { shown: ALL(), skip: false, next: null, giveUp: true };
    }
    return { shown: [], skip: false, next: INTRO_WAIT_CAP_MS - sinceMount, giveUp: false };
  }
  const shown = COPY_PARTS.filter((p) => sinceStart >= copySettledAt(p));
  const skip = sinceStart < INTRO.doneMs;
  const due = [...COPY_PARTS.map(copySettledAt), INTRO.doneMs].filter((at) => at > sinceStart);
  return {
    shown,
    skip,
    next: due.length > 0 ? Math.min(...due) - sinceStart : null,
    giveUp: false,
  };
}
