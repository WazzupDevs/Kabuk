import { describeEventTime } from '@shared/explore.ts';

import { Tag, useKit } from '@/aura/kit';
import { AppIcon } from '@/components/AppIcon';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { ICON } from '@/theme/tokens';

import type { ExploreVenue } from './useExploreVenues';

// A venue's event on its Keşfet row: when it is and its title.
export function EventTag({ event }: { event: NonNullable<ExploreVenue['event']> }) {
  const now = useNow(60_000);
  const when = describeEventTime(event.startsAt, event.endsAt, now);
  const { tags } = useKit();
  return (
    <Tag
      tone="amber"
      lead={<AppIcon name="sparkles-outline" size={ICON.xs} color={tags.amber.fg} />}
      label={tr.explore.eventTag(tr.explore.eventTime(when), event.title)}
    />
  );
}
