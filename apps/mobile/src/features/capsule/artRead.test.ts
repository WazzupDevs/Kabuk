import { describe, expect, it } from 'vitest';

import { readArts, stampsOf } from '../../capsule/artRead';
import { createArtStore } from '../../capsule/artStore';

function store() {
  return createArtStore<string>({
    limits: { meta: { bytes: 1000 } },
    classOf: () => 'meta',
    drop: () => undefined,
  });
}

describe('readArts', () => {
  it('reads an empty list as an empty list, not as nothing made', () => {
    // A still look needs no plan: its canvas's plans are [] and must read as made (the empty
    // capsule of 0.12.0's whole canvas: its stamps were '' and read as "not made" forever).
    const s = store();
    expect(readArts([], s.peek)).toEqual([]);
    expect(stampsOf([], s.stamp)).toBe('');
  });

  it('is undefined for no keys and while one is not made', () => {
    const s = store();
    expect(readArts(null, s.peek)).toBeUndefined();
    s.put('a', 'A', 1);
    expect(readArts(['a', 'b'], s.peek)).toBeUndefined();
    s.put('b', 'B', 1);
    expect(readArts(['a', 'b'], s.peek)).toEqual(['A', 'B']);
  });

  it('stamps change when a key is put again', () => {
    const s = store();
    s.put('a', 'A', 1);
    const before = stampsOf(['a'], s.stamp);
    s.put('a', 'A2', 1);
    expect(stampsOf(['a'], s.stamp)).not.toBe(before);
    expect(readArts(['a'], s.peek)).toEqual(['A2']);
  });
});
