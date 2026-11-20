import { describeEventTime } from '@shared/explore.ts';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { T, Tag } from '@/aura/kit';
import { usePressScale } from '@/components/motion';
import type { ExploreEvent } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import { useNarrow } from '@/lib/useNarrow';
import { ACTIVITIES } from '@/theme/activities';
import { KIT } from '@/theme/auraKit';
import { GIFT_CARD } from '@/theme/gifts';
import { gradientStyle } from '@/theme/gradient';
import type { CoverKind } from '@/theme/eventCovers';
import { SPACING } from '@/theme/tokens';

// One of today's events, in the manner of Keşfet's venue card (docs/design/aura → Keşfet): a glass
// card, the riso event scene (Aura v75 AktivitelerEtkinlik, riso-etkinlik) with "Etkinlik" and the
// time on it, the title and the venue under it. No "ilgileniyorum" and no count (K-15). It opens the venue's page in
// Keşfet (K-43).
export function EventCard({
  venue,
  event,
  now,
  onPress,
}: {
  venue: { name: string; kind: CoverKind };
  event: ExploreEvent;
  now: number;
  onPress: () => void;
}) {
  const pressScale = usePressScale();
  // Aura v75 AktivitelerDar: the tags 30 when narrow.
  const tagHeight = useNarrow() ? KIT.size.tagNarrow : undefined;
  const when = tr.explore.eventTime(describeEventTime(event.startsAt, event.endsAt, now));
  return (
    <Pressable
      testID={`activities-event-${venue.name}`}
      accessibilityRole="button"
      accessibilityLabel={tr.activities.eventLabel(event.title, venue.name, when)}
      onPress={onPress}
    >
      {({ pressed }) => (
        // As tall and as round as the gift card over it (the owner's ask, 20 Kasım): the riso
        // scene fills the card, the tags at its top, the title and the venue at its foot on a
        // dark fade.
        <View
          style={[
            pressScale(pressed),
            { height: GIFT_CARD.height, borderRadius: GIFT_CARD.radius, overflow: 'hidden' },
          ]}
        >
          <Image source={EVENT_SCENE} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[StyleSheet.absoluteFill, gradientStyle(E.shade)]} />
          <View
            className="absolute flex-row items-start"
            style={{ top: E.pad, left: E.pad, right: E.pad, gap: SPACING[1.5] }}
          >
            <Tag tone="event" fit height={tagHeight} label={tr.activities.eventKind} />
            <View style={{ marginLeft: 'auto', flexShrink: 1 }}>
              <Tag tone="eventTime" fit height={tagHeight} label={when} />
            </View>
          </View>
          <View
            style={{
              position: 'absolute',
              left: E.pad,
              right: E.pad,
              bottom: E.pad,
              gap: E.lineGap,
            }}
          >
            <T v="venueBarName" color={E.title} lines={1} fit>
              {event.title}
            </T>
            <T v="fine" color={E.venue} lines={1} fit>
              {venue.name}
            </T>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const E = ACTIVITIES.eventCard;
const EVENT_SCENE = require('../../../assets/riso/event.webp');
