// The riso print texture (docs/decisions/riso-dugme.md) of Mesajlar's riso "+": a tile of halftone
// dots and paper grain laid over its ink, repeated (Image resizeMode="repeat"), light marks for the
// dark ink. The buttons are glass since 12 Kasım (docs/design/iskelet.md → 2.1). 8 dp tiles at 3×,
// made once; run again only to change the texture:
//   cd scripts && node --experimental-strip-types icon/risoButton.ts
import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const SIZE = 24; // 8 dp at 3×
const SEED = 7;

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function tile(ink: [number, number, number], dotAlpha: number, grainAlpha: number): Buffer {
  const png = new PNG({ width: SIZE, height: SIZE });
  const r = rand(SEED);
  // Two dots in a 4 dp cell (12 px): at (3, 3) and (9, 9), radius 2.7 px.
  const dots = [
    [3, 3],
    [9, 9],
    [15, 3],
    [21, 9],
    [3, 15],
    [9, 21],
    [15, 15],
    [21, 21],
  ];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let a = r() * grainAlpha;
      for (const [cx, cy] of dots) {
        const d = Math.hypot(x + 0.5 - (cx ?? 0), y + 0.5 - (cy ?? 0));
        if (d < 2.7) a = Math.max(a, dotAlpha * Math.min(1, 2.7 - d));
      }
      const i = (y * SIZE + x) * 4;
      png.data[i] = ink[0];
      png.data[i + 1] = ink[1];
      png.data[i + 2] = ink[2];
      png.data[i + 3] = Math.round(a * 255);
    }
  }
  return PNG.sync.write(png);
}

const out = new URL('../../apps/mobile/assets/riso/button', import.meta.url).pathname;
writeFileSync(`${out}/texture-light@3x.png`, tile([255, 255, 255], 0.22, 0.12));
