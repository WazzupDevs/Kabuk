import { venueChatActive } from '@shared/venueChat.ts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { GlyphDisc } from '@/components/GlyphDisc';
import { ListCard } from '@/components/ListCard';
import { ListRow } from '@/components/ListRow';
import { LiveDot } from '@/components/LiveDot';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { SPACING } from '@/theme/tokens';

import { useVenueChatLastAt } from './queries';

// The dot beats at a calm pace.
const BEAT_MS = 1600;

// "Mekan sohbeti" at the top of the venue screen (v45: .linkcard.chat): the chat disc, the name and
// who reads it, a dot only while the chat is active (a message in the last 10 minutes, K-12), and
// the arrow. The page is read once; then a new message only marks its time (useVenueChatLastAt).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
  const last = useVenueChatLastAt(venueId, sessionId);
  const now = useNow(30_000);
  const active = venueChatActive(last, now);
  // skall tuvali (Mekan): one row in a list card, the chat disc, the live dot while people write.
  return (
    <ListCard>
      <ListRow
        inset
        noChevron
        testID="venue-chat-open"
        accessibilityLabel={
          active ? `${tr.venueChat.open}, ${tr.venue.chatActive}` : tr.venueChat.open
        }
        onPress={() => router.push('/venue-chat')}
        leading={<GlyphDisc icon="chatbubbles-outline" />}
        title={tr.venueChat.open}
        meta={tr.venue.chatCard}
        trailing={
          active ? (
            <View testID="venue-chat-live">
              <LiveDot tone="success" periodMs={BEAT_MS} size={SPACING[2]} />
            </View>
          ) : undefined
        }
      />
    </ListCard>
  );
}
