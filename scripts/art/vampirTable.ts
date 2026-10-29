// Usage: node --experimental-strip-types scripts/art/vampirTable.ts → Vampir Köylü's round table
// drawn once into pictures (apps/mobile/assets/vampir/table/): the table for each time of day, the
// medallion and the glass over the sand for each tone, at 3× the design's size, as lossless WebP.
// The phone shows these instead of drawing the same SVG text (blurred shadows and lights) on its
// main thread at every phase (the owner's report, 29 Ekim). `manifest.json` keeps a hash of each
// picture's SVG text; apps/mobile/src/theme/vampirArt.test.ts fails when the text changes and the
// pictures were not drawn again. JavaScript assets: they go out with an update.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import { TABLE_ART } from '../../apps/mobile/src/theme/vampirArt.ts';

const root = resolve(import.meta.dirname, '../..');
const DIR = resolve(root, 'apps/mobile/assets/vampir/table');
const SCALE = 3;

mkdirSync(DIR, { recursive: true });
const manifest: Record<string, string> = {};
for (const [name, svg] of Object.entries(TABLE_ART())) {
  await sharp(Buffer.from(svg), { density: 72 * SCALE })
    .webp({ lossless: true, effort: 6 })
    .toFile(resolve(DIR, `${name}.webp`));
  manifest[name] = createHash('sha256').update(svg).digest('hex');
  console.log(`${name}.webp`);
}
writeFileSync(resolve(DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
