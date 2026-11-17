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
  runDialogAction,
  useDialogRun,
  useOverlay,
} from '@/lib/overlayStore';

type DialogEntry = OverlayEntryOf<ConfirmOptions>;

// What opens over every screen, drawn once in one window (app/(app)/_layout.tsx): for now the
// centred confirmation (`confirm`, overlayStore.ts). Its window stays while the dialog leaves; the
// last one it showed is kept for that. Android's back button and a tap outside close it as
// "Vazgeç" does; while one of its ways runs none of them does, and a second press is ignored
// (`runDialogAction`). A failed try keeps it open and it writes the error itself.
export function OverlayHost() {
  const open = useOverlay((s) => s.open);
  const dialog: DialogEntry | null =
    open && open.kind === 'dialog' && isConfirm(open.payload)
      ? { ...open, payload: open.payload }
      : null;
  const [shown, setShown] = useState<DialogEntry | null>(dialog);
  if (dialog && dialog.id !== shown?.id) setShown(dialog);
  const run = useDialogRun();
  useLeaveKeyboard(dialog !== null);

  // What the shown one is doing (kept while it leaves).
  const mine = shown !== null && run.id === shown.id;
  const running = mine ? run.running : null;
  const error = mine ? run.error : null;
  const cancel = () => {
    if (!dialog || (run.id === dialog.id && run.running)) return;
    closeOverlay(dialog.id);
  };
  const confirmIt = () => {
    if (dialog) void runDialogAction(dialog.id, 'confirm', dialog.payload.onConfirm);
  };
  const other = dialog?.payload.other;
  const otherIt = () => {
    if (dialog && other) void runDialogAction(dialog.id, 'other', other.onPress);
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
          running={running}
          error={error}
          onConfirm={confirmIt}
          onOther={otherIt}
          onCancel={cancel}
          onHidden={hidden}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}
