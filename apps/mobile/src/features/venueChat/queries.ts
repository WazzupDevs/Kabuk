import {
  VENUE_CHAT_BROADCAST,
  VENUE_CHAT_REACTION_BROADCAST,
  type VenueChatMessage,
  type CheckinIdentity,
  type VenueChatMode,
  venueChatChannel,
  withVenueChatExtras,
} from '@shared/venueChat.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

import { useBroadcast } from '@/features/rooms/useBroadcast';
import { useReactions } from '@/features/chat/messageExtras';
import { profileApi, venueChatApi } from '@/lib/api';
import { stablePhoto } from '@/lib/photoUrls';

export const venueChatKeys = {
  messages: (venueId: string) => ['venueChat', venueId] as const,
  // Per check-in as well: a new table session at the same venue never starts from the last one's
  // mode (§22.G), so its first message always asks.
  page: (venueId: string, sessionId: string) => ['venueChat', venueId, sessionId] as const,
  profile: (messageId: string) => ['venueChatProfile', messageId] as const,
};

export type VenueChatPage = {
  messages: VenueChatMessage[];
  mode: VenueChatMode | null;
  // The check-in's identity (docs/SPEC_V4.md §4.D); null without a table.
  identity: CheckinIdentity | null;
};

// The venue chat, oldest first for the screen (venue-chat/page returns newest first, with the
// photos of profiled messages signed), and this check-in's mode (null until the first message,
// docs/SPEC_V3.md §22.G). Empty without a live table at the venue.
function venueChatPage(venueId: string | undefined, sessionId: string | undefined) {
  return {
    queryKey: venueChatKeys.page(venueId ?? '', sessionId ?? ''),
    enabled: venueId !== undefined && sessionId !== undefined,
    queryFn: async (): Promise<VenueChatPage> => {
      const page = await venueChatApi.page(venueId ?? '');
      return {
        messages: page.messages
          .map((m) => withVenueChatExtras({ ...m, photoUrl: stablePhoto(m.photoUrl) }))
          .reverse(),
        mode: page.mode,
        identity: page.identity ?? null,
      };
    },
  };
}

// The venue chat screen's page: read again on the data-free `venue_chat` broadcast and when a
// reaction moved (docs/SPEC_V3.md §21.3). Only the chat screen does this.
export function useVenueChat(venueId: string | undefined, sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId) });
  }, [queryClient, venueId]);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_BROADCAST, refetch);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_REACTION_BROADCAST, refetch);

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
  const missed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const read = useCallback(() => {
    if (timer.current || !venueId || !sessionId) return;
    timer.current = setTimeout(
      () => {
        timer.current = null;
        void queryClient.invalidateQueries({
          queryKey: venueChatKeys.page(venueId, sessionId),
          exact: true,
        });
      },
      CARD_READ_AFTER_MS + Math.random() * CARD_READ_SPREAD_MS,
    );
  }, [queryClient, venueId, sessionId]);
  const heard = useCallback(() => {
    if (focused) read();
    else missed.current = true;
  }, [focused, read]);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_BROADCAST, heard);
  useEffect(() => {
    if (!focused || !missed.current) return;
    missed.current = false;
    read();
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
