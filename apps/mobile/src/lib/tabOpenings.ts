// A tab's openings (TabScene → the screens under it): each time the tab is opened again after
// another tab, the parts that arrive again (Screen's cascade, Keşfet's rows: aura/Reveal) hear it
// and play their arrival on the native driver. Nothing renders for it: the tab's context holds this
// one object for its whole life, so an opening no longer draws the tab's tree again
// (docs/denetim/performans-2026-11.md → B2). Pure, so tabOpenings.test.ts pins it.
//
// `leave`: the tab went out of sight to another tab; its parts take their arrival's first values
// while it is hidden (B5), so the first frame it is shown again is already the arrival's first.
// `open`: it is shown again, the arrival plays. `settle`: shown again with no arrival (Çizim
// ölçümü's `kademe`), the parts in place.
export type TabOpeningEvent = 'leave' | 'open' | 'settle';
export type TabOpenings = {
  // Returns the unsubscribe.
  subscribe: (on: (event: TabOpeningEvent) => void) => () => void;
};

export function createTabOpenings(): TabOpenings & { emit: (event: TabOpeningEvent) => void } {
  const listeners = new Set<(event: TabOpeningEvent) => void>();
  return {
    subscribe(on) {
      listeners.add(on);
      return () => {
        listeners.delete(on);
      };
    },
    emit(event) {
      // A copy: a listener may unsubscribe (a part unmounting) while the others are told.
      for (const on of [...listeners]) on(event);
    },
  };
}

// How long after the tab's blur its parts take their first values: the leaving screen is detached
// by then (react-native-screens), so it never shows a blank frame on its way out. A tab opened
// again sooner cancels it and arrives from where it is.
export const LEAVE_PREPARE_MS = 150;
