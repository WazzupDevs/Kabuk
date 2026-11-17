import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { refreshFriends } from '@/features/friends/queries';
import { SenderProfileScreen } from '@/features/profile/SenderProfileScreen';
import { useVenueFeedProfile, venueFeedKeys } from '@/features/venueFeed/queries';
import { friendsApi, venueFeedApi } from '@/lib/api';

// The author of a post or a reply, opened through it (docs/SPEC_V4.md §4.Y): no public_id, no
// capsule or nick. The screen is the shared `SenderProfileScreen`; the feed has no block, only
// "Sessize al" and "Şikayet et".
export default function VenueFeedProfileScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const view = useVenueFeedProfile(postId);
  const queryClient = useQueryClient();
  return (
    <SenderProfileScreen
      view={view}
      sendRequest={() => friendsApi.requestFromVenuePost(postId)}
      // The "Gönderdiğin" list reads again.
      onRequested={() => void refreshFriends(queryClient, 'pressed')}
      report={{ send: (reason) => venueFeedApi.report(postId, reason) }}
      mute={{
        send: () => venueFeedApi.mute(postId),
        onDone: () => {
          void queryClient.invalidateQueries({ queryKey: ['venueChatMutes'] });
          void queryClient.invalidateQueries({ queryKey: venueFeedKeys.all });
          void queryClient.invalidateQueries({ queryKey: venueFeedKeys.repliesAll });
          router.back();
        },
      }}
      ids={{
        screen: 'venue-feed-profile',
        request: 'venue-feed-profile-request',
        confirm: 'venue-feed-request-confirm',
        sent: 'venue-feed-request-sent',
        report: 'venue-feed-profile-report',
      }}
    />
  );
}
