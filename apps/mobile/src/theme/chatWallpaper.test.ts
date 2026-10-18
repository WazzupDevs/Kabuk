import { describe, expect, it } from 'vitest';

import { BRAND } from './brand';
import { WALLPAPER, wallpaperCanvas, wallpaperSvg } from './chatWallpaper';

function tags(svg: string, name: string): number {
  return svg.split(`<${name}`).length - 1;
}

describe('chat wallpaper (v45: .chatbg)', () => {
  it('covers the area with one pattern: the tile drawn once, whatever the size', () => {
    const small = wallpaperSvg('light', 250, 250);
    const tall = wallpaperSvg('light', 400, 900);
    for (const svg of [small, tall]) {
      expect(tags(svg, 'pattern ')).toBe(1);
      expect(svg).toContain(
        '<pattern id="tile" patternUnits="userSpaceOnUse" width="250" height="250">',
      );
      expect(svg).toContain('fill="url(#tile)"');
      expect(svg.split("<g transform='translate(").length - 1).toBe(27);
    }
    // The SVG barely grows with the area (the CTO's 4.2b review: 580 nodes on a tall screen).
    expect(tall.length - small.length).toBeLessThan(40);
    expect(tall).toContain('<rect width="400" height="900" fill="url(#tile)"/>');
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

describe('wallpaper canvas (drawn once, clipped)', () => {
  it("takes the area's width and the window's height", () => {
    expect(wallpaperCanvas(null, 360.4, 780)).toEqual({ w: 361, h: 780 });
  });

  it('a keyboard, a shorter window or a new message keeps the same picture', () => {
    const first = wallpaperCanvas(null, 360, 780);
    expect(wallpaperCanvas(first, 360, 780)).toBe(first);
    // The window never shrinks the picture; a shorter area clips it.
    expect(wallpaperCanvas(first, 360, 420)).toBe(first);
  });

  it('a new width or a taller window draws it again', () => {
    const first = wallpaperCanvas(null, 360, 780);
    expect(wallpaperCanvas(first, 400, 780)).toEqual({ w: 400, h: 780 });
    expect(wallpaperCanvas(first, 360, 900)).toEqual({ w: 360, h: 900 });
  });
});
