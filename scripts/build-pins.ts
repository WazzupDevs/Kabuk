// Usage: node --experimental-strip-types scripts/build-pins.ts → apps/mobile/assets/pin/*.png, the
// Keşfet map pins' coloured glyphs (scripts/icon/pins.ts) at 1×, 2× and 3×. Separate from
// `pnpm icons`, which also writes the launcher icon (a native asset): these are JavaScript assets
// and go out with an update.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import type { MarkerKind } from './icon/glyphs.ts';
import { PINS, pinSvg } from './icon/pins.ts';

const DP = 24;
const DENSITIES = [1, 2, 3] as const;
const out = resolve(import.meta.dirname, '..', 'apps/mobile/assets/pin');
mkdirSync(out, { recursive: true });
for (const kind of Object.keys(PINS) as MarkerKind[]) {
  for (const d of DENSITIES) {
    const file = d === 1 ? `pin-${kind}.png` : `pin-${kind}@${d}x.png`;
    await sharp(Buffer.from(pinSvg(kind, DP * d)))
      .png()
      .toFile(resolve(out, file));
    console.log(file);
  }
}
