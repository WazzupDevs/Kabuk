// The light aura ground (scripts/aura/ground.html: Aura v65 ekran.css → .aura .a1–.a5 on the
// canvas), drawn with Chromium at the canvas's 390 × 844 and kept lossless as
// apps/mobile/assets/aura/ground-light.webp (src/aura/AuraBackground.tsx). The dark scheme has no
// aura (`.dark.pA`): its ground is the flat canvas. `node --experimental-strip-types
// scripts/aura/ground.ts` from the repo root.
import { join } from 'node:path';

import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`file://${join(root, 'scripts/aura/ground.html')}`);
const png = await page.screenshot();
await browser.close();
await sharp(png)
  .webp({ lossless: true })
  .toFile(join(root, 'apps/mobile/assets/aura/ground-light.webp'));
