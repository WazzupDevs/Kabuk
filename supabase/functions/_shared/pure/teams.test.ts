import { describe, expect, it } from 'vitest';

import { MAX_SIDE_PHONES, sideHeadcount } from './teams.ts';

describe('sideHeadcount', () => {
  it('is the declared headcount until the phones outnumber it', () => {
    expect(sideHeadcount(3, 1)).toBe(3);
    expect(sideHeadcount(3, 3)).toBe(3);
    expect(sideHeadcount(1, 2)).toBe(2);
    expect(sideHeadcount(2, MAX_SIDE_PHONES)).toBe(MAX_SIDE_PHONES);
  });
});

describe('MAX_SIDE_PHONES', () => {
  it('is the leader and three members', () => {
    expect(MAX_SIDE_PHONES).toBe(4);
  });
});
