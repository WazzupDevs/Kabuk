import {
  VENUE_CHAT,
  VENUE_CHAT_BROADCAST,
  VENUE_CHAT_REACTION_BROADCAST,
  VENUE_CHAT_REMOVED_BROADCAST,
  type VenueChatMessage,
  type CheckinIdentity,
  venueChatChannel,
  withVenueChatExtras,
} from '@shared/venueChat.ts';
import type { VenueChatPageResponse } from '@shared/api/venueChat.ts';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

import { useBroadcast } from '@/features/rooms/useBroadcast';
import { useReactions } from '@/features/chat/messageExtras';
import { profileApi, venueChatApi } from '@/lib/api';
import { stablePhoto } from '@/lib/photoUrls';

export const venueChatKeys = {
  messages: (venueId: string) => ['venueChat', venueId] as const,
  // Per check-in as well: a new check-in at the same venue never starts from the last one's page.
  page: (venueId: string, sessionId: string) => ['venueChat', venueId, sessionId] as const,
  profile: (messageId: string) => ['venueChatProfile', messageId] as const,
};

export type VenueChatPage = {
  messages: VenueChatMessage[];
  // The check-in's identity (docs/SPEC_V4.md §4.D); null without a table.
  identity: CheckinIdentity | null;
};

// venue-chat/page returns newest first, with the photos of profiled messages signed; the screen
// draws oldest first.
function oldestFirst(page: VenueChatPageResponse): VenueChatMessage[] {
  return page.messages
    .map((m) => withVenueChatExtras({ ...m, photoUrl: stablePhoto(m.photoUrl) }))
    .reverse();
}

// The venue chat, oldest first, and this check-in's identity (docs/SPEC_V4.md §4.D). Empty without
// a live table at the venue.
function venueChatPage(venueId: string | undefined, sessionId: string | undefined) {
  return {
    queryKey: venueChatKeys.page(venueId ?? '', sessionId ?? ''),
    enabled: venueId !== undefined && sessionId !== undefined,
    queryFn: async (): Promise<VenueChatPage> => {
      const page = await venueChatApi.page(venueId ?? '');
      return { messages: oldestFirst(page), identity: page.identity };
    },
  };
}

// An older page of the venue chat, oldest first (the screen's older pages, useOlderPages).
export async function readVenueChatOlder(
  venueId: string,
  before: string,
): Promise<VenueChatMessage[]> {
  return oldestFirst(await venueChatApi.page(venueId, before));
}

// A new message (D5): only what came after the page's newest message is read and put after it,
// not the whole page again. A full page of new ones may leave a gap: then the page is read again.
// Past LIVE_MAX the page keeps its newest messages; the screen's older pages reach the rest. One
// read at a time per page; a broadcast heard meanwhile reads once more after it.
const LIVE_MAX = VENUE_CHAT.pageSize * 4;
const newerReads = new Map<string, { again: boolean }>();

export function readVenueChatNewer(queryClient: QueryClient, venueId: string, sessionId: string) {
  const queryKey = venueChatKeys.page(venueId, sessionId);
  const id = queryKey.join(':');
  const running = newerReads.get(id);
  if (running) {
    running.again = true;
    return;
  }
  const state = { again: false };
  newerReads.set(id, state);
  const once = async () => {
    const last = queryClient.getQueryData<VenueChatPage>(queryKey)?.messages.at(-1);
    if (!last) {
      await queryClient.invalidateQueries({ queryKey, exact: true });
      return;
    }
    const page = await venueChatApi.newer(venueId, last.createdAt);
    // A full answer without the newest message the page had: there may be more between.
    if (
      page.messages.length >= VENUE_CHAT.pageSize &&
      !page.messages.some((m) => m.id === last.id)
    ) {
      await queryClient.invalidateQueries({ queryKey, exact: true });
      return;
    }
    const fresh = oldestFirst(page);
    queryClient.setQueryData<VenueChatPage>(queryKey, (old) => {
      if (!old) return old;
      const known = new Set(old.messages.map((m) => m.id));
      const added = fresh.filter((m) => !known.has(m.id));
      if (added.length === 0) return { ...old, identity: page.identity };
      return { messages: [...old.messages, ...added].slice(-LIVE_MAX), identity: page.identity };
    });
  };
  const run = async () => {
    do {
      state.again = false;
      // A failed read waits for the next broadcast.
      await once().catch(() => undefined);
    } while (state.again);
    newerReads.delete(id);
  };
  void run();
}

// The venue chat screen's page: a new message on the data-free `venue_chat` broadcast, the page
// again when a reaction moved (docs/SPEC_V3.md §21.3) or a message went. Only the chat screen does
// this.
export function useVenueChat(venueId: string | undefined, sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const reread = useCallback(() => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId) });
  }, [queryClient, venueId]);
  const newer = useCallback(() => {
    if (venueId && sessionId) readVenueChatNewer(queryClient, venueId, sessionId);
  }, [queryClient, venueId, sessionId]);
  const channel = venueId ? venueChatChannel(venueId) : null;
  useBroadcast(channel, VENUE_CHAT_BROADCAST, newer);
  useBroadcast(channel, VENUE_CHAT_REACTION_BROADCAST, reread);
  useBroadcast(channel, VENUE_CHAT_REMOVED_BROADCAST, reread);

  return useQuery(venueChatPage(venueId, sessionId));
}

// The venue screen's chat card (the owner's call, 27 Ekim: a fuller card; docs/design/aura →
// Mekan): the last messages of the page, the count of others' messages after the person last read
// the chat, and the page's state for the card's loading and error. Only real messages count: a
// data-free `venue_chat` broadcast says nothing of who wrote, so it reads the page again rather than
// counting as one (the person's own message and a resubscribe counted, and an empty chat looked
// active). The venue screen stays open under every other screen, so only while Mekan is on top: a
// message heard meanwhile is read when it comes back. Reads close together are one. Older than
// CARD_STALE_MS, the page is read once more when the app comes back to the front.
const CARD_STALE_MS = 5 * 60_000;
// Between 1.5 and 4 s after the broadcast, each phone at its own moment: the broadcast reaches every
// phone at the venue at once, and they would all read the page (and sign its photos) together.
const CARD_READ_AFTER_MS = 1500;
const CARD_READ_SPREAD_MS = 2500;
const CARD_PREVIEW = 2;
// When the person last read the venue chat, per check-in (this run of the app): Mekan's card counts
// the messages after it (docs/design/aura → Mekan: the pink count).
const useVenueChatSeen = create<{ seen: Record<string, string> }>(() => ({ seen: {} }));

export function markVenueChatSeen(sessionId: string) {
  useVenueChatSeen.setState((s) => ({
    seen: { ...s.seen, [sessionId]: new Date().toISOString() },
  }));
}

export function useVenueChatCard(venueId: string | undefined, sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const first = useQuery({ ...venueChatPage(venueId, sessionId), staleTime: CARD_STALE_MS });
  const focused = useIsFocused();
  const missed = useRef<'new' | 'all' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whole = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  // 'new': what came after the newest message (D5); 'all': the page again (a message went).
  const read = useCallback(
    (what: 'new' | 'all') => {
      if (what === 'all') whole.current = true;
      if (timer.current || !venueId || !sessionId) return;
      timer.current = setTimeout(
        () => {
          timer.current = null;
          const all = whole.current;
          whole.current = false;
          if (all) {
            void queryClient.invalidateQueries({
              queryKey: venueChatKeys.page(venueId, sessionId),
              exact: true,
            });
          } else readVenueChatNewer(queryClient, venueId, sessionId);
        },
        CARD_READ_AFTER_MS + Math.random() * CARD_READ_SPREAD_MS,
      );
    },
    [queryClient, venueId, sessionId],
  );
  const heard = useCallback(
    (what: 'new' | 'all') => {
      if (focused) read(what);
      else if (missed.current !== 'all') missed.current = what;
    },
    [focused, read],
  );
  const channel = venueId ? venueChatChannel(venueId) : null;
  useBroadcast(channel, VENUE_CHAT_BROADCAST, () => heard('new'));
  useBroadcast(channel, VENUE_CHAT_REMOVED_BROADCAST, () => heard('all'));
  useEffect(() => {
    const what = missed.current;
    if (!focused || !what) return;
    missed.current = null;
    read(what);
  }, [focused, read]);

  const seenAt = useVenueChatSeen((s) => (sessionId ? s.seen[sessionId] : undefined));
  // The first sight of the card counts as read: the count is what came after.
  useEffect(() => {
    if (sessionId && seenAt === undefined) markVenueChatSeen(sessionId);
  }, [sessionId, seenAt]);
  const messages = first.data?.messages ?? [];
  return {
    // The page is read once at first; a read again keeps what the card shows.
    pending: first.isPending,
    failed: first.isError && !first.data,
    retrying: first.isFetching,
    retry: () => void first.refetch(),
    lastAt: messages.at(-1)?.createdAt ?? null,
    recent: messages.slice(-CARD_PREVIEW),
    unread: seenAt ? messages.filter((m) => !m.fromMe && m.createdAt > seenAt).length : 0,
  };
}

// The sender of a profiled message, opened through the message (no public_id).
export function useVenueChatProfile(messageId: string | undefined) {
  return useQuery({
    queryKey: venueChatKeys.profile(messageId ?? ''),
    enabled: !!messageId,
    retry: false,
    queryFn: () => profileApi.getFromVenueChat(messageId ?? ''),
  });
}

// The reader's reactions (docs/SPEC_V3.md §21.2): shown at once; over the limit (10 per 10
// seconds) the server answers rate_limited and the bubble quietly goes back to the page.
export function useVenueChatReactions(venueId: string | undefined) {
  const queryClient = useQueryClient();
  return useReactions(venueChatApi.react, () =>
    queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId ?? '') }),
  );
}
