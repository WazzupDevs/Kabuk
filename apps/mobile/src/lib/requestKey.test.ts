import { describe, expect, it } from 'vitest';

import { requestKey } from './requestKey';

// RFC 9562 version 4 (what the server's z.uuid() takes).
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('requestKey', () => {
  it('is a version 4 UUID, at both ends of the random range', () => {
    expect(requestKey()).toMatch(UUID_V4);
    expect(requestKey(() => 0)).toBe('00000000-0000-4000-8000-000000000000');
    expect(requestKey(() => 0.999999)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('differs from one call to the next', () => {
    const keys = new Set(Array.from({ length: 100 }, () => requestKey()));
    expect(keys.size).toBe(100);
  });
});
