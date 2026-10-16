// The launch's two safeguards (docs/DECISIONS.md → "skall açılışı"). The system splash stays up
// until the launch curtain hands over (SplashScreen.preventAutoHideAsync); if the curtain never
// gets there, the app must not look frozen behind it:
// - the cap: whatever the curtain does, the system splash goes at the latest `capMs` after launch,
//   and a curtain that has not begun its motion by then is dropped, so the app shows;
// - a curtain that fails (a render error, a frame that throws) is dropped at once and its error
//   reported, and the app shows.
// Pure (no React Native): the app wires it in src/features/launch/launchStore.ts.

// The system splash's upper bound, from the moment the app's JS starts.
export const SPLASH_CAP_MS = 3000;

export type LaunchGuardIO = {
  hideSplash: () => Promise<unknown> | void;
  dropCurtain: () => void;
  report: (error: unknown) => void;
};

export type LaunchGuard = {
  // The curtain's first frame is on screen and its motion begins: the system splash goes.
  begin: () => void;
  // A first screen without the curtain (the error screen): the system splash goes.
  release: () => void;
  // The curtain failed: it goes, the app shows, the error is reported (once).
  fail: (error: unknown) => void;
};

export function createLaunchGuard(io: LaunchGuardIO, capMs: number = SPLASH_CAP_MS): LaunchGuard {
  let hidden = false;
  let begun = false;
  let dropped = false;
  let reported = false;

  const hide = () => {
    if (hidden) return;
    hidden = true;
    try {
      void Promise.resolve(io.hideSplash()).catch(() => undefined);
    } catch {
      // A splash that is already gone, or none: nothing to hide.
    }
  };
  const drop = () => {
    if (dropped) return;
    dropped = true;
    io.dropCurtain();
  };

  const cap = setTimeout(() => {
    hide();
    if (!begun) drop();
  }, capMs);
  // Nothing left for the cap once the splash is gone and the curtain has begun or is gone.
  const settle = () => {
    if (hidden && (begun || dropped)) clearTimeout(cap);
  };

  return {
    begin() {
      if (dropped) return;
      begun = true;
      hide();
      settle();
    },
    release() {
      hide();
      settle();
    },
    fail(error) {
      if (!reported) {
        reported = true;
        io.report(error);
      }
      hide();
      drop();
      settle();
    },
  };
}
