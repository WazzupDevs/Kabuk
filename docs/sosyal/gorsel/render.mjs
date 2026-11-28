// skall sosyal görselleri: sablon.html + icerik.json → 1080×1920 PNG ve MP4.
// Kullanım: node docs/sosyal/gorsel/render.mjs <çıktı klasörü> [id ...]
// Gerekenler: Playwright (Chromium'la) ve ffmpeg. Ayrıntı docs/sosyal/README.md → Görsel üretim.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = resolve(process.argv[2] ?? join(here, 'cikti'));
const only = new Set(process.argv.slice(3));
mkdirSync(out, { recursive: true });

// Kapsül çizimi ve wordmark yalnızca okunur: tasarım kaynağı ve uygulamanın wordmark dosyası.
const capsuleLib = readFileSync(
  join(repo, 'docs/design/kaynak/kapsul/kapsul-cizim-kutuphanesi.js'),
  'utf8',
);
const wordmarkSrc = readFileSync(join(repo, 'apps/mobile/src/theme/wordmark.ts'), 'utf8');
const lettersAt = wordmarkSrc.indexOf('SKA_LETTERS = [');
const letters = wordmarkSrc.slice(lettersAt, wordmarkSrc.indexOf('] as const', lettersAt));
if (!letters.includes('M295')) throw new Error('wordmark.ts: SKA_LETTERS bulunamadı');
const skaD = [...letters.matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');

const jobs = JSON.parse(readFileSync(join(here, 'icerik.json'), 'utf8')).filter(
  (j) => !only.size || only.has(j.id),
);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});

async function load(spec) {
  await page.goto(pathToFileURL(join(here, 'sablon.html')).href);
  await page.addScriptTag({ content: capsuleLib + '\nwindow.LOOK = LOOK;' });
  await page.evaluate(
    ([d, s]) => {
      window.SKA_D = d;
      window.SPEC = s;
    },
    [skaD, spec],
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all([500, 700, 800].map((w) => document.fonts.load(w + ' 40px PJS', 'ğşıİçöü'))),
  );
  await page.evaluate(() => window.render());
}

for (const job of jobs) {
  await load(job);
  if (!job.anim) {
    const file = join(out, job.id + '.png');
    await page.screenshot({ path: file });
    console.log('png', file);
    continue;
  }
  const fps = job.fps ?? 30;
  const frames = Math.round((job.dur ?? 7) * fps);
  const dir = mkdtempSync(join(tmpdir(), 'skall-kare-'));
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.frame(t), i / fps);
    await page.screenshot({
      path: join(dir, String(i).padStart(4, '0') + '.jpg'),
      type: 'jpeg',
      quality: 92,
    });
  }
  const file = join(out, job.id + '.mp4');
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-i',
    join(dir, '%04d.jpg'),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '18',
    '-movflags',
    '+faststart',
    file,
  ]);
  // Kapak karesi: animasyonun son hâli, ayrı PNG.
  await page.evaluate((t) => window.frame(t), (frames - 1) / fps);
  await page.screenshot({ path: join(out, job.id + '-kapak.png') });
  rmSync(dir, { recursive: true, force: true });
  console.log('mp4', file);
}

await browser.close();
