import type { GameFlowReportReason } from '@shared/chat.ts';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import type { CapIconName } from '@/aura/CapIcon';
import { Banner } from '@/components/Banner';
import { Checkbox } from '@/components/Checkbox';
import { Sheet } from '@/components/Sheet';
import { Btn, T, useKit } from '@/aura/kit';
import { ReportModal } from '@/features/chat/ReportModal';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { DM } from '@/theme/dm';

// The face 18 under the handle: the content starts 16 under it, without a title.
const FACE_TOP = DM.confirm.faceTop - KIT.size.sheetGap;

type Props<R extends GameFlowReportReason> = {
  visible: boolean;
  // The report's reasons (ReportModal): GAME_FLOW_REPORT_REASONS only for a history row.
  reasons: readonly R[];
  title: string;
  hint: string;
  confirmLabel: string;
  // The confirm button's icon (EngelleOnay: `block`).
  confirmIcon?: CapIconName;
  // The person's picture over the sentence (iskelet.md → 3.5; the DM, 5.5).
  picture?: ReactNode;
  pending: boolean;
  error: unknown;
  onConfirm: (report: R | undefined) => void;
  onClose: () => void;
};

// Block or unfriend with the "Şikayet de et" option (docs/arsiv/SPEC_V2.md §6.4): the server copies the
// report in the same transaction before anything is deleted. Aura v71 EngelleOnay: no icon disc, the
// option in a boxed row, the confirm in the danger-soft button (K6: the option starts empty).
// tuval Dm (`confirm`; iskelet.md → 3.5): on its plain ground, centred: the face 18 under the
// handle, the question 21/800 14 under it, the sentence 14/500 6 under that; the buttons 20 under
// the words, 12 apart, the danger one and the clear "Vazgeç" (16.5/800).
export function ConfirmWithReport<R extends GameFlowReportReason>(props: Props<R>) {
  const [alsoReport, setAlsoReport] = useState(false);
  const [pickingReason, setPickingReason] = useState(false);
  const { scheme } = useKit();
  const C = DM.confirm;
  const look = DM[scheme].confirm;

  return (
    <>
      <Sheet
        visible={props.visible && !pickingReason}
        onClose={props.onClose}
        look={{ base: look.ground, padX: C.padX, padBottom: C.padBottom }}
      >
        <View style={{ alignItems: 'center', marginTop: FACE_TOP }}>
          {props.picture ?? null}
          <View style={{ marginTop: props.picture ? C.titleTop : 0, alignSelf: 'stretch' }}>
            <T v="confirmTitle" center accessibilityRole="header">
              {props.title}
            </T>
          </View>
          <View style={{ marginTop: C.noteTop, alignSelf: 'stretch' }}>
            <T v="confirmNote" center color={look.note}>
              {props.hint}
            </T>
          </View>
        </View>
        <Checkbox
          boxed
          label={tr.friends.alsoReport}
          checked={alsoReport}
          onToggle={() => setAlsoReport((v) => !v)}
        />
        {props.error ? <Banner tone="danger" body={errorMessage(props.error)} /> : null}
        <View style={{ gap: C.buttonsGap, marginTop: C.buttonsTop - KIT.size.rowGap }}>
          <Btn
            block
            variant="danger"
            testID="confirm-action"
            icon={props.confirmIcon}
            label={props.confirmLabel}
            loading={props.pending}
            look={{ type: 'confirmBtn' }}
            onPress={() => (alsoReport ? setPickingReason(true) : props.onConfirm(undefined))}
          />
          <Btn
            block
            variant="glassy"
            label={tr.common.cancel}
            look={{ type: 'confirmBtn' }}
            onPress={props.onClose}
          />
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
