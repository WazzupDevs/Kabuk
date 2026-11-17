import { describe, expect, it } from 'vitest';

import { prepareVenuePost, VENUE_FEED, VENUE_FEED_BROADCAST } from './venueFeed.ts';

describe('VENUE_FEED rules', () => {
  it('match the spec', () => {
    expect(VENUE_FEED).toEqual({
      maxLength: 280,
      minIntervalMs: 3000,
      windowSeconds: 600,
      windowMax: 10,
      likeWindowSeconds: 10,
      likeWindowMax: 20,
      hideAfterReports: 3,
      keepHours: 24,
      pageSize: 30,
    });
    expect(VENUE_FEED_BROADCAST).toBe('venue_post');
  });
});

describe('prepareVenuePost', () => {
  it('trims and keeps 1–280 characters', () => {
    expect(prepareVenuePost('  Merhaba  ')).toBe('Merhaba');
    expect(prepareVenuePost('   ')).toBeNull();
    expect(prepareVenuePost('a'.repeat(280))).toBe('a'.repeat(280));
    expect(prepareVenuePost('a'.repeat(281))).toBeNull();
  });

  it('counts code points, like the database', () => {
    expect(prepareVenuePost('😀'.repeat(280))).toBe('😀'.repeat(280));
    expect(prepareVenuePost('😀'.repeat(281))).toBeNull();
  });
});
