import { GAME_FLOW_REPORT_REASONS, type GameFlowReportReason } from '@shared/chat.ts';
import { historyAction } from '@shared/friends.ts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { type ReactNode, useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { friendKeys } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

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
            icon="report"
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
        <Btn block variant="glassy" label={tr.common.cancel} onPress={() => setMenuFor(null)} />
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
// (canvas: Faz 3 · 23.3 → oyun geçmişi), else "Arkadaş ekle" or "İstek gönder"; then "Diğer". The
// aura kit's buttons (5.4); the press's explanation is said once for the sheet (`HistoryAddHint`,
// 5.2), not under each person.
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
  const { c } = useKit();
  const action = historyAction(h);
  const silent = h.reveal_mutual || h.friend_open;
  const pending = act.isPending && act.variables?.historyId === h.id;
  const primary = friend?.threadId ? (
    <Btn
      sm
      icon="chat"
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
    <Btn
      sm
      variant="glassy"
      icon="check"
      testID="history-added"
      label={tr.tableEnd.added}
      disabled={act.isPending}
      loading={pending}
      onPress={() => act.mutate({ kind: 'withdraw', historyId: h.id })}
    />
  ) : action === 'done' ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <CapIcon name="check" size={ICON.sm} color={c.muted} />
      <T v="fine">{tr.friends.actionDone}</T>
    </View>
  ) : (
    <Btn
      sm
      icon="plus"
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <CapIcon name="check" size={ICON.sm} color={c.link} />
      <T v="fine" color={c.link}>
        {tr.tableEnd.friends}
      </T>
    </View>
  ) : action === 'done' && silent ? (
    <T v="fine">{tr.friends.addedNote(h.other_alias)}</T>
  ) : null;
  return (
    <>
      {hint}
      <View
        style={{
          flexDirection: narrow ? 'column' : 'row',
          alignItems: narrow ? 'flex-start' : 'center',
          gap: KIT.size.chipsGap,
          marginTop: SPACING[1],
        }}
      >
        {primary}
        <Btn sm variant="glassy" testID="history-more" label={tr.friends.more} onPress={onMore} />
      </View>
    </>
  );
}

// "İkiniz de basarsanız arkadaş olursunuz…": once over the sheet's people when any of them can be
// added (5.2).
export function HistoryAddHint({ records }: { records: HistoryRecord[] }): ReactNode {
  return records.some((r) => historyAction(r) === 'add_friend') ? (
    <T v="fine">{tr.friends.addFriendHint}</T>
  ) : null;
}
