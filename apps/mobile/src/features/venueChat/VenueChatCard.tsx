import { senderLabel, venueChatActive, type VenueChatMessage } from '@shared/venueChat.ts';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Av, Glass, Live, T, Tag, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { useVenueChatCard } from './queries';

// "Mekan sohbeti" on Mekan (docs/design/aura → Mekan): a glass card, its name with "Yeni mesaj" when
// one came after the page was read and a live dot while the chat is active (a message in the last
// 10 minutes, K-12), then the last messages as lines: the writer's face, the name in its colour (a
// nick in amber, a name in pink) and the message. Everyone checked in at the venue reads them
// (rule 4).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
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
      style={({ pressed }) => ({ opacity: pressed ? PRESSED : 1 })}
    >
      <Glass style={{ paddingVertical: PAD_Y, paddingHorizontal: PAD_X, gap: GAP }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: GAP,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP, flexShrink: 1 }}>
            <T v="h3">{tr.venueChat.open}</T>
            {active ? (
              <View testID="venue-chat-live">
                <Live label={tr.venue.chatActive} />
              </View>
            ) : null}
          </View>
          {card.fresh ? <Tag tone="pink" label={tr.venue.chatNew} /> : null}
        </View>
        {card.recent.length > 0 ? (
          card.recent.map((m) => <Line key={m.id} message={m} />)
        ) : (
          <T v="fine">{tr.venue.chatEmpty}</T>
        )}
      </Glass>
    </Pressable>
  );
}

const PAD_Y = 12;
const PAD_X = 14;
const GAP = 10;
const PRESSED = 0.8;

// A message as a line: the face, the writer in its colour and the first line of the message.
function Line({ message }: { message: VenueChatMessage }) {
  const { c, scheme, tags } = useKit();
  const name = senderLabel(message);
  const ink = message.profiled
    ? scheme === 'dark'
      ? tags.pink.fg
      : KIT.nameInk
    : scheme === 'dark'
      ? tags.amber.fg
      : KIT.nickInk;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP }}>
      {message.profiled ? (
        <Av size="sm" name={name} photoUrl={message.photoUrl} />
      ) : message.senderLook ? (
        <Av size="sm" name={name}>
          <LookAvatar look={message.senderLook} size={KIT.size.av.sm} />
        </Av>
      ) : (
        <Av size="sm" name={name} />
      )}
      {/* A preview: one line (CLAUDE.md → Ekran davranışı). */}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[KIT_TYPE.fine, { color: c.ink, flex: 1 }]}
      >
        <Text style={[KIT_TYPE.strong, { color: ink }]}>{name}</Text> {message.body}
      </Text>
    </View>
  );
}
const MAX_FONT_SCALE = 1.3;
