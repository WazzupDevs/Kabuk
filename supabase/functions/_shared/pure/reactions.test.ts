import { describe, expect, it } from 'vitest';

import { isReaction, REACTIONS, toReaction } from './reactions.ts';

describe('reactions', () => {
  it('are six distinct capsule faces', () => {
    expect(REACTIONS).toHaveLength(6);
    expect(new Set(REACTIONS).size).toBe(6);
  });

  it('accepts only the set', () => {
    expect(isReaction('kizgin')).toBe(true);
    expect(isReaction('🔥')).toBe(false);
    expect(isReaction(null)).toBe(false);
  });

  it('takes the emojis of the app before them as their faces', () => {
    expect(toReaction('begen')).toBe('begen');
    expect(toReaction('👍')).toBe('begen');
    expect(toReaction('❤️')).toBe('ask');
    expect(toReaction('😂')).toBe('kahkaha');
    expect(toReaction('😮')).toBe('saskin');
    expect(toReaction('🎉')).toBe('ask');
    expect(toReaction('🔥')).toBe('ask');
    expect(toReaction('💩')).toBeNull();
    expect(toReaction(1)).toBeNull();
  });
});
