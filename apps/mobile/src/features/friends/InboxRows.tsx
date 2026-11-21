import { inboxStamp } from '@shared/dmInbox.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { DM_PIN_MAX } from '@shared/dmManage.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Badge, Li, T, useKit } from '@/aura/kit';
import { DeliveryTicks } from '@/components/ChatBubble';
import { type MenuAnchor, measureMenuAnchor, MenuItem, openMenuAt } from '@/components/Menu';
import { TypingDots } from '@/components/TypingDots';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { refreshFriends } from '@/features/friends/queries';
import { useDmManage } from '@/features/friends/useDmManage';
import { useDmTyping } from '@/features/friends/useDmTyping';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { safetyApi } from '@/lib/api';
import { type DmManageKind, pinsFull } from '@/lib/dmManage';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { confirm } from '@/lib/overlayStore';
import { CountSwap, ListMove, type ListMoves, Tap } from '@/motion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { MESSAGES as M } from '@/theme/messages';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// Mesajlar's and Arşivlenenler's conversations (docs/SPEC_V4.md §4.X): flat rows on the ground, a
// long press on a row opens its menu (tuval MesajlarUzunBas: grown from the row, Menu → anchor,
// the long-press look over its scrim: `hold`).

// Rows past this many don't listen for "yazıyor": a Realtime connection carries a limited number
// of channels, and the rows further down are off screen.
const TYPING_ROWS = 30;

// A press's change and how the list moves for it (the motion table's A3): Sabitle and its undo move
// the row; the others take it out of the list.
const MOVES: Record<DmManageKind, 'move' | 'leave'> = {
  pin: 'move',
  unpin: 'move',
  archive: 'leave',
  unarchive: 'leave',
  clear: 'leave',
};

// One menu a screen (CLAUDE.md → Ekran davranışı: only one open at a time). `all` is the whole
// inbox: "Sabitle" is off at DM_PIN_MAX pinned (tuval MesajlarSabitDolu). `moves`: the list's
// rows move for the press (ListMove); `onCleared`: a conversation was cleared ("Sohbet silindi",
// tuval MesajlarSilindi). `lastKind`: the last press, for which card goes over the other as a row
// moves between them. `now`: the held row's time, as the list shows it.
export function useThreadMenu(
  all: readonly DmInboxThread[],
  { moves, onCleared, now }: { moves?: ListMoves; onCleared?: () => void; now: Date } = {
    now: new Date(),
  },
) {
  const [lastKind, setLastKind] = useState<DmManageKind | null>(null);
  const manage = useDmManage();
  const full = pinsFull(all);
  const run = (kind: DmManageKind, t: DmInboxThread) => {
    if (!t.threadId || manage.isPending) return;
    setLastKind(kind);
    moves?.arm(MOVES[kind], 'now');
    manage.mutate(
      { kind, threadId: t.threadId, lastMessageAt: t.lastMessageAt },
      {
        onError: (e) => Alert.alert(errorMessage(e)),
        onSettled: () => moves?.settle(),
      },
    );
  };
  const askClear = (t: DmInboxThread) => {
    const threadId = t.threadId;
    if (!threadId) return;
    const name = t.displayName ?? tr.profile.noName;
    // tuval MesajlarSohbetSil: the trash on the red disc, "Sohbeti sil" red, "Vazgeç" under it.
    confirm({
      title: tr.messages.clearTitle,
      note: tr.messages.clearNote(name),
      icon: 'trash',
      tone: 'danger',
      confirmLabel: tr.messages.clear,
      confirmIcon: 'trash',
      cancelLabel: tr.common.cancel,
      testID: 'inbox-clear-confirm',
      scrim: 'hold',
      onConfirm: async () => {
        setLastKind('clear');
        // The dialog closes once the call is done: the row goes after it.
        moves?.arm('leave', 'onChange');
        try {
          await manage.mutateAsync({ kind: 'clear', threadId, lastMessageAt: t.lastMessageAt });
        } finally {
          moves?.settle();
        }
        onCleared?.();
      },
    });
  };
  // "Engelle" (tuval MesajlarUzunBas): the DM's own block, its dialog and the report box; the
  // conversation leaves the inbox with the friendship.
  const queryClient = useQueryClient();
  const [blocking, setBlocking] = useState<DmInboxThread | null>(null);
  const block = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ publicId, reason }: { publicId: string; reason?: ReportReason }) =>
      safetyApi.blockFriend(publicId, reason),
    onSuccess: (_data, { reason }) => {
      track('block_created', {});
      if (reason) track('report_submitted', {});
      setBlocking(null);
      void refreshFriends(queryClient, 'friendship');
    },
  });
  const blockName = blocking?.displayName ?? tr.profile.noName;
  const confirmBlock = (
    <ConfirmWithReport
      reasons={REPORT_REASONS}
      visible={blocking !== null}
      title={tr.safety.blockNamedTitle(blockName)}
      hint={tr.friends.blockHint}
      confirmLabel={tr.friends.blockConfirm}
      confirmIcon="block"
      pending={block.isPending}
      error={block.error}
      onConfirm={(reason) => blocking && block.mutate({ publicId: blocking.publicId, reason })}
      onClose={() => setBlocking(null)}
    />
  );
  // The long-press menu over its scrim, the held row raised at its place: in the app's layer, never
  // in the inbox's state, so holding a row redraws no other row (CLAUDE.md → Çizim bütçesi).
  const open = (t: DmInboxThread, at: MenuAnchor) =>
    openMenuAt(
      at,
      <>
        {t.archived ? (
          <MenuItem
            testID="inbox-menu-unarchive"
            cap="unarchive"
            label={tr.messages.unarchive}
            onPress={() => run('unarchive', t)}
          />
        ) : t.pinned ? (
          <MenuItem
            testID="inbox-menu-unpin"
            cap="unpin"
            label={tr.messages.unpin}
            onPress={() => run('unpin', t)}
          />
        ) : (
          <MenuItem
            testID="inbox-menu-pin"
            cap="pushpin"
            label={tr.messages.pin}
            disabled={full}
            note={full ? tr.messages.pinFull(DM_PIN_MAX) : undefined}
            onPress={() => run('pin', t)}
          />
        )}
        {t.archived ? null : (
          <MenuItem
            testID="inbox-menu-archive"
            cap="archive"
            label={tr.messages.archive}
            onPress={() => run('archive', t)}
          />
        )}
        <MenuItem
          testID="inbox-menu-profile"
          cap="user"
          label={tr.messages.seeProfile}
          onPress={() =>
            router.push({
              pathname: '/people/[publicId]',
              params: { publicId: t.publicId, from: 'dm' },
            })
          }
        />
        <MenuItem
          negative
          testID="inbox-menu-block"
          cap="block"
          label={tr.messages.block}
          onPress={() => setBlocking(t)}
        />
        <MenuItem
          negative
          testID="inbox-menu-clear"
          cap="trash"
          label={tr.messages.clear}
          onPress={() => askClear(t)}
        />
      </>,
      {
        hold: true,
        side: M.side,
        label: tr.messages.menu(t.displayName ?? tr.profile.noName),
        lifted: <LiftedRow thread={t} now={now} />,
      },
    );
  return {
    open,
    menu: confirmBlock,
    lastKind,
  };
}

// The rows lying flat on the ground (yeni arayüz tuvali, Main `.lst`): no card and no hairline, the
// rows running to the screen's edges (`margin: 0 -20px`), each 20 in.
export function InboxList({
  threads,
  now,
  onHold,
  from = 0,
  version,
  raised = false,
  above = 0,
}: {
  threads: readonly DmInboxThread[];
  now: Date;
  onHold: (thread: DmInboxThread, at: MenuAnchor) => void;
  // The rows before these on the screen (the pinned list's): the rise and "yazıyor" go on counting.
  from?: number;
  // The inbox's read (its time): the rows lay out again for a press's moves (ListMove).
  version: number;
  // Over the other list: a row moving into it slides over the list it came from.
  raised?: boolean;
  // More room over it than the page's gap (`.lst+.lst`: 8).
  above?: number;
}) {
  return (
    <View style={{ marginHorizontal: -M.side, marginTop: above, zIndex: raised ? 1 : 0 }}>
      {threads.map((t, i) => (
        <ListMove key={t.publicId} id={t.publicId} version={version} index={from + i}>
          <InboxRow thread={t} now={now} listen={from + i < TYPING_ROWS} onHold={onHold} />
        </ListMove>
      ))}
    </View>
  );
}

// tuval Main: over the pinned card, the pushpin (16, its body at half) and "Sabitlenenler" (12/600,
// muted), 6 apart and 4 in; "· 5/5" when full (MesajlarSabitDolu).
export function PinnedHead({ count }: { count: number }) {
  const { c } = useKit();
  return (
    <View
      testID="inbox-pinned-head"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[1.5],
      }}
    >
      <CapIcon name="pushpin" size={ICON.sm} color={c.muted} />
      {/* The one section head (13/700, from the rows' own line; the owner's call, 19 Kasım). */}
      <T v="sectionHead" color={c.muted}>
        {count >= DM_PIN_MAX ? tr.messages.pinnedFull(count, DM_PIN_MAX) : tr.messages.pinned}
      </T>
    </View>
  );
}

// tuval Main and MesajlarArsivRozet: under the list, 48 high and 16 in, 12 between its parts: the
// archive box (20, muted, its body at half), "Arşivlenenler" (600 15/22, 700 with unread: `.arl`),
// the unread on the pink badge, the number of conversations (600 13/18, muted) and the chevron (18).
export function ArchivedRow({
  count,
  unread,
  onPress,
}: {
  count: number;
  unread: number;
  onPress: () => void;
}) {
  const { c } = useKit();
  return (
    <Tap
      testID="inbox-archived"
      accessibilityLabel={tr.messages.archivedRow(count, unread)}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[3],
        minHeight: KIT.size.btn,
        paddingHorizontal: SPACING[4],
      }}
    >
      <CapIcon name="archive" size={ICON.md} color={c.muted} />
      <T v="inboxArchived" style={[{ flex: 1 }, unread > 0 ? KIT_TYPE.heavy : null]}>
        {tr.messages.archived}
      </T>
      {unread > 0 ? <Badge count={unread} /> : null}
      {/* The motion table's A3 3.4: the count's old number fades as the new one comes. */}
      <CountSwap value={String(count)}>
        {/* Proportional digits (`.arc .n` has no tabular-nums): "12" as narrow as the board's. */}
        <T v="inboxCount" color={c.muted}>
          {String(count)}
        </T>
      </CountSwap>
      <CapIcon name="chevron" size={ARC_CHEVRON} color={c.muted} />
    </Tap>
  );
}
// tuval Main: `.chev` 18.
const ARC_CHEVRON = ICON.sm + SPACING[0.5];

// A conversation (yeni arayüz tuvali, Main `.rw`): 10 above and under, 20 in, the 48 face (its 2
// ring inside, the initial 17), 12 from the words; the name (600 16/22) and the time (13/500) on
// top, the last message (15/500, one line fading out at its end) or "yazıyor" 2 under it. Unread,
// the time in the accent at 700, the last line in the ink at 600 and the count on the pink badge at
// the right; the own last message's read ticks (18) before it. A long press opens its menu
// (docs/SPEC_V4.md §4.X).
function InboxRow({
  thread: t,
  now,
  listen,
  onHold,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
  onHold: (thread: DmInboxThread, at: MenuAnchor) => void;
}) {
  const { colors } = useTheme();
  const box = useRef<View>(null);
  const name = t.displayName ?? tr.profile.noName;
  const threadId = t.threadId;
  const lastText = t.lastDeleted === true ? tr.dm.deleted : (t.lastBody ?? tr.messages.noMessage);
  const label = tr.messages.row(name, lastText, t.unreadCount);
  return (
    <View ref={box} collapsable={false}>
      <Li
        testID={`inbox-${name}`}
        accessibilityLabel={t.pinned ? `${label}, ${tr.messages.pinnedRow}` : label}
        padY={M.row.padY}
        padX={M.row.padX}
        gap={M.row.gap}
        minHeight={M.row.minHeight}
        onPress={
          threadId
            ? () => openDm({ threadId, publicId: t.publicId, name: t.displayName })
            : undefined
        }
        onLongPress={
          threadId
            ? () => {
                // Held long enough: felt as the menu opens (as a held message is, ChatBubble).
                haptic('grabbed');
                measureMenuAnchor(box.current, (at) => onHold(t, at));
              }
            : undefined
        }
      >
        <RowBody thread={t} now={now} listen={listen} ground={colors.canvas} />
      </Li>
    </View>
  );
}

// The held row raised over the long press's scrim at its place (tuval MesajlarUzunBas `.rw.ub`):
// the surface card 12 in from the screen's sides, 22 round, its words where the row's were (10 / 8
// inside), its shadow; in the dark #151A18 in a hairline.
function LiftedRow({ thread: t, now }: { thread: DmInboxThread; now: Date }) {
  const { scheme } = useKit();
  const look = M[scheme].lifted;
  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: M.lifted.side,
        paddingVertical: M.row.padY,
        paddingHorizontal: M.lifted.padX,
        borderRadius: M.lifted.radius,
        backgroundColor: look.fill,
        borderWidth: look.edge ? KIT.size.edge : 0,
        borderColor: look.edge || undefined,
        boxShadow: look.shadow || undefined,
        flexDirection: 'row',
        alignItems: 'center',
        gap: M.row.gap,
      }}
    >
      <RowBody thread={t} now={now} listen={false} ground={look.fill} />
    </View>
  );
}

// A row's face and words (`.rw .av`, `.mid`). `ground`: what the last line fades into.
function RowBody({
  thread: t,
  now,
  listen,
  ground,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
  ground: string;
}) {
  const { c, scheme } = useKit();
  const look = M[scheme];
  const name = t.displayName ?? tr.profile.noName;
  const unread = t.unreadCount > 0;
  const threadId = t.threadId;
  const preview = <Preview thread={t} unread={unread} ground={ground} />;
  return (
    <>
      <Av
        // The one person row (the owner's call, 19 Kasım): the face 44, the name 15/600 over a
        // 13/500 line.
        size="md"
        name={name}
        photoUrl={t.photoUrl}
        board={{
          ring: M.row.ring,
          ringColor: look.faceRing,
          shadow: look.faceShadow,
          letter: KIT_TYPE.inboxLetter,
        }}
      />
      <View style={{ flex: 1, minWidth: 0, gap: M.row.lineGap }}>
        <View style={BETWEEN}>
          <T v="inboxName" style={{ flex: 1 }}>
            {name}
          </T>
          {t.lastMessageAt ? (
            <T
              v="fine"
              tabular
              color={unread ? look.fresh : c.muted}
              style={unread ? KIT_TYPE.heavy : null}
            >
              {tr.messages.stamp(t.lastMessageAt, inboxStamp(t.lastMessageAt, now))}
            </T>
          ) : null}
        </View>
        <View style={BETWEEN}>
          {threadId && listen ? (
            <TypingOr threadId={threadId} lastMessageAt={t.lastMessageAt}>
              {preview}
            </TypingOr>
          ) : (
            preview
          )}
          {unread ? (
            <View accessible accessibilityLabel={tr.messages.unread(t.unreadCount)}>
              <Badge count={t.unreadCount} />
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}
const BETWEEN = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: M.row.metaGap,
};

// The last message (`.pv`): muted, in the ink at 600 while unread; the own one after its read ticks
// (`.tick`, 4 apart); none yet, "Henüz mesaj yok" slanted (`.pv.first`). One line cut at its end,
// its last 44 fading into the row's ground (`mask-image`), no "…".
function Preview({
  thread: t,
  unread,
  ground,
}: {
  thread: DmInboxThread;
  unread: boolean;
  ground: string;
}) {
  const { c } = useKit();
  const none = t.lastBody === null;
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap }}>
      {t.lastFromMe && t.lastStatus && !none ? (
        <DeliveryTicks delivery={t.lastStatus} size={M.ticks.width} />
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T
          v="fine"
          color={unread ? c.ink : c.muted}
          lines={1}
          clip
          style={none ? KIT_TYPE.italic : unread ? KIT_TYPE.strong : null}
        >
          {t.lastDeleted === true ? tr.dm.deleted : (t.lastBody ?? tr.messages.noMessage)}
        </T>
        <View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: M.row.fade,
            },
            gradientStyle(`linear-gradient(90deg, ${ground}00, ${ground})`),
          ]}
        />
      </View>
    </View>
  );
}

// "yazıyor" and the dots in place of the last message while the friend types (dm_typing, as in the
// DM).
function TypingOr({
  threadId,
  lastMessageAt,
  children,
}: {
  threadId: string;
  lastMessageAt: string | null;
  children: ReactNode;
}) {
  const { typing, clearTyping } = useDmTyping(threadId);
  // A new message arrived: the dots go at once.
  const seen = useRef(lastMessageAt);
  useEffect(() => {
    if (lastMessageAt === seen.current) return;
    seen.current = lastMessageAt;
    clearTyping();
  }, [lastMessageAt, clearTyping]);
  if (!typing) return children;
  return (
    <View
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipGap }}
      testID="inbox-typing"
    >
      <TypingDots />
      <T v="fine" strong color={KIT.primary}>
        {tr.messages.typing}
      </T>
    </View>
  );
}
