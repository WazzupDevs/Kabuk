import { GAME_FLOW_REPORT_REASONS, type GameFlowReportReason } from '@shared/chat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';

import { roomKeys } from '@/features/rooms/queries';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { ReportModal } from './ReportModal';

// "Şikayet et" and "Engelle" in the room (MVP_SPEC §4.5, §8). Faz 2 (docs/SPEC_V3.md §22.D, §22.J):
// the phone is picked first, any phone of the room; the report form follows the pick and lives
// outside the menu, so it stays open after the menu closes.
export function useRoomSafety(roomId: string) {
  const queryClient = useQueryClient();
  // The phone being reported; the reason sheet is open while it is set.
  const [reporting, setReporting] = useState<string | null>(null);

  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: GameFlowReportReason }) =>
      safetyApi.report(roomId, reason, sessionId),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(null);
      Alert.alert(tr.safety.reportSent);
    },
  });
  // Who leaves is the server's (a leader's own member, or the one who blocks).
  const block = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (sessionId: string) => safetyApi.block(roomId, sessionId),
    onSuccess: () => track('block_created', {}),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.phones(roomId) });
    },
  });

  const reportForm = (
    <ReportModal
      visible={reporting !== null}
      reasons={GAME_FLOW_REPORT_REASONS}
      pending={report.isPending}
      error={report.error}
      onReport={(reason) => reporting && report.mutate({ sessionId: reporting, reason })}
      onClose={() => setReporting(null)}
    />
  );
  return {
    startReport: (sessionId: string) => {
      report.reset();
      setReporting(sessionId);
    },
    block: (sessionId: string, onDone: () => void) =>
      block.mutate(sessionId, { onSuccess: onDone }),
    blocking: block.isPending,
    blockError: block.error,
    resetBlock: block.reset,
    reportForm,
  };
}
