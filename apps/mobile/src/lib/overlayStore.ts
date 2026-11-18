import type { ReactNode } from 'react';
import { create } from 'zustand';

import type { CapIconName } from '../aura/CapIcon';
import {
  closeAllOverlays,
  closeOverlay as closeStep,
  openOverlay as openStep,
  type OverlayEntry,
  type OverlayKind,
  type OverlayState,
  type OverlayStep,
} from './overlayModel';

// One place for what opens over the screens (CLAUDE.md → Ekran davranışı): the centred dialog, the
// bottom sheets (motion/Sheet, RouteSheet), the held message (MessagePop) and the menus (Menu →
// anchor) all open here, one at a time, a new one closing the one before through its `onDismiss`.
// Only `dialog` is drawn by the host (OverlayHost, mounted once in app/(app)/_layout.tsx); the
// others draw themselves where they are (their own Modal; the held message at the chat's root,
// popHost.tsx) and hold their place here with `useOverlaySlot`. `closeAll` (`closeAllSheets`) closes
// whichever is open.

export type DialogAction = {
  label: string;
  // `danger` for what cannot be undone (SusleCikis: "Kaydetmeden çık" soft red); else clear.
  tone?: 'danger' | 'plain';
  testID?: string;
  onPress: () => Promise<void> | void;
};

export type ConfirmOptions = {
  title: string;
  note: string;
  // A 56 disc over the title (EngelleOnay, MesajlarSohbetSil).
  icon?: CapIconName;
  // A face over the title in the disc's place (MasaAt: the person, 64).
  face?: ReactNode;
  // `danger` only for what cannot be undone (Ortak kurallar C1): the red button and disc.
  tone: 'danger' | 'plain';
  confirmLabel: string;
  confirmIcon?: CapIconName;
  // "Vazgeç" or the other way out, under the action. Without it there is no such button (both
  // buttons are answers, SemtSureBitti); outside and back still close it.
  cancelLabel?: string;
  // While it runs the action shows it waits and nothing closes the dialog; it closes when it ends.
  // A thrown error leaves it open for another try and says so in the top notice over it (Ortak
  // kurallar C4: the toast, "Tekrar dene" runs the same way again), not in the dialog.
  onConfirm: () => Promise<void> | void;
  // Closed without the action: "Vazgeç", outside, back, or something else opening.
  onCancel?: () => void;
  // A third way, in the buttons between the action and the way out ("Kaydetmeden çık",
  // ProfilDuzenleCikis); it waits, closes and keeps its error as the action does.
  other?: DialogAction;
  // The failure notice's title ("Kaydedilemedi"), its line the error's words; without it the
  // notice's title is the error's words.
  errorTitle?: string;
  // Between the sentence and the buttons (EngelleOnay's "Şikayet de et" box).
  children?: ReactNode;
  // Names the action; the cancel gets `${testID}-cancel` (as ConfirmSheet).
  testID?: string;
  // `hold`: opened from a long-press menu, over the menu's lighter scrim (Ortak kurallar C2,
  // MesajlarSohbetSil `.ubs`); otherwise the dialog's.
  scrim?: 'hold';
  // Under the buttons, small (MasaIstekGelen `.dnote`: what a "Reddet" shows the other side).
  footnote?: string;
  // The action cannot be pressed now (a table that would pass 12 people cannot be accepted).
  confirmDisabled?: boolean;
  // Ayarlar's own (AyarlarCikis, AyarHesapSil): the title 20/26, the disc the flat soft red with
  // its icon 26.
  settings?: boolean;
};

// What a non-dialog entry draws once its component moves here (a later package).
export type OverlayRender = { render: (close: () => void) => ReactNode };

// A sheet, a menu or a held message that draws itself (useOverlaySlot): the store only knows it is
// the one open.
export type OverlayOwned = { owned: true };

export type OverlayPayload = ConfirmOptions | OverlayRender | OverlayOwned;

type Store = OverlayState<OverlayPayload>;

export type OverlayEntryOf<P extends OverlayPayload> = OverlayEntry<P>;

export const useOverlay = create<Store>(() => ({ open: null }));

type DialogWay = 'confirm' | 'other';
type DialogTask = () => Promise<unknown> | unknown;

// The last failed try: what "Tekrar dene" runs again; `n` counts the failures, a new one shows the
// notice again.
export type DialogFailure = { which: DialogWay; task: DialogTask; n: number };

// What the open dialog is doing: which of its buttons waits (its action, its third way or one the
// caller put between, all `other`) and the error of its last try, which the host's notice says.
export type DialogRunState = {
  id: string | null;
  running: DialogWay | null;
  error: unknown;
  failed: DialogFailure | null;
};

export const useDialogRun = create<DialogRunState>(() => ({
  id: null,
  running: null,
  error: null,
  failed: null,
}));

let nextId = 0;

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
  if (kind === 'dialog') {
    useDialogRun.setState({ id: entry.id, running: null, error: null, failed: null }, true);
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

// The owner's request card coming in closes whatever is open over it (audit UI-2: a sheet is its
// own Android window and hid the 60 second card under it).
export const closeAllSheets = closeAll;

// A centred confirmation, one call; the screen holds no state of its own for it.
export function confirm(options: ConfirmOptions): string {
  return openOverlay('dialog', options, options.onCancel);
}

export function isConfirm(payload: OverlayPayload): payload is ConfirmOptions {
  return 'onConfirm' in payload;
}

// Runs one of the open dialog's ways: one at a time (a press while one runs is ignored), the error
// cleared as it starts. Done, the dialog closes without its `onCancel`; failed, it stays open with
// the error and the way to try again. False when it did not run or failed.
export async function runDialogAction(
  id: string,
  which: DialogWay,
  task: DialogTask,
): Promise<boolean> {
  const state = useDialogRun.getState();
  if (useOverlay.getState().open?.id !== id || state.id !== id || state.running) return false;
  const n = (state.failed?.n ?? 0) + 1;
  useDialogRun.setState({ running: which, error: null, failed: null });
  try {
    await task();
  } catch (error) {
    if (useDialogRun.getState().id === id) {
      useDialogRun.setState({ running: null, error, failed: { which, task, n } });
    }
    return false;
  }
  if (useDialogRun.getState().id === id) useDialogRun.setState({ running: null });
  closeOverlay(id, false);
  return true;
}

// "Tekrar dene" on the failure notice: the failed way once more.
export function retryDialogAction(id: string): Promise<boolean> {
  const { id: runId, failed } = useDialogRun.getState();
  if (runId !== id || !failed) return Promise.resolve(false);
  return runDialogAction(id, failed.which, failed.task);
}

// The id of what is open, or null.
export function useOverlayOpenId(): string | null {
  return useOverlay((s) => s.open?.id ?? null);
}
