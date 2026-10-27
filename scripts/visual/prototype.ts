// The page script and the in-page callbacks below run in Chromium.
/// <reference lib="dom" />
// The design prototype (v46, docs/design/v46/skall-masa-deneme-v46.html) drawn the way the visual
// gate's emulator draws the app (CLAUDE.md → Görsel kapı): 360 × 640 dp at 2×, the app's own font
// files (appFonts) instead of Google Fonts, Roboto for system-ui as in the app, no network, motion reduced, the clock stopped at the
// gate's moment and Math.random seeded as in the app (apps/mobile/src/features/design/gorsel/
// deterministic.ts). A state opens with `?gorsel=<state id>&tema=light|dark`: the page script below
// presses the prototype's own "Deneme durumları" buttons (states.json → `prototip.adimlar`). The
// design file itself is never changed.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium, type Page } from 'playwright';

import { GATE_NOW, GATE_SEED } from '../../apps/mobile/src/features/design/gorsel/deterministic.ts';
import { type PrototypeState, PROTOTYPE_FILE, type Theme } from './states.ts';

// The emulator's screen in the gate's job: 720 × 1280 px at density 320 (run-on-emulator.sh).
export const VIEWPORT = { width: 360, height: 640 };
export const SCALE = 2;
const FONT_HOST = 'https://fonts.gstatic.com/gorsel/';
// The app's font files: the list in apps/mobile/src/theme/fonts.ts, a module per weight of an
// @expo-google-fonts package (each next to its .ttf) or a file of the app's own
// (`Name: require('../../assets/fonts/Name.ttf')`). Family and weight come from the name:
// PlusJakartaSans_800ExtraBold is Plus Jakarta Sans 800.
export const APP_FONTS_FILE = 'apps/mobile/src/theme/fonts.ts';

export type AppFont = { name: string; family: string; weight: number; file: string };

function fontOf(name: string, file: string): AppFont {
  const m = /^([A-Za-z]+)_(\d+)/.exec(name);
  if (!m) throw new Error(`${APP_FONTS_FILE}: "${name}" is not Family_<weight>…`);
  const family = (m[1] ?? '').replace(/([a-z])([A-Z])/g, '$1 $2');
  return { name, family, weight: Number(m[2]), file };
}

export function appFonts(root: string): AppFont[] {
  const source = readFileSync(join(root, APP_FONTS_FILE), 'utf8');
  const req = createRequire(join(root, 'apps/mobile/package.json'));
  const fonts: AppFont[] = [];
  for (const m of source.matchAll(
    /import \{ (\w+) \} from '(@expo-google-fonts\/[a-z0-9-]+\/\d+\w*)';/g,
  )) {
    const [, name = '', module = ''] = m;
    fonts.push(fontOf(name, join(dirname(req.resolve(module)), `${name}.ttf`)));
  }
  for (const m of source.matchAll(/^\s*(\w+): require\('([^']+\.ttf)'\),?$/gm)) {
    const [, name = '', path = ''] = m;
    fonts.push(fontOf(name, join(root, dirname(APP_FONTS_FILE), path)));
  }
  if (fonts.length === 0) throw new Error(`no fonts in ${APP_FONTS_FILE}`);
  return fonts;
}

// What the prototype gets instead of Google Fonts' stylesheet: the app's files, and nothing for
// the families the app does not have (v46's link also asks for Manrope and Poppins, which its CSS
// never uses).
export function fontFaces(fonts: AppFont[]): string {
  return fonts
    .map(
      (f) =>
        `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};` +
        `font-display:block;src:url(${FONT_HOST}${f.name}.ttf) format('truetype')}`,
    )
    .join('\n');
}

// v46 sets a few texts in system-ui (the notice over the tab bar, its own test bars); the app sets
// them in Roboto, Android's system face (the owner's decision, docs/decisions/ci-gorsel-kapi.md), so
// the page is served with Roboto in their place, from the app's own file (assets/fonts/). The design
// file itself is not changed.
export function withRoboto(html: string): string {
  return html.replace(/\bsystem-ui\b/g, 'Roboto');
}

// Every face of the app's families loads from its file, or the drawing stops: no silent fallback
// to a system font.
async function checkFonts(page: Page, fonts: AppFont[]): Promise<void> {
  const failed = await page.evaluate(async (wanted) => {
    const bad: string[] = [];
    for (const f of wanted) {
      const faces = await document.fonts.load(`${f.weight} 16px "${f.family}"`);
      if (!faces.some((face) => face.status === 'loaded' && face.weight === String(f.weight))) {
        bad.push(`${f.family} ${f.weight}`);
      }
    }
    return bad;
  }, fonts);
  if (failed.length > 0)
    throw new Error(`fonts not loaded from the app's files: ${failed.join(', ')}`);
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

async function openState(
  page: Page,
  file: string,
  id: string,
  theme: Theme,
  query?: string,
  width?: number,
): Promise<void> {
  const more = query ? `&${query.replaceAll('{tema}', theme)}` : '';
  // The skall tuvali's boards (docs/design/sistem/ekran/) read `tema=koyu` and `genislik`.
  const board = file.includes(`${sep}docs${sep}design${sep}sistem${sep}`);
  const tema = board ? (theme === 'dark' ? 'koyu' : 'acik') : theme;
  const wide = board && width ? `&genislik=${width}` : '';
  await page.goto(
    `${pathToFileURL(file).href}?gorsel=${encodeURIComponent(id)}&tema=${tema}${wide}${more}`,
  );
  await page.waitForFunction(() => document.documentElement.dataset.gorselHazir === '1', null, {
    timeout: 30_000,
  });
  const error = await page.evaluate(() => (window as { __gorselHata?: string }).__gorselHata);
  if (error) throw new Error(`prototype ${id}: ${error}`);
}

// `width`: the state's `genislik` (dp), when it is drawn narrower than the emulator.
export type Wanted = { id: string; theme: Theme; state: PrototypeState; width?: number };
export type Rendered = { id: string; theme: Theme; file: string };

// Draws each (state, scheme) into `out/<id>-<theme>.png`, cropped to the state's `kirp` element.
export async function renderPrototype(
  root: string,
  out: string,
  wanted: Wanted[],
  executablePath?: string,
): Promise<Rendered[]> {
  const fonts = appFonts(root);
  const files = new Map(fonts.map((f) => [`${FONT_HOST}${f.name}.ttf`, f.file]));
  const states = Object.fromEntries(wanted.map((w) => [w.id, w.state]));
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const done: Rendered[] = [];
  try {
    for (const { id, theme, state, width } of wanted) {
      const documentFile = join(root, state.dosya ?? PROTOTYPE_FILE);
      const documentUrl = pathToFileURL(documentFile).href;
      const context = await browser.newContext({
        viewport: { ...VIEWPORT, width: state.genislik ?? width ?? VIEWPORT.width },
        deviceScaleFactor: SCALE,
        colorScheme: theme,
        reducedMotion: 'reduce',
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
      });
      await context.clock.install({ time: GATE_NOW });
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.startsWith(documentUrl)) {
          return route.fulfill({
            contentType: 'text/html; charset=utf-8',
            body: withRoboto(readFileSync(documentFile, 'utf8')),
          });
        }
        if (url.startsWith('file:')) return route.continue();
        if (url.startsWith('https://fonts.googleapis.com/')) {
          return route.fulfill({ contentType: 'text/css', body: fontFaces(fonts) });
        }
        const file = files.get(url);
        if (file) return route.fulfill({ contentType: 'font/ttf', body: readFileSync(file) });
        return route.abort();
      });
      const page = await context.newPage();
      await page.exposeFunction('__gorselBekle', (ms: number) => page.clock.runFor(ms));
      await page.addInitScript(pageScript, { seed: GATE_SEED, states } satisfies PageArg);
      await openState(page, documentFile, id, theme, state.sorgu, state.genislik ?? width);
      await page.evaluate(() => document.fonts.ready);
      await checkFonts(page, fonts);
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
