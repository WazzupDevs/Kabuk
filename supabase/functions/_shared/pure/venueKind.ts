// What a venue is (docs/SPEC_V3.md §18.1): Keşfet's map pins and the list show it. A cafe is a point
// with the 300 m radius; a campus has a boundary. Content sets it per file (venues-pilot and
// venues-test: cafe, venues-campus: campus) and the seed validates it.
export const VENUE_KINDS = ['cafe', 'campus'] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

export function isVenueKind(value: unknown): value is VenueKind {
  return (VENUE_KINDS as readonly unknown[]).includes(value);
}

// What sort of place a cafe-kind venue is, for Keşfet's list (docs/SPEC_V4.md §4.C, the project
// owner's decision): a kafe, a çay bahçesi or a place to eat. Content sets it per venue
// (`category`, venues-pilot and venues-test); an empty one is a kafe. A campus is told apart by its
// kind and has no category.
export const VENUE_CATEGORIES = ['kafe', 'cay_bahcesi', 'yemek'] as const;
export type VenueCategory = (typeof VENUE_CATEGORIES)[number];
export const DEFAULT_VENUE_CATEGORY: VenueCategory = 'kafe';

export function isVenueCategory(value: unknown): value is VenueCategory {
  return (VENUE_CATEGORIES as readonly unknown[]).includes(value);
}
