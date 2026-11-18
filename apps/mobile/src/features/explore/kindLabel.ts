import type { VenueKind } from '@shared/venueKind.ts';

import { tr } from '@/i18n/tr';

// The words under a venue's name in Keşfet's rows and the map's card (yeni arayüz tuvali Kesfet,
// KesfetAra, KesfetHarita): the kind chip's own words, "Kampüs" or "Kafe ve mekan", for a café, a
// tea garden and a restaurant alike (the picture tells them apart, not the line).
export function kindLabel(kind: VenueKind): string {
  return kind === 'campus' ? tr.explore.kinds.campus : tr.explore.kinds.cafe;
}
