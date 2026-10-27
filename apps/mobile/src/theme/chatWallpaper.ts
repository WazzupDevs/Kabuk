import { type ChatWallKind, CHAT_WALLS } from './chatWalls.generated';
import type { ColorScheme } from './tokens';

// The chat walls (skall tuvali: Dm, MasaSohbeti, MekanSohbeti; `.wall`): each chat its own ground
// and its own line tile (300 px; docs/design/sistem/varlik/desen-*.svg, generated into
// chatWalls.generated.ts by scripts/sistem/walls.ts). One picture drawn once behind the messages
// (src/components/ChatWallpaper.tsx), the tile repeated by one <pattern>; pure, so
// chatWallpaper.test.ts checks the SVG text.
export type { ChatWallKind };

export const WALL_TILE = 300;

export function wallpaperSvg(
  scheme: ColorScheme,
  width: number,
  height: number,
  kind: ChatWallKind = 'dm',
): string {
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  const wall = CHAT_WALLS[kind];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><pattern id="tile" patternUnits="userSpaceOnUse" width="${WALL_TILE}" height="${WALL_TILE}">` +
    `${wall.tile[scheme]}</pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="${wall.ground[scheme]}"/>` +
    `<rect width="${w}" height="${h}" fill="url(#tile)"/></svg>`
  );
}

export type WallpaperCanvas = { w: number; h: number };

// The size the wallpaper is drawn at: the area's width and the tallest window height seen. The
// keyboard only shortens the area, so it never redraws the picture; a shorter area clips it. A new
// width (a new layout) or a taller window draws it again; the same size returns `prev` unchanged.
export function wallpaperCanvas(
  prev: WallpaperCanvas | null,
  areaWidth: number,
  windowHeight: number,
): WallpaperCanvas {
  const w = Math.max(1, Math.ceil(areaWidth));
  const h = Math.max(1, Math.ceil(windowHeight), prev?.h ?? 0);
  return prev && prev.w === w && prev.h === h ? prev : { w, h };
}
