// A tab's openings (TabScene → the screens under it): each time the tab is opened again after
// another tab, the parts that arrive again (Screen's cascade, Keşfet's rows: aura/Reveal) hear it
// and play their arrival on the native driver. Nothing renders for it: the tab's context holds this
// one object for its whole life, so an opening no longer draws the tab's tree again
// (docs/denetim/performans-2026-11.md → B2). Pure, so tabOpenings.test.ts pins it.
export type TabOpenings = {
  // Returns the unsubscribe.
  subscribe: (onOpen: () => void) => () => void;
};

export function createTabOpenings(): TabOpenings & { open: () => void } {
  const listeners = new Set<() => void>();
  return {
    subscribe(onOpen) {
      listeners.add(onOpen);
      return () => {
        listeners.delete(onOpen);
      };
    },
    open() {
      // A copy: a listener may unsubscribe (a part unmounting) while the others are told.
      for (const onOpen of [...listeners]) onOpen();
    },
  };
}
