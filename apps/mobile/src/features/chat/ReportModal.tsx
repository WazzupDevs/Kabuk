import type { GameFlowReportReason } from '@shared/chat.ts';

import { useState } from 'react';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { Sheet } from '@/components/Sheet';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { REPORT_PICK } from '@/theme/person';
import { useTheme } from '@/theme/ThemeProvider';

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // REPORT_REASONS, or GAME_FLOW_REPORT_REASONS for a person met in the game flow (a phone at the
  // table, a history row): only there "Yanlış cinsiyet beyanı" (docs/SPEC_V3.md §23.D).
  reasons: readonly R[];
  // The person's name for the title ("Ece'yi neden şikayet ediyorsun?"); without it the plain one.
  name?: string;
  pending: boolean;
  error: unknown;
  onReport: (reason: R) => void;
  onClose: () => void;
};

// Reason picker for "Şikayet et" (a room or a profile). SikayetEt (60): the title with the name,
// the reasons as a radio list (the first one chosen), the red "Şikayeti gönder" under them; no
// close button and no "Vazgeç" (outside, a drag and back close the sheet). The board's "Ne oldu?"
// note is not drawn: the report carries a reason only.
export function ReportModal<R extends GameFlowReportReason>({
  visible,
  reasons,
  name,
  pending,
  error,
  onReport,
  onClose,
}: Props<R>) {
  const { scheme } = useTheme();
  const look = KIT[scheme];
  const first = reasons[0];
  const [picked, setPicked] = useState<R | null>(null);
  const reason = picked && reasons.includes(picked) ? picked : (first ?? null);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={name ? tr.safety.reportNamedTitle(name) : tr.safety.reportTitle}
    >
      <View accessibilityRole="radiogroup">
        {reasons.map((r, i) => {
          const on = r === reason;
          return (
            <Tap
              key={r}
              sink={false}
              feel="selection"
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: pending }}
              disabled={pending}
              testID={`report-${r}`}
              onPress={() => setPicked(r)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: REPORT_PICK.gap,
                minHeight: REPORT_PICK.row,
                borderTopWidth: i === 0 ? 0 : KIT.size.hair,
                borderTopColor: KIT.layer[scheme].checkHair,
              }}
            >
              <View
                style={{
                  width: KIT.size.checkBox,
                  height: KIT.size.checkBox,
                  borderRadius: KIT.size.checkBox / 2,
                  borderWidth: on ? KIT.size.radioOn : KIT.size.markLine,
                  borderColor: on ? look.markOn : look.markLine,
                }}
              />
              <View style={{ flex: 1 }}>
                <T v="popRow" ink>
                  {tr.safety.reasons[r]}
                </T>
              </View>
            </Tap>
          );
        })}
      </View>
      {error ? <Banner tone="danger" body={errorMessage(error)} /> : null}
      <Btn
        block
        variant="danger"
        icon="report"
        testID="report-send"
        label={tr.safety.reportSend}
        loading={pending}
        disabled={!reason}
        onPress={() => reason && onReport(reason)}
      />
    </Sheet>
  );
}
