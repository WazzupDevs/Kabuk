import { inboxStamp } from '@shared/dmInbox.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { PopIn } from '@/aura/PopIn';
import { Av, Badge, Li, RowList, Seg, T, useKit, usePress } from '@/aura/kit';
import { DeliveryTicks } from '@/components/ChatBubble';
import { EmptyState } from '@/components/EmptyState';
import { shadowParts } from '@/components/NativeShadow';
import { useLoaderHold } from '@/components/Loader';
import { Rise } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useTabBarSpace } from '@/components/TabBar';
import { TypingDots } from '@/components/TypingDots';
import { pruneDmCache } from '@/features/friends/dmCache';
import { openDm } from '@/features/friends/openDm';
import { useSessionStore } from '@/features/auth/session';
import { restoreDm, useDmInbox, useFriends, useRequestCount } from '@/features/friends/queries';
import { RequestList } from '@/features/friends/RequestList';
import { useDmTyping } from '@/features/friends/useDmTyping';
import { NotificationsBell } from '@/features/notifications/Bell';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';

type Tab = 'chats' | 'requests';

// Mesajlar (docs/design/aura → Mesajlar; docs/SPEC_V3.md §18.3; docs/SPEC_V4.md §4.C): "Sohbetler"
// lists every friend, newest conversation first, from dm/inbox (the function signs the photos); a
// friend without messages shows "Henüz mesaj yok" and a row opens the DM. "İstekler" lists the open
// friend requests waiting for the caller (RequestList); their count is on its tab (the requests'
// scene left in aura 31).
export default function MessagesScreen() {
  const [tab, setTab] = useState<Tab>('chats');
  const [picking, setPicking] = useState(false);
  const requests = useRequestCount();
  const now = useNow(60_000);

  return (
    <View style={{ flex: 1 }}>
      <Screen edges={['top']} refreshable gap={KIT.size.venueGap}>
        {/* docs/design/aura → Mesajlar: the title, the bell, the two tabs, the conversations as
          plain rows. */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <T v="displayXl" accessibilityRole="header">
            {tr.tabs.messages}
          </T>
          <NotificationsBell />
        </View>
        <Seg<Tab>
          large
          value={tab}
          onChange={setTab}
          accessibilityLabel={tr.messages.tabs}
          options={[
            { value: 'chats', label: tr.messages.chatsTab, testID: 'messages-tab-chats' },
            {
              value: 'requests',
              label: tr.messages.requestsTab,
              badge: requests,
              testID: 'messages-tab-requests',
            },
          ]}
        />
        {tab === 'chats' ? <Chats now={new Date(now)} /> : <RequestList now={new Date(now)} />}
      </Screen>
      {/* A new message, as Telegram Android's pencil (the owner's call, 30 Ekim): a friend to
          write to. */}
      {tab === 'chats' ? <NewMessageButton onPress={() => setPicking(true)} /> : null}
      <FriendPicker visible={picking} onClose={() => setPicking(false)} />
    </View>
  );
}

// The round "+" at the bottom right (70, the primary's), over the list and above the tab bar; it
// pops in (docs/design/aura → Mesajlar).
function NewMessageButton({ onPress }: { onPress: () => void }) {
  const barSpace = useTabBarSpace();
  const press = usePress();
  const { c } = useKit();
  const shadow = shadowParts(
    useLabOff('golge'),
    KIT.primaryShadow,
    c.primaryInset,
    KIT.size.newChat / 2,
  );
  return (
    <View style={{ position: 'absolute', right: KIT.size.newChatRight, bottom: barSpace }}>
      <PopIn rise={NEW_CHAT_RISE}>
        <Pressable
          testID="messages-new"
          accessibilityRole="button"
          accessibilityLabel={tr.messages.newMessage}
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
        >
          <Animated.View
            style={{
              width: KIT.size.newChat,
              height: KIT.size.newChat,
              borderRadius: KIT.size.newChat / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: KIT.primary,
              boxShadow: shadow.boxShadow,
              transform: [{ scale: press.scale }],
            }}
          >
            {shadow.node}
            <CapIcon name="plus" color={KIT.onPrimary} soft={NEW_CHAT_SOFT} />
          </Animated.View>
        </Pressable>
      </PopIn>
    </View>
  );
}
const NEW_CHAT_RISE = 12;
// The plus's second stroke on the primary (the board: .62).
const NEW_CHAT_SOFT = 0.62;

// "Yeni mesaj": the friends to write to, as a list; a row opens the conversation.
function FriendPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const friends = useFriends();
  const list = friends.data ?? [];
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.messages.newMessage}>
      {list.length === 0 ? (
        <T v="fine">{friends.isPending ? tr.common.loading : tr.messages.emptyHint}</T>
      ) : (
        <RowList>
          {list.map((f) => {
            const name = f.displayName ?? tr.profile.noName;
            const threadId = f.threadId;
            return (
              <Li
                key={f.publicId}
                testID={`new-message-${name}`}
                accessibilityLabel={name}
                onPress={
                  threadId
                    ? () => {
                        onClose();
                        openDm({ threadId, publicId: f.publicId, name: f.displayName });
                      }
                    : undefined
                }
              >
                <Av size="row" name={name} photoUrl={f.photoUrl} />
                <T v="h3" style={{ flex: 1 }}>
                  {name}
                </T>
              </Li>
            );
          })}
        </RowList>
      )}
    </Sheet>
  );
}

function Chats({ now }: { now: Date }) {
  const inbox = useDmInbox();
  const loading = useLoaderHold(inbox.isPending);
  // The conversations' copies on the phone into memory (useDmMessages): a DM opened from here
  // shows its messages as it slides in, as Telegram Android opens a chat.
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  const threadIds = (inbox.data ?? [])
    .slice(0, WARM_ROWS)
    .flatMap((t) => (t.threadId ? [t.threadId] : []))
    .join(' ');
  useEffect(() => {
    if (!userId || !threadIds) return;
    for (const id of threadIds.split(' ')) void restoreDm(queryClient, userId, id);
  }, [queryClient, userId, threadIds]);
  // A conversation that left the inbox (the friendship ended) leaves the phone too (dmCache.ts).
  const allThreads = inbox.data
    ? inbox.data.flatMap((t) => (t.threadId ? [t.threadId] : [])).join(' ')
    : null;
  useEffect(() => {
    if (!userId || allThreads === null) return;
    void pruneDmCache(userId, new Set(allThreads ? allThreads.split(' ') : []));
  }, [userId, allThreads]);

  if (inbox.isPending || loading) {
    return (
      <View className="mt-12">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  // A failed refresh keeps the list (audit PRO-2): the error only stands in for no list at all.
  if (!inbox.data) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        body={errorMessage(inbox.error)}
        action={{
          label: tr.common.retry,
          onPress: () => void inbox.refetch(),
          loading: inbox.isRefetching,
        }}
      />
    );
  }
  if (inbox.data.length === 0) {
    return (
      <View className="flex-1 justify-center">
        <EmptyState kind="empty" title={tr.messages.empty} body={tr.messages.emptyHint} />
      </View>
    );
  }
  return (
    <View style={{ paddingBottom: KIT.size.newChat }}>
      {/* The room under the last row for the "+" over it. */}
      <RowList inset={KIT.size.av.seat + KIT.size.liGap}>
        {inbox.data.map((t, i) => (
          <Rise key={t.publicId} index={i}>
            <InboxRow thread={t} now={now} listen={i < TYPING_ROWS} />
          </Rise>
        ))}
      </RowList>
    </View>
  );
}

// The conversations brought into memory from the phone: the first screenfuls.
const WARM_ROWS = 20;

// Rows past this many don't listen for "yazıyor": a Realtime connection carries a limited number
// of channels, and the rows further down are off screen.
const TYPING_ROWS = 30;

// A conversation (docs/design/aura → Mesajlar: `.li`): the 58 face, the name (18) and the read
// ticks and time (14) on top, the last message (15) or "yazıyor" below, the unread count as a pink
// badge.
function InboxRow({
  thread: t,
  now,
  listen,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
}) {
  const name = t.displayName ?? tr.profile.noName;
  const unread = t.unreadCount > 0;
  const threadId = t.threadId;
  const preview = <Preview thread={t} unread={unread} />;
  return (
    <Li
      testID={`inbox-${name}`}
      accessibilityLabel={tr.messages.row(name, t.lastBody ?? tr.messages.noMessage, t.unreadCount)}
      padY={KIT.size.inboxPadY}
      onPress={
        threadId ? () => openDm({ threadId, publicId: t.publicId, name: t.displayName }) : undefined
      }
    >
      <Av size="seat" name={name} photoUrl={t.photoUrl} />
      <View style={{ flex: 1, gap: ROW_GAP }}>
        <View style={BETWEEN}>
          <T v="sec" style={{ flexShrink: 1 }}>
            {name}
          </T>
          {t.lastMessageAt ? (
            // The own last message's ticks by the time (Telegram Android).
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap }}>
              {t.lastFromMe && t.lastStatus ? (
                <DeliveryTicks delivery={t.lastStatus} size={INBOX_TICK} />
              ) : null}
              <T v="fineLg">
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
              <Badge count={t.unreadCount} />
            </View>
          ) : null}
        </View>
      </View>
    </Li>
  );
}
const ROW_GAP = 4;
const INBOX_TICK = 17;
const BETWEEN = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: KIT.size.chipsGap,
};

// The last message, ink while unread (its ticks are by the time).
function Preview({ thread: t, unread }: { thread: DmInboxThread; unread: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap }}>
      <T v="body" ink={unread} strong={unread} lines={1} style={{ flex: 1 }}>
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
