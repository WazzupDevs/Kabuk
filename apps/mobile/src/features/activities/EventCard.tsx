import { describeEventTime } from '@shared/explore.ts';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { usePressScale } from '@/components/motion';
import { Text } from '@/components/Text';
import type { ExploreEvent } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import { type CoverKind, EVENT_COVER_HEIGHT } from '@/theme/eventCovers';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { OPACITY, type PaletteKey, SPACING } from '@/theme/tokens';

import { EventCover } from './EventCover';

// One of today's events (v44: .evc): the venue kind's cover with "Etkinlik" and the time on top and
// a plate with the title and the venue at the bottom. No "ilgileniyorum" and no count (K-15). It
// opens the venue's page in Keşfet (K-43). The card grows past the cover's height when the plate
// needs it (a long title, large text), so the plate never covers the tags.
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
  const { colors, shape } = useTheme();
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
        <View
          style={[
            {
              minHeight: EVENT_COVER_HEIGHT,
              justifyContent: 'space-between',
              gap: SPACING[2],
              padding: SPACING[2],
              borderRadius: shape.radius.lg,
              overflow: 'hidden',
              backgroundColor: colors.surface,
              boxShadow: shape.shadow.card,
            },
            pressScale(pressed),
          ]}
        >
          <EventCover kind={venue.kind} />
          <View
            className="flex-row flex-wrap justify-between"
            style={{ gap: SPACING[1.5], padding: SPACING[0.5] }}
          >
            <Pill label={tr.activities.eventKind} bg={colors.surface} fg="accent" />
            <Pill label={when} bg={withAlpha(colors.feature, OPACITY.onCover)} fg="onFeature" />
          </View>
          <View
            className="flex-row items-center"
            style={{
              gap: SPACING[2.5],
              paddingVertical: SPACING[2],
              paddingLeft: SPACING[3],
              paddingRight: SPACING[2],
              borderRadius: shape.radius.md,
              backgroundColor: withAlpha(colors.surface, OPACITY.coverPlate),
              boxShadow: shape.shadow.raised,
            }}
          >
            <View className="flex-1" style={{ gap: SPACING[0.5] }}>
              <Text variant="bodyStrong">{event.title}</Text>
              <Text variant="label" tone="accent">
                {venue.name}
              </Text>
            </View>
            <Icon name="chevron-forward" tone="muted" />
          </View>
        </View>
      )}
    </Pressable>
  );
}

// v44: .etype, .ewhen: a small capsule on the cover.
function Pill({ label, bg, fg }: { label: string; bg: string; fg: PaletteKey }) {
  const { shape } = useTheme();
  return (
    <View
      className="justify-center"
      style={{
        minHeight: SPACING[6],
        paddingHorizontal: SPACING[2.5],
        borderRadius: shape.radius.pill,
        backgroundColor: bg,
      }}
    >
      <Text variant="caption" tone={fg}>
        {label}
      </Text>
    </View>
  );
}
