import type { DmInboxThread } from '@shared/api/friends.ts';
import { normalize } from '@shared/trText.ts';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDeferredValue, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { GlassSearch } from '@/aura/GlassSearch';
import { Av, Li, Round, RowList, Seg, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useTabBarSpace } from '@/components/TabBar';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { pruneDmCache } from '@/features/friends/dmCache';
import { ArchivedRow, InboxCard, PinnedHead, useThreadMenu } from '@/features/friends/InboxRows';
import { openDm } from '@/features/friends/openDm';
import { useSessionStore } from '@/features/auth/session';
import { restoreDm, useDmInbox, useFriends, useRequestCount } from '@/features/friends/queries';
import { RequestList } from '@/features/friends/RequestList';
import { NotificationsBell } from '@/features/notifications/Bell';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { splitInbox } from '@/lib/dmManage';
import { useNow } from '@/lib/useNow';
import { PopIn, StickyField } from '@/motion';
import { KIT } from '@/theme/auraKit';
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
  // The field shows each letter at once; the rows follow it a moment later (A-28).
  const asked = useDeferredValue(query);
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
          <Chats now={new Date(now)} query={asked} />
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
  const inbox = useDmInbox();
  const menu = useThreadMenu(inbox.data ?? []);
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
  // Searching: every conversation by name, the archived too. Otherwise the pinned on their own card
  // under "Sabitlenenler" (the server's order: the last pinned on top), the rest, and Arşivlenenler
  // under them (tuval Main, MesajlarArsivRozet; docs/SPEC_V4.md §4.X).
  const searching = normalize(query).trim() !== '';
  const { chats, archived, archivedUnread } = splitInbox(inbox.data);
  const pinned = searching ? [] : chats.filter((t) => t.pinned);
  const rest = searching ? byName(inbox.data, query) : chats.filter((t) => !t.pinned);
  if (searching && rest.length === 0) {
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
    // The room under the last row for the "+" over it.
    <View style={{ paddingBottom: NEW_CHAT, gap: SPACING[2] }}>
      {pinned.length > 0 ? (
        <>
          <PinnedHead count={pinned.length} />
          <InboxCard threads={pinned} now={now} onHold={menu.open} />
        </>
      ) : null}
      {rest.length > 0 ? (
        <InboxCard threads={rest} now={now} onHold={menu.open} from={pinned.length} />
      ) : null}
      {!searching && archived.length > 0 ? (
        <ArchivedRow
          count={archived.length}
          unread={archivedUnread}
          onPress={() => router.push('/messages/archive')}
        />
      ) : null}
      {menu.menu}
    </View>
  );
}

// The conversations brought into memory from the phone: the first screenfuls.
const WARM_ROWS = 20;
