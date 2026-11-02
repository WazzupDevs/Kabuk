// Usage: node --experimental-strip-types scripts/art/build.ts → skall's own pictures (art.ts): the
// table pictures that replace v46's (docs/design/aura/masa-simgeleri/<id>.webp, 384 px; `pnpm seed`
// copies them into the app). The venue icons and the map pins are the riso pictures now
// (apps/mobile/assets/riso/venue-<kind>.webp, assets/pin/pin-<kind>.png; Aura v65 §9.1).
// JavaScript assets: they go out with an update.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import { TABLE_ART } from './art.ts';

const root = resolve(import.meta.dirname, '../..');
const TABLE_DIR = resolve(root, 'docs/design/aura/masa-simgeleri');
const TABLE_PX = 384;

const raster = (svg: string, px: number) =>
  sharp(Buffer.from(svg), { density: (72 * px) / 120 }).resize(px, px);

mkdirSync(TABLE_DIR, { recursive: true });
for (const [id, draw] of Object.entries(TABLE_ART)) {
  await raster(draw(), TABLE_PX)
    .webp({ quality: 92, effort: 6 })
    .toFile(resolve(TABLE_DIR, `${id}.webp`));
  console.log(`${id}.webp`);
}
