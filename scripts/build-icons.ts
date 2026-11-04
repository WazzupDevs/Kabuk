// Usage: pnpm icons → apps/mobile/assets/icon/*.png, apps/mobile/assets/glyph/*.png and the
// preview page dist/icon-preview/. The skall mark
// (scripts/icon/mark.ts: the app icon, splash and notification icon) and the icon family
// (scripts/icon/glyphs.ts) in every size the app and the stores need. In the app the mark, the
// loaders and the Mekan tab are drawn with Views and react-native-svg (src/components/Mark.tsx),
// not images. Rerun after changing any of them; the PNGs are committed.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import {
  adaptiveMonochromeSvg,
  notificationSvg,
  SPLASH,
  splashSvg,
  storeIconSvg,
} from './icon/mark.ts';
import {
  BADGE_GLYPHS,
  type BadgeGlyph,
  GAME_GLYPHS,
  type GameGlyph,
  glyphSvg,
  LOCK,
  TABLE_AVATARS,
} from './icon/glyphs.ts';
import { previewHtml } from './icon/preview.ts';

const root = resolve(import.meta.dirname, '..');
const assets = resolve(root, 'apps/mobile/assets/icon');
const glyph = resolve(root, 'apps/mobile/assets/glyph');
const preview = resolve(root, 'dist/icon-preview');

async function png(svg: string, dir: string, file: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(resolve(dir, file));
  console.log(`${dir.slice(root.length + 1)}/${file}`);
}

mkdirSync(assets, { recursive: true });
mkdirSync(glyph, { recursive: true });
// Source drawing, for designers and the store.
writeFileSync(resolve(assets, 'mark.svg'), `${storeIconSvg(1024)}\n`);

// The Android 13 themed (monochrome) layer. The launcher icon itself (icon.png, play-512.png and
// the adaptive foreground and background) is the riso C drawing of Aura v78 (UygulamaSimgesi; the
// owner's call, 3 Kasım): halftone PNGs from the design, committed as they came, not drawn here.
await png(adaptiveMonochromeSvg(1024), assets, 'adaptive-monochrome.png');
// Splash image: the 288 dp canvas at xxxhdpi (4×; the plugin draws the night colour, the same in
// light and dark), and the notification icon (white on transparent; 96 px is the xxxhdpi size of
// the 24 dp status bar icon).
await png(splashSvg(SPLASH * 4), assets, 'splash.png');
await png(notificationSvg(96), assets, 'notification.png');

// The status bar icon per push kind (Aura BildirimSimgeleri, 3 Kasım): the drawings come as they
// are from the canvas (scripts/icon/bildirim/<kind>.svg, white on transparent, 24 dp grid), one
// PNG per Android density. app.config.ts → withNotificationIcons copies them into res/drawable-*;
// the patched expo-notifications picks ic_bildirim_<kind> by the push's `kind` (pure/push.ts).
// A push of no known kind keeps notification.png above.
const bildirim = resolve(root, 'scripts/icon/bildirim');
const notificationRes = resolve(root, 'apps/mobile/assets/notification');
const DRAWABLE = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 } as const;
for (const file of readdirSync(bildirim)
  .filter((f) => f.endsWith('.svg'))
  .sort()) {
  const svg = readFileSync(resolve(bildirim, file));
  for (const [density, px] of Object.entries(DRAWABLE)) {
    const dir = resolve(notificationRes, `drawable-${density}`);
    mkdirSync(dir, { recursive: true });
    await sharp(svg, { density: (72 * px) / 24 })
      .resize(px, px)
      .png()
      .toFile(resolve(dir, `ic_bildirim_${file.slice(0, -4)}.png`));
  }
  console.log(`apps/mobile/assets/notification/drawable-*/ic_bildirim_${file.slice(0, -4)}.png`);
}

// The icon family (scripts/icon/glyphs.ts), white, tinted by the app. React Native picks the
// @2x/@3x file for the screen's density; `dp` is the size the app draws it at.
const DENSITIES = [1, 2, 3] as const;
async function glyphPngs(svgAt: (px: number) => string, file: string, dp: number): Promise<void> {
  for (const d of DENSITIES)
    await png(svgAt(dp * d), glyph, d === 1 ? `${file}.png` : `${file}@${d}x.png`);
}
// Badges (src/features/profile/BadgeIcon.tsx): drawn up to 32 dp inside their disc; the lock 14.
for (const id of Object.keys(BADGE_GLYPHS) as BadgeGlyph[]) {
  await glyphPngs((px) => glyphSvg(BADGE_GLYPHS[id], px), `badge-${id}`, 32);
}
await glyphPngs((px) => glyphSvg(LOCK, px), 'lock', 14);
// Games (src/components/Glyph.tsx → GameIcon): up to 32 dp inside their disc.
for (const id of Object.keys(GAME_GLYPHS) as GameGlyph[]) {
  const g = GAME_GLYPHS[id];
  await glyphPngs((px) => glyphSvg(g.solid, px, { cut: g.cut }), `game-${id}`, 32);
}
// Table avatars (src/components/Avatar.tsx): the icon on its disc, up to 40 dp (the 72 dp hero
// avatar draws it at 56 %).
for (const a of TABLE_AVATARS) {
  await glyphPngs((px) => glyphSvg(a.solid, px, { cut: a.cut }), `avatar-${a.id}`, 40);
}

mkdirSync(preview, { recursive: true });
writeFileSync(resolve(preview, 'index.html'), previewHtml('../../apps/mobile/assets/icon'));
console.log('dist/icon-preview/index.html');
