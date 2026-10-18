import { BRAND } from './brand';
import type { ColorScheme } from './tokens';

// The chat wallpaper (v43 report §2 "Mekan sohbeti", the v45 file's .chatbg; docs/SPEC_V4.md §4.C):
// line doodles from the game nights in a 250 px tile at 11 %, three soft glows in the logo's colours
// and a faint vertical gradient. One picture drawn once behind the messages
// (src/components/ChatWallpaper.tsx), never per message; the messages scroll over it. Pure, so
// chatWallpaper.test.ts checks the SVG text.

export const WALLPAPER = {
  tile: 250,
  ink: '#5A3AE6',
  inkOpacity: 0.11,
  stroke: 1.6,
  // The gradient from top to bottom (v45: linear-gradient(#F6F3FE, #F1ECFB); dark #1E1E2E, #222232).
  base: { light: ['#F6F3FE', '#F1ECFB'], dark: ['#1E1E2E', '#222232'] },
  // CSS radial-gradient(rx ry at cx cy, colour a, transparent 72%), in the picture's own units.
  glows: [
    { cx: 1, cy: 0, rx: 0.8, ry: 0.45, color: BRAND.purple, alpha: 0.2 },
    { cx: 0, cy: 1, rx: 0.75, ry: 0.42, color: BRAND.pink, alpha: 0.16 },
    { cx: 0.95, cy: 0.7, rx: 0.55, ry: 0.32, color: BRAND.orange, alpha: 0.16 },
  ],
  fadeAt: 0.72,
} as const satisfies { base: Record<ColorScheme, readonly [string, string]> } & Record<
  string,
  unknown
>;

// The tile's 27 doodles (v45), each placed and turned in the 250 box.
const TILE =
  "<g transform='translate(26.5 29.0) rotate(-30) scale(1)'><path d='M-3.6-3.6a3.6 3.6 0 1 1 5.4 3.1C.6.2 0 1 0 2.4'/><circle cx='0' cy='6.6' r='1.1' fill='#5A3AE6'/></g><g transform='translate(69.4 29.6) rotate(10) scale(1)'><path d='M-8.5 4a8.5 8.5 0 0 1 17 0'/><path d='M0 4l4.6-5.6'/></g><g transform='translate(128.3 22.9) rotate(10) scale(1)'><rect x='-7.5' y='-7.5' width='15' height='15' rx='3.5'/><circle cx='-3' cy='-3' r='1.1' fill='#5A3AE6'/><circle cx='3' cy='3' r='1.1' fill='#5A3AE6'/><circle cx='0' cy='0' r='1.1' fill='#5A3AE6'/></g><g transform='translate(175.2 26.7) rotate(0) scale(1)'><path d='M-3.5-7l7 7-7 7'/></g><g transform='translate(226.9 24.5) rotate(-10) scale(0.88)'><path d='M0-8C.8-2.2 2.2-.8 8 0 2.2.8.8 2.2 0 8-.8 2.2-2.2.8-8 0-2.2-.8-.8-2.2 0-8z'/></g><g transform='translate(56.0 80.9) rotate(28) scale(1)'><path d='M-8.5 4a8.5 8.5 0 0 1 17 0'/><path d='M0 4l4.6-5.6'/></g><g transform='translate(102.5 72.8) rotate(-20) scale(1.1)'><rect x='-6.5' y='-10' width='8' height='20' rx='4'/><rect x='-1.5' y='-10' width='8' height='20' rx='4'/></g><g transform='translate(144.4 75.8) rotate(-30) scale(0.88)'><path d='M0-8C.8-2.2 2.2-.8 8 0 2.2.8.8 2.2 0 8-.8 2.2-2.2.8-8 0-2.2-.8-.8-2.2 0-8z'/></g><g transform='translate(195.3 72.5) rotate(-30) scale(1)'><path d='M-9-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-5 4v-4h-1a3 3 0 0 1-3-3z'/></g><g transform='translate(4.2 69.0) rotate(-20) scale(1)'><path d='M2.5-9v12.5M2.5-9l5 2'/><circle cx='-0.5' cy='4' r='3'/></g><g transform='translate(254.2 69.0) rotate(-20) scale(1)'><path d='M2.5-9v12.5M2.5-9l5 2'/><circle cx='-0.5' cy='4' r='3'/></g><g transform='translate(24.6 130.8) rotate(0) scale(0.88)'><path d='M0-7.5v15M-7.5 0h15'/></g><g transform='translate(69.9 126.6) rotate(28) scale(1.1)'><path d='M-5.5-5.5l11 11M5.5-5.5l-11 11'/></g><g transform='translate(123.0 122.7) rotate(-30) scale(0.88)'><rect x='-7.5' y='-7.5' width='15' height='15' rx='3.5'/><circle cx='-3' cy='-3' r='1.1' fill='#5A3AE6'/><circle cx='3' cy='3' r='1.1' fill='#5A3AE6'/><circle cx='0' cy='0' r='1.1' fill='#5A3AE6'/></g><g transform='translate(178.1 120.4) rotate(-20) scale(1)'><path d='M-5.5 8l5.5-16 5.5 16M-3.2 2.2h6.4'/></g><g transform='translate(219.1 124.6) rotate(0) scale(1)'><path d='M0 7s-8-4.8-8-10a4 4 0 0 1 8-1.2A4 4 0 0 1 8-3c0 5.2-8 10-8 10z'/></g><g transform='translate(52.2 171.3) rotate(10) scale(1)'><rect x='-6.5' y='-10' width='8' height='20' rx='4'/><rect x='-1.5' y='-10' width='8' height='20' rx='4'/></g><g transform='translate(105.8 178.2) rotate(0) scale(0.88)'><path d='M2.5-9v12.5M2.5-9l5 2'/><circle cx='-0.5' cy='4' r='3'/></g><g transform='translate(145.4 174.0) rotate(-20) scale(1)'><rect x='-6' y='-9' width='12' height='18' rx='2.6'/><path d='M-2.8-4h5.6M-2.8 0h3.6'/></g><g transform='translate(197.2 180.7) rotate(28) scale(1.1)'><circle cx='0' cy='1.5' r='7.5'/><path d='M0 1.5V-2.5M-2.4-8.5h4.8'/></g><g transform='translate(6.0 169.2) rotate(-20) scale(0.88)'><path d='M0 7s-8-4.8-8-10a4 4 0 0 1 8-1.2A4 4 0 0 1 8-3c0 5.2-8 10-8 10z'/></g><g transform='translate(256.0 169.2) rotate(-20) scale(0.88)'><path d='M0 7s-8-4.8-8-10a4 4 0 0 1 8-1.2A4 4 0 0 1 8-3c0 5.2-8 10-8 10z'/></g><g transform='translate(31.0 226.2) rotate(10) scale(1)'><path d='M-9-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-5 4v-4h-1a3 3 0 0 1-3-3z'/></g><g transform='translate(69.5 220.8) rotate(0) scale(1.1)'><circle cx='0' cy='1.5' r='7.5'/><path d='M0 1.5V-2.5M-2.4-8.5h4.8'/></g><g transform='translate(119.1 226.3) rotate(28) scale(1.1)'><path d='M-5.5 8l5.5-16 5.5 16M-3.2 2.2h6.4'/></g><g transform='translate(173.6 219.9) rotate(-20) scale(1)'><rect x='-6' y='-9' width='12' height='18' rx='2.6'/><path d='M-2.8-4h5.6M-2.8 0h3.6'/></g><g transform='translate(219.2 223.4) rotate(10) scale(0.88)'><rect x='-6.5' y='-10' width='8' height='20' rx='4'/><rect x='-1.5' y='-10' width='8' height='20' rx='4'/></g>";

// The whole wallpaper for a `width` x `height` area as SVG text: the gradient, the glows and as many
// tiles as cover it.
export function wallpaperSvg(scheme: ColorScheme, width: number, height: number): string {
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  const [top, bottom] = WALLPAPER.base[scheme];
  const glows = WALLPAPER.glows
    .map(
      (g, i) =>
        `<radialGradient id="glow${i}" gradientUnits="objectBoundingBox" cx="${g.cx}" cy="${g.cy}" ` +
        `rx="${g.rx}" ry="${g.ry}" fx="${g.cx}" fy="${g.cy}">` +
        `<stop offset="0" stop-color="${g.color}" stop-opacity="${g.alpha}"/>` +
        `<stop offset="${WALLPAPER.fadeAt}" stop-color="${g.color}" stop-opacity="0"/></radialGradient>`,
    )
    .join('');
  const tiles: string[] = [];
  for (let y = 0; y < h; y += WALLPAPER.tile) {
    for (let x = 0; x < w; x += WALLPAPER.tile) {
      tiles.push(`<g transform="translate(${x} ${y})">${TILE}</g>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="base" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>${glows}</defs>` +
    `<rect width="${w}" height="${h}" fill="url(#base)"/>` +
    WALLPAPER.glows
      .map((_, i) => `<rect width="${w}" height="${h}" fill="url(#glow${i})"/>`)
      .join('') +
    `<g fill="none" stroke="${WALLPAPER.ink}" stroke-width="${WALLPAPER.stroke}" stroke-linecap="round" ` +
    `stroke-linejoin="round" opacity="${WALLPAPER.inkOpacity}">${tiles.join('')}</g></svg>`
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
