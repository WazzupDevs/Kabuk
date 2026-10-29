import type { DmInboxThread } from '@shared/api/friends.ts';
import { type DmPageRow, totalUnread, withSentDm, withThreadRead } from '@shared/dmInbox.ts';
import { withNewestPage, withSamePage } from '@shared/dmPages.ts';
import { BROADCAST, inboxChannel } from '@shared/rooms.ts';
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useSessionStore } from '@/features/auth/session';
import { readDmCache, writeDmCache } from '@/features/friends/dmCache';
import { useBroadcast } from '@/features/rooms/useBroadcast';
import { useReactions } from '@/features/chat/messageExtras';
import { dmApi, friendsApi } from '@/lib/api';
import { stablePhoto } from '@/lib/photoUrls';
import { supabase } from '@/lib/supabase';

export const friendKeys = {
  all: ['friends'] as const,
  list: ['friends', 'list'] as const,
  incoming: ['friends', 'incoming'] as const,
  incomingChat: ['friends', 'incomingChat'] as const,
  sent: ['friends', 'sent'] as const,
  history: ['friends', 'history'] as const,
  inbox: ['friends', 'inbox'] as const,
  dms: ['friends', 'dm'] as const,
  dm: (threadId: string) => ['friends', 'dm', threadId] as const,
  notifications: ['friends', 'notifications'] as const,
};

// The bell's list and its count of new rows (docs/SPEC_V4.md §4.G).
export function useNotifications() {
  return useQuery({
    queryKey: friendKeys.notifications,
    queryFn: () => friendsApi.notifications(),
  });
}

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.list,
    queryFn: async () =>
      (await friendsApi.list()).friends.map((f) => ({ ...f, photoUrl: stablePhoto(f.photoUrl) })),
  });
}

export function useIncomingFriendRequests() {
  return useQuery({
    queryKey: friendKeys.incoming,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_incoming_requests');
      if (error) throw error;
      return data;
    },
  });
}

// Requests from the venue chat (docs/SPEC_V3.md §7.5): the sender's name, age and photo, signed
// by the function. Under friendKeys.all, so the inbox broadcast refreshes them too.
export function useVenueChatRequests() {
  return useQuery({
    queryKey: friendKeys.incomingChat,
    queryFn: async () =>
      (await friendsApi.incoming()).requests.map((r) => ({
        ...r,
        photoUrl: stablePhoto(r.photoUrl),
      })),
  });
}

// Requests sent from the venue chat: the name the other side showed; declined stays pending.
export function useSentVenueChatRequests() {
  return useQuery({
    queryKey: [...friendKeys.sent, 'venueChat'] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_sent_venue_chat_requests');
      if (error) throw error;
      return data;
    },
  });
}

export function useSentFriendRequests() {
  return useQuery({
    queryKey: friendKeys.sent,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_sent_requests');
      if (error) throw error;
      return data;
    },
  });
}

// The caller's own encounters (RLS: own rows once available; no id of the other side).
export function usePlayHistory() {
  return useQuery({
    queryKey: friendKeys.history,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('play_history')
        .select(
          'id, room_id, concept, own_alias, other_alias, other_headcount, reveal_mutual, friend_open, friend_action_at, played_at',
        )
        .order('played_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// This phone's records of one table (docs/SPEC_V3.md §23.G), written when the table closed or when
// this phone left it: one per phone of the other side it sat with for 3 minutes, by that phone's
// alias. The table's end is built from them and from what the phone saw at the table (who sat
// there profiled: play_history.other_profiled is closed to the client).
export function useTableHistory(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...friendKeys.history, 'room', roomId] as const,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('play_history')
        .select('id, other_alias, reveal_mutual, friend_open, friend_action_at')
        .eq('room_id', roomId);
      if (error) throw error;
      return data;
    },
  });
}

// The records whose pair became friends at that encounter (public.my_history_friends: both pressed
// "Arkadaş ekle" on it, friends now, no block): "Arkadaş oldunuz · Mesajlaş" on the table's end and
// in the play history. The RPC gives only the profile id; the name and the DM come from the friend
// list. Both are under friendKeys.all, so a new friendship (the inbox broadcast) reads them again. A
// single press shows nothing (rule 5).
export type HistoryFriend = { publicId: string; name: string | null; threadId: string | null };

export function useHistoryFriends(): { data: ReadonlyMap<string, HistoryFriend> | undefined } {
  const records = useQuery({
    queryKey: [...friendKeys.history, 'friends'] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_history_friends');
      if (error) throw error;
      return data;
    },
  });
  const friends = useFriends();
  const data = useMemo(() => {
    if (!records.data || !friends.data) return undefined;
    const byId = new Map(friends.data.map((f) => [f.publicId, f]));
    const joined = new Map<string, HistoryFriend>();
    for (const r of records.data) {
      const f = byId.get(r.public_id);
      if (f)
        joined.set(r.history_id, {
          publicId: f.publicId,
          name: f.displayName,
          threadId: f.threadId,
        });
    }
    return joined;
  }, [records.data, friends.data]);
  return { data };
}

// Mesajlar (docs/SPEC_V3.md §18.3): every friend, newest conversation first. Under friendKeys.all,
// so the inbox broadcast refreshes it.
export function useDmInbox() {
  return useQuery({
    queryKey: friendKeys.inbox,
    queryFn: async () =>
      (await dmApi.inbox()).threads.map((t) => ({ ...t, photoUrl: stablePhoto(t.photoUrl) })),
  });
}

// The Mesajlar tab's badge.
export function useUnreadTotal(): number {
  const inbox = useDmInbox();
  return totalUnread(inbox.data ?? []);
}

// The requests waiting for the caller (the bell's badge): from play history and the venue chat.
export function useRequestCount(): number {
  const incoming = useIncomingFriendRequests();
  const chatIncoming = useVenueChatRequests();
  return (incoming.data?.length ?? 0) + (chatIncoming.data?.length ?? 0);
}

// The bell's badge: what came after the list was last opened.
export function useUnseenCount(): number {
  return useNotifications().data?.unseen ?? 0;
}

// The inbox and the friends list (both sign photos) are read again at most once per
// INBOX_REFRESH_MS, however many DMs and reads come in meanwhile (adım 9.1: every message used to
// refetch every friends/* query). One timer for the app: the tab layout's inbox channel and the
// conversation's reads share it.
const INBOX_REFRESH_MS = 1000;
let inboxRefresh: ReturnType<typeof setTimeout> | null = null;

function refreshInboxSoon(queryClient: QueryClient): void {
  if (inboxRefresh) return;
  inboxRefresh = setTimeout(() => {
    inboxRefresh = null;
    void queryClient.invalidateQueries({ queryKey: friendKeys.inbox });
    void queryClient.invalidateQueries({ queryKey: friendKeys.list });
  }, INBOX_REFRESH_MS);
}

// dm/read for a conversation the caller is looking at, then the Mesajlar badge: the thread's row in
// the cached inbox drops to nothing unread at once, and the inbox and the friends list are read
// again soon (step 9: the badge stayed red because only the list was refreshed).
export function useMarkThreadRead(threadId: string): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void dmApi
      .read(threadId)
      .then(() => {
        queryClient.setQueryData<DmInboxThread[]>(friendKeys.inbox, (threads) =>
          threads ? withThreadRead(threads, threadId) : threads,
        );
        refreshInboxSoon(queryClient);
      })
      .catch(() => undefined);
  }, [queryClient, threadId]);
}

// dm_messages_page's size.
const DM_PAGE_SIZE = 50;
// A conversation left stays in memory this long: back in it, it shows at once.
const DM_KEEP_MS = 30 * 60_000;
// Older messages being read: a refresh waits for them (their answer is written over the cache as it
// was when they began, and would drop what the refresh put in).
const BUSY_MS = 150;
// Not past this: a read that hangs does not hold the conversation back.
const BUSY_MAX_MS = 10_000;
type DmPages = InfiniteData<DmPageRow[], string | null>;
// Which loaded pages to read again: the newest only, some, or all of them.
type Want = 'all' | ReadonlySet<number>;
const NEWEST: Want = new Set([0]);

async function readDmPage(threadId: string, before: string | null): Promise<DmPageRow[]> {
  const { data, error } = await supabase.rpc('dm_messages_page', {
    target_thread_id: threadId,
    ...(before ? { before } : {}),
  });
  if (error) throw error;
  return data;
}

function joinWant(a: Want | null, b: Want): Want {
  if (a === null) return b;
  if (a === 'all' || b === 'all') return 'all';
  return new Set([...a, ...b]);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One conversation's refresh at a time: what is asked for meanwhile is read once more after it.
const runs = new Map<string, { again: Want | null; done: Promise<void> }>();

// A conversation as Telegram Android keeps its chat (the owner's call, 29 Ekim): a new message, a
// tick or a reaction reads only the page it is in and puts it in place (@shared/dmPages.ts); the
// other pages, and every row that did not change, stay as they are, so nothing else is drawn again.
export function refreshDm(
  queryClient: QueryClient,
  threadId: string,
  want: Want = NEWEST,
): Promise<void> {
  const running = runs.get(threadId);
  if (running) {
    running.again = joinWant(running.again, want);
    return running.done;
  }
  const run: { again: Want | null; done: Promise<void> } = {
    again: null,
    done: Promise.resolve(),
  };
  runs.set(threadId, run);
  run.done = (async () => {
    let next: Want | null = want;
    try {
      while (next !== null) {
        run.again = null;
        await refreshOnce(queryClient, threadId, next).catch(() => undefined);
        next = run.again;
      }
    } finally {
      runs.delete(threadId);
    }
  })();
  return run.done;
}

async function refreshOnce(queryClient: QueryClient, threadId: string, want: Want): Promise<void> {
  const key = friendKeys.dm(threadId);
  for (
    let waited = 0;
    waited < BUSY_MAX_MS && queryClient.getQueryState(key)?.fetchStatus === 'fetching';
    waited += BUSY_MS
  ) {
    await wait(BUSY_MS);
  }
  const data = queryClient.getQueryData<DmPages>(key);
  // Not read yet: its first read brings it.
  if (!data) return;
  const indexes =
    want === 'all'
      ? data.pageParams.map((_, i) => i)
      : [...want].filter((i) => i < data.pageParams.length);
  const fresh = await Promise.all(
    indexes.map((i) => readDmPage(threadId, data.pageParams[i] ?? null)),
  );
  queryClient.setQueryData<DmPages>(key, (d) => {
    if (!d) return d;
    let pages = d.pages;
    indexes.forEach((index, n) => {
      const rows = fresh[n];
      if (!rows) return;
      pages =
        index === 0
          ? withNewestPage(pages, rows, DM_PAGE_SIZE)
          : pages.map((page, i) => (i === index ? withSamePage(page, rows) : page));
    });
    return { ...d, pages };
  });
  // Older messages asked for meanwhile: their answer goes over this one; once more after them.
  if (queryClient.getQueryState(key)?.fetchStatus === 'fetching') {
    const run = runs.get(threadId);
    if (run) run.again = joinWant(run.again, want);
  }
}

// A conversation kept on the phone (dmCache.ts) into memory, if it is not there yet: Mesajlar does
// it for its rows, so a DM opens with its messages already drawn.
export async function restoreDm(
  queryClient: QueryClient,
  userId: string,
  threadId: string,
): Promise<void> {
  const key = friendKeys.dm(threadId);
  if (queryClient.getQueryData(key)) return;
  const rows = await readDmCache(userId, threadId);
  if (!rows || queryClient.getQueryData(key)) return;
  queryClient.setQueryData<DmPages>(key, { pages: [rows], pageParams: [null] });
}

// Newest first, DM_PAGE_SIZE at a time (dm_messages_page), with the status of the caller's own
// messages; the page before the oldest one is read as the reader nears it (fetchNextPage). Shown at
// once from memory or the phone's copy and brought up to date behind it, the newest page only
// (refreshDm): opening, coming back to the foreground and each broadcast read nothing else. Left,
// only the newest page stays; older ones are read again when reached.
export function useDmMessages(threadId: string) {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  const [kept] = useState(() => queryClient.getQueryData(friendKeys.dm(threadId)) !== undefined);
  useEffect(() => {
    if (kept) void refreshDm(queryClient, threadId);
    else if (userId) void restoreDm(queryClient, userId, threadId);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshDm(queryClient, threadId);
    });
    return () => {
      sub.remove();
      queryClient.setQueryData<DmPages>(friendKeys.dm(threadId), (d) =>
        d && d.pages.length > 1
          ? { pages: d.pages.slice(0, 1), pageParams: d.pageParams.slice(0, 1) }
          : d,
      );
    };
  }, [kept, queryClient, threadId, userId]);
  const query = useInfiniteQuery({
    queryKey: friendKeys.dm(threadId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<DmPageRow[]> => {
      const rows = await readDmPage(threadId, pageParam);
      if (pageParam !== null) return rows;
      // The newest page over what memory or the phone already showed.
      const shown = queryClient.getQueryData<DmPages>(friendKeys.dm(threadId))?.pages[0];
      return shown ? (withNewestPage([shown], rows, DM_PAGE_SIZE)[0] ?? rows) : rows;
    },
    // The newest page grows with new messages: a page is full at DM_PAGE_SIZE or more.
    getNextPageParam: (last) =>
      last.length >= DM_PAGE_SIZE ? (last[last.length - 1]?.created_at ?? null) : null,
    // Brought up to date by refreshDm, never by reading every page again.
    staleTime: Infinity,
    gcTime: DM_KEEP_MS,
  });
  // The phone's copy follows the newest page.
  const newest = query.data?.pages[0];
  useEffect(() => {
    if (userId && newest) writeDmCache(userId, threadId, newest);
  }, [userId, threadId, newest]);
  return query;
}

// Sends a DM. On the reply the message goes into the cached page with the 'sent' tick (adım 9.1:
// the clock used to wait for the page to be read again); the caller puts the server's copy in its
// waiting bubble's place then. Resolves with the message's id (null from a function before it). A
// failure rejects with the ApiError, for "Tekrar dene".
export function useSendDm(
  threadId: string,
): (body: string, reply?: { id: string; body: string; fromMe: boolean }) => Promise<string | null> {
  const queryClient = useQueryClient();
  return useCallback(
    async (body: string, reply?: { id: string; body: string; fromMe: boolean }) => {
      const sent = await dmApi.send(threadId, body, reply?.id);
      refreshInboxSoon(queryClient);
      if (!sent.messageId) {
        // A function from before this answer carried the message.
        await refreshDm(queryClient, threadId);
        return null;
      }
      // Into the newest page; not read yet, the DM reads it with the message in it.
      queryClient.setQueryData<DmPages>(friendKeys.dm(threadId), (data) =>
        data
          ? {
              ...data,
              pages: [
                withSentDm(data.pages[0] ?? [], {
                  id: sent.messageId,
                  body,
                  created_at: sent.createdAt,
                  // The quote as the page will send it (docs/SPEC_V3.md §21.1).
                  ...(reply
                    ? {
                        reply_to: {
                          id: reply.id,
                          body: reply.body.slice(0, 80),
                          from_me: reply.fromMe,
                        },
                      }
                    : {}),
                }),
                ...data.pages.slice(1),
              ],
            }
          : data,
      );
      return sent.messageId;
    },
    [queryClient, threadId],
  );
}

// docs/SPEC_V3.md §21.2: the reader's reaction shows at once; then the page it is in is read again
// (and every loaded page on the dm_reaction broadcast).
export function useDmReactions(threadId: string) {
  const queryClient = useQueryClient();
  const react = async (messageId: string, emoji: Parameters<typeof dmApi.react>[1]) => {
    await dmApi.react(messageId, emoji);
    const pages = queryClient.getQueryData<DmPages>(friendKeys.dm(threadId))?.pages ?? [];
    const index = pages.findIndex((page) => page.some((m) => m.id === messageId));
    await refreshDm(queryClient, threadId, new Set([Math.max(index, 0)]));
  };
  return useReactions(react, () => Promise.resolve());
}

// Ticks (docs/SPEC_V3.md §18.2): while the app is open, the messages it has been told about count
// as delivered. Called on mount, when the app comes to the foreground and on an inbox DM
// broadcast, at most once per DELIVERED_DEBOUNCE_MS. With the app closed nothing is delivered.
const DELIVERED_DEBOUNCE_MS = 1000;

function useMarkDelivered(): () => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mark = useCallback(() => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      void dmApi.delivered().catch(() => undefined);
    }, DELIVERED_DEBOUNCE_MS);
  }, []);
  useEffect(() => {
    mark();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') mark();
    });
    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [mark]);
  return mark;
}

// The account's inbox channel: requests and friendships refetch every friends/* query when told to.
// Mounted once, in the tab layout, so the Mesajlar and bell badges stay current. A DM refreshes only
// the inbox and the list, soon (refreshInboxSoon); the open conversation reads its own newest page
// on dm:{thread_id}, and another one reads it when it is opened (useDmMessages).
export function useInbox(): void {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  const markDelivered = useMarkDelivered();
  const refetch = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: friendKeys.all }),
    [queryClient],
  );
  const onDm = useCallback(() => {
    refreshInboxSoon(queryClient);
    markDelivered();
  }, [queryClient, markDelivered]);
  // A table invite (2 minutes) shows on the bell at once; nothing else listened for it, so an
  // invite to a phone with the app open waited for the next foreground (audit CHAT-1, 28 Ekim).
  const refetchNotifications = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: friendKeys.notifications }),
    [queryClient],
  );
  const topic = userId ? inboxChannel(userId) : null;
  useBroadcast(topic, BROADCAST.friendRequest, refetch);
  useBroadcast(topic, BROADCAST.tableInvite, refetchNotifications);
  useBroadcast(topic, BROADCAST.friendshipChanged, refetch);
  useBroadcast(topic, BROADCAST.dm, onDm);
}
