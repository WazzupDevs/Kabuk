import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { refreshFriends } from '@/features/friends/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';
import { useVenueChatProfile } from '@/features/venueChat/queries';
import { track } from '@/lib/analytics';
import { friendsApi, safetyApi } from '@/lib/api';

// The sender of a profiled venue chat message, opened through the message (docs/SPEC_V3.md §7.5):
// no public_id. The screen is the shared `SenderProfileScreen` (the district chat and the venue
// feed use it too).
export default function VenueChatProfileScreen() {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const view = useVenueChatProfile(messageId);
  const queryClient = useQueryClient();
  return (
    <SenderProfileScreen
      view={view}
      sendRequest={() => friendsApi.requestFromVenueChat(messageId)}
      onRequested={() => track('friend_request_sent', { source: 'venue_chat' })}
      report={{
        send: (reason) => safetyApi.reportVenueChat(messageId, reason),
        onSent: () => track('venue_chat_reported', {}),
      }}
      block={{
        send: (reason) => safetyApi.blockVenueChat(messageId, reason),
        onDone: () => {
          track('block_created', {});
          // The blocked person's messages go from the chat, and a friend from the lists (audit CHAT-5).
          void queryClient.invalidateQueries({ queryKey: ['venueChat'] });
          void refreshFriends(queryClient, 'friendship');
          router.back();
        },
      }}
      ids={{
        screen: 'venue-chat-profile',
        request: 'venue-chat-request',
        confirm: 'venue-chat-request-confirm',
        sent: 'venue-chat-request-sent',
        report: 'profile-report',
        block: 'profile-block',
      }}
    />
  );
}
