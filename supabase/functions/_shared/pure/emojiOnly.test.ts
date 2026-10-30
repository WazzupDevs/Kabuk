import { describe, expect, it } from 'vitest';

import { emojiOnly } from './emojiOnly.ts';

describe('emojiOnly', () => {
  it('counts one to three emoji', () => {
    expect(emojiOnly('😀')).toBe(1);
    expect(emojiOnly('😀😂')).toBe(2);
    expect(emojiOnly(' 😀 😂 ❤️ ')).toBe(3);
  });

  it('takes joined sequences, skin tones and flags as one', () => {
    expect(emojiOnly('👨‍👩‍👧')).toBe(1);
    expect(emojiOnly('👍🏽')).toBe(1);
    expect(emojiOnly('🇹🇷')).toBe(1);
    expect(emojiOnly('🇹🇷🇹🇷')).toBe(2);
    expect(emojiOnly('❤️')).toBe(1);
  });

  it('is 0 with text, more than three, or nothing', () => {
    expect(emojiOnly('selam 😀')).toBe(0);
    expect(emojiOnly('😀😀😀😀')).toBe(0);
    expect(emojiOnly('')).toBe(0);
    expect(emojiOnly('   ')).toBe(0);
    expect(emojiOnly('123')).toBe(0);
    expect(emojiOnly(':)')).toBe(0);
  });
});
