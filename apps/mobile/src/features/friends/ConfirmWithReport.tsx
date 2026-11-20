import type { GameFlowReportReason } from '@shared/chat.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { create } from 'zustand';

import { T, useKit } from '@/aura/kit';
import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { ReportModal } from '@/features/chat/ReportModal';
import { tr } from '@/i18n/tr';
import { closeOverlay, confirm } from '@/lib/overlayStore';
import { Tap } from '@/motion';
import { REPORT_PICK } from '@/theme/person';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // The report's reasons (ReportModal): GAME_FLOW_REPORT_REASONS only for a history row.
  reasons: readonly R[];
  title: string;
  hint: string;
  confirmLabel: string;
  // The confirm button's icon (EngelleOnay: `block`); it also puts the disc over the title.
  confirmIcon?: CapIconName;
  // Not drawn: EngelleOnay (61) draws the icon's disc over the title, no picture; kept so callers
  // stay.
  picture?: ReactNode;
  pending: boolean;
  error: unknown;
  onConfirm: (report: R | undefined) => void;
  onClose: () => void;
};

// What the dialog's children read: they are drawn once by the host, so the box lives outside
// React's props here.
type OptionState = { alsoReport: boolean };
const useOption = create<OptionState>(() => ({ alsoReport: false }));

const L = KIT.layer.size;

// EngelleOnay (61) `.chk`: a row between two hairlines, the box (24, 7 round, a 2 line; ticked
// the ink with its check) and the words with the line under them saying the reason comes next.
function ReportOption() {
  const alsoReport = useOption((s) => s.alsoReport);
  const { scheme } = useTheme();
  const { c } = useKit();
  const look = KIT.layer[scheme];
  return (
    <View style={{ width: '100%' }}>
      <Tap
        sink={false}
        feel="selection"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: alsoReport }}
        accessibilityLabel={`${tr.friends.alsoReport}. ${tr.friends.alsoReportNote}`}
        testID="confirm-also-report"
        onPress={() => useOption.setState((s) => ({ alsoReport: !s.alsoReport }))}
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: L.checkRowGap,
          paddingVertical: L.checkRowPad,
          borderTopWidth: KIT.size.hair,
          borderBottomWidth: KIT.size.hair,
          borderColor: look.checkHair,
        }}
      >
        <View
          style={{
            width: L.checkBox,
            height: L.checkBox,
            borderRadius: L.checkBoxRadius,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alsoReport ? look.checkOn : 'transparent',
            boxShadow: alsoReport
              ? undefined
              : `inset 0px 0px 0px ${L.checkBoxLine}px ${look.checkLine}`,
          }}
        >
          {alsoReport ? (
            <CapIcon name="check" size={L.checkMark} color={look.onCheckOn} soft={1} />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, marginRight: -REPORT_PICK.bleed }}>
          <T v="body" color={c.ink} style={KIT_TYPE.checkRow}>
            {tr.friends.alsoReport}
          </T>
          <T v="body" color={c.muted} style={KIT_TYPE.checkRowNote}>
            {tr.friends.alsoReportNote}
          </T>
        </View>
      </Tap>
    </View>
  );
}

type Waiter = { resolve: () => void; reject: (e: unknown) => void; sawPending: boolean };

// Block or unfriend with the "Şikayet de et" option (docs/arsiv/SPEC_V2.md §6.4): the server copies the
// report in the same transaction before anything is deleted. Now the centred dialog (`confirm`,
// ortak-temel-plan.md paket 4, EngelleOnay): the option's box sits between the sentence and the
// buttons, the action waits while the mutation runs, and a failed one leaves the dialog open with
// the error in the top notice over it (Ortak kurallar C4). With the box ticked the action closes the dialog and the reason sheet (ReportModal,
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
      w.reject(props.error);
    } else {
      w.resolve();
    }
  }, [props.pending, props.error]);

  const open = props.visible && !pickingReason;
  useEffect(() => {
    if (!open) return;
    useOption.setState({ alsoReport: false });
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
