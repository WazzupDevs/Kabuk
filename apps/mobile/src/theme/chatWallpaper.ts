import { type ChatWallKind, CHAT_WALLS } from './chatWalls.generated';
import type { ColorScheme } from './tokens';

// The chat walls (skall tuvali: Dm, MasaSohbeti, MekanSohbeti; `.wall`): each chat its own ground
// and its own line tile (300 px; docs/design/sistem/varlik/desen-*.svg, generated into
// chatWalls.generated.ts by scripts/sistem/walls.ts). One picture drawn once behind the messages
// (src/components/ChatWallpaper.tsx), the tile repeated by one <pattern>; pure, so
// chatWallpaper.test.ts checks the SVG text.
export type { ChatWallKind };

export const WALL_TILE = 300;

// The DM's light wall in aura 31 (docs/design/aura → Dm): a blue to lilac fall from top to foot,
// soft capsules strewn on it, the board's 390 × 844 repeated. A still pattern, no effect. The dark
// wall stays the generated one (the board draws the light side only).
export const DM_AURA = {
  stops: [
    ['0', '#E3EEFE'],
    ['0.55', '#DCE2FF'],
    ['1', '#E2DAFE'],
  ],
  tile: { w: 390, h: 844 },
  ink: '#C3D3FD',
  opacity: 0.75,
  // x, y, angle: each capsule 7 × 22.
  capsules: [
    [40, 70, 30],
    [300, 40, -35],
    [250, 150, 60],
    [20, 240, -20],
    [350, 300, 15],
    [180, 330, -50],
    [60, 430, 40],
    [300, 470, -25],
    [200, 560, 70],
    [30, 640, -40],
    [360, 640, 20],
    [140, 740, -15],
  ],
  dots: [
    [120, 190],
    [330, 220],
    [100, 520],
    [260, 690],
  ],
} as const;

function dmAuraSvg(w: number, h: number): string {
  const a = DM_AURA;
  const stops = a.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const caps = a.capsules
    .map(
      ([x, y, r]) =>
        `<rect x="${x}" y="${y}" width="7" height="22" rx="3.5" transform="rotate(${r} ${x + 3} ${y + 11})"/>`,
    )
    .join('');
  const dots = a.dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>` +
    `<pattern id="tile" patternUnits="userSpaceOnUse" width="${a.tile.w}" height="${a.tile.h}">` +
    `<g fill="${a.ink}" opacity="${a.opacity}">${caps}${dots}</g></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#fall)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#tile)"/></svg>`
  );
}

export function wallpaperSvg(
  scheme: ColorScheme,
  width: number,
  height: number,
  kind: ChatWallKind = 'dm',
): string {
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  if (kind === 'dm' && scheme === 'light') return dmAuraSvg(w, h);
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
