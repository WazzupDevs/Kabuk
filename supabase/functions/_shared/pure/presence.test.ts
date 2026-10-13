import { describe, expect, it } from 'vitest';

import { nextOfflineSince, OFFLINE_GRACE_MS, showOffline } from './presence.ts';

describe('the other table offline note', () => {
  it('waits the whole grace without the other table', () => {
    const since = nextOfflineSince(null, false, 1000);
    expect(since).toBe(1000);
    // Still gone a moment later: the first moment counts.
    expect(nextOfflineSince(since, false, 5000)).toBe(1000);
    expect(showOffline(since, 1000 + OFFLINE_GRACE_MS - 1)).toBe(false);
    expect(showOffline(since, 1000 + OFFLINE_GRACE_MS)).toBe(true);
  });

  it('starts over when the other table comes back', () => {
    let since = nextOfflineSince(null, false, 0);
    since = nextOfflineSince(since, true, 10_000);
    expect(since).toBeNull();
    expect(showOffline(since, 20_000)).toBe(false);
    since = nextOfflineSince(since, false, 12_000);
    expect(showOffline(since, 20_000)).toBe(false);
    expect(showOffline(since, 12_000 + OFFLINE_GRACE_MS)).toBe(true);
  });
});
