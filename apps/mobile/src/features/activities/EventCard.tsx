import { describeEventTime } from '@shared/explore.ts';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import type { ExploreEvent } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import type { CoverKind } from '@/theme/eventCovers';
import { SPACING } from '@/theme/tokens';

import { EventCover } from './EventCover';

// One of today's events (skall tuvali, Aktiviteler): the venue kind's cover with "Etkinlik" and the
// time on it, the title and the venue under it. No "ilgileniyorum" and no count (K-15). It opens the
// venue's page in Keşfet (K-43).
const EVENT_ART_HEIGHT = SPACING[16] * 2 + SPACING[5] + SPACING[0.5];
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
  const when = tr.explore.eventTime(describeEventTime(event.startsAt, event.endsAt, now));
  return (
    <Pressable
      testID={`activities-event-${venue.name}`}
      accessibilityRole="button"
      accessibilityLabel={tr.activities.eventLabel(event.title, venue.name, when)}
      onPress={onPress}
    >
      {({ pressed }) => (
        // skall tuvali (Aktiviteler): a picture card, the cover 150 high with its two tags, the
        // title and the venue under it.
        <View style={pressScale(pressed)}>
          <Card flush>
            <View style={{ height: EVENT_ART_HEIGHT, overflow: 'hidden' }}>
              <EventCover kind={venue.kind} />
              <View
                className="absolute flex-row"
                style={{ top: SPACING[3], left: SPACING[3], right: SPACING[3], gap: SPACING[1.5] }}
              >
                <Tag variant="light" label={tr.activities.eventKind} />
                <View style={{ marginLeft: 'auto' }}>
                  <Tag variant="glass" label={when} />
                </View>
              </View>
            </View>
            <View
              style={{
                gap: SPACING[0.5],
                paddingTop: SPACING[3],
                paddingRight: SPACING[3] + SPACING[0.5],
                paddingBottom: SPACING[3] + SPACING[0.5],
                paddingLeft: SPACING[4],
              }}
            >
              <Text variant="heading">{event.title}</Text>
              <Text variant="label" tone="accent">
                {venue.name}
              </Text>
            </View>
          </Card>
        </View>
      )}
    </Pressable>
  );
}
