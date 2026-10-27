import { describe, expect, it } from 'vitest';

import { wallpaperCanvas, wallpaperSvg } from './chatWallpaper';
import { CHAT_WALLS } from './chatWalls.generated';

function count(svg: string, name: string): number {
  return svg.split(`<${name}`).length - 1;
}

describe('chat wallpaper (skall tuvali: .wall)', () => {
  it("each chat draws its board's ground and tile, the tile once in one pattern", () => {
    for (const kind of ['dm', 'masa', 'mekan'] as const) {
      for (const scheme of ['light', 'dark'] as const) {
        const svg = wallpaperSvg(scheme, 360, 2400, kind);
        expect(svg).toContain(`fill="${CHAT_WALLS[kind].ground[scheme]}"`);
        expect(svg).toContain(CHAT_WALLS[kind].tile[scheme]);
        expect(count(svg, 'pattern ')).toBe(1);
      }
    }
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
