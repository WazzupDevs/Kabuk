import { describe, expect, it } from 'vitest';

import { keptQuery } from './keptQuery';

const OWN = 'own-public-id';

describe('the reads kept on the phone (docs/decisions/onbellek.md)', () => {
  it('keeps the lists a screen opens with', () => {
    for (const key of [
      ['exploreVenues'],
      ['venueCities'],
      ['venueSpots', 'v1'],
      ['friends', 'list'],
      ['friends', 'inbox'],
      ['friends', 'history'],
      ['friends', 'notifications'],
      ['profile', 'user-1'],
      ['profileView', OWN],
      ['gifts', 'state'],
    ]) {
      expect(keptQuery(key, OWN), key.join('/')).toBe(true);
    }
  });

  it('never keeps another person, a conversation, a table, a game or the semt room', () => {
    for (const key of [
      ['profileView', 'someone-else'],
      ['friends', 'dm', 't1'],
      ['friends', 'list', 'mutual', 'p1'],
      ['friends', 'history', 'room', 'r1'],
      ['activeTable', 'u'],
      ['roomMemberProfiles', 'r1'],
      ['kaupholl-pool', 'r1'],
      ['signum-view', 'r1'],
      ['district', 'state'],
      ['venueChatMutes'],
    ]) {
      expect(keptQuery(key, OWN), key.join('/')).toBe(false);
    }
  });

  it('keeps no profile view before the own one is known', () => {
    expect(keptQuery(['profileView', OWN], null)).toBe(false);
  });
});
