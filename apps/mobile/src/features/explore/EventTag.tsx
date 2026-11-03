import { describeEventTime } from '@shared/explore.ts';

import { Tag } from '@/components/Tag';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';

import type { ExploreVenue } from './useExploreVenues';

// A venue's event on its Keşfet row: when it is and its title.
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
