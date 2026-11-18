// node --experimental-strip-types scripts/visual/web-shot.ts <app key | states.json id> <light|dark>
//   <out.png> [--bas <testID>] [--uzun-bas <testID>] [--kaydir <dp>] [--bekle <ms>]
//   [--sayfa <n> --sayfalar <m>] [--genislik <dp>] [--url <base>] [--yanyana <file>]
// The web preview of a visual gate state (CLAUDE.md → Görsel kapı): a quick look at a screen in a
// browser, seconds instead of the Android run. Not evidence: the Android shot stays the proof
// (react-native-web lays text out with the browser, native views are stand-ins). Needs the preview
// server running (`pnpm web:onizleme`, default http://localhost:8081).
// The state is an app key (`ekran/dm`) or an id of e2e/visual/states.json (`ekran-dm-mesaj-menu`):
// an id brings its app key, page count, width and steps (`uygulamaAdimlar`), the steps given here
// come after them. Opens /gorsel?durum=<key>&tema=<scheme> on a 390×844 dp, 2× page (the gate's
// emulator: 780×1688, the full screen with its 24 dp status bar left empty), motion reduced,
// Istanbul's time zone, nothing but the server reachable; waits for the state's ready marker
// (`gorsel-hazir-1`, GateState.tsx) and the fonts, does the steps in order (`bas`: a click on
// data-testid; `uzunBas`: held 800 ms; `kaydir`: the wheel, dp down; `bekle`: a pause), then
// writes the PNG. Fails when the state is unknown or never settles; the page's errors are printed.
// PLAYWRIGHT_CHROMIUM: a Chromium to use instead of Playwright's own.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from 'playwright';
import { PNG } from 'pngjs';

import { pngOf, readPng, similarity, tryReadPng } from './compare.ts';
import { sideBySide } from './sideBySide.ts';
import { type AppStep, loadStates, SCALE, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './states.ts';

const USAGE =
  'usage: web-shot.ts <app key | states.json id> <light|dark> <out.png> [--bas <testID>] ' +
  '[--uzun-bas <testID>] [--kaydir <dp>] [--bekle <ms>] [--sayfa <n> --sayfalar <m>] ' +
  '[--genislik <dp>] [--url <base>] [--yanyana <file>]';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const HOLD_MS = 800;

function parseArgs(argv: string[]) {
  const [name, theme, out, ...rest] = argv;
  if (!name || !out || (theme !== 'light' && theme !== 'dark')) throw new Error(USAGE);
  const known = loadStates(ROOT).durumlar.find((s) => s.id === name);
  const steps: AppStep[] = [...(known?.uygulamaAdimlar ?? [])];
  let base = process.env.WEB_ONIZLEME_URL ?? 'http://localhost:8081';
  let page = 0;
  let pages = known?.sayfa ?? 1;
  let width = known?.genislik;
  let beside: string | undefined;
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (value === undefined) throw new Error(`${flag ?? ''}: value missing\n${USAGE}`);
    const n = Number(value);
    if (flag === '--bas') steps.push({ bas: value });
    else if (flag === '--uzun-bas') steps.push({ uzunBas: value });
    else if (flag === '--kaydir' && n > 0) steps.push({ kaydir: n });
    else if (flag === '--bekle' && n > 0) steps.push({ bekle: n });
    else if (flag === '--sayfa' && n >= 0) page = n;
    else if (flag === '--sayfalar' && n >= 1) pages = n;
    else if (flag === '--genislik' && n > 0) width = n;
    else if (flag === '--url') base = value.replace(/\/$/, '');
    else if (flag === '--yanyana' && known) beside = resolve(value);
    else throw new Error(`${flag ?? ''} ${value}: not understood\n${USAGE}`);
  }
  return {
    key: known?.app ?? name,
    id: known?.id,
    theme: theme === 'dark' ? ('dark' as const) : ('light' as const),
    out: resolve(out),
    steps,
    base,
    page,
    pages,
    width,
    beside,
  };
}

// With `--yanyana <file>` and a states.json id: the Android baseline of the same state and theme
// (e2e/visual/baz/<id>-<theme>-<page>.png), the web shot and their diff side by side, and
// pixelmatch's similarity. Neither the baseline nor the shot is cropped: both are the full screen.
function writeBeside(file: string, id: string, theme: string, page: number, shot: string): void {
  const baseline = join(ROOT, 'e2e/visual/baz', `${id}-${theme}-${page + 1}.png`);
  const android = tryReadPng(baseline);
  const web = readPng(shot);
  const androidPng = pngOf(android);
  const match = androidPng ? similarity(androidPng, web) : null;
  writeFileSync(
    file,
    PNG.sync.write(
      sideBySide([
        { label: 'Android baz', image: androidPng },
        { label: 'Web', image: web },
        { label: 'Fark', image: match?.diff ?? null },
      ]),
    ),
  );
  console.log(
    match
      ? `${file}: ${match.percent.toFixed(2)}% alike${match.sameSize ? '' : ' (different sizes)'}`
      : `${file}: no baseline (${baseline})`,
  );
}

async function runStep(page: Page, step: AppStep): Promise<void> {
  if ('bas' in step) {
    await page.locator(`[data-testid="${step.bas}"]`).first().click();
  } else if ('uzunBas' in step) {
    const box = await page.locator(`[data-testid="${step.uzunBas}"]`).first().boundingBox();
    if (!box) throw new Error(`${step.uzunBas}: not on screen`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(HOLD_MS);
    await page.mouse.up();
  } else if ('kaydir' in step) {
    await page.mouse.move(VIEWPORT_WIDTH / 2, (VIEWPORT_HEIGHT * 3) / 4);
    await page.mouse.wheel(0, step.kaydir);
  } else {
    await page.waitForTimeout(step.bekle);
  }
}

const args = parseArgs(process.argv.slice(2));
const started = Date.now();
const executablePath = process.env.PLAYWRIGHT_CHROMIUM;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: SCALE,
    // The gate's emulator runs with animations off: the app's reduce-motion path.
    reducedMotion: 'reduce',
    colorScheme: args.theme,
    timezoneId: 'Europe/Istanbul',
    locale: 'tr-TR',
  });
  // Nothing leaves the machine: only the preview server answers.
  const origin = new URL(args.base).origin;
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text().split('\n')[0] ?? ''}`);
  });
  const query = new URLSearchParams({
    durum: args.key,
    tema: args.theme,
    sayfa: String(args.page),
    sayfalar: String(args.pages),
    n: '1',
    ...(args.width ? { genislik: String(args.width) } : {}),
  });
  // The first open of a cold server bundles the app (a minute or two).
  await page.goto(`${args.base}/gorsel?${query.toString()}`, { timeout: 600_000 });
  const ready = page.locator('[data-testid="gorsel-hazir-1"]');
  const unknown = page.locator('[data-testid="gorsel-yok"]');
  await Promise.race([
    ready.waitFor({ state: 'attached', timeout: 60_000 }),
    unknown.waitFor({ state: 'attached', timeout: 60_000 }),
  ]).catch(() => undefined);
  if ((await unknown.count()) > 0) throw new Error(`no gate state "${args.key}" (registry.tsx)`);
  if ((await ready.count()) === 0) {
    throw new Error(
      `"${args.key}" did not settle in 60 s` +
        (errors.length > 0 ? `; page errors:\n${errors.join('\n')}` : ''),
    );
  }
  const failedFonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family);
  });
  if (failedFonts.length > 0) throw new Error(`fonts did not load: ${failedFonts.join(', ')}`);
  for (const step of args.steps) await runStep(page, step);
  // A step's result (a menu, a scroll) draws in the next frames.
  await page.waitForTimeout(args.steps.length > 0 ? 500 : 100);
  const wrongPages = await page.locator('[data-testid^="gorsel-sayfa-gereken-"]').count();
  if (wrongPages > 0) console.warn('the page count is wrong: the banner says how many it takes');
  // The development overlay's error toast is not the screen: hidden, its errors printed below.
  await page.addStyleTag({ content: '#error-toast { display: none !important; }' });
  mkdirSync(dirname(args.out), { recursive: true });
  await page.screenshot({ path: args.out });
  if (errors.length > 0) console.warn(`page errors (the shot was taken):\n${errors.join('\n')}`);
  console.log(`${args.out} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  if (args.beside && args.id) writeBeside(args.beside, args.id, args.theme, args.page, args.out);
} finally {
  await browser.close();
}
