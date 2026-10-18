import { describe, expect, it } from 'vitest';

import { BRAND } from './brand';
import { WALLPAPER, wallpaperSvg } from './chatWallpaper';

function tags(svg: string, name: string): number {
  return svg.split(`<${name}`).length - 1;
}

describe('chat wallpaper (v45: .chatbg)', () => {
  it('covers the area with whole tiles', () => {
    expect(tags(wallpaperSvg('light', 250, 250), 'g transform="translate(')).toBe(1);
    // 400 x 900 needs 2 x 4 tiles.
    const svg = wallpaperSvg('light', 400, 900);
    expect(svg).toContain('translate(250 750)');
    expect(svg.split('<g transform="translate(').length - 1).toBe(8);
  });

  it("a tile has v45's 27 doodles, drawn in one colour at 11 %", () => {
    const svg = wallpaperSvg('dark', 250, 250);
    expect(svg.split("<g transform='translate(").length - 1).toBe(27);
    expect(svg).toContain(`stroke="${WALLPAPER.ink}" stroke-width="1.6"`);
    expect(svg).toContain('opacity="0.11"');
    expect(svg).not.toContain('currentColor');
  });

  it("takes the scheme's gradient and the logo's three glows", () => {
    expect(wallpaperSvg('light', 100, 100)).toContain('stop-color="#F6F3FE"');
    expect(wallpaperSvg('dark', 100, 100)).toContain('stop-color="#222232"');
    const svg = wallpaperSvg('light', 100, 100);
    for (const c of [BRAND.purple, BRAND.pink, BRAND.orange]) expect(svg).toContain(c);
    expect(tags(svg, 'radialGradient ')).toBe(3);
  });
});
