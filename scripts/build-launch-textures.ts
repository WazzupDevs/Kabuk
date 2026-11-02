// Cuts the riso launch's full-screen textures (apps/mobile/assets/launch/*.webp, 390x844 dp at 3x)
// to the boxes the launch uses (apps/mobile/src/theme/launchTextures.ts), so that the app decodes
// about 50 MB of them and not 260 MB. Writes apps/mobile/assets/launch/kirpik-*.webp, lossless.
// Run `pnpm launch:textures` when the textures or the boxes change.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import {
  LAUNCH_ART,
  LAUNCH_TEXTURE_BOX,
  LAUNCH_TEXTURE_FILES,
  RISO_VARIANTS,
} from '../apps/mobile/src/theme/launchTextures.ts';

const DIR = fileURLToPath(new URL('../apps/mobile/assets/launch/', import.meta.url));

async function main(): Promise<void> {
  const k = LAUNCH_ART.scale;
  for (const file of LAUNCH_TEXTURE_FILES) {
    const [x, y, w, h] = LAUNCH_TEXTURE_BOX[file.box];
    const region = {
      left: (LAUNCH_ART.w / 2 + x) * k,
      top: (LAUNCH_ART.h / 2 + y) * k,
      width: w * k,
      height: h * k,
    };
    for (let v = 1; v <= RISO_VARIANTS; v++) {
      const source = join(DIR, `${file.source}-${v}.webp`);
      const meta = await sharp(source).metadata();
      if (meta.width !== LAUNCH_ART.w * k || meta.height !== LAUNCH_ART.h * k) {
        throw new Error(`${source}: ${meta.width}x${meta.height}, not the set's screen`);
      }
      const out = join(DIR, `${file.out}-${v}.webp`);
      await sharp(source).extract(region).webp({ lossless: true, effort: 6 }).toFile(out);
      console.log(`${out}: ${region.width}x${region.height}`);
    }
  }
}

await main();
