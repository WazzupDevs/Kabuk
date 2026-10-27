import {
  VENUE_CHAT_BROADCAST,
  VENUE_CHAT_REACTION_BROADCAST,
  type VenueChatMessage,
  type CheckinIdentity,
  type VenueChatMode,
  venueChatChannel,
  venueChatLastAt,
  withVenueChatExtras,
} from '@shared/venueChat.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

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

// When the venue chat's last message came, for the venue screen's chat card (K-12): the page once
// (the same cache as the chat screen), then each `venue_chat` broadcast only marks the moment it was
// heard. No read again for a message and none for a reaction: the venue screen stays open under
// every other screen, so every phone at the venue would read the page (and sign its photos) at each
// message. Older than CARD_STALE_MS, the page is read once more when the app comes back to the
// front, which also catches a broadcast missed while the connection was down.
const CARD_STALE_MS = 5 * 60_000;
export function useVenueChatLastAt(
  venueId: string | undefined,
  sessionId: string | undefined,
): string | null {
  const first = useQuery({ ...venueChatPage(venueId, sessionId), staleTime: CARD_STALE_MS });
  const [heardAt, setHeardAt] = useState<string | null>(null);
  const heard = useCallback(() => setHeardAt(new Date().toISOString()), []);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_BROADCAST, heard);
  return venueChatLastAt(first.data?.messages.at(-1)?.createdAt ?? null, heardAt);
}

// The venue screen's chat card (the owner's call, 27 Ekim: a fuller card): the last messages of the
// page it already reads (useVenueChatLastAt's rule: once, then only the broadcast's moment), and
// whether a message came after them.
const CARD_PREVIEW = 2;
export function useVenueChatCard(venueId: string | undefined, sessionId: string | undefined) {
  const first = useQuery({ ...venueChatPage(venueId, sessionId), staleTime: CARD_STALE_MS });
  const [heardAt, setHeardAt] = useState<string | null>(null);
  const heard = useCallback(() => setHeardAt(new Date().toISOString()), []);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_BROADCAST, heard);
  const messages = first.data?.messages ?? [];
  const newest = messages.at(-1)?.createdAt ?? null;
  return {
    lastAt: venueChatLastAt(newest, heardAt),
    recent: messages.slice(-CARD_PREVIEW),
    fresh: heardAt !== null && (newest === null || heardAt > newest),
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
