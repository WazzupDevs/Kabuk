import { Ionicons } from '@expo/vector-icons';
import { type ActivityBucket, describeEventTime } from '@shared/explore.ts';
import type { VenueKind } from '@shared/venueKind.ts';
import { View } from 'react-native';

import { KindIcon } from '@/components/Glyph';
import { ListRow } from '@/components/ListRow';
import { LiveDot } from '@/components/LiveDot';
import { Tag, type TagVariant } from '@/components/Tag';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, type PaletteKey, SPACING, TOUCH } from '@/theme/tokens';

import type { ExploreEvent, ExploreVenue } from './useExploreVenues';

// Bucket → tag colours, shared by the list tag and the map marker.
export const BUCKET_TAG: Record<ActivityBucket, 'calm' | 'lively' | 'buzz'> = {
  calm: 'calm',
  lively: 'lively',
  buzzing: 'buzz',
};

export function BucketBadge({ bucket }: { bucket: ActivityBucket }) {
  const variant: TagVariant = BUCKET_TAG[bucket];
  return <Tag variant={variant} label={tr.explore.buckets[bucket]} />;
}

export function EventTag({ event }: { event: NonNullable<ExploreVenue['event']> }) {
  const now = useNow(60_000);
  const when = describeEventTime(event.startsAt, event.endsAt, now);
  return (
    <Tag
      variant="event"
      icon="sparkles-outline"
      label={tr.explore.eventTag(tr.explore.eventTime(when), event.title)}
    />
  );
}

// How lively a venue is, beside its name on the Keşfet list (canvas: Aşama 8 · Saha → Keşfet). The
// three states differ in shape, colour and motion, not colour alone: calm is a still, hollow ring in
// the quiet colour; lively a green dot beating with its halo; buzzing a larger red dot beating fast.
// The reader hears the bucket's name ("Sakin", "Hareketli", "Çok hareketli").
const LIVENESS: Record<
  Exclude<ActivityBucket, 'calm'>,
  { tone: PaletteKey; periodMs: number; size: number }
> = {
  lively: { tone: 'success', periodMs: 1400, size: SPACING[2.5] },
  buzzing: { tone: 'danger', periodMs: 700, size: SPACING[3] + SPACING[0.5] },
};
// Every state takes the same box, so the rows line up.
const LIVENESS_BOX = (SPACING[3] + SPACING[0.5]) * 3;

export function LivenessDot({ bucket }: { bucket: ActivityBucket }) {
  const { colors, shape } = useTheme();
  if (bucket === 'calm') {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={tr.explore.buckets.calm}
        testID="liveness-calm"
        className="items-center justify-center"
        style={{ width: LIVENESS_BOX, height: LIVENESS_BOX }}
      >
        <View
          style={{
            width: SPACING[2.5],
            height: SPACING[2.5],
            borderRadius: shape.radius.pill,
            borderWidth: shape.stroke.control,
            borderColor: colors.muted,
          }}
        />
      </View>
    );
  }
  const { tone, periodMs, size } = LIVENESS[bucket];
  return (
    <View
      testID={`liveness-${bucket}`}
      className="items-center justify-center"
      style={{ width: LIVENESS_BOX, height: LIVENESS_BOX }}
    >
      <LiveDot
        tone={tone}
        periodMs={periodMs}
        size={size}
        accessibilityLabel={tr.explore.buckets[bucket]}
      />
    </View>
  );
}

// A venue's picture in the list: its kind (a cup, a faculty building; the map marker drawings) on a
// tile.
export function VenueTile({ kind }: { kind: VenueKind }) {
  const { colors, shape } = useTheme();
  const [bg, fg] =
    kind === 'campus' ? [colors.calm, colors.onCalm] : [colors.surface2, colors.text];
  return (
    <View
      className="items-center justify-center"
      style={{
        width: SPACING[14],
        height: SPACING[14],
        borderRadius: shape.radius.md,
        backgroundColor: bg,
      }}
    >
      <KindIcon kind={kind} color={fg} size={SPACING[8]} />
    </View>
  );
}

// One event in the single-venue Keşfet (canvas: Etkinlikler): a calendar tile, the title and when.
// The tile is in the event colour while the event is on.
export function EventRow({ event }: { event: ExploreEvent }) {
  const { colors, shape } = useTheme();
  const now = useNow(60_000);
  const when = describeEventTime(event.startsAt, event.endsAt, now);
  const on = when.kind === 'now';
  return (
    <ListRow
      card
      title={event.title}
      meta={tr.explore.eventTime(when)}
      leading={
        <View
          className="items-center justify-center"
          style={{
            width: TOUCH.button,
            height: TOUCH.button,
            borderRadius: shape.radius.pill,
            backgroundColor: on ? colors.event : colors.surface2,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={ICON.md}
            color={on ? colors.onEvent : colors.text}
          />
        </View>
      }
    />
  );
}
