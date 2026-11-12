import { describe, expect, it } from 'vitest';

import type { Option, OptionGroup } from './options';
import { dotAt, dotCount, EMPTY_KEY, packNames, packOptions } from './strip';

const option = (key: string): Option => ({
  key,
  name: key,
  tier: null,
  apply: (look) => look,
});

const groups: OptionGroup[] = [
  { rack: null, pack: null, options: [option(EMPTY_KEY), option('x-a')] },
  { rack: 'stil', pack: 'Sokak', options: [option('s1'), option('s2')] },
  { rack: 'karakter', pack: 'Sokak', options: [option('k1')] },
  { rack: 'tema', pack: 'Korku', options: [option('t1')] },
];

describe('the trying strip', () => {
  it('names each pack once, in order', () => {
    expect(packNames(groups)).toEqual(['Sokak', 'Korku']);
    expect(packNames([groups[0] as OptionGroup])).toEqual([]);
  });

  it('shows every option for Tümü, "boş" and the pack for a pack', () => {
    expect(packOptions(groups, null).map((o) => o.key)).toEqual([
      EMPTY_KEY,
      'x-a',
      's1',
      's2',
      'k1',
      't1',
    ]);
    expect(packOptions(groups, 'Sokak').map((o) => o.key)).toEqual([EMPTY_KEY, 's1', 's2', 'k1']);
    expect(packOptions(groups, 'Korku').map((o) => o.key)).toEqual([EMPTY_KEY, 't1']);
  });

  it('lights the dot for the place along the strip', () => {
    expect(dotCount(3, 7)).toBe(3);
    expect(dotCount(40, 7)).toBe(7);
    expect(dotAt(3, 2, 7)).toBe(2);
    expect(dotAt(40, 0, 7)).toBe(0);
    expect(dotAt(40, 39, 7)).toBe(6);
    expect(dotAt(40, 20, 7)).toBe(3);
    expect(dotAt(40, -1, 7)).toBe(-1);
    expect(dotAt(1, 0, 7)).toBe(0);
  });
});
