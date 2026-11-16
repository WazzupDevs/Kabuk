import type { ReactNode } from 'react';
import { create } from 'zustand';

import type { CapIconName } from '../aura/CapIcon';
import { closeAllSheets, useSheetCloser } from '../components/sheetCloser';
import {
  closeAllOverlays,
  closeOverlay as closeStep,
  openOverlay as openStep,
  type OverlayEntry,
  type OverlayKind,
  type OverlayState,
  type OverlayStep,
} from './overlayModel';

// One place for what opens over the screens (OverlayHost, mounted once in app/(app)/_layout.tsx):
// only one at a time, a new one closing the one before. Only `dialog` is drawn by the host for now;
// the bottom sheets, the held message and the menus keep their own windows and close through
// `closeAllSheets` (sheetCloser.ts), which this store and they share both ways.

export type ConfirmOptions = {
  title: string;
  note: string;
  // A 56 disc over the title (EngelleOnay, MesajlarSohbetSil).
  icon?: CapIconName;
  // `danger` only for what cannot be undone (Ortak kurallar C1): the red button and disc.
  tone: 'danger' | 'plain';
  confirmLabel: string;
  confirmIcon?: CapIconName;
  // "Vazgeç" or the other way out, under the action.
  cancelLabel: string;
  // While it runs the action shows it waits and nothing closes the dialog; it closes when it ends.
  // A thrown error leaves it open (the screen shows the error) for another try.
  onConfirm: () => Promise<void> | void;
  // Closed without the action: "Vazgeç", outside, back, or something else opening.
  onCancel?: () => void;
  // Between the sentence and the buttons (EngelleOnay's "Şikayet de et" box).
  children?: ReactNode;
  // Names the action; the cancel gets `${testID}-cancel` (as ConfirmSheet).
  testID?: string;
};

// What a non-dialog entry draws once its component moves here (a later package).
export type OverlayRender = { render: (close: () => void) => ReactNode };

export type OverlayPayload = ConfirmOptions | OverlayRender;

type Store = OverlayState<OverlayPayload>;

export type OverlayEntryOf<P extends OverlayPayload> = OverlayEntry<P>;

export const useOverlay = create<Store>(() => ({ open: null }));

let nextId = 0;
// Set while this store closes the sheets itself, so their round does not close what it opens.
let closingSheets = false;

function apply(step: OverlayStep<OverlayPayload>): void {
  useOverlay.setState(step.state, true);
  step.closed?.onDismiss?.();
}

export function openOverlay(
  kind: OverlayKind,
  payload: OverlayPayload,
  onDismiss?: () => void,
): string {
  nextId += 1;
  const entry: OverlayEntry<OverlayPayload> = { id: `o${nextId}`, kind, payload, onDismiss };
  // The sheets drawn in their own windows close as this one opens.
  closingSheets = true;
  try {
    closeAllSheets();
  } finally {
    closingSheets = false;
  }
  apply(openStep(useOverlay.getState(), entry));
  return entry.id;
}

// `dismiss`: closed without its own action, its `onDismiss` runs.
export function closeOverlay(id: string, dismiss = true): void {
  const step = closeStep(useOverlay.getState(), id);
  if (!dismiss) {
    useOverlay.setState(step.state, true);
    return;
  }
  apply(step);
}

export function closeAll(): void {
  if (useOverlay.getState().open === null) return;
  apply(closeAllOverlays(useOverlay.getState()));
}

// `closeAllSheets` (a request card coming in) closes this store's one too.
useSheetCloser.subscribe((s, before) => {
  if (s.round !== before.round && !closingSheets) closeAll();
});

// A centred confirmation, one call; the screen holds no state of its own for it.
export function confirm(options: ConfirmOptions): string {
  return openOverlay('dialog', options, options.onCancel);
}

export function isConfirm(payload: OverlayPayload): payload is ConfirmOptions {
  return 'onConfirm' in payload;
}

// The id of what is open, or null.
export function useOverlayOpenId(): string | null {
  return useOverlay((s) => s.open?.id ?? null);
}
