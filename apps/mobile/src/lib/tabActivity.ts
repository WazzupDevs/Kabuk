import { createContext, useContext } from 'react';

import { MOTION } from '../theme/aura';

// Whether a tab is on screen (TabScene → the screens under it). Every tab stays alive (#279), so a
// hidden tab's clocks and polls kept rendering it out of sight (docs/denetim/performans-2026-11.md
// → B6). A clock or a poll asks `active()` when it ticks and skips the tick while the tab is hidden;
// when the tab comes back it hears `onResume` and catches up once, after the tab's arrival
// (AFTER_ARRIVAL_MS), so the catch-up never lands on the switch's frames. Nothing renders for the
// tab's focus itself: the context holds this one object for the tab's life. Outside the tabs there
// is none, and a clock runs as it always did.
export type TabActivity = {
  active: () => boolean;
  // Returns the unsubscribe.
  onResume: (fn: () => void) => () => void;
};

// The tab's arrival and its longest cascade (MOTION.dissolve, MOTION.stagger).
export const AFTER_ARRIVAL_MS = MOTION.dissolve.inMs + MOTION.stagger.max * MOTION.stagger.part;

export function createTabActivity(initial: boolean): TabActivity & { set: (on: boolean) => void } {
  let on = initial;
  const listeners = new Set<() => void>();
  return {
    active: () => on,
    onResume(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    set(next) {
      const resumed = next && !on;
      on = next;
      if (resumed) for (const fn of [...listeners]) fn();
    },
  };
}

export const TabActivityContext = createContext<TabActivity | null>(null);
export function useTabActivity(): TabActivity | null {
  return useContext(TabActivityContext);
}
