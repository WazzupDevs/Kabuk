import { useState } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { Dialog } from '@/motion/Dialog';
import {
  closeOverlay,
  type ConfirmOptions,
  isConfirm,
  type OverlayEntryOf,
  useOverlay,
} from '@/lib/overlayStore';

type DialogEntry = OverlayEntryOf<ConfirmOptions>;

// What opens over every screen, drawn once in one window (app/(app)/_layout.tsx): for now the
// centred confirmation (`confirm`, overlayStore.ts). Its window stays while the dialog leaves; the
// last one it showed is kept for that. Android's back button and a tap outside close it as
// "Vazgeç" does; while its action runs none of them does, and a second press of it is ignored.
export function OverlayHost() {
  const open = useOverlay((s) => s.open);
  const dialog: DialogEntry | null =
    open && open.kind === 'dialog' && isConfirm(open.payload)
      ? { ...open, payload: open.payload }
      : null;
  const [shown, setShown] = useState<DialogEntry | null>(dialog);
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (dialog && dialog.id !== shown?.id) setShown(dialog);
  useLeaveKeyboard(dialog !== null);

  const pending = shown !== null && pendingId === shown.id;
  const cancel = () => {
    if (!dialog || pendingId === dialog.id) return;
    closeOverlay(dialog.id);
  };
  const run = async () => {
    if (!dialog || pendingId === dialog.id) return;
    const { id, payload } = dialog;
    setPendingId(id);
    try {
      await payload.onConfirm();
      closeOverlay(id, false);
    } catch {
      // The screen shows the error (its mutation); the dialog stays for another try.
    } finally {
      setPendingId((p) => (p === id ? null : p));
    }
  };
  const hidden = () => {
    if (useOverlay.getState().open?.kind !== 'dialog') setShown(null);
  };

  if (!shown) return null;
  return (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      visible
      onRequestClose={cancel}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Dialog
          options={shown.payload}
          visible={dialog !== null}
          pending={pending}
          onConfirm={() => void run()}
          onCancel={cancel}
          onHidden={hidden}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}
