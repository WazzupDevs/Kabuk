// node --experimental-strip-types scripts/visual/web-shot.ts <app key> <light|dark> <out.png>
//   [--bas <testID>] [--kaydir <dp>] [--bekle <ms>] [--sayfa <n> --sayfalar <m>] [--url <base>]
// The web preview of a visual gate state (CLAUDE.md → Görsel kapı): a quick look at a screen in a
// browser, seconds instead of the Android run. Not evidence: the Android shot stays the proof
// (react-native-web lays text out with the browser, native views are stand-ins). Needs the preview
// server running (`pnpm web:onizleme`, default http://localhost:8081). Opens
// /gorsel?durum=<key>&tema=<scheme> on a 390×844 dp, 2× page (the gate's emulator: 780×1688),
// motion reduced, Istanbul's time zone, nothing but the server reachable; waits for the state's
// ready marker (`gorsel-hazir-1`, GateState.tsx) and the fonts, does the steps in the order given
// (`--bas`: a click on data-testid; `--kaydir`: the wheel, dp down; `--bekle`: a pause), then
// writes the PNG. Fails when the state is unknown, the route errors or it never settles.
// PLAYWRIGHT_CHROMIUM: a Chromium to use instead of Playwright's own.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { chromium } from 'playwright';

import { SCALE, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './states.ts';

type Step = { bas: string } | { kaydir: number } | { bekle: number };

const USAGE =
  'usage: web-shot.ts <app key> <light|dark> <out.png> [--bas <testID>] [--kaydir <dp>] ' +
  '[--bekle <ms>] [--sayfa <n> --sayfalar <m>] [--url <base>]';

function parseArgs(argv: string[]) {
  const [key, theme, out, ...rest] = argv;
  if (!key || !out || (theme !== 'light' && theme !== 'dark')) throw new Error(USAGE);
  const steps: Step[] = [];
  let base = process.env.WEB_ONIZLEME_URL ?? 'http://localhost:8081';
  let page = 0;
  let pages = 1;
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (value === undefined) throw new Error(`${flag ?? ''}: value missing\n${USAGE}`);
    const n = Number(value);
    if (flag === '--bas') steps.push({ bas: value });
    else if (flag === '--kaydir' && n > 0) steps.push({ kaydir: n });
    else if (flag === '--bekle' && n > 0) steps.push({ bekle: n });
    else if (flag === '--sayfa' && n >= 0) page = n;
    else if (flag === '--sayfalar' && n >= 1) pages = n;
    else if (flag === '--url') base = value.replace(/\/$/, '');
    else throw new Error(`${flag ?? ''} ${value}: not understood\n${USAGE}`);
  }
  return { key, theme, out: resolve(out), steps, base, page, pages };
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
  const query = new URLSearchParams({
    durum: args.key,
    tema: args.theme,
    sayfa: String(args.page),
    sayfalar: String(args.pages),
    n: '1',
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
  for (const step of args.steps) {
    if ('bas' in step) await page.locator(`[data-testid="${step.bas}"]`).first().click();
    else if ('kaydir' in step) {
      await page.mouse.move(VIEWPORT_WIDTH / 2, (VIEWPORT_HEIGHT * 3) / 4);
      await page.mouse.wheel(0, step.kaydir);
    } else await page.waitForTimeout(step.bekle);
  }
  // A step's result (a menu, a scroll) draws in the next frames.
  await page.waitForTimeout(args.steps.length > 0 ? 500 : 100);
  mkdirSync(dirname(args.out), { recursive: true });
  await page.screenshot({ path: args.out });
  if (errors.length > 0) console.warn(`page errors (the shot was taken):\n${errors.join('\n')}`);
  console.log(`${args.out} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
} finally {
  await browser.close();
}
