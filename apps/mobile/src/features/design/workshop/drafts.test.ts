import { describe, expect, it } from 'vitest';

import { nextVariantKey, resolveVariantKey, validateDrafts } from './drafts';

const v = (...keys: string[]) => keys.map((key) => ({ key }));

describe('nextVariantKey', () => {
  it('takes the next variant and wraps around', () => {
    expect(nextVariantKey(v('a', 'b', 'c'), 'a')).toBe('b');
    expect(nextVariantKey(v('a', 'b', 'c'), 'c')).toBe('a');
  });
  it('has nothing to compare for one variant or an unknown key', () => {
    expect(nextVariantKey(v('a'), 'a')).toBeNull();
    expect(nextVariantKey(v('a', 'b'), 'x')).toBeNull();
  });
});

describe('resolveVariantKey', () => {
  it('falls back to the first variant', () => {
    expect(resolveVariantKey(v('a', 'b'), 'b')).toBe('b');
    expect(resolveVariantKey(v('a', 'b'), 'x')).toBe('a');
    expect(resolveVariantKey([], 'x')).toBe('');
  });
});

describe('validateDrafts', () => {
  it('accepts a sound registry', () => {
    expect(validateDrafts([{ key: 'one', variants: v('a', 'b') }])).toEqual([]);
  });
  it('reports duplicates and empty drafts', () => {
    const problems = validateDrafts([
      { key: 'one', variants: v('a', 'a') },
      { key: 'one', variants: [] },
    ]);
    expect(problems).toEqual([
      'duplicate variant key: one/a',
      'duplicate draft key: one',
      'no variants: one',
    ]);
  });
});
