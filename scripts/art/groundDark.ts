// The dark theme's cloud ground (apps/mobile/assets/aura/ground-dark.webp), drawn by Chromium from
// docs/design/aura's clouds with the night's own strengths, quieter (the owner's report, 30 Ekim:
// the clouds stood out too much in the dark, the amber one a brown smear in the middle). The light
// ground stays as the canvas draws it. Run:
//   PLAYWRIGHT_CHROMIUM=<chromium> node --experimental-strip-types scripts/art/groundDark.ts
import { chromium } from 'playwright';
import sharp from 'sharp';

const OUT = 'apps/mobile/assets/aura/ground-dark.webp';
// The canvas's phone (390 × 844) and its five clouds (aura.css `.a1` … `.a5`).
const W = 390;
const H = 844;
// Night, quieter: purple top left and bottom, a soft pink top right; no amber (it reads as brown
// on the dark ground), the bottom-right pink faint.
const CLOUDS = [
  'width:360px;height:300px;left:-110px;top:-70px;background:rgba(123,92,255,0.34)',
  'width:300px;height:280px;right:-120px;top:30px;background:rgba(255,79,139,0.16)',
  'width:420px;height:320px;left:-60px;bottom:-150px;background:rgba(90,58,230,0.24)',
  'width:260px;height:260px;right:-90px;bottom:120px;background:rgba(255,79,139,0.06)',
];
const GROUND = '#0D0B1E';

const html = `<!doctype html><html><body style="margin:0">
<div style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${GROUND}">
${CLOUDS.map((c) => `<i style="position:absolute;border-radius:50%;filter:blur(64px);${c}"></i>`).join('')}
</div></body></html>`;

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html);
const png = await page.screenshot();
await browser.close();
// Lossless, as the light picture (a blurred picture compresses well).
await sharp(png).webp({ lossless: true, effort: 6 }).toFile(OUT);
console.log('wrote', OUT);
