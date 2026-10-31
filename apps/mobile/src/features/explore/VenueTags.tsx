import { type ActivityBucket, describeEventTime } from '@shared/explore.ts';
import type { VenueKind } from '@shared/venueKind.ts';
import { View } from 'react-native';

import { KindIcon } from '@/components/Glyph';
import { GlyphDisc } from '@/components/GlyphDisc';
import { ListRow } from '@/components/ListRow';
import { LiveDot } from '@/components/LiveDot';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import type { ExploreEvent, ExploreVenue } from './useExploreVenues';

// Bucket → tag colours, shared by the list tag and the map marker.
export const BUCKET_TAG: Record<ActivityBucket, 'calm' | 'lively' | 'buzz'> = {
  calm: 'calm',
  lively: 'lively',
  buzzing: 'buzz',
};

// skall tuvali (KesfetTekMekan): a busy venue's bucket is the soft green tag with the live dot; a
// calm one the plain tag.
export function BucketBadge({ bucket }: { bucket: ActivityBucket }) {
  const calm = bucket === 'calm';
  return (
    <Tag variant={calm ? 'neutral' : 'positive'} live={!calm} label={tr.explore.buckets[bucket]} />
  );
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

// How lively a venue is, in words (v44: .vlive; K-41): a beating dot and the words while tables are
// on, a crowded venue beating faster; "Sessiz" in the quiet colour, without a dot.
const BUCKET_BEAT_MS = { lively: 1400, buzzing: 700 } as const;

export function BucketLine({ bucket }: { bucket: ActivityBucket }) {
  return (
    <View className="flex-row items-center gap-1.5" testID={`bucket-${bucket}`}>
      {bucket === 'calm' ? null : (
        <LiveDot tone="success" periodMs={BUCKET_BEAT_MS[bucket]} size={SPACING[2]} />
      )}
      <Text variant="label" tone={bucket === 'calm' ? 'muted' : 'success'}>
        {tr.explore.buckets[bucket]}
      </Text>
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

// One event on the venue page (the week's events): a calendar tile, the title and when.
// The tile is in the event colour while the event is on.
// A venue's event as a row of the events card (skall tuvali, KesfetTekMekan): the calendar disc,
// pink while it is on.
export function EventRow({ event }: { event: ExploreEvent }) {
  const now = useNow(60_000);
  const when = describeEventTime(event.startsAt, event.endsAt, now);
  return (
    <ListRow
      inset
      title={event.title}
      meta={tr.explore.eventTime(when)}
      leading={<GlyphDisc icon="calendar-outline" hot={when.kind === 'now'} />}
    />
  );
}
