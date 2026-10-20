// The page script and the in-page callbacks below run in Chromium.
/// <reference lib="dom" />
// The design prototype (v46, docs/design/v46/skall-masa-deneme-v46.html) drawn the way the visual
// gate's emulator draws the app (CLAUDE.md → Görsel kapı): 360 × 640 dp at 2×, the app's own Plus
// Jakarta Sans files instead of Google Fonts, no network, motion reduced, the clock stopped at the
// gate's moment and Math.random seeded as in the app (apps/mobile/src/features/design/gorsel/
// deterministic.ts). A state opens with `?gorsel=<state id>&tema=light|dark`: the page script below
// presses the prototype's own "Deneme durumları" buttons (states.json → `prototip.adimlar`). The
// design file itself is never changed.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium, type Page } from 'playwright';

import { GATE_NOW, GATE_SEED } from '../../apps/mobile/src/features/design/gorsel/deterministic.ts';
import { type PrototypeState, PROTOTYPE_FILE, type Theme } from './states.ts';

// The emulator's screen in the gate's job: 720 × 1280 px at density 320 (run-on-emulator.sh).
export const VIEWPORT = { width: 360, height: 640 };
export const SCALE = 2;
const FONT_HOST = 'https://fonts.gstatic.com/gorsel/';
const WEIGHTS = ['400Regular', '500Medium', '600SemiBold', '700Bold', '800ExtraBold'];

function fontDir(root: string): string {
  const req = createRequire(join(root, 'apps/mobile/package.json'));
  return dirname(req.resolve('@expo-google-fonts/plus-jakarta-sans/package.json'));
}

export function fontFaces(): string {
  return WEIGHTS.map(
    (w) =>
      `@font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:${parseInt(w, 10)};` +
      `src:url(${FONT_HOST}PlusJakartaSans_${w}.ttf) format('truetype')}`,
  ).join('\n');
}

type PageArg = { seed: number; states: Record<string, PrototypeState> };

// Runs in the page before its own scripts: the seeded Math.random (the app's seededRandom,
// written out again because the page cannot import it; prototype.test.ts keeps them equal), then,
// once the prototype has built its screens, the state's steps from `?gorsel=`.
// `window.__gorselBekle(ms)` is the test's clock (renderPrototype exposes it); without it, the
// steps wait on real timers.
export function pageScript(arg: PageArg): void {
  let a = arg.seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const w = window as unknown as {
    __gorselBekle?: (ms: number) => Promise<void>;
    __gorselHata?: string;
  };
  const wait = (ms: number) =>
    w.__gorselBekle ? w.__gorselBekle(ms) : new Promise<void>((r) => setTimeout(r, ms));
  window.addEventListener('load', () => {
    void (async () => {
      const id = new URLSearchParams(location.search).get('gorsel');
      const state = id ? arg.states[id] : undefined;
      if (id && !state) w.__gorselHata = `prototipte böyle bir durum yok: ${id}`;
      for (const step of state?.adimlar ?? []) {
        if ('tikla' in step) {
          const el = document.querySelector<HTMLElement>(step.tikla);
          if (!el) {
            w.__gorselHata = `bulunamadı: ${step.tikla}`;
            break;
          }
          el.click();
        } else {
          await wait(step.bekle);
        }
      }
      document.documentElement.dataset.gorselHazir = '1';
    })();
  });
}

async function openState(page: Page, file: string, id: string, theme: Theme): Promise<void> {
  await page.goto(`${pathToFileURL(file).href}?gorsel=${encodeURIComponent(id)}&tema=${theme}`);
  await page.waitForFunction(() => document.documentElement.dataset.gorselHazir === '1', null, {
    timeout: 30_000,
  });
  const error = await page.evaluate(() => (window as { __gorselHata?: string }).__gorselHata);
  if (error) throw new Error(`prototype ${id}: ${error}`);
}

export type Wanted = { id: string; theme: Theme; state: PrototypeState };
export type Rendered = { id: string; theme: Theme; file: string };

// Draws each (state, scheme) into `out/<id>-<theme>.png`, cropped to the state's `kirp` element.
export async function renderPrototype(
  root: string,
  out: string,
  wanted: Wanted[],
  executablePath?: string,
): Promise<Rendered[]> {
  const fonts = fontDir(root);
  const states = Object.fromEntries(wanted.map((w) => [w.id, w.state]));
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const done: Rendered[] = [];
  try {
    for (const { id, theme, state } of wanted) {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: SCALE,
        colorScheme: theme,
        reducedMotion: 'reduce',
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
      });
      await context.clock.install({ time: GATE_NOW });
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.startsWith('file:')) return route.continue();
        if (url.startsWith('https://fonts.googleapis.com/')) {
          return route.fulfill({ contentType: 'text/css', body: fontFaces() });
        }
        if (url.startsWith(FONT_HOST)) {
          const file = url.slice(FONT_HOST.length);
          const weight = /PlusJakartaSans_(\w+)\.ttf$/.exec(file)?.[1] ?? '';
          return route.fulfill({
            contentType: 'font/ttf',
            body: readFileSync(join(fonts, weight, file)),
          });
        }
        return route.abort();
      });
      const page = await context.newPage();
      await page.exposeFunction('__gorselBekle', (ms: number) => page.clock.runFor(ms));
      await page.addInitScript(pageScript, { seed: GATE_SEED, states } satisfies PageArg);
      await openState(page, join(root, state.dosya ?? PROTOTYPE_FILE), id, theme);
      await page.evaluate(() => document.fonts.ready);
      const file = join(out, `${id}-${theme}.png`);
      await page.locator(state.kirp).first().screenshot({ path: file, animations: 'disabled' });
      done.push({ id, theme, file });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return done;
}
