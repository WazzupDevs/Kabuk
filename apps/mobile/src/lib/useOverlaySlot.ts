import { useLayoutEffect, useRef } from 'react';

import { closeOverlay, openOverlay } from './overlayStore';
import type { OverlayKind } from './overlayModel';

// A sheet, a menu or a held message that draws itself holds its place in the one store
// (overlayStore.ts) while it is open: opening it closes whatever was open, and anything opening
// after it (or `closeAll`) closes it through `onClose`, as a tap outside does. Closed by its own
// screen, it leaves the store without its `onClose`.
//
// The close it is asked for waits a microtask and runs only if it is still open then: when a screen
// swaps one sheet for another in one render, the new one's opening must not call the old one's
// `onClose` (which often clears the state the new one is read from). Layout effects, so every
// opening and closing of one commit is in the store before that.
//
// `onClose` unset (the join request, a route's sheet): nothing but its own way closes it.
export function useOverlaySlot(
  kind: Exclude<OverlayKind, 'dialog'>,
  open: boolean,
  onClose?: () => void,
): void {
  const id = useRef<string | null>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useLayoutEffect(() => {
    if (!open) return undefined;
    const mine = openOverlay(kind, { owned: true }, () => {
      queueMicrotask(() => {
        if (id.current !== mine) return;
        id.current = null;
        close.current?.();
      });
    });
    id.current = mine;
    return () => {
      id.current = null;
      closeOverlay(mine, false);
    };
  }, [kind, open]);
}
