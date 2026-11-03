import type { GameFlowReportReason } from '@shared/chat.ts';
import { useState } from 'react';
import { View } from 'react-native';

import type { CapIconName } from '@/aura/CapIcon';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Sheet } from '@/components/Sheet';
import { Btn, T } from '@/aura/kit';
import { ReportModal } from '@/features/chat/ReportModal';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // The report's reasons (ReportModal): GAME_FLOW_REPORT_REASONS only for a history row.
  reasons: readonly R[];
  title: string;
  hint: string;
  confirmLabel: string;
  // The confirm button's icon (EngelleOnay: `block`).
  confirmIcon?: CapIconName;
  pending: boolean;
  error: unknown;
  onConfirm: (report: R | undefined) => void;
  onClose: () => void;
};

// Block or unfriend with the "Şikayet de et" option (docs/arsiv/SPEC_V2.md §6.4): the server copies the
// report in the same transaction before anything is deleted. Aura v71 EngelleOnay: no icon disc, the
// option in a boxed row, the confirm in the danger-soft button (K6: the option starts empty).
export function ConfirmWithReport<R extends GameFlowReportReason>(props: Props<R>) {
  const [alsoReport, setAlsoReport] = useState(false);
  const [pickingReason, setPickingReason] = useState(false);

  return (
    <>
      <Sheet visible={props.visible && !pickingReason} onClose={props.onClose} title={props.title}>
        <T v="fine">{props.hint}</T>
        <Checkbox
          boxed
          label={tr.friends.alsoReport}
          checked={alsoReport}
          onToggle={() => setAlsoReport((v) => !v)}
        />
        {props.error ? <Banner tone="danger" body={errorMessage(props.error)} /> : null}
        <View style={{ gap: KIT.size.btnGap }}>
          <Btn
            block
            variant="danger"
            testID="confirm-action"
            icon={props.confirmIcon}
            label={props.confirmLabel}
            loading={props.pending}
            onPress={() => (alsoReport ? setPickingReason(true) : props.onConfirm(undefined))}
          />
          <Button variant="ghost" label={tr.common.cancel} onPress={props.onClose} />
        </View>
      </Sheet>
      <ReportModal
        visible={props.visible && pickingReason}
        reasons={props.reasons}
        pending={props.pending}
        error={props.error}
        onReport={(reason) => {
          setPickingReason(false);
          props.onConfirm(reason);
        }}
        onClose={() => setPickingReason(false)}
      />
    </>
  );
}
