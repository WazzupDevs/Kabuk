import { inboxStamp } from '@shared/dmInbox.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { normalize } from '@shared/trText.ts';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { GlassSearch } from '@/aura/GlassSearch';
import { Av, Badge, Glass, Li, Round, RowList, Seg, T, useKit } from '@/aura/kit';
import { DeliveryTicks } from '@/components/ChatBubble';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useTabBarSpace } from '@/components/TabBar';
import { TypingDots } from '@/components/TypingDots';
import { EmptyCard } from '@/features/explore/EmptyCard';
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
import { PopIn, Rise, StickyField } from '@/motion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { MESSAGES as M } from '@/theme/messages';
import { SPACING } from '@/theme/tokens';

type Tab = 'chats' | 'requests';

// Mesajlar (docs/design/iskelet.md → 5.4; docs/SPEC_V3.md §18.3; docs/SPEC_V4.md §4.C): the title
// and the bell stay on top (CLAUDE.md → Ekran davranışı: the top buttons never scroll); under them
// the glass search capsule (Keşfet's) with "Sohbetler" and "İstekler" under it, pinning under the
// top as the list scrolls (3.2). "Sohbetler" lists every friend, newest conversation first, from
// dm/inbox (the function signs the photos); the search narrows them by name on the phone, no call;
// a friend without messages shows "Henüz mesaj yok" and a row opens the DM. "İstekler" lists the
// open friend requests waiting for the caller (RequestList); their count is on its tab.
export default function MessagesScreen() {
  const [tab, setTab] = useState<Tab>('chats');
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const requests = useRequestCount();
  const now = useNow(60_000);
  const { scheme } = useKit();

  return (
    <View style={{ flex: 1 }}>
      <Screen
        edges={['top']}
        refreshable
        side={M.side}
        padTop={M.fieldTop}
        gap={M.listTop}
        top={
          // tuval Mesajlar: the title 36/800 15 under the status bar, 6 in from the cards at its
          // left and the bell 2 in at its right (the screen's top stands 20 in, 8 down).
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: M.headTop,
              marginLeft: M.titleIn,
              marginRight: M.bellIn,
            }}
          >
            <T v="exploreTitle" accessibilityRole="header">
              {tr.tabs.messages}
            </T>
            <NotificationsBell />
          </View>
        }
      >
        <StickyField band side={M.side}>
          <View style={{ gap: SPACING[3] }}>
            <GlassSearch
              testID="messages-search"
              value={query}
              onChangeText={setQuery}
              placeholder={tr.messages.search}
            />
            {/* tuval Mesajlar: the tabs a glass capsule 48, 24 round, the chosen part white, the
                words 15/700. */}
            <Seg<Tab>
              board={{
                item: M.tabs.item,
                radius: M.tabs.radius,
                type: 'tabsBoard',
                face: M[scheme].tabsGlass,
                onShadow: M[scheme].tabOnShadow || undefined,
              }}
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
          </View>
        </StickyField>
        {tab === 'chats' ? (
          <Chats now={new Date(now)} query={query} />
        ) : (
          <RequestList now={new Date(now)} />
        )}
      </Screen>
      {/* A new message, as Telegram Android's pencil (the owner's call, 30 Ekim): a friend to
          write to. */}
      {tab === 'chats' ? <NewMessageButton onPress={() => setPicking(true)} /> : null}
      <FriendPicker visible={picking} onClose={() => setPicking(false)} />
    </View>
  );
}

// The round "+" at the bottom right, over the list and above the tab bar; it pops in. iskelet.md →
// 2.1 and 5.4: a prominent glass round.
function NewMessageButton({ onPress }: { onPress: () => void }) {
  const barSpace = useTabBarSpace();
  // tuval Mesajlar: 26 from the right, 22 over the tab bar; the plus 24.
  return (
    <View
      style={{
        position: 'absolute',
        right: M.newChat.right,
        bottom: barSpace + M.newChat.aboveBar,
      }}
    >
      <PopIn rise={NEW_CHAT_RISE}>
        <Round
          glass="prominent"
          side={NEW_CHAT}
          testID="messages-new"
          label={tr.messages.newMessage}
          onPress={onPress}
        >
          <CapIcon name="plus" color={KIT.onPrimary} soft={NEW_CHAT_SOFT} size={M.newChat.icon} />
        </Round>
      </PopIn>
    </View>
  );
}
const NEW_CHAT = KIT.size.newChat;
const NEW_CHAT_RISE = 12;
// The plus's second stroke on the prominent glass (as a prominent button's icon: .62).
const NEW_CHAT_SOFT = 0.62;

// The conversations whose name holds what is searched (@shared/trText.ts → normalize: Turkish
// lowercase, ç ğ ı ö ş ü folded; CLAUDE.md rule 7).
function byName(threads: readonly DmInboxThread[], query: string): readonly DmInboxThread[] {
  const q = normalize(query).replace(/\s+/g, ' ').trim();
  if (q === '') return threads;
  return threads.filter((t) =>
    normalize(t.displayName ?? tr.profile.noName)
      .replace(/\s+/g, ' ')
      .includes(q),
  );
}

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

function Chats({ now, query }: { now: Date; query: string }) {
  const { scheme } = useKit();
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
  const shown = byName(inbox.data, query);
  if (shown.length === 0) {
    // iskelet.md → 3.4: nothing found, on the small empty card.
    return (
      <EmptyCard
        testID="messages-no-match"
        title={tr.messages.noMatch}
        body={tr.messages.noMatchHint}
      />
    );
  }
  return (
    <View style={{ paddingBottom: NEW_CHAT }}>
      {/* The room under the last row for the "+" over it. */}
      {/* tuval Mesajlar: the conversations on one `.card`, 26 round, 4 / 6 inside; the hairline
          over each row's words but the first (InboxRow). */}
      <Glass
        face={M[scheme].card}
        radius={M.card.radius}
        style={{
          borderRadius: M.card.radius,
          paddingVertical: M.card.padY,
          paddingHorizontal: M.card.padX,
        }}
      >
        {shown.map((t, i) => (
          <Rise key={t.publicId} index={i}>
            <InboxRow thread={t} now={now} listen={i < TYPING_ROWS} follows={i > 0} />
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

// A conversation (tuval Mesajlar): 10 / 8 inside, the 54 face in a white ring, 13 from the words;
// the words 4 above and under, the hairline over them when a row is above; the name (16/700) and
// the read ticks and time (12.5/600) on top, the last message (14/500, one line) or "yazıyor" 3
// under it. iskelet.md → 5.4: unread, the name and the last line bold, the time green and the count
// on a green badge at the right.
function InboxRow({
  thread: t,
  now,
  listen,
  follows,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
  follows: boolean;
}) {
  const { scheme } = useKit();
  const look = M[scheme];
  const name = t.displayName ?? tr.profile.noName;
  const unread = t.unreadCount > 0;
  const threadId = t.threadId;
  const preview = <Preview thread={t} unread={unread} />;
  return (
    <Li
      testID={`inbox-${name}`}
      accessibilityLabel={tr.messages.row(name, t.lastBody ?? tr.messages.noMessage, t.unreadCount)}
      padY={M.row.padY}
      padX={M.row.padX}
      gap={M.row.gap}
      onPress={
        threadId ? () => openDm({ threadId, publicId: t.publicId, name: t.displayName }) : undefined
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
