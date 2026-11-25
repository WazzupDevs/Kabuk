import type { QueryKey } from '@tanstack/react-query';

// Which reads are kept on the phone (queryPersist.ts; docs/decisions/onbellek.md). Pure, so the
// list is pinned (keptQuery.test.ts).
// Whether a query's key is one kept on the phone. `ownPublicId`: the own profile's view only.
export function keptQuery(key: QueryKey, ownPublicId: string | null): boolean {
  const [root, second, third] = key as readonly unknown[];
  switch (root) {
    case 'exploreVenues':
    case 'venueCities':
      return key.length === 1;
    case 'venueSpots':
      return key.length === 2 && typeof second === 'string';
    case 'friends':
      // The friend list, the inbox, the history and the notices; not a conversation's pages, not
      // a mutual list, not a room's records.
      return (
        key.length === 2 &&
        (second === 'list' ||
          second === 'inbox' ||
          second === 'history' ||
          second === 'notifications')
      );
    case 'profile':
      return key.length === 2;
    case 'profileView':
      return key.length === 2 && ownPublicId !== null && second === ownPublicId;
    case 'gifts':
      return key.length === 2 && second === 'state' && third === undefined;
    default:
      return false;
  }
}
