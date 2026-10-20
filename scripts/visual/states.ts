// The visual gate's list (e2e/visual/states.json; CLAUDE.md → Görsel kapı): which app states it
// photographs, page by page, in both schemes, and which of them it also sets beside the design
// prototype (v46). One line per state: a new screen or game phase is one more line, once the app
// opens it in its hidden route (apps/mobile/src/features/design/gorsel/registry.tsx).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The design prototype the app is set beside, unless a state names another (`prototip.dosya`).
export const PROTOTYPE_FILE = 'docs/design/v46/skall-masa-deneme-v46.html';

// How the prototype reaches the same state (scripts/visual/v46.ts opens it as
// `?gorsel=<id>&tema=<theme>`): its own "Deneme durumları" buttons pressed in order, its clock run
// on where a step says so, then `kirp`, the element the app's frame corresponds to, photographed.
export type PrototypeStep =
  // Press the element (a CSS selector).
  | { tikla: string }
  // Let the prototype's clock run (ms): its timers and transitions.
  | { bekle: number };

export type PrototypeState = {
  adimlar: PrototypeStep[];
  kirp: string;
  // Another prototype file, from the repo root (default PROTOTYPE_FILE).
  dosya?: string;
  // More of the address, after `?gorsel=…&tema=…`, `{tema}` standing for the scheme: v46's gallery
  // layer opens its gallery (`page=galeri&theme={tema}`) or one of its states (`s=<state>&…`)
  // itself (docs/design/v46/skall-v46-galeri-notu.md).
  sorgu?: string;
  // The prototype's page this wide (CSS px), for an element that its own page lays out at another
  // width: v46's gallery copies each component in a 360-wide frame inside a card that, at 360,
  // clips the full-width ones.
  genislik?: number;
};

export type GateState = {
  // File name stem: `<id>-<tema>-<page>.png`.
  id: string;
  // The app state (apps/mobile/src/features/design/gorsel/registry.tsx): `galeri/<set>`,
  // `oyun/<game>/<phase>`, later `ekran/<screen>`.
  app: string;
  // Pages of a state taller than the screen (default 1); the route says when this is wrong.
  sayfa?: number;
  // The same state in the prototype: set beside it in the similarity report.
  prototip?: PrototypeState;
  // false: photographed and set beside the prototype, never compared with a baseline (a trial
  // entry).
  baz?: boolean;
  // Drawn this wide (dp) on the 360 emulator, and the prototype at this width: v46's small-screen
  // check is at 320 (its `max-width: 350px` rules). The app lays its content out for it (src/ui's
  // WidthScope).
  genislik?: number;
  // Photographed cropped to this element of the frame (a testID), not the whole frame: a
  // component, beside the prototype's `kirp`.
  uygulamaKirp?: string;
};

export type GateConfig = {
  // Maestro assertScreenshot's thresholdPercentage: the least share of matching pixels.
  esik: number;
  durumlar: GateState[];
};

// The gate emulator's width in dp (scripts/visual/run-on-emulator.sh; prototype.ts → VIEWPORT).
export const VIEWPORT_WIDTH = 360;

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export type Shot = {
  state: GateState;
  theme: Theme;
  // 1-based, as in the file name.
  page: number;
  pages: number;
  // `<id>-<theme>-<page>`.
  name: string;
  // Whether a baseline is expected for it.
  baseline: boolean;
};

export const STATES_FILE = 'e2e/visual/states.json';
export const BASELINE_DIR = 'e2e/visual/baz';

export function parseStates(raw: unknown): GateConfig {
  const c = raw as Partial<GateConfig>;
  if (typeof c.esik !== 'number' || c.esik < 90 || c.esik > 100) {
    throw new Error('states.json: esik is the match percentage, 90 to 100');
  }
  if (!Array.isArray(c.durumlar)) throw new Error('states.json: durumlar is a list');
  const seen = new Set<string>();
  for (const s of c.durumlar) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id ?? '')) {
      throw new Error(`states.json: id "${s.id}" is lowercase words joined by "-"`);
    }
    if (seen.has(s.id)) throw new Error(`states.json: id "${s.id}" twice`);
    seen.add(s.id);
    if (!/^(galeri|oyun|ekran)\/[a-z0-9]+(\/[a-z0-9-]+)*$/.test(s.app ?? '')) {
      throw new Error(`states.json: ${s.id}: app "${s.app}" is galeri/…, oyun/… or ekran/…`);
    }
    if (s.sayfa !== undefined && (!Number.isInteger(s.sayfa) || s.sayfa < 1)) {
      throw new Error(`states.json: ${s.id}: sayfa is a whole number from 1`);
    }
    if (s.baz !== undefined && typeof s.baz !== 'boolean') {
      throw new Error(`states.json: ${s.id}: baz is true or false`);
    }
    if (
      s.genislik !== undefined &&
      (!Number.isInteger(s.genislik) || s.genislik < 280 || s.genislik > VIEWPORT_WIDTH)
    ) {
      throw new Error(`states.json: ${s.id}: genislik is a whole number of dp, 280 to 360`);
    }
    if (s.uygulamaKirp !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.uygulamaKirp)) {
      throw new Error(`states.json: ${s.id}: uygulamaKirp is a testID`);
    }
    if (s.prototip !== undefined) checkPrototype(s.id, s.prototip);
  }
  return { esik: c.esik, durumlar: c.durumlar };
}

function checkPrototype(id: string, p: PrototypeState): void {
  if (typeof p.kirp !== 'string' || p.kirp === '') {
    throw new Error(`states.json: ${id}: prototip.kirp is the CSS selector photographed`);
  }
  if (!Array.isArray(p.adimlar)) throw new Error(`states.json: ${id}: prototip.adimlar is a list`);
  for (const step of p.adimlar as unknown[]) {
    const ok =
      typeof step === 'object' &&
      step !== null &&
      Object.keys(step).length === 1 &&
      (('tikla' in step && typeof step.tikla === 'string' && step.tikla !== '') ||
        ('bekle' in step &&
          typeof step.bekle === 'number' &&
          Number.isInteger(step.bekle) &&
          step.bekle >= 0));
    if (!ok) {
      throw new Error(
        `states.json: ${id}: a step is { "tikla": "<selector>" } or { "bekle": <ms> }`,
      );
    }
  }
  if (
    p.genislik !== undefined &&
    (!Number.isInteger(p.genislik) || p.genislik < 280 || p.genislik > 800)
  ) {
    throw new Error(`states.json: ${id}: prototip.genislik is a whole number of px, 280 to 800`);
  }
  if (
    p.sorgu !== undefined &&
    !/^[a-z0-9-]+=[a-z0-9{}-]+(&[a-z0-9-]+=[a-z0-9{}-]+)*$/.test(p.sorgu)
  ) {
    throw new Error(`states.json: ${id}: prototip.sorgu is key=value pairs joined by "&"`);
  }
  if (
    p.dosya !== undefined &&
    (!/^docs\/design\/[\w./-]+\.html$/.test(p.dosya) || p.dosya.split('/').includes('..'))
  ) {
    throw new Error(`states.json: ${id}: prototip.dosya is an .html file under docs/design/`);
  }
}

export function loadStates(root: string): GateConfig {
  return parseStates(JSON.parse(readFileSync(join(root, STATES_FILE), 'utf8')));
}

export function shots(config: GateConfig): Shot[] {
  return config.durumlar.flatMap((state) => {
    const pages = state.sayfa ?? 1;
    return THEMES.flatMap((theme) =>
      Array.from({ length: pages }, (_, i) => ({
        state,
        theme,
        page: i + 1,
        pages,
        name: `${state.id}-${theme}-${i + 1}`,
        baseline: state.baz !== false,
      })),
    );
  });
}

export function baselinePath(root: string, shot: Shot): string {
  return join(root, BASELINE_DIR, `${shot.name}.png`);
}

export function hasBaseline(root: string, shot: Shot): boolean {
  return existsSync(baselinePath(root, shot));
}
