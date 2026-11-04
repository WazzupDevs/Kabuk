// Usage: node --experimental-strip-types scripts/art/vampirScene.ts [room-png-dir] → Vampir
// Köylü's capsule table drawn once into pictures (apps/mobile/assets/vampir/scene/): the table for
// each phase (theme/vampirScene.ts → tableSvg) at 3× the design's size with what the reference
// lays over it there (toon2.js → drawCap: the lamp's light, lighter; the vignette), as lossless
// WebP. `manifest.json` keeps a hash of each picture's SVG text; apps/mobile/src/theme/
// vampirScene.test.ts fails when the text changes and the pictures were not drawn again.
// With `room-png-dir` (the design's arka-plan-masasiz/: gece, safak-sabah, gunduz-oylama,
// son-sonuc .png, 1080 × 2283) the rooms behind the table are made again too.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

import {
  LAMP,
  lampAt,
  PAL,
  SCENE_ART,
  type ScenePhase,
  vignette,
} from '../../apps/mobile/src/theme/vampirScene.ts';
import { TABLE } from '../../apps/mobile/src/theme/vampirTableSize.ts';

const root = resolve(import.meta.dirname, '../..');
const DIR = resolve(root, 'apps/mobile/assets/vampir/scene');
const SCALE = 3;
const ROOMS: Record<ScenePhase, string> = {
  night: 'gece',
  dawn: 'safak-sabah',
  day: 'gunduz-oylama',
  end: 'son-sonuc',
};

mkdirSync(DIR, { recursive: true });
const manifestPath = resolve(DIR, 'manifest.json');
const manifest: Record<string, string> = {};
for (const [name, svg] of Object.entries(SCENE_ART())) {
  const phase = name.replace('table-', '') as ScenePhase;
  const { data, info } = await sharp(Buffer.from(svg), { density: 72 * SCALE })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const v = vignette(phase);
  const lift = PAL[phase].lift;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if ((data[i + 3] ?? 0) === 0) continue;
      const px = (x + 0.5) / SCALE;
      const py = (y + 0.5) / SCALE;
      // The lamp's light adds (lighter); the day's light, laid on after it, takes its share.
      const lamp =
        lampAt(phase, Math.hypot(px - TABLE.frame.cx, py - (TABLE.frame.cy - LAMP.rise))) *
        (1 - lift);
      const d = Math.hypot(px - TABLE.frame.cx, py - TABLE.frame.cy);
      const t = Math.max(0, Math.min(1, (d - v.from) / (v.to - v.from)));
      const va = (v.color[3] ?? 0) * t;
      for (let c = 0; c < 3; c++) {
        const lit = Math.min(255, (data[i + c] ?? 0) + (LAMP.rgb[c] ?? 0) * lamp);
        data[i + c] = Math.round(lit * (1 - va) + (v.color[c] ?? 0) * va);
      }
    }
  }
  await sharp(data, { raw: info })
    .webp({ lossless: true, effort: 6 })
    .toFile(resolve(DIR, `${name}.webp`));
  manifest[name] = createHash('sha256').update(svg).digest('hex');
  console.log(`${name}.webp`);
}

const roomDir = process.argv[2];
if (roomDir) {
  for (const [phase, file] of Object.entries(ROOMS)) {
    await sharp(readFileSync(resolve(roomDir, `${file}.png`)))
      .webp({ quality: 88, effort: 6 })
      .toFile(resolve(DIR, `room-${phase}.webp`));
    console.log(`room-${phase}.webp`);
  }
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
