import { venueChatActive } from '@shared/venueChat.ts';
import { router } from 'expo-router';

import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { VenueLinkCard } from '@/ui/VenueCards';

import { useVenueChatLastAt } from './queries';

// "Mekan sohbeti" at the top of the venue screen (v46: .linkcard.chat): the chat disc, the name and
// who reads it, a dot only while the chat is active (a message in the last 10 minutes, K-12), and
// the arrow. The page is read once; then a new message only marks its time (useVenueChatLastAt).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
  const last = useVenueChatLastAt(venueId, sessionId);
  const now = useNow(30_000);
  const active = venueChatActive(last, now);
  return (
    <VenueLinkCard
      testID="venue-chat-open"
      liveTestID="venue-chat-live"
      title={tr.venueChat.open}
      body={tr.venue.chatCard}
      live={active}
      accessibilityLabel={
        active ? `${tr.venueChat.open}, ${tr.venue.chatActive}` : tr.venueChat.open
      }
      onPress={() => router.push('/venue-chat')}
    />
  );
}
