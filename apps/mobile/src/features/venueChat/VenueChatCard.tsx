import { venueChatActive } from '@shared/venueChat.ts';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { LiveDot } from '@/components/LiveDot';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH } from '@/theme/tokens';

import { useVenueChatLastAt } from './queries';

// The dot beats at a calm pace.
const BEAT_MS = 1600;

// "Mekan sohbeti" at the top of the venue screen (v45: .linkcard.chat): the chat disc, the name and
// who reads it, a dot only while the chat is active (a message in the last 10 minutes, K-12), and
// the arrow. The page is read once; then a new message only marks its time (useVenueChatLastAt).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
  const { colors, shape } = useTheme();
  const last = useVenueChatLastAt(venueId, sessionId);
  const now = useNow(30_000);
  const active = venueChatActive(last, now);
  return (
    <Pressable
      testID="venue-chat-open"
      accessibilityRole="button"
      accessibilityLabel={
        active ? `${tr.venueChat.open}, ${tr.venue.chatActive}` : tr.venueChat.open
      }
      onPress={() => router.push('/venue-chat')}
    >
      {({ pressed }) => (
        <Card flush>
          <View
            className="flex-row items-center"
            style={{
              gap: SPACING[3],
              paddingVertical: SPACING[2.5],
              paddingLeft: SPACING[2.5],
              paddingRight: SPACING[3],
              opacity: pressed ? OPACITY.pressed : 1,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: TOUCH.min + SPACING[0.5],
                height: TOUCH.min + SPACING[0.5],
                borderRadius: shape.radius.pill,
                backgroundColor: colors.calm,
              }}
            >
              <Icon name="chatbubbles-outline" size={ICON.lg} tone="accent" />
            </View>
            <View className="flex-1" style={{ gap: SPACING[0.5] }}>
              <Text variant="bodyStrong">{tr.venueChat.open}</Text>
              <Text variant="fine">{tr.venue.chatCard}</Text>
            </View>
            {active ? (
              <View testID="venue-chat-live">
                <LiveDot tone="success" periodMs={BEAT_MS} />
              </View>
            ) : null}
            <Icon name="chevron-forward" size={ICON.md} tone="muted" />
          </View>
        </Card>
      )}
    </Pressable>
  );
}
