import { inboxStamp } from '@shared/dmInbox.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { PopIn } from '@/aura/PopIn';
import { Av, Badge, Glass, Li, RISO_TEXTURE, RowList, Seg, T, useKit } from '@/aura/kit';
import { DeliveryTicks } from '@/components/ChatBubble';
import { EmptyState } from '@/components/EmptyState';
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
      <Screen
        edges={['top']}
        refreshable
        gap={KIT.size.venueGap}
        // docs/design/aura → Mesajlar: the title and the bell stay on top (the owner's report, 2
        // Kasım, B2); the two tabs and the conversations as plain rows scroll under them.
        top={
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <T v="display" accessibilityRole="header">
              {tr.tabs.messages}
            </T>
            <NotificationsBell />
          </View>
        }
      >
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

// The round "+" at the bottom right, over the list and above the tab bar; it pops in (docs/design/
// aura → Mesajlar). A riso round as the other buttons, the size of the other round buttons (the
// bell's): the ink flat, the pink printed a little off under it, the texture over it; pressed, the
// print settles onto the pink (the owner's call, 8 Kasım).
function NewMessageButton({ onPress }: { onPress: () => void }) {
  const barSpace = useTabBarSpace();
  const R = KIT.riso;
  const [sink] = useState(() => new Animated.Value(0));
  const settle = (to: number) =>
    Animated.timing(sink, {
      toValue: to,
      duration: R.pressMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  const travel = sink.interpolate({ inputRange: [0, 1], outputRange: [0, R.shift - 1] });
  return (
    <View style={{ position: 'absolute', right: KIT.size.newChatRight, bottom: barSpace }}>
      <PopIn rise={NEW_CHAT_RISE}>
        <Pressable
          testID="messages-new"
          accessibilityRole="button"
          accessibilityLabel={tr.messages.newMessage}
          onPress={onPress}
          onPressIn={() => settle(1)}
          onPressOut={() => settle(0)}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: R.shift,
              left: R.shift,
              width: NEW_CHAT,
              height: NEW_CHAT,
              borderRadius: NEW_CHAT / 2,
              backgroundColor: R.offset,
            }}
          />
          <Animated.View
            style={{
              width: NEW_CHAT,
              height: NEW_CHAT,
              borderRadius: NEW_CHAT / 2,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: R.ink,
              transform: [{ translateX: travel }, { translateY: travel }],
            }}
          >
            <Image
              source={RISO_TEXTURE.light}
              resizeMode="repeat"
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', left: 0, top: 0, width: NEW_CHAT, height: NEW_CHAT }}
            />
            <CapIcon name="plus" color={R.onInk} soft={NEW_CHAT_SOFT} />
          </Animated.View>
        </Pressable>
      </PopIn>
    </View>
  );
}
const NEW_CHAT = KIT.size.newChat;
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
  const { c } = useKit();
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
        <EmptyState
          kind="empty"
          riso="chats"
          title={tr.messages.empty}
          body={tr.messages.emptyHint}
        />
      </View>
    );
  }
  return (
    <View style={{ paddingBottom: NEW_CHAT }}>
      {/* The room under the last row for the "+" over it. */}
      {/* U27: the conversations on glass sm, a hairline from 72 to 16 short of the right. */}
      <Glass sm style={{ paddingVertical: KIT.size.listPadY }}>
        {inbox.data.map((t, i) => (
          <Rise key={t.publicId} index={i}>
            {i > 0 ? (
              <View
                style={{
                  height: KIT.size.hair,
                  marginLeft: KIT.size.liPadX + KIT.size.av.md + KIT.size.liGap,
                  marginRight: KIT.size.liPadX,
                  backgroundColor: c.hair,
                }}
              />
            ) : null}
            <InboxRow thread={t} now={now} listen={i < TYPING_ROWS} />
          </Rise>
        ))}
      </Glass>
    </View>
  );
}

// The conversations brought into memory from the phone: the first screenfuls.
const WARM_ROWS = 20;

// Rows past this many don't listen for "yazıyor": a Realtime connection carries a limited number
// of channels, and the rows further down are off screen.
const TYPING_ROWS = 30;

// A conversation (U27, docs/design/aura → Mesajlar: `.li`): 72 high, the 44 face, the name (h3) and
// the read ticks and time (fine) on top, the last message (body, one line) or "yazıyor" below, the
// unread count as a pink badge.
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
      <Av size="md" name={name} photoUrl={t.photoUrl} />
      <View
        style={{
          flex: 1,
          gap: ROW_GAP,
          minHeight: KIT.size.inboxRow - 2 * KIT.size.inboxPadY,
          justifyContent: 'center',
        }}
      >
        <View style={BETWEEN}>
          <T v="h3" style={{ flexShrink: 1 }}>
            {name}
          </T>
          {t.lastMessageAt ? (
            // The own last message's ticks by the time (Telegram Android).
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap }}>
              {t.lastFromMe && t.lastStatus ? (
                <DeliveryTicks delivery={t.lastStatus} size={INBOX_TICK} />
              ) : null}
              <T v="fine">{tr.messages.stamp(t.lastMessageAt, inboxStamp(t.lastMessageAt, now))}</T>
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
const ROW_GAP = 2;
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
