// node --experimental-strip-types scripts/visual/render-pano.ts <repo root> <board images dir> <out dir>
// The boards e2e/visual/states.json sets beside the app (states.ts → `pano`), light and dark, from
// the `pano-goruntuleri` branch's WebP images (<board images dir>, the branch's tree) into
// <out>/pano/<id>-<theme>.png, the pixels as they are (no scaling, no colour change): Playwright's
// Chromium decodes the WebP and writes it out as PNG through a canvas of the image's own size. The
// visual job already has Playwright for the prototype; nothing else is installed for it. A board
// whose image is not on the branch is named and skipped (the report shows "PANO YOK").
// PLAYWRIGHT_CHROMIUM: a Chromium to use instead of Playwright's own (a local machine).
/// <reference lib="dom" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from 'playwright';

import { BOARD_DIR } from './gate-report.ts';
import { boardImage, type GateConfig, loadStates, THEMES } from './states.ts';

export type BoardWanted = { id: string; theme: (typeof THEMES)[number]; image: string };

// Every board image the states ask for, by state and theme.
export function boardsWanted(config: GateConfig): BoardWanted[] {
  return config.durumlar.flatMap(({ id, pano }) =>
    pano ? THEMES.map((theme) => ({ id, theme, image: boardImage(pano, theme) })) : [],
  );
}

// One WebP to PNG in the page: decoded at its own size, drawn 1:1 on a canvas of that size.
export async function webpToPng(page: Page, webp: Buffer): Promise<Buffer> {
  const base64 = await page.evaluate(async (data: string) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/webp' }), {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) {
      s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }, webp.toString('base64'));
  return Buffer.from(base64, 'base64');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [rootArg, boardsArg, outArg] = process.argv.slice(2);
  if (!rootArg || !boardsArg || !outArg) {
    throw new Error('usage: render-pano.ts <repo root> <board images dir> <out dir>');
  }
  const boards = resolve(boardsArg);
  const out = join(resolve(outArg), BOARD_DIR);
  mkdirSync(out, { recursive: true });
  const wanted = boardsWanted(loadStates(resolve(rootArg)));
  const missing = wanted.filter((w) => !existsSync(join(boards, w.image)));
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  let done = 0;
  try {
    const page = await browser.newPage();
    for (const w of wanted) {
      if (missing.includes(w)) continue;
      const png = await webpToPng(page, readFileSync(join(boards, w.image)));
      writeFileSync(join(out, `${w.id}-${w.theme}.png`), png);
      done++;
    }
  } finally {
    await browser.close();
  }
  console.log(`boards: ${done} of ${wanted.length} converted into ${out}`);
  if (missing.length > 0) {
    console.log(`not on the branch: ${[...new Set(missing.map((w) => w.image))].join(', ')}`);
  }
}
