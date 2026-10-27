import { senderLabel, venueChatActive, type VenueChatMessage } from '@shared/venueChat.ts';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { CanvasBar } from '@/components/CanvasIcon';
import { ChatWallpaper } from '@/components/ChatWallpaper';
import { Icon } from '@/components/Icon';
import { LiveDot } from '@/components/LiveDot';
import { LookAvatar } from '@/components/LookAvatar';
import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, VENUE_CHAT_CARD } from '@/theme/tokens';

import { useVenueChatCard } from './queries';

// The dot beats at a calm pace.
const BEAT_MS = 1600;

// "Mekan sohbeti" at the top of the venue screen (v45: .linkcard.chat), fuller since the owner's
// call (27 Ekim): the venue chat's wall under a veil of the card's ground, the family's two
// bubbles, the name and who reads it, a dot while the chat is active (a message in the last 10
// minutes, K-12), "Yeni mesaj" when one came after the page was read, and the last messages: the
// writer's face, name and the first line. Everyone checked in at the venue reads them (rule 4).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const card = useVenueChatCard(venueId, sessionId);
  const now = useNow(30_000);
  const active = venueChatActive(card.lastAt, now);
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
        <View
          style={[
            {
              overflow: 'hidden',
              borderRadius: shape.radius.lg,
              borderWidth: shape.stroke.card,
              borderColor: colors.cardLine,
              boxShadow: shape.shadow.card,
              backgroundColor: colors.surface,
            },
            pressScale(pressed),
          ]}
        >
          <ChatWallpaper kind="mekan" />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surface, opacity: VENUE_CHAT_CARD.veil },
            ]}
          />
          <View style={{ padding: SPACING[4], gap: SPACING[3] }}>
            <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
              <View
                className="items-center justify-center"
                style={{
                  width: AVATAR_SIZE.xl,
                  height: AVATAR_SIZE.xl,
                  borderRadius: shape.radius.pill,
                  backgroundColor: colors.surface,
                  boxShadow: shape.shadow.card,
                }}
              >
                <CanvasBar name="chat" size={ICON.lg} />
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
                  <Text variant="heading">{tr.venueChat.open}</Text>
                  {active ? (
                    <View testID="venue-chat-live">
                      <LiveDot tone="success" periodMs={BEAT_MS} size={SPACING[2]} />
                    </View>
                  ) : null}
                </View>
                <Text variant="fine">{tr.venue.chatCard}</Text>
              </View>
              {card.fresh ? <Tag variant="event" label={tr.venue.chatNew} /> : null}
              <Icon name="chevron-forward" tone="muted" />
            </View>
            {card.recent.length > 0 ? (
              <View style={{ gap: SPACING[2] }}>
                {card.recent.map((m) => (
                  <Preview key={m.id} message={m} />
                ))}
              </View>
            ) : (
              <Text variant="fine">{tr.venue.chatEmpty}</Text>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// A message as a line in a soft bubble: the writer's face, name and the message's first line.
function Preview({ message }: { message: VenueChatMessage }) {
  const { colors, shape } = useTheme();
  const name = senderLabel(message);
  return (
    <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
      {message.profiled ? (
        <Avatar kind="profile" name={name} photoUrl={message.photoUrl} size="sm" />
      ) : message.senderLook ? (
        <LookAvatar look={message.senderLook} size={AVATAR_SIZE.sm} />
      ) : (
        <Avatar kind="table" alias={name} size="sm" />
      )}
      <View
        className="flex-1 flex-row items-center"
        style={{
          gap: SPACING[1.5],
          paddingHorizontal: SPACING[3],
          paddingVertical: SPACING[1.5],
          borderRadius: shape.radius.lg,
          borderBottomLeftRadius: SPACING[1],
          backgroundColor: colors.surface,
          boxShadow: shape.shadow.card,
        }}
      >
        <Text variant="label">{name}</Text>
        {/* A preview of the message: one line (CLAUDE.md → Ekran davranışı). */}
        <Text variant="fine" tone="text" numberOfLines={1} className="shrink">
          {message.body}
        </Text>
      </View>
    </View>
  );
}
