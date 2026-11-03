import { describe, expect, it } from 'vitest';

import { isNarrow } from './narrow';

describe('isNarrow (Aura v75 E4)', () => {
  it('is narrow at 320 dp and at the largest text, not at 390 dp with normal text', () => {
    expect(isNarrow(390, 1)).toBe(false);
    expect(isNarrow(320, 1)).toBe(true);
    expect(isNarrow(390, 1.3)).toBe(true);
    expect(isNarrow(320, 1.3)).toBe(true);
    expect(isNarrow(480, 1.3)).toBe(false);
  });
  it('takes the text growth only up to 1.3 and never below 1', () => {
    expect(isNarrow(480, 2)).toBe(false);
    expect(isNarrow(360, 0.85)).toBe(false);
  });
});
