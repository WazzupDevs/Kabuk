import { describe, expect, it } from 'vitest';

import { isReviewPhone } from './reviewAccount.ts';

describe('isReviewPhone', () => {
  it('matches the number as Supabase Auth keeps it, in any spelling of the secret', () => {
    for (const secret of ['+905990000001', '905990000001', '05990000001', '+90 599 000 00 01']) {
      expect(isReviewPhone(secret, '905990000001')).toBe(true);
    }
  });

  it('is nobody when the secret is unset, empty or not a Turkish mobile number', () => {
    for (const secret of [undefined, '', '   ', '12345', '+12025550123']) {
      expect(isReviewPhone(secret, '905990000001')).toBe(false);
    }
  });

  it('is nobody for another number or an account without one', () => {
    expect(isReviewPhone('+905990000001', '905990000002')).toBe(false);
    expect(isReviewPhone('+905990000001', null)).toBe(false);
    expect(isReviewPhone('+905990000001', undefined)).toBe(false);
    expect(isReviewPhone('+905990000001', '')).toBe(false);
  });
});
