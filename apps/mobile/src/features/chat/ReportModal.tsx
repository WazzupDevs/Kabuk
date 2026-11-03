import type { GameFlowReportReason } from '@shared/chat.ts';

import { Btn } from '@/aura/kit';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

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
      icon="report"
      // "Vazgeç" at the foot, under the reasons however many (X3).
      footer={<Btn block variant="glassy" label={tr.common.cancel} onPress={onClose} />}
    >
      {reasons.map((reason) => (
        <Button
          key={reason}
          variant="neutral"
          testID={`report-${reason}`}
          label={tr.safety.reasons[reason]}
          onPress={() => onReport(reason)}
          disabled={pending}
        />
      ))}
      {error ? (
        <Text variant="fine" tone="danger">
          {errorMessage(error)}
        </Text>
      ) : null}
    </Sheet>
  );
}
