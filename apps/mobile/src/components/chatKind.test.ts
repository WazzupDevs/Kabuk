import { describe, expect, it } from 'vitest';

import { kindOfWall } from './chatKind';

describe('kindOfWall', () => {
  it('gives the district chat the venue chat bubbles and keeps the others', () => {
    expect(kindOfWall('semt')).toBe('mekan');
    expect(kindOfWall('mekan')).toBe('mekan');
    expect(kindOfWall('masa')).toBe('masa');
    expect(kindOfWall('dm')).toBe('dm');
  });
});
