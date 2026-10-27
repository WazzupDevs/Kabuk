import { describe, expect, it } from 'vitest';

import { lookParts, lookSvg } from './capsuleLook';

describe('capsule look', () => {
  it('reads a stored code into slots, the first id a slot', () => {
    expect(lookParts('c:pembe e:koyu h:kulaklik h:sapka x:yok')).toEqual({
      c: 'pembe',
      e: 'koyu',
      h: 'kulaklik',
    });
  });

  it('draws the avatar disc in the colour ground', () => {
    const svg = lookSvg('c:pembe e:klasik');
    expect(svg.startsWith('<svg viewBox="0 0 48 48"')).toBe(true);
    expect(svg).toContain('#FF5C93');
  });
});
