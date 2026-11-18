import type { DmInboxThread } from '@shared/api/friends.ts';
import { normalize, upperTr } from '@shared/trText.ts';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useEffect, useState } from 'react';
import { View } from 'react-native';

import { GlassSearch } from '@/aura/GlassSearch';
import { Av, Li, Round, RowList, Seg, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Toast, type ToastMessage } from '@/components/Toast';
import { pruneDmCache } from '@/features/friends/dmCache';
import { ArchivedRow, InboxList, PinnedHead, useThreadMenu } from '@/features/friends/InboxRows';
import { openDm } from '@/features/friends/openDm';
import { useSessionStore } from '@/features/auth/session';
import { restoreDm, useDmInbox, useFriends, useRequestCount } from '@/features/friends/queries';
import { useMasaRequestCount } from '@/features/friends/MasaRequests';
import { RequestList } from '@/features/friends/RequestList';
import { NotificationsBell } from '@/features/notifications/Bell';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { splitInbox } from '@/lib/dmManage';
import { useNow } from '@/lib/useNow';
import { ListMove, ListMoveArea, StickyField, useListMoves } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { MESSAGES as M } from '@/theme/messages';
import { ICON } from '@/theme/tokens';

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
  // "Bak" in Bildirimler opens İstekler (`?tab=requests`).
  const { tab: wantedTab } = useLocalSearchParams<{ tab?: string }>();
  const [handledTab, setHandledTab] = useState<string | undefined>(undefined);
  if (wantedTab !== handledTab) {
    setHandledTab(wantedTab);
    if (wantedTab === 'requests') setTab('requests');
  }
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  // The field shows each letter at once; the rows follow it a moment later (A-28).
  const asked = useDeferredValue(query);
  const requests = useRequestCount();
  const now = useNow(60_000);
  const masaRequests = useMasaRequestCount(now);
  const { c, scheme } = useKit();
  // "Sohbet silindi" once a conversation is cleared (tuval MesajlarSilindi).
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const onCleared = () => setNotice({ id: Date.now(), title: tr.messages.cleared });

  // Searching (tuval MesajlarAra, MesajlarAraBos): the tabs step aside and the conversations found
  // stand under the field.
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
            <GlassSearch
              testID="messages-search"
              value={query}
              onChangeText={setQuery}
              placeholder={tr.messages.search}
              height={KIT.size.field}
              trailing={
                query ? (
                  <Round
                    glassy={false}
                    side={KIT.size.btnSm}
                    icon="close"
                    iconSize={ICON.md}
                    color={c.muted}
                    label={tr.messages.clearSearch}
                    testID="messages-search-clear"
                    onPress={() => setQuery('')}
                  />
                ) : undefined
              }
            />
            {searching ? null : (
              // `.sg`: Aktiviteler's tabs, a glass capsule 44, the chosen part white, 14/600.
              <Seg<Tab>
                board={{
                  item: M.tabs.item,
                  radius: M.tabs.radius,
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
        {tab === 'chats' || searching ? (
          <Chats now={new Date(now)} query={asked} onCleared={onCleared} />
        ) : (
          <RequestList now={new Date(now)} />
        )}
      </Screen>
      <FriendPicker visible={picking} onClose={() => setPicking(false)} />
      <Toast message={notice} testID="messages-toast" />
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

function Chats({ now, query, onCleared }: { now: Date; query: string; onCleared: () => void }) {
  const inbox = useDmInbox();
  // The motion table's A3: the rows move for Sabitle, Arşivle and Sohbeti sil.
  const moves = useListMoves();
  const menu = useThreadMenu(inbox.data ?? [], { moves, onCleared });
  const version = inbox.dataUpdatedAt;
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
      <View className="flex-1 justify-center">
        <EmptyState
          kind="empty"
          riso="messages"
          compact
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
    // Yeni arayüz tuvali, MesajlarAraBos: nothing found, the riso and its two lines in the middle.
    return (
      <View testID="messages-no-match" className="flex-1 justify-center">
        <EmptyState
          kind="empty"
          riso="search"
          compact
          title={tr.messages.noMatch}
          body={tr.messages.noMatchHint}
        />
      </View>
    );
  }
  return (
    // tuval Main: 12 between the parts, the two lists 8 more apart (`.lst+.lst`).
    <ListMoveArea moves={moves} style={{ gap: M.gap }}>
      {searching ? (
        // `.rlbl`: how many were found, 4 under the field.
        <T v="eyebrow" style={{ marginTop: M.resultTop }} testID="messages-found">
          {upperTr(tr.messages.found(rest.length))}
        </T>
      ) : null}
      {pinned.length > 0 ? (
        <>
          <ListMove id="pinned-head" version={version} rise={false}>
            <PinnedHead count={pinned.length} />
          </ListMove>
          <InboxList
            threads={pinned}
            now={now}
            onHold={menu.open}
            version={version}
            raised={menu.lastKind !== 'unpin'}
          />
        </>
      ) : null}
      {rest.length > 0 ? (
        <InboxList
          threads={rest}
          now={now}
          onHold={menu.open}
          from={pinned.length}
          version={version}
          raised={menu.lastKind === 'unpin'}
          above={pinned.length > 0 ? M.listGap : 0}
        />
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
      {menu.menu}
    </ListMoveArea>
  );
}

// The conversations brought into memory from the phone: the first screenfuls.
const WARM_ROWS = 20;
