import { describe, expect, it } from 'vitest';

import { lookParts, lookSvg, posedEyes } from './capsuleLook';

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

describe('posed eyes', () => {
  const svg = lookSvg('c:mor e:klasik', 'av');
  it('leaves the drawing as it is without a pose', () => {
    expect(posedEyes(svg, {})).toBe(svg);
  });
  it('gathers the eyes into one squashed group for a blink, the rest unchanged', () => {
    const blink = posedEyes(svg, { blink: true });
    expect(blink).toContain('scale(1 0.12)');
    const eyes = svg.match(/class="eye"/g)?.length ?? 0;
    expect(eyes).toBeGreaterThan(0);
    expect(blink.match(/class="eye"/g)?.length).toBe(eyes);
    expect(
      blink.replace(/<g transform="translate\(0 20\.5\)[^"]*">/, '').replace('</g>', ''),
    ).not.toBe('');
  });
  it('moves the eyes along their line to look aside', () => {
    expect(posedEyes(svg, { look: -1.6 })).toContain('translate(-1.6 20.5) scale(1 1)');
  });
});
