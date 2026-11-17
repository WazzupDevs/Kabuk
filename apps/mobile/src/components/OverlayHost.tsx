import { useState } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapIcon } from '@/aura/CapIcon';
import { Toast, TOAST_TOP, type ToastMessage } from '@/components/Toast';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { Dialog } from '@/motion/Dialog';
import {
  closeOverlay,
  type ConfirmOptions,
  isConfirm,
  type OverlayEntryOf,
  retryDialogAction,
  runDialogAction,
  useDialogRun,
  useOverlay,
} from '@/lib/overlayStore';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';

type DialogEntry = OverlayEntryOf<ConfirmOptions>;

// What opens over every screen, drawn once in one window (app/(app)/_layout.tsx): for now the
// centred confirmation (`confirm`, overlayStore.ts). Its window stays while the dialog leaves; the
// last one it showed is kept for that. Android's back button and a tap outside close it as
// "Vazgeç" does; while one of its ways runs none of them does, and a second press is ignored
// (`runDialogAction`). A failed try keeps it open and says so in the top notice over it, in the
// same window (Ortak kurallar C4; SusleKaydedilemedi): the error's words, "Tekrar dene" running
// the failed way again; it goes as the next try starts or the dialog closes.
export function OverlayHost() {
  const open = useOverlay((s) => s.open);
  const dialog: DialogEntry | null =
    open && open.kind === 'dialog' && isConfirm(open.payload)
      ? { ...open, payload: open.payload }
      : null;
  const [shown, setShown] = useState<DialogEntry | null>(dialog);
  if (dialog && dialog.id !== shown?.id) setShown(dialog);
  const run = useDialogRun();
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const look = KIT.layer[scheme];
  useLeaveKeyboard(dialog !== null);

  // What the shown one is doing (kept while it leaves).
  const mine = shown !== null && run.id === shown.id;
  const running = mine ? run.running : null;
  const failed = dialog !== null && run.id === dialog.id ? run.failed : null;
  const testID = dialog?.payload.testID;
  const notice: ToastMessage | null =
    dialog && failed
      ? {
          id: `${dialog.id}:${failed.n}`,
          title: dialog.payload.errorTitle ?? errorMessage(run.error),
          sub: dialog.payload.errorTitle ? errorMessage(run.error) : undefined,
          lead: (
            <CapIcon
              name="warn"
              size={KIT.layer.size.toastIcon}
              color={look.toastIcon}
              soft={look.toastIconSoft}
            />
          ),
          action: {
            label: tr.common.retry,
            testID: testID ? `${testID}-retry` : undefined,
            onPress: () => void retryDialogAction(dialog.id),
          },
        }
      : null;
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
          onConfirm={confirmIt}
          onOther={otherIt}
          onCancel={cancel}
          onHidden={hidden}
        />
        <Toast message={notice} top={insets.top + TOAST_TOP} testID="dialog-error" />
      </GestureHandlerRootView>
    </Modal>
  );
}
