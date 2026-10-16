import { describe, expect, it } from 'vitest';

import { MAX_SIDE_PHONES } from '../../supabase/functions/_shared/pure/teams.ts';
import { ROOM_SIZES, sideOfPhone } from './room.ts';

describe('room step', () => {
  it('fills two even sides for every size, within the side limit', () => {
    for (const size of ROOM_SIZES) {
      const sides = Array.from({ length: size }, (_, i) => sideOfPhone(i));
      expect(sides[0]).toBe('owner');
      expect(sides[1]).toBe('guest');
      const owner = sides.filter((s) => s === 'owner').length;
      expect(owner).toBe(size / 2);
      expect(owner).toBeLessThanOrEqual(MAX_SIDE_PHONES);
    }
    expect(Math.max(...ROOM_SIZES)).toBe(2 * MAX_SIDE_PHONES);
  });
});
