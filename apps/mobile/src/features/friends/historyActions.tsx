import { GAME_FLOW_REPORT_REASONS, type GameFlowReportReason } from '@shared/chat.ts';
import { historyAction } from '@shared/friends.ts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { type ReactNode, useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, type BtnLook, T, useKit } from '@/aura/kit';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { refreshFriends } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { tr } from '@/i18n/tr';
import { PopIn, Tap } from '@/motion';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { ACTIVITIES } from '@/theme/activities';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
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
  const refresh = () => refreshFriends(queryClient, 'pressed');

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
        confirmIcon="block"
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
// `row` (Aktiviteler's game sheet, iskelet.md → 5.3): one line a person, `lead` (their buddy) and
// `title` (their name) at its left, the hint under the name, the small prominent action ("Ekle")
// and the three dots at its right; what a press turns it into ("Eklendi", "Gönderildi") comes in on
// springs.pop. The same states and calls as the stacked one, only drawn so.
export function HistoryActions({
  record: h,
  friend,
  act,
  narrow,
  onMore,
  row,
}: {
  record: HistoryRecord;
  friend: Friend | undefined;
  act: HistoryAct;
  narrow: boolean;
  onMore: () => void;
  row?: { lead: ReactNode; title: ReactNode };
}): ReactNode {
  const { c, scheme } = useKit();
  const action = historyAction(h);
  const silent = h.reveal_mutual || h.friend_open;
  const pending = act.isPending && act.variables?.historyId === h.id;
  // In the game sheet's list a press on one row leaves the other rows as they are (a press on
  // them is passed over while it waits): shown disabled, every other row's button dimmed and
  // narrowed for the half second, and the whole list moved twice
  // (docs/denetim/pano-fark-2026-11.md → PF-28). The stacked card has one record, so it dims.
  const othersBusy = act.isPending && !row;
  const state = friend?.threadId
    ? 'message'
    : action === 'done'
      ? silent
        ? 'added'
        : 'sent'
      : 'press';
  // A state reached while this row is shown pops in; the one it opened with stands still.
  const [shownState, setShownState] = useState(state);
  const [pop, setPop] = useState(false);
  if (shownState !== state) {
    setShownState(state);
    setPop(state === 'added' || state === 'sent');
  }
  // In the game sheet's row (tuval Sohbet): the small prominent at 13.5/800, 11 / 14 in, its icon
  // 14 and 5 from the words; once pressed the soft green pill at 13.5/700 with its check 15.
  const pressLook = row ? ACTION_LOOK : undefined;
  const added = ACTIVITIES[scheme].added;
  const primary = friend?.threadId ? (
    <Btn
      sm
      icon="chat"
      look={pressLook}
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
      fill={row ? added.fill : undefined}
      tint={row ? added.ink : undefined}
      look={row ? DONE_LOOK : undefined}
      testID="history-added"
      label={tr.tableEnd.added}
      disabled={othersBusy}
      loading={pending}
      onPress={() => {
        if (!act.isPending) act.mutate({ kind: 'withdraw', historyId: h.id });
      }}
    />
  ) : action === 'done' ? (
    row ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: DONE_LOOK.gap,
          minHeight: KIT.size.btnSm,
          paddingHorizontal: SHEET.done.padX,
          borderRadius: KIT.size.btnSm / 2,
          backgroundColor: added.fill,
        }}
      >
        <CapIcon name="check" size={DONE_LOOK.icon} color={added.ink} />
        <T v="actionSmDone" color={added.ink}>
          {tr.friends.actionDone}
        </T>
      </View>
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
        <CapIcon name="check" size={ICON.sm} color={c.muted} />
        <T v="fine">{tr.friends.actionDone}</T>
      </View>
    )
  ) : (
    <Btn
      sm
      icon="plus"
      look={pressLook}
      testID={action === 'add_friend' ? 'history-add' : 'history-request'}
      label={
        action === 'add_friend'
          ? row
            ? tr.friends.addShort
            : tr.friends.addFriend
          : tr.friends.sendRequest
      }
      disabled={othersBusy}
      loading={pending}
      onPress={() =>
        !act.isPending &&
        act.mutate({
          kind: action === 'add_friend' ? 'add' : 'request',
          historyId: h.id,
        })
      }
    />
  );
  // Under the name in the sheet's row: the board's line (12.5/600, muted).
  const line = row ? 'personLine' : 'fine';
  const hint = friend ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}>
      <CapIcon name="check" size={ICON.sm} color={c.link} />
      <T v={line} color={c.link}>
        {tr.tableEnd.friends}
      </T>
    </View>
  ) : action === 'done' && silent ? (
    <T v={line} color={c.muted}>
      {tr.friends.addedNote(h.other_alias)}
    </T>
  ) : null;
  if (row) {
    const actions = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SHEET.row.gap }}>
        {pop ? (
          <PopIn key={state} rise={0}>
            {primary}
          </PopIn>
        ) : (
          primary
        )}
        <More onPress={onMore} />
      </View>
    );
    return (
      <View style={{ gap: SPACING[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SHEET.row.gap }}>
          {row.lead}
          <View style={{ flex: 1, minWidth: 0, gap: SHEET.row.nameGap }}>{row.title}</View>
          {narrow ? null : actions}
        </View>
        {narrow ? actions : null}
        {/* Under the row at its full width: beside the buttons it had the name's narrow column
            and stood a word to a line (docs/denetim/pano-fark-2026-11.md → PF-26). */}
        {hint}
      </View>
    );
  }
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

// The game sheet's row (tuval Sohbet; theme/activities.ts).
const SHEET = ACTIVITIES.sheet;
const ACTION_LOOK: BtnLook = {
  type: 'actionSm',
  padLeft: SHEET.action.padLeft,
  padRight: SHEET.action.padRight,
  gap: SHEET.action.gap,
  icon: SHEET.action.icon,
};
const DONE_LOOK = {
  type: 'actionSmDone',
  padLeft: SHEET.done.padX,
  padRight: SHEET.done.padX,
  gap: SHEET.action.gap,
  icon: SHEET.done.icon,
} as const satisfies BtnLook;

// The three dots at the row's right: a 36 round on a faint ink, no glass (tuval Sohbet).
function More({ onPress }: { onPress: () => void }) {
  const { scheme } = useKit();
  const more = ACTIVITIES[scheme].more;
  const side = KIT.size.btnSm;
  return (
    <Tap
      testID="history-more"
      accessibilityLabel={tr.friends.more}
      onPress={onPress}
      style={{
        width: side,
        height: side,
        borderRadius: side / 2,
        backgroundColor: more.fill,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CapIcon name="more" color={more.ink} soft={1} size={SHEET.more} />
    </Tap>
  );
}

// "İkiniz de basarsanız arkadaş olursunuz…": once over the sheet's people when any of them can be
// added (5.2).
// `boxed`: in the green-toned note box (Aktiviteler's game sheet, iskelet.md → 5.3).
export function HistoryAddHint({
  records,
  boxed,
}: {
  records: HistoryRecord[];
  boxed?: boolean;
}): ReactNode {
  const { scheme } = useTheme();
  if (!records.some((r) => historyAction(r) === 'add_friend')) return null;
  if (!boxed) return <T v="fine">{tr.friends.addFriendHint}</T>;
  // tuval Sohbet: the green at 8 %, 18 round, 12 / 14 in, the people's icon 18 before the words.
  const note = SHEET.note;
  const ink = ACTIVITIES[scheme].note.ink;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: note.gap,
        backgroundColor: ACTIVITIES[scheme].note.fill,
        borderRadius: note.radius,
        paddingHorizontal: note.padX,
        paddingVertical: note.padY,
      }}
    >
      <CapIcon name="people" color={ink} size={note.icon} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="sheetNote" color={ink}>
          {tr.friends.addFriendHint}
        </T>
      </View>
    </View>
  );
}
