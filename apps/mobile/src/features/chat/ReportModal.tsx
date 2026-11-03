import type { GameFlowReportReason } from '@shared/chat.ts';

import { View } from 'react-native';

import { Btn } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Sheet } from '@/components/Sheet';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // REPORT_REASONS, or GAME_FLOW_REPORT_REASONS for a person met in the game flow (a phone at the
  // table, a history row): only there "Yanlış cinsiyet beyanı" (docs/SPEC_V3.md §23.D).
  reasons: readonly R[];
  pending: boolean;
  error: unknown;
  onReport: (reason: R) => void;
  onClose: () => void;
};

// Reason picker for "Şikayet et" (a room or a profile).
export function ReportModal<R extends GameFlowReportReason>({
  visible,
  reasons,
  pending,
  error,
  onReport,
  onClose,
}: Props<R>) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.safety.reportTitle}
      titleIcon="report"
      // "Vazgeç" at the foot, under the reasons however many (X3).
      footer={<Btn block variant="glassy" label={tr.common.cancel} onPress={onClose} />}
    >
      {/* SikayetEt (v71): the reasons as soft blocks, 8 apart. */}
      <View style={{ gap: KIT.size.btnGap }}>
        {reasons.map((reason) => (
          <Btn
            key={reason}
            block
            variant="glassy"
            testID={`report-${reason}`}
            label={tr.safety.reasons[reason]}
            onPress={() => onReport(reason)}
            disabled={pending}
          />
        ))}
      </View>
      {error ? <Banner tone="danger" body={errorMessage(error)} /> : null}
    </Sheet>
  );
}
