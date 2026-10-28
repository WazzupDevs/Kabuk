// Usage: node --experimental-strip-types scripts/art/build.ts → skall's own pictures (art.ts): the
// table pictures that replace v46's (docs/design/aura/masa-simgeleri/<id>.webp, 384 px; `pnpm seed`
// copies them into the app), the venue icons (apps/mobile/assets/venue/<kind>.webp, 168 px: the
// list's 56 at 3×) and the map pins (apps/mobile/assets/pin/pin-<kind>.png, 40 pt at 1×, 2×, 3×).
// JavaScript assets: they go out with an update.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import { TABLE_ART, VENUE_KINDS, venueIcon, venuePin } from './art.ts';

const root = resolve(import.meta.dirname, '../..');
const TABLE_DIR = resolve(root, 'docs/design/aura/masa-simgeleri');
const VENUE_DIR = resolve(root, 'apps/mobile/assets/venue');
const PIN_DIR = resolve(root, 'apps/mobile/assets/pin');
const TABLE_PX = 384;
const VENUE_PX = 168;
const PIN_PT = 40;

const raster = (svg: string, px: number) =>
  sharp(Buffer.from(svg), { density: (72 * px) / 120 }).resize(px, px);

mkdirSync(TABLE_DIR, { recursive: true });
mkdirSync(VENUE_DIR, { recursive: true });
for (const [id, draw] of Object.entries(TABLE_ART)) {
  await raster(draw(), TABLE_PX)
    .webp({ quality: 92, effort: 6 })
    .toFile(resolve(TABLE_DIR, `${id}.webp`));
  console.log(`${id}.webp`);
}
for (const kind of VENUE_KINDS) {
  await raster(venueIcon(kind), VENUE_PX)
    .webp({ quality: 92, effort: 6 })
    .toFile(resolve(VENUE_DIR, `${kind}.webp`));
  for (const d of [1, 2, 3]) {
    const file = d === 1 ? `pin-${kind}.png` : `pin-${kind}@${d}x.png`;
    await raster(venuePin(kind), PIN_PT * d)
      .png()
      .toFile(resolve(PIN_DIR, file));
  }
  console.log(`${kind}: icon, pins`);
}
