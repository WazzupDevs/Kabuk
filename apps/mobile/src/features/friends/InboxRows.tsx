import { inboxStamp } from '@shared/dmInbox.ts';
import { DM_PIN_MAX } from '@shared/dmManage.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Badge, Glass, Li, T, useKit } from '@/aura/kit';
import { DeliveryTicks } from '@/components/ChatBubble';
import { type MenuAnchor, measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { TypingDots } from '@/components/TypingDots';
import { openDm } from '@/features/friends/openDm';
import { useDmManage } from '@/features/friends/useDmManage';
import { createDialogError, DialogErrorLine } from '@/features/rooms/DialogError';
import { useDmTyping } from '@/features/friends/useDmTyping';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { type DmManageKind, pinsFull } from '@/lib/dmManage';
import { confirm } from '@/lib/overlayStore';
import { Rise, Tap } from '@/motion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { MESSAGES as M } from '@/theme/messages';
import { ICON, SPACING } from '@/theme/tokens';

// Mesajlar's and Arşivlenenler's conversations (docs/SPEC_V4.md §4.X): the rows on one glass card,
// a long press on a row opens its menu (tuval MesajlarUzunBas: grown from the row, Menu → anchor).

// Rows past this many don't listen for "yazıyor": a Realtime connection carries a limited number
// of channels, and the rows further down are off screen.
const TYPING_ROWS = 30;

type Held = { thread: DmInboxThread; at: MenuAnchor };

// One menu a screen (CLAUDE.md → Ekran davranışı: only one open at a time). `all` is the whole
// inbox: "Sabitle" is off at DM_PIN_MAX pinned (tuval MesajlarSabitDolu).
export function useThreadMenu(all: readonly DmInboxThread[]) {
  const [held, setHeld] = useState<Held | null>(null);
  const manage = useDmManage();
  const full = pinsFull(all);
  const run = (kind: DmManageKind, t: DmInboxThread) => {
    if (!t.threadId || manage.isPending) return;
    manage.mutate(
      { kind, threadId: t.threadId, lastMessageAt: t.lastMessageAt },
      { onError: (e) => Alert.alert(errorMessage(e)) },
    );
  };
  const askClear = (t: DmInboxThread) => {
    const threadId = t.threadId;
    if (!threadId) return;
    const holder = createDialogError();
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
      onConfirm: async () => {
        holder.set(null);
        try {
          await manage.mutateAsync({ kind: 'clear', threadId, lastMessageAt: t.lastMessageAt });
        } catch (e) {
          holder.set(e);
          throw e;
        }
      },
      children: <DialogErrorLine holder={holder} />,
    });
  };
  const open = (thread: DmInboxThread, at: MenuAnchor) => setHeld({ thread, at });
  const t = held?.thread;
  const menu =
    held && t ? (
      <Menu anchor={held.at} visible onClose={() => setHeld(null)}>
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
            cap="pushpin"
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
          negative
          testID="inbox-menu-clear"
          cap="trash"
          label={tr.messages.clear}
          onPress={() => askClear(t)}
        />
      </Menu>
    ) : null;
  return { open, menu };
}

// The rows on one `.card` (tuval Mesajlar), 26 round, 4 / 6 inside; the hairline over each row's
// words but the first (InboxRow).
export function InboxCard({
  threads,
  now,
  onHold,
  from = 0,
}: {
  threads: readonly DmInboxThread[];
  now: Date;
  onHold: (thread: DmInboxThread, at: MenuAnchor) => void;
  // The rows before these on the screen (the pinned card's): the rise and "yazıyor" go on counting.
  from?: number;
}) {
  const { scheme } = useKit();
  return (
    <Glass
      face={M[scheme].card}
      radius={M.card.radius}
      style={{
        borderRadius: M.card.radius,
        paddingVertical: M.card.padY,
        paddingHorizontal: M.card.padX,
      }}
    >
      {threads.map((t, i) => (
        <Rise key={t.publicId} index={from + i}>
          <InboxRow
            thread={t}
            now={now}
            listen={from + i < TYPING_ROWS}
            follows={i > 0}
            onHold={onHold}
          />
        </Rise>
      ))}
    </Glass>
  );
}

// tuval Main: over the pinned card, the pushpin (16) and "Sabitlenenler" (12/600, muted), 6 apart
// and 4 in; "· 5/5" when full (MesajlarSabitDolu).
export function PinnedHead({ count }: { count: number }) {
  const { c } = useKit();
  return (
    <View
      testID="inbox-pinned-head"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[1.5],
        paddingHorizontal: SPACING[1],
      }}
    >
      <CapIcon name="pushpin" size={ICON.sm} color={c.muted} soft={1} />
      <T v="eyebrow" color={c.muted}>
        {count >= DM_PIN_MAX ? tr.messages.pinnedFull(count, DM_PIN_MAX) : tr.messages.pinned}
      </T>
    </View>
  );
}

// tuval Main and MesajlarArsivRozet: under the list, 48 high and 16 in, 12 between its parts: the
// archive box (20, muted), "Arşivlenenler" (15/600, bold with unread), the unread on the pink
// badge, the number of conversations (13/600, muted) and the chevron (18).
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
      <CapIcon name="archive" size={ICON.md} color={c.muted} soft={1} />
      <T v="holdRow" style={[{ flex: 1 }, unread > 0 ? KIT_TYPE.bold : null]}>
        {tr.messages.archived}
      </T>
      {unread > 0 ? <Badge count={unread} /> : null}
      <T v="exploreCount" tabular color={c.muted}>
        {String(count)}
      </T>
      <CapIcon name="chevron" size={ARC_CHEVRON} color={c.muted} soft={1} />
    </Tap>
  );
}
// tuval Main: `.chev` 18.
const ARC_CHEVRON = ICON.sm + SPACING[0.5];

// A conversation (tuval Mesajlar): 10 / 8 inside, the 54 face in a white ring, 13 from the words;
// the words 4 above and under, the hairline over them when a row is above; the name (16/700) and
// the read ticks and time (12.5/600) on top, the last message (14/500, one line) or "yazıyor" 3
// under it. iskelet.md → 5.4: unread, the name and the last line bold, the time green and the count
// on a green badge at the right. A long press opens its menu (docs/SPEC_V4.md §4.X).
function InboxRow({
  thread: t,
  now,
  listen,
  follows,
  onHold,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
  follows: boolean;
  onHold: (thread: DmInboxThread, at: MenuAnchor) => void;
}) {
  const { scheme } = useKit();
  const look = M[scheme];
  const box = useRef<View>(null);
  const name = t.displayName ?? tr.profile.noName;
  const unread = t.unreadCount > 0;
  const threadId = t.threadId;
  const preview = <Preview thread={t} unread={unread} />;
  const label = tr.messages.row(name, t.lastBody ?? tr.messages.noMessage, t.unreadCount);
  return (
    <View ref={box} collapsable={false}>
      <Li
        testID={`inbox-${name}`}
        accessibilityLabel={t.pinned ? `${label}, ${tr.messages.pinnedRow}` : label}
        padY={M.row.padY}
        padX={M.row.padX}
        gap={M.row.gap}
        onPress={
          threadId
            ? () => openDm({ threadId, publicId: t.publicId, name: t.displayName })
            : undefined
        }
        onLongPress={
          threadId ? () => measureMenuAnchor(box.current, (at) => onHold(t, at)) : undefined
        }
      >
        <Av
          size="inbox"
          name={name}
          photoUrl={t.photoUrl}
          board={{ ring: M.row.ring, ringColor: look.faceRing, shadow: look.faceShadow }}
        />
        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: M.row.lineGap,
            paddingVertical: M.row.wordsPadY,
            borderTopWidth: follows ? KIT.size.hair : 0,
            borderTopColor: look.hair,
          }}
        >
          <View style={BETWEEN}>
            <T v="placeName" style={[{ flex: 1 }, unread ? KIT_TYPE.bold : null]}>
              {name}
            </T>
            {t.lastMessageAt ? (
              // The own last message's ticks by the time (Telegram Android).
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: M.row.metaGap }}>
                {t.lastFromMe && t.lastStatus ? (
                  <DeliveryTicks delivery={t.lastStatus} size={M.ticks.width} />
                ) : null}
                <T v="personLine" tabular color={unread ? KIT.primary : look.time}>
                  {tr.messages.stamp(t.lastMessageAt, inboxStamp(t.lastMessageAt, now))}
                </T>
              </View>
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
                <Badge green count={t.unreadCount} />
              </View>
            ) : null}
          </View>
        </View>
      </Li>
    </View>
  );
}
const BETWEEN = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: M.row.metaGap,
};

// The last message, ink and bold while unread (its ticks are by the time); none yet, "Henüz mesaj
// yok" slanted and quieter (iskelet.md → 5.4; tuval Mesajlar: #4A6550, none #7C8F82).
function Preview({ thread: t, unread }: { thread: DmInboxThread; unread: boolean }) {
  const { c, scheme } = useKit();
  const none = t.lastBody === null;
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap }}>
      <T
        v="inboxPreview"
        color={none ? M[scheme].none : unread ? c.ink : M[scheme].preview}
        lines={1}
        style={[{ flex: 1 }, none ? KIT_TYPE.italic : unread ? KIT_TYPE.bold : null]}
      >
        {t.lastBody ?? tr.messages.noMessage}
      </T>
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
