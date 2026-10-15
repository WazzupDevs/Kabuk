import {
  VENUE_CHAT_BROADCAST,
  VENUE_CHAT_REACTION_BROADCAST,
  type VenueChatMessage,
  type VenueChatMode,
  venueChatChannel,
  withVenueChatExtras,
} from '@shared/venueChat.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

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

export type VenueChatPage = { messages: VenueChatMessage[]; mode: VenueChatMode | null };

// The venue chat, oldest first for the screen (venue-chat/page returns newest first, with the
// photos of profiled messages signed), and this check-in's mode (null until the first message,
// docs/SPEC_V3.md §22.G). Refetched on the data-free `venue_chat` broadcast; empty without a live
// table at the venue.
export function useVenueChat(venueId: string | undefined, sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId) });
  }, [queryClient, venueId]);
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_BROADCAST, refetch);
  // A reaction moved (docs/SPEC_V3.md §21.3): the page again.
  useBroadcast(venueId ? venueChatChannel(venueId) : null, VENUE_CHAT_REACTION_BROADCAST, refetch);

  return useQuery({
    queryKey: venueChatKeys.page(venueId ?? '', sessionId ?? ''),
    enabled: venueId !== undefined && sessionId !== undefined,
    queryFn: async (): Promise<VenueChatPage> => {
      const page = await venueChatApi.page(venueId ?? '');
      return {
        messages: page.messages
          .map((m) => withVenueChatExtras({ ...m, photoUrl: stablePhoto(m.photoUrl) }))
          .reverse(),
        mode: page.mode,
      };
    },
  });
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
