import { useEffect } from 'react';
import { Keyboard } from 'react-native';

// A Modal (sheet, held message, photo) opening lets go of the focused text field. Otherwise the
// field keeps the focus under the modal, and Android shows the keyboard again when the modal's
// window closes and the screen's window gets the focus back: the keyboard covered the tab bar
// after the Şehir ve semt sheet and the DM's newest message after the reaction bar (E2E 02 and
// 05b, 3 Kasım). Every file that opens a Modal calls it (theme/modalKeyboard.test.ts).
export function useLeaveKeyboard(open: boolean): void {
  useEffect(() => {
    if (open) Keyboard.dismiss();
  }, [open]);
}
