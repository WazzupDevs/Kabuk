import type { VenueCategory, VenueKind } from '@shared/venueKind.ts';

// What a venue is in Keşfet's list (docs/SPEC_V4.md §4.C, the owner's decision): a campus by its
// kind, a cafe-kind venue by its category (kafe, çay bahçesi, yemek; none is a kafe). Its icon
// (`.vthumb`) and its type in words (v46's `data-vtype`, tr.explore.typeLabel) both come from it.
export type VenueType = 'kafe' | 'cay' | 'yemek' | 'kampus';

const TYPE_OF: Record<VenueCategory, VenueType> = {
  kafe: 'kafe',
  cay_bahcesi: 'cay',
  yemek: 'yemek',
};

export function venueType(venue: { kind: VenueKind; category: VenueCategory | null }): VenueType {
  if (venue.kind === 'campus') return 'kampus';
  return venue.category ? TYPE_OF[venue.category] : 'kafe';
}
