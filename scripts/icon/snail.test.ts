import { describe, expect, it } from 'vitest';

import { box, brandSvg, type IconTokens, lineIconSvg, snail, palette } from './snail.ts';

const tokens: IconTokens = {
  cream: '#111111',
  ink: '#222222',
  purple: '#333333',
  lemon: '#444444',
  paper: '#555555',
  night: '#666666',
};

describe('in-app snail', () => {
  it('takes its colours from the tokens', () => {
    const light = brandSvg(tokens, 100);
    for (const c of [tokens.ink, tokens.purple, tokens.lemon]) expect(light).toContain(c);
    expect(brandSvg(tokens, 100, { ground: 'dark' })).toContain(tokens.paper);
  });

  it('leaves the face out of the small drawing', () => {
    // The face is the only quadratic curve (the smile).
    expect(snail(palette(tokens, 'light'), { face: false })).not.toContain(' Q ');
    expect(snail(palette(tokens, 'light'))).toContain(' Q ');
  });

  it('draws the crawl layers on the same box', () => {
    const [, , w, h] = box();
    const size = `width="${Math.round((w / h) * 90)}" height="90"`;
    for (const layer of ['body', 'shell', 'antennae'] as const) {
      expect(brandSvg(tokens, 90, { layer })).toContain(size);
    }
  });

  it('draws the tab icon with the tab icons’ stroke', () => {
    expect(lineIconSvg(24)).toContain('stroke-width="1.8"');
  });
});
