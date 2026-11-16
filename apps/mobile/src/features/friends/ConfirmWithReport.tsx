import type { GameFlowReportReason } from '@shared/chat.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { create } from 'zustand';

import type { CapIconName } from '@/aura/CapIcon';
import { Banner } from '@/components/Banner';
import { Checkbox } from '@/components/Checkbox';
import { ReportModal } from '@/features/chat/ReportModal';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { closeOverlay, confirm } from '@/lib/overlayStore';

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // The report's reasons (ReportModal): GAME_FLOW_REPORT_REASONS only for a history row.
  reasons: readonly R[];
  title: string;
  hint: string;
  confirmLabel: string;
  // The confirm button's icon (EngelleOnay: `block`); it also puts the disc over the title.
  confirmIcon?: CapIconName;
  // The centred dialog has no slot for a picture (EngelleOnay draws a disc); kept so callers stay.
  picture?: ReactNode;
  pending: boolean;
  error: unknown;
  onConfirm: (report: R | undefined) => void;
  onClose: () => void;
};

// What the dialog's children read: they are drawn once by the host, so the box and the error live
// outside React's props here.
type OptionState = { alsoReport: boolean; error: string | null };
const useOption = create<OptionState>(() => ({ alsoReport: false, error: null }));

function ReportOption() {
  const alsoReport = useOption((s) => s.alsoReport);
  const error = useOption((s) => s.error);
  return (
    <View>
      <Checkbox
        boxed
        label={tr.friends.alsoReport}
        checked={alsoReport}
        onToggle={() => useOption.setState((s) => ({ alsoReport: !s.alsoReport }))}
      />
      {error ? <Banner tone="danger" body={error} /> : null}
    </View>
  );
}

type Waiter = { resolve: () => void; reject: (e: unknown) => void; sawPending: boolean };

// Block or unfriend with the "Şikayet de et" option (docs/arsiv/SPEC_V2.md §6.4): the server copies the
// report in the same transaction before anything is deleted. Now the centred dialog (`confirm`,
// ortak-temel-plan.md paket 4, EngelleOnay): the option's box sits between the sentence and the
// buttons, the action waits while the mutation runs, and a failed one leaves the dialog open with
// the error. With the box ticked the action closes the dialog and the reason sheet (ReportModal,
// still a bottom sheet) opens.
export function ConfirmWithReport<R extends GameFlowReportReason>(props: Props<R>) {
  const [pickingReason, setPickingReason] = useState(false);
  const latest = useRef(props);
  const waiter = useRef<Waiter | null>(null);
  const dialogId = useRef<string | null>(null);

  useEffect(() => {
    latest.current = props;
  });

  // The mutation's turn ends the wait: its error keeps the dialog open.
  useEffect(() => {
    const w = waiter.current;
    if (!w) return;
    if (props.pending) {
      w.sawPending = true;
      return;
    }
    if (!w.sawPending) return;
    waiter.current = null;
    if (props.error) {
      useOption.setState({ error: errorMessage(props.error) });
      w.reject(props.error);
    } else {
      w.resolve();
    }
  }, [props.pending, props.error]);

  const open = props.visible && !pickingReason;
  useEffect(() => {
    if (!open) return;
    useOption.setState({ alsoReport: false, error: null });
    dialogId.current = confirm({
      title: props.title,
      note: props.hint,
      icon: props.confirmIcon,
      tone: 'danger',
      confirmLabel: props.confirmLabel,
      confirmIcon: props.confirmIcon,
      cancelLabel: tr.common.cancel,
      children: <ReportOption />,
      testID: 'confirm-action',
      onConfirm: () => {
        if (useOption.getState().alsoReport) {
          setPickingReason(true);
          return undefined;
        }
        useOption.setState({ error: null });
        return new Promise<void>((resolve, reject) => {
          waiter.current = { resolve, reject, sawPending: false };
          latest.current.onConfirm(undefined);
        });
      },
      onCancel: () => latest.current.onClose(),
    });
    return () => {
      // Closes only its own dialog, quietly (the caller took `visible` away or the reason sheet
      // opens); a stale id is a no-op.
      if (dialogId.current) closeOverlay(dialogId.current, false);
      dialogId.current = null;
      waiter.current = null;
    };
    // The text is read once on opening, as a sheet reads its props while shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!props.visible) return;
    // The reason step ends with the visit.
    return () => setPickingReason(false);
  }, [props.visible]);

  return (
    <ReportModal
      visible={props.visible && pickingReason}
      reasons={props.reasons}
      pending={props.pending}
      error={props.error}
      onReport={(reason) => props.onConfirm(reason)}
      onClose={() => setPickingReason(false)}
    />
  );
}
