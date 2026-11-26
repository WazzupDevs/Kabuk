import type { DmInboxThread } from '@shared/api/friends.ts';
import { normalize, upperTr } from '@shared/trText.ts';
import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchField } from '@/components/Field';
import { Av, type AvBoard, Li, Round, Seg, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { TabPane, useBuiltTabs } from '@/components/TabPane';
import { Toast, type ToastMessage } from '@/components/Toast';
import { pruneDmCache } from '@/features/friends/dmCache';
import { ArchivedRow, InboxList, useThreadMenu } from '@/features/friends/InboxRows';
import { openDmFromInbox } from '@/features/friends/openDm';
import { useSessionStore } from '@/features/auth/session';
import {
  preloadDm,
  restoreDm,
  useDmInbox,
  useFriends,
  useRequestCount,
} from '@/features/friends/queries';
import { useMasaRequestCount } from '@/features/friends/MasaRequests';
import { RequestList } from '@/features/friends/RequestList';
import { NotificationsBell } from '@/features/notifications/Bell';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { splitInbox } from '@/lib/dmManage';
import { useNow } from '@/lib/useNow';
import { ListMove, ListMoveArea, StickyField, useListMoves } from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { MESSAGES as M } from '@/theme/messages';
import { ROOM } from '@/theme/room';

type Tab = 'chats' | 'requests';
const TABS: readonly Tab[] = ['chats', 'requests'];

// Mesajlar (docs/design/iskelet.md → 5.4; docs/SPEC_V3.md §18.3; docs/SPEC_V4.md §4.C): the title
// and the round search, the pencil and the bell stay on top (CLAUDE.md → Ekran davranışı: the top
// buttons never scroll); under them "Sohbetler" and "İstekler", or the search field while it is
// open, pinning under the top as the list scrolls (3.2). "Sohbetler" lists every friend, newest conversation first, from
// dm/inbox (the function signs the photos); the search narrows them by name on the phone, no call;
// a friend without messages shows "Henüz mesaj yok" and a row opens the DM. "İstekler" lists the
// open friend requests waiting for the caller (RequestList); their count is on its tab.
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('chats');
  // "Bak" in Bildirimler opens İstekler (`?tab=requests`).
  const { tab: wantedTab } = useLocalSearchParams<{ tab?: string }>();
  const [handledTab, setHandledTab] = useState<string | undefined>(undefined);
  if (wantedTab !== handledTab) {
    setHandledTab(wantedTab);
    if (wantedTab === 'requests') setTab('requests');
  }
  const [picking, setPicking] = useState(false);
  const built = useBuiltTabs(tab, TABS);
  const [query, setQuery] = useState('');
  // The field shows each letter at once; the rows follow it a moment later (A-28).
  const asked = useDeferredValue(query);
  const requests = useRequestCount();
  const now = useNow(60_000);
  const masaRequests = useMasaRequestCount(now);
  const { scheme } = useKit();
  // "Sohbet silindi" once a conversation is cleared (tuval MesajlarSilindi).
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const onCleared = () => setNotice({ id: Date.now(), title: tr.messages.cleared });

  // The search behind a round button beside the pencil (the owner's call, 24 Kasım): pressed, the
  // field opens in the tabs' place with the keyboard; the button (now a cross) or the back key
  // closes it and clears it (CLAUDE.md → Ekran davranışı).
  const [finding, setFinding] = useState(false);
  const closeFind = useCallback(() => {
    setFinding(false);
    setQuery('');
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (!finding) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        closeFind();
        return true;
      });
      return () => sub.remove();
    }, [finding, closeFind]),
  );
  // Searching (tuval MesajlarAra, MesajlarAraBos): the conversations found stand under the field.
  const searching = normalize(query).trim() !== '';
  return (
    <View style={{ flex: 1 }}>
      <Screen
        edges={['top']}
        refreshable
        side={M.side}
        barSide={M.side}
        barTop={M.top}
        padTop={M.fieldTop}
        gap={M.gap}
        top={
          // Yeni arayüz tuvali, Main (`.hd`): the title (32/500) at the left, the new message's
          // soft round (Telegram Android's pencil, the owner's call, 30 Ekim) and the bell at the
          // right, 8 apart.
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <T v="display" accessibilityRole="header">
              {tr.tabs.messages}
            </T>
            <View style={{ flexDirection: 'row', gap: M.actsGap }}>
              <Round
                side={KIT.size.round}
                icon={finding ? 'close' : 'search'}
                testID="messages-search-open"
                label={finding ? tr.messages.searchClose : tr.messages.search}
                onPress={() => (finding ? closeFind() : setFinding(true))}
              />
              <Round
                side={KIT.size.round}
                icon="compose"
                testID="messages-new"
                label={tr.messages.newMessage}
                onPress={() => setPicking(true)}
              />
              <NotificationsBell />
            </View>
          </View>
        }
      >
        <StickyField band side={M.side}>
          <View style={{ gap: M.gap }}>
            {finding ? (
              <SearchField
                testID="messages-search"
                value={query}
                onChangeText={setQuery}
                placeholder={tr.messages.search}
                autoFocus
              />
            ) : (
              // `.sg`: Aktiviteler's tabs, a glass capsule 44, the chosen part white, 14/600.
              <Seg<Tab>
                board={{
                  item: M.tabs.item,
                  radius: M.tabs.radius,
                  pad: M.tabs.pad,
                  badgeGap: M.tabs.badgeGap,
                  type: 'btnSm',
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
                    badge: requests + masaRequests,
                    testID: 'messages-tab-requests',
                  },
                ]}
              />
            )}
          </View>
        </StickyField>
        {/* The room under the tabs: the empty and loading states centre in it (Screen → fills). */}
        {/* Both tabs stay built once built (TabPane): a switch only shows one. */}
        <View style={{ flexGrow: 1 }}>
          <TabPane grow built={built.has('chats')} shown={tab === 'chats' || searching}>
            <Chats now={new Date(now)} query={asked} onCleared={onCleared} />
          </TabPane>
          <TabPane grow built={built.has('requests')} shown={tab === 'requests' && !searching}>
            <RequestList now={new Date(now)} />
          </TabPane>
        </View>
      </Screen>
      <FriendPicker visible={picking} onClose={() => setPicking(false)} />
      <Toast
        message={notice}
        pill
        bottom={insets.bottom + AURA.tabBar.bottom + AURA.tabBar.height + M.noticeAbove}
        testID="messages-toast"
      />
    </View>
  );
}

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

// "Yeni mesaj": the friends to write to; a row opens the conversation. The rows lie on the sheet
// itself as Masana davet et's do (theme/room.ts → invite), the 44 face without its ring, the count
// under the title (Atölye `newMessageSheet` B, the owner's call, 26 Kasım).
function FriendPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { scheme } = useKit();
  const friends = useFriends();
  const holding = useLoaderHold(friends.isPending);
  const list = friends.data ?? [];
  const I = ROOM.invite;
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.messages.newMessage}
      subtitle={
        friends.data && list.length > 0 ? tr.messages.newMessageSub(list.length) : undefined
      }
    >
      {friends.isError && !friends.data ? (
        <EmptyState
          kind="error"
          compact
          body={errorMessage(friends.error)}
          error={friends.error}
          action={{
            label: tr.common.retry,
            onPress: () => void friends.refetch(),
            loading: friends.isFetching,
          }}
        />
      ) : !friends.data || holding ? (
        <EmptyState kind="loading" body={tr.common.loading} />
      ) : list.length === 0 ? (
        <EmptyState kind="empty" compact body={tr.messages.emptyHint} />
      ) : (
        <View>
          {list.map((f, i) => {
            const name = f.displayName ?? tr.profile.noName;
            const threadId = f.threadId;
            return (
              <View key={f.publicId}>
                {i > 0 ? (
                  <View
                    style={{
                      height: KIT.size.hair,
                      marginLeft: I.hairIn,
                      marginRight: I.hairOut,
                      backgroundColor: KIT.layer[scheme].menuHair,
                    }}
                  />
                ) : null}
                <Li
                  testID={`new-message-${name}`}
                  accessibilityLabel={name}
                  padY={I.padY}
                  padX={0}
                  gap={I.gap}
                  minHeight={I.min}
                  onPress={
                    threadId
                      ? () => {
                          onClose();
                          openDmFromInbox({ threadId, publicId: f.publicId, name: f.displayName });
                        }
                      : undefined
                  }
                >
                  <Av size="md" name={name} photoUrl={f.photoUrl} board={NO_RING} />
                  <View style={{ flex: 1 }}>
                    <T v="settingsRow" ink>
                      {name}
                    </T>
                  </View>
                </Li>
              </View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}
const NO_RING: AvBoard = { ring: 0, ringColor: 'transparent', shadow: '' };

function Chats({ now, query, onCleared }: { now: Date; query: string; onCleared: () => void }) {
  const inbox = useDmInbox();
  // The motion table's A3: the rows move for Sabitle, Arşivle and Sohbeti sil.
  const moves = useListMoves();
  const menu = useThreadMenu(inbox.data ?? [], { moves, onCleared, now });
  const version = inbox.dataUpdatedAt;
  const loading = useLoaderHold(inbox.isPending);
  // The conversations' copies on the phone into memory (useDmMessages): a DM opened from here
  // shows its messages as it slides in, as Telegram Android opens a chat.
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  // The first few are also brought up to date (preloadDm): their newest page read before they are
  // opened when the inbox says something came after the copy.
  const threadIds = (inbox.data ?? [])
    .slice(0, WARM_ROWS)
    .flatMap((t) => (t.threadId ? [`${t.threadId}|${t.lastMessageAt ?? ''}`] : []))
    .join(' ');
  useEffect(() => {
    if (!userId || !threadIds) return;
    threadIds.split(' ').forEach((entry, i) => {
      const [id = '', at = ''] = entry.split('|');
      if (i < PRELOAD_ROWS) void preloadDm(queryClient, userId, id, at || null);
      else void restoreDm(queryClient, userId, id);
    });
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
      <View className="flex-1">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  // A failed refresh keeps the list (audit PRO-2): the error only stands in for no list at all.
  if (!inbox.data) {
    return (
      <EmptyState
        kind="error"
        body={errorMessage(inbox.error)}
        error={inbox.error}
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
      // MesajlarBos `.emp`: in the middle of the page (EmptyState → page), the sentence at most 240.
      <EmptyState
        page
        kind="empty"
        riso="messages"
        compact
        settings
        title={tr.messages.empty}
        body={tr.messages.emptyHint}
      />
    );
  }
  // Searching: every conversation by name, the archived too. Otherwise Arşivlenenler first, under
  // the bars, then one list: the pinned on top (the server's order: the last pinned first), each
  // with its pushpin at the right, and the rest (the owner's call, 24 Kasım; docs/SPEC_V4.md §4.X).
  const searching = normalize(query).trim() !== '';
  const { chats, archived, archivedUnread } = splitInbox(inbox.data);
  const rows = searching
    ? byName(inbox.data, query)
    : [...chats.filter((t) => t.pinned), ...chats.filter((t) => !t.pinned)];
  if (searching && rows.length === 0) {
    // Yeni arayüz tuvali, MesajlarAraBos: nothing found, the riso and its two lines in the middle.
    return (
      <EmptyState
        page
        testID="messages-no-match"
        kind="empty"
        riso="search"
        compact
        settings
        title={tr.messages.noMatch}
        body={tr.messages.noMatchHint}
      />
    );
  }
  return (
    // tuval Main: 12 between the parts, the two lists 8 more apart (`.lst+.lst`).
    <ListMoveArea moves={moves} style={{ gap: M.gap }}>
      {searching ? (
        // `.rlbl`: how many were found, 4 under the field.
        <T v="eyebrow" style={{ marginTop: M.resultTop }} testID="messages-found">
          {upperTr(tr.messages.found(rows.length))}
        </T>
      ) : null}
      {!searching && archived.length > 0 ? (
        <ListMove id="archived-row" version={version} rise={false}>
          <ArchivedRow
            count={archived.length}
            unread={archivedUnread}
            onPress={() => router.push('/messages/archive')}
          />
        </ListMove>
      ) : null}
      {rows.length > 0 ? (
        <InboxList threads={rows} now={now} onHold={menu.open} version={version} />
      ) : null}
      {menu.menu}
    </ListMoveArea>
  );
}

// The conversations brought into memory from the phone: the first screenfuls.
const WARM_ROWS = 20;
// How many of them are read ahead from the server too.
const PRELOAD_ROWS = 5;
