import { describe, expect, it } from 'vitest';

import { maxLengthFor } from './textLimit';

describe('maxLengthFor', () => {
  it('lets plain text grow to the limit', () => {
    expect(maxLengthFor('', 80)).toBe(80);
    expect(maxLengthFor('kahve', 80)).toBe(80);
  });

  it('counts an emoji as one character, as the server does', () => {
    const emoji = '🎲'.repeat(40);
    expect(emoji.length).toBe(80);
    // 40 characters in, 40 more may come: the native limit is 80 units past the 80 there are.
    expect(maxLengthFor(emoji, 80)).toBe(120);
    expect(maxLengthFor('🎲'.repeat(80), 80)).toBe(160);
  });

  it('stops at what the text has once it is full or over (an older, longer bio)', () => {
    expect(maxLengthFor('a'.repeat(80), 80)).toBe(80);
    expect(maxLengthFor('a'.repeat(120), 80)).toBe(120);
  });
});
