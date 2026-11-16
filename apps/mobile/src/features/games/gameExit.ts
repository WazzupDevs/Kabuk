import { tr } from '@/i18n/tr';
import { confirm } from '@/lib/overlayStore';

// The "end the game / leave the game / back to the table" confirmation the seven games share:
// the centred dialog (motion/Dialog). `run` is the server call (or only closing the cover for a
// watcher); while its promise is pending the dialog waits, and a thrown error leaves it open with
// the error written in it (the dialog's own line).
export type GameExitCopy = { title: string; body: string; confirm: string };

export function confirmGameExit(args: {
  copy: GameExitCopy;
  // Ending the game (owner) and leaving it (player) cannot be undone; watching only goes back.
  danger: boolean;
  testID: string;
  run: () => Promise<unknown> | void;
}): void {
  confirm({
    title: args.copy.title,
    note: args.copy.body,
    tone: args.danger ? 'danger' : 'plain',
    confirmLabel: args.copy.confirm,
    confirmIcon: 'logout',
    cancelLabel: tr.common.cancel,
    onConfirm: async () => {
      await args.run();
    },
    testID: args.testID,
  });
}
