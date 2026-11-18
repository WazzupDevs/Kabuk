// The visual gate's list (e2e/visual/states.json; CLAUDE.md → Görsel kapı): which app states it
// photographs, page by page, in both schemes, and which of them it also sets beside a design
// prototype. One line per state: a new screen or game phase is one more line, once the app
// opens it in its hidden route (apps/mobile/src/features/design/gorsel/registry.tsx).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// How the prototype reaches the same state (scripts/visual/prototype.ts opens it as
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
  // The prototype file, from the repo root.
  dosya: string;
  // More of the address, after `?gorsel=…&tema=…`, `{tema}` standing for the scheme.
  sorgu?: string;
  // The prototype's page this wide (CSS px), for an element that its own page lays out at another
  // width.
  genislik?: number;
};

// What the app's route is made to do after it has opened the state, before the photo
// (flow.ts turns them into Maestro commands): a real button pressed or held (its testID), or time let run
// (ms) for what the press opened to settle.
// `kaydir` drags the screen's content up by about that many dp (a slow drag from three quarters down
// the screen: no fling), for a board that draws the screen scrolled.
export type AppStep =
  { bas: string } | { uzunBas: string } | { bekle: number } | { kaydir: number };

// The board of the new canvas the state is drawn after (docs/design/yeni-arayuz/ESLEME.md): its
// file's stem (`project/<dosya>.dc.html`), whose images are on the `pano-goruntuleri` branch as
// `<dosya>-acik.webp` and `<dosya>-koyu.webp`. Set beside the app's photo (gate-report.ts →
// yanyana/), and the board's rows in e2e/visual/kapsam.json name this state (pnpm visual:kapsam).
export type BoardLink = { dosya: string };

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
  // The board it is drawn after: set beside it, with the diff, in yanyana/.
  pano?: BoardLink;
  // Pressed and waited for after the state has opened, before the photo.
  uygulamaAdimlar?: AppStep[];
  // false: photographed and set beside the prototype, never compared with a baseline (a trial
  // entry).
  baz?: boolean;
  // Drawn this wide (dp) on the 390 emulator, and the prototype at this width (the small-screen
  // check is at 320).
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

// The gate emulator's screen in dp, the boards' phone (390 × 844; scripts/visual/run-on-emulator.sh,
// e2e.yml → visual's skin; prototype.ts → VIEWPORT), at SCALE px per dp.
export const VIEWPORT_WIDTH = 390;
export const VIEWPORT_HEIGHT = 844;
export const SCALE = 2;
// The width (px) of a photo of the whole frame: a baseline of another width was taken on an
// earlier emulator and is accepted again (flow.ts leaves its comparison out, the report says so).
export const FRAME_WIDTH_PX = VIEWPORT_WIDTH * SCALE;

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
  const boards = new Map<string, string>();
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
      throw new Error(
        `states.json: ${s.id}: genislik is a whole number of dp, 280 to ${VIEWPORT_WIDTH}`,
      );
    }
    if (s.uygulamaKirp !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.uygulamaKirp)) {
      throw new Error(`states.json: ${s.id}: uygulamaKirp is a testID`);
    }
    if (s.prototip !== undefined) checkPrototype(s.id, s.prototip);
    if (s.pano !== undefined) {
      const keys = typeof s.pano === 'object' && s.pano !== null ? Object.keys(s.pano) : [];
      if (
        keys.length !== 1 ||
        keys[0] !== 'dosya' ||
        typeof s.pano.dosya !== 'string' ||
        !/^[A-Z][A-Za-z0-9]*$/.test(s.pano.dosya)
      ) {
        throw new Error(
          `states.json: ${s.id}: pano is { "dosya": "<Board>" }, the board file's stem (project/<Board>.dc.html)`,
        );
      }
      const other = boards.get(s.pano.dosya);
      if (other) throw new Error(`states.json: ${s.id}: pano ${s.pano.dosya} is ${other}'s too`);
      boards.set(s.pano.dosya, s.id);
    }
    if (s.uygulamaAdimlar !== undefined) checkAppSteps(s.id, s.uygulamaAdimlar);
  }
  return { esik: c.esik, durumlar: c.durumlar };
}

const TEST_ID = /^[\p{L}\p{N}]+(-[\p{L}\p{N}]+)*$/u;

// One drag starts three quarters down the screen and ends no higher than a tenth from its top.
export const DRAG_FROM = 0.75;
export const MAX_DRAG_DP = Math.floor(VIEWPORT_HEIGHT * (DRAG_FROM - 0.1));

function checkAppSteps(id: string, steps: unknown): void {
  if (!Array.isArray(steps)) throw new Error(`states.json: ${id}: uygulamaAdimlar is a list`);
  for (const step of steps as unknown[]) {
    const ok =
      typeof step === 'object' &&
      step !== null &&
      Object.keys(step).length === 1 &&
      (('bas' in step && typeof step.bas === 'string' && TEST_ID.test(step.bas)) ||
        ('uzunBas' in step && typeof step.uzunBas === 'string' && TEST_ID.test(step.uzunBas)) ||
        ('bekle' in step &&
          typeof step.bekle === 'number' &&
          Number.isInteger(step.bekle) &&
          step.bekle > 0 &&
          step.bekle <= 10000) ||
        ('kaydir' in step &&
          typeof step.kaydir === 'number' &&
          Number.isInteger(step.kaydir) &&
          step.kaydir > 0 &&
          step.kaydir <= MAX_DRAG_DP));
    if (!ok) {
      throw new Error(
        `states.json: ${id}: an app step is { "bas": "<testID>" }, { "uzunBas": "<testID>" }, { "bekle": <ms, 1 to 10000> } or { "kaydir": <dp, 1 to ${MAX_DRAG_DP}> }`,
      );
    }
  }
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
    typeof p.dosya !== 'string' ||
    !/^docs\/design\/[\w./-]+\.html$/.test(p.dosya) ||
    p.dosya.split('/').includes('..')
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

// A PNG's width from its header (IHDR: bytes 16–19), without decoding it.
export function pngWidth(file: string): number {
  const head = readFileSync(file).subarray(0, 24);
  if (head.toString('latin1', 12, 16) !== 'IHDR') throw new Error(`${file}: not a PNG`);
  return head.readUInt32BE(16);
}

// A baseline of the whole frame taken at another width than the emulator's (an earlier emulator):
// never compared, accepted again (pnpm visual:accept). A state cropped to its own element
// (`uygulamaKirp`) has its own width and is never stale by it.
export function staleBaseline(root: string, shot: Shot): boolean {
  if (shot.state.uygulamaKirp || !hasBaseline(root, shot)) return false;
  return pngWidth(baselinePath(root, shot)) !== FRAME_WIDTH_PX;
}

// The board images' branch and their names on it, by theme.
export const BOARD_BRANCH = 'pano-goruntuleri';
const BOARD_THEME: Record<Theme, 'acik' | 'koyu'> = { light: 'acik', dark: 'koyu' };
export function boardImage(board: BoardLink, theme: Theme): string {
  return `${board.dosya}-${BOARD_THEME[theme]}.webp`;
}
