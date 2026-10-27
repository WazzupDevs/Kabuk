import { GAME_FLOW_REPORT_REASONS, type GameFlowReportReason } from '@shared/chat.ts';
import { historyAction } from '@shared/friends.ts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { type ReactNode, useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/Button';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { friendKeys } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

type Action = { kind: 'request' | 'add' | 'withdraw'; historyId: string };
export type HistoryAct = UseMutationResult<unknown, Error, Action>;

// What a play history record offers, on Bildirimler and on Aktiviteler → Geçmiş (docs/SPEC_V3.md
// §23.G; SPEC_V4 K-15): "Arkadaş ekle" or "İstek gönder", and "Diğer" → Şikayet et, Engelle. Every
// action goes through the caller's own record (historyId); nothing carries a profile id (rule 4).
export function useHistoryActions() {
  const queryClient = useQueryClient();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: friendKeys.all });

  const act = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ kind, historyId }: Action) =>
      kind === 'request'
        ? friendsApi.request(historyId)
        : kind === 'withdraw'
          ? friendsApi.withdrawAdd(historyId)
          : friendsApi.addFromRoom(historyId),
    onSuccess: (_data, { kind }) => {
      if (kind === 'request') track('friend_request_sent', { source: 'history' });
      else if (kind === 'add') track('friend_add_pressed', {});
    },
    onError: (err, action) => void askName(err, action),
    onSettled: refresh,
  });
  const runAction = useCallback((a: Action) => act.mutate(a), [act]);
  const askName = useRetryAfterName(runAction);

  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ historyId, reason }: { historyId: string; reason: GameFlowReportReason }) =>
      safetyApi.reportHistory(historyId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(null);
      Alert.alert(tr.safety.reportSent);
    },
  });
  const block = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ historyId, reason }: { historyId: string; reason?: GameFlowReportReason }) =>
      safetyApi.blockHistory(historyId, reason),
    onSuccess: (_data, { reason }) => {
      track('block_created', {});
      if (reason) track('report_submitted', {});
      setBlocking(null);
    },
    onSettled: refresh,
  });

  const sheets = (
    <>
      <Sheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={tr.friends.moreTitle}
      >
        {/* skall tuvali (AktivitelerGecmisKayit): both in the menu card, written red. */}
        <Menu>
          <MenuItem
            negative
            icon="flag-outline"
            label={tr.friends.report}
            onPress={() => {
              setReporting(menuFor);
              setMenuFor(null);
            }}
          />
          <MenuItem
            negative
            testID="menu-block"
            icon="ban-outline"
            label={tr.friends.block}
            onPress={() => {
              setBlocking(menuFor);
              setMenuFor(null);
            }}
          />
        </Menu>
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.cancel}
          onPress={() => setMenuFor(null)}
        />
      </Sheet>

      <ReportModal
        visible={reporting !== null}
        reasons={GAME_FLOW_REPORT_REASONS}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => reporting && report.mutate({ historyId: reporting, reason })}
        onClose={() => setReporting(null)}
      />
      <ConfirmWithReport
        visible={blocking !== null}
        reasons={GAME_FLOW_REPORT_REASONS}
        title={tr.safety.blockConfirmTitle}
        hint={tr.friends.blockHint}
        confirmLabel={tr.friends.blockConfirm}
        pending={block.isPending}
        error={block.error}
        onConfirm={(reason) => blocking && block.mutate({ historyId: blocking, reason })}
        onClose={() => setBlocking(null)}
      />
    </>
  );

  return { act, openMenu: setMenuFor, sheets };
}

type HistoryRecord = Parameters<typeof historyAction>[0] & {
  id: string;
  other_alias: string;
  reveal_mutual: boolean;
  friend_open: boolean;
};
type Friend = { threadId: string | null; publicId: string; name: string | null };

// A record's hint and its actions: "Mesaj" once the two are friends, "Bastın" after a silent press
// (canvas: Faz 3 · 23.3 → oyun geçmişi), else "Arkadaş ekle" or "İstek gönder"; then "Diğer".
export function HistoryActions({
  record: h,
  friend,
  act,
  narrow,
  onMore,
}: {
  record: HistoryRecord;
  friend: Friend | undefined;
  act: HistoryAct;
  narrow: boolean;
  onMore: () => void;
}): ReactNode {
  const { colors } = useTheme();
  const action = historyAction(h);
  const silent = h.reveal_mutual || h.friend_open;
  const pending = act.isPending && act.variables?.historyId === h.id;
  const primary = friend?.threadId ? (
    <Button
      variant="neutral"
      size="sm"
      testID="history-message"
      label={tr.tableEnd.message}
      onPress={() =>
        openDm({
          threadId: friend.threadId ?? '',
          publicId: friend.publicId,
          name: friend.name,
        })
      }
    />
  ) : action === 'done' && silent ? (
    // A silent press is taken back by pressing again (rule 5; skall tuvali, AktivitelerGecmisEklendi).
    <Button
      variant="neutral"
      size="sm"
      icon="checkmark"
      testID="history-added"
      label={tr.tableEnd.added}
      disabled={act.isPending}
      loading={pending}
      onPress={() => act.mutate({ kind: 'withdraw', historyId: h.id })}
    />
  ) : action === 'done' ? (
    <View className="flex-row items-center gap-1.5 self-center">
      <AppIcon name="checkmark" size={ICON.sm} color={colors.muted} />
      <Text variant="label" tone="muted">
        {tr.friends.actionDone}
      </Text>
    </View>
  ) : (
    <Button
      variant="neutral"
      size="sm"
      testID={action === 'add_friend' ? 'history-add' : 'history-request'}
      label={action === 'add_friend' ? tr.friends.addFriend : tr.friends.sendRequest}
      disabled={act.isPending}
      loading={pending}
      onPress={() =>
        act.mutate({
          kind: action === 'add_friend' ? 'add' : 'request',
          historyId: h.id,
        })
      }
    />
  );
  const hint = friend ? (
    <View className="mt-1 flex-row items-center gap-1.5">
      <AppIcon name="checkmark-circle" size={ICON.sm} color={colors.success} />
      <Text variant="label" tone="success">
        {tr.tableEnd.friends}
      </Text>
    </View>
  ) : action === 'add_friend' ? (
    <Text variant="fine" className="mt-1">
      {tr.friends.addFriendHint}
    </Text>
  ) : action === 'done' && silent ? (
    <Text variant="fine" className="mt-1">
      {tr.friends.addedNote(h.other_alias)}
    </Text>
  ) : null;
  return (
    <>
      {hint}
      <View className={narrow ? 'mt-3 items-start gap-2' : 'mt-3 flex-row items-center gap-2'}>
        {primary}
        <Button
          testID="history-more"
          variant="ghost"
          size="sm"
          label={tr.friends.more}
          onPress={onMore}
        />
      </View>
    </>
  );
}
