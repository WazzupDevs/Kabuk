import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { seededRandom } from '../../apps/mobile/src/features/design/gorsel/deterministic.ts';
import { junitCases, maestroMatch, padTo, similarity, thresholdFor } from './compare.ts';
import { flowFiles, flowFor, shotLink } from './flow.ts';
import { buildReport, pageHints } from './gate-report.ts';
import { appFonts, fontFaces, pageScript, SCALE, VIEWPORT, withRoboto } from './prototype.ts';
import { type GateConfig, loadStates, parseStates, shots, themesFrom } from './states.ts';

const ROOT = join(import.meta.dirname, '..', '..');

// A w × h image of one colour.
function png(width: number, height: number, rgb: [number, number, number] = [255, 255, 255]): PNG {
  const p = new PNG({ width, height });
  for (let i = 0; i < p.data.length; i += 4) {
    p.data[i] = rgb[0];
    p.data[i + 1] = rgb[1];
    p.data[i + 2] = rgb[2];
    p.data[i + 3] = 255;
  }
  return p;
}
function setPixel(p: PNG, x: number, y: number, rgb: [number, number, number]): void {
  const i = (p.width * y + x) * 4;
  p.data[i] = rgb[0];
  p.data[i + 1] = rgb[1];
  p.data[i + 2] = rgb[2];
}
const write = (file: string, p: PNG) => writeFileSync(file, PNG.sync.write(p));

describe('visual gate: the states list', () => {
  it("reads the repo's e2e/visual/states.json", () => {
    const config = loadStates(ROOT);
    expect(config.durumlar.length).toBeGreaterThan(0);
    expect(config.esik).toBeGreaterThanOrEqual(90);
  });

  it('is one entry per state: id, app state, pages, prototype steps', () => {
    const config = parseStates({
      esik: 99.5,
      durumlar: [
        { id: 'galeri-oyun', app: 'galeri/games', sayfa: 2 },
        {
          id: 'oyun-x-anlat',
          app: 'oyun/x/anlat',
          baz: false,
          prototip: { adimlar: [{ tikla: '[data-x]' }, { bekle: 300 }], kirp: '.tg' },
        },
      ],
    });
    expect(shots(config).map((s) => [s.name, s.page, s.pages, s.baseline])).toEqual([
      ['galeri-oyun-light-1', 1, 2, true],
      ['galeri-oyun-light-2', 2, 2, true],
      ['galeri-oyun-dark-1', 1, 2, true],
      ['galeri-oyun-dark-2', 2, 2, true],
      ['oyun-x-anlat-light-1', 1, 1, false],
      ['oyun-x-anlat-dark-1', 1, 1, false],
    ]);
  });

  it('photographs one scheme per job (TEMA), both without it', () => {
    expect(themesFrom(undefined)).toEqual(['light', 'dark']);
    expect(themesFrom('')).toEqual(['light', 'dark']);
    expect(themesFrom('dark')).toEqual(['dark']);
    expect(() => themesFrom('blue')).toThrow(/light or dark/);
    const config = parseStates({
      esik: 99.5,
      durumlar: [{ id: 'galeri-oyun', app: 'galeri/games', sayfa: 2 }],
    });
    expect(shots(config, ['dark']).map((s) => s.name)).toEqual([
      'galeri-oyun-dark-1',
      'galeri-oyun-dark-2',
    ]);
  });

  it.each([
    ['a threshold out of range', { esik: 80, durumlar: [] }],
    [
      'an id twice',
      {
        esik: 99,
        durumlar: [
          { id: 'a', app: 'galeri/a' },
          { id: 'a', app: 'galeri/b' },
        ],
      },
    ],
    ['an id with capitals', { esik: 99, durumlar: [{ id: 'Galeri', app: 'galeri/a' }] }],
    ['an app state of another kind', { esik: 99, durumlar: [{ id: 'a', app: 'sahne/a' }] }],
    ['a page count of 0', { esik: 99, durumlar: [{ id: 'a', app: 'galeri/a', sayfa: 0 }] }],
    ['baz not true or false', { esik: 99, durumlar: [{ id: 'a', app: 'galeri/a', baz: 'no' }] }],
    [
      'a prototype step of two kinds',
      {
        esik: 99,
        durumlar: [
          {
            id: 'a',
            app: 'galeri/a',
            prototip: { adimlar: [{ tikla: 'x', bekle: 1 }], kirp: 'x' },
          },
        ],
      },
    ],
    [
      'a prototype without its crop',
      { esik: 99, durumlar: [{ id: 'a', app: 'galeri/a', prototip: { adimlar: [] } }] },
    ],
    [
      'a prototype file outside docs/design',
      {
        esik: 99,
        durumlar: [
          {
            id: 'a',
            app: 'galeri/a',
            prototip: { adimlar: [], kirp: 'x', dosya: 'docs/design/../../x.html' },
          },
        ],
      },
    ],
  ])('rejects %s', (_, raw) => {
    expect(() => parseStates(raw)).toThrow(/states\.json/);
  });
});

describe('visual gate: the Maestro flows', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'gorsel-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const config: GateConfig = {
    esik: 99.5,
    durumlar: [
      { id: 'galeri-oyun', app: 'galeri/games', sayfa: 2 },
      { id: 'oyun-x', app: 'oyun/x/anlat', baz: false },
    ],
  };

  it('opens the route on the page (0-based in the link) with the shot number', () => {
    const second = shots(config)[1];
    expect(second && shotLink(second, 7)).toBe(
      'masa:///gorsel?durum=galeri/games&tema=light&sayfa=1&sayfalar=2&n=7',
    );
  });

  it('numbers one flow per shot of the scheme; TEKRAR photographs twice only where a baseline is expected', () => {
    const flows = flowFiles(root, config, ['dark'], true);
    expect(flows.map((f) => f.file)).toEqual([
      '001-galeri-oyun-dark-1.yaml',
      '002-galeri-oyun-dark-2.yaml',
      '003-oyun-x-dark-1.yaml',
    ]);
    expect(flows.map((f) => f.text.includes('aday2__'))).toEqual([true, true, false]);
    expect(flowFiles(root, config, ['dark'], false).some((f) => f.text.includes('aday2__'))).toBe(
      false,
    );
  });

  it('photographs the frame once the state has settled; no comparison without a baseline', () => {
    const [shot] = shots(config);
    const flow = flowFor(root, shot ?? fail(), 3, 99.5, false);
    expect(flow).toContain('name: galeri-oyun-light-1');
    // Warm first; the app is started afresh only when the state has not settled in 20 s.
    expect(flow.split('\n')[3]).toMatch(/^- openLink: /);
    expect(flow).toMatch(
      /timeout: 20000\n {4}optional: true\n- runFlow:\n {4}when:\n {6}notVisible:\n {8}id: gorsel-hazir-3\n {4}commands:\n {6}- stopApp\n {6}- openLink: /,
    );
    expect(flow).toContain('id: gorsel-hazir-3');
    expect(flow).toContain('id: gorsel-yok');
    expect(flow).toContain('id: gorsel-eksik-sayfa');
    expect(flow).toContain('path: aday__galeri-oyun-light-1');
    expect(flow).toContain('id: gorsel-cerceve');
    expect(flow).not.toContain('assertScreenshot');
  });

  it('presses Wait on a system "isn\'t responding" dialog before the photo', () => {
    const [shot] = shots(config);
    const flow = flowFor(root, shot ?? fail(), 3, 99.5, false);
    expect(flow.indexOf('id: android:id/aerr_wait')).toBeGreaterThan(-1);
    expect(flow.indexOf('id: android:id/aerr_wait')).toBeLessThan(
      flow.indexOf('- takeScreenshot:'),
    );
  });

  it("compares with the baseline, by its absolute path, at the list's threshold", () => {
    const [shot] = shots(config);
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    write(join(root, 'e2e/visual/baz/galeri-oyun-light-1.png'), png(2, 2));
    const flow = flowFor(root, shot ?? fail(), 3, 99.5, false);
    expect(flow).toContain(
      `- assertScreenshot:\n    path: ${join(root, 'e2e/visual/baz/galeri-oyun-light-1.png')}`,
    );
    expect(flow).toContain('thresholdPercentage: 99.5');
  });

  it('photographs a second time on a fresh mount for the noise (TEKRAR)', () => {
    const [shot] = shots(config);
    const flow = flowFor(root, shot ?? fail(), 3, 99.5, true);
    expect(flow.match(/^- openLink: /gm)).toHaveLength(2);
    expect(flow).toContain('id: gorsel-hazir-100003');
    expect(flow).toContain('path: aday2__galeri-oyun-light-1');
  });

  it('never compares a trial entry (baz: false), even with a file in baz/', () => {
    const trial = shots(config).find((s) => s.state.id === 'oyun-x');
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    write(join(root, 'e2e/visual/baz/oyun-x-light-1.png'), png(2, 2));
    expect(flowFor(root, trial ?? fail(), 1, 99.5, false)).not.toContain('assertScreenshot');
  });
});

describe("visual gate: Maestro's measure", () => {
  it('is 100 for the same image', () => {
    expect(maestroMatch(png(4, 4), png(4, 4))).toBe(100);
  });

  // Maestro 2.10.0 (ScreenshotMatch): a pixel differs when its squared RGB distance is over
  // (0.1 × √(3 × 255²))² = 1950.75.
  it('counts a pixel only beyond a tenth of the largest colour distance', () => {
    const base = png(10, 10, [100, 100, 100]);
    const near = png(10, 10, [100, 100, 100]);
    setPixel(near, 0, 0, [125, 125, 125]); // 3 × 25² = 1875
    expect(maestroMatch(base, near)).toBe(100);
    const far = png(10, 10, [100, 100, 100]);
    setPixel(far, 0, 0, [126, 126, 126]); // 3 × 26² = 2028
    expect(maestroMatch(base, far)).toBe(99);
  });

  it('needs the same size, as assertScreenshot does', () => {
    expect(() => maestroMatch(png(2, 2), png(2, 3))).toThrow(/different sizes/);
  });

  it('sets the threshold as far below the worst noise again as the noise, at most 99.9', () => {
    expect(thresholdFor(100)).toBe(99.9);
    expect(thresholdFor(99.8)).toBe(99.5);
    expect(thresholdFor(99)).toBe(97.9);
  });
});

describe('visual gate: the comparison with the prototype', () => {
  it('counts a size difference as difference', () => {
    const a = png(2, 2);
    const padded = padTo(a, 2, 4);
    expect([padded.width, padded.height]).toEqual([2, 4]);
    const r = similarity(a, png(2, 4));
    expect(r.sameSize).toBe(false);
    expect(r.percent).toBe(50);
  });

  it('is 100 for the same image', () => {
    expect(similarity(png(3, 3, [20, 17, 43]), png(3, 3, [20, 17, 43])).percent).toBe(100);
  });
});

describe("visual gate: Maestro's JUnit report", () => {
  // As Maestro 2.10.0 writes it (maestro-cli JUnitTestSuiteReporter; a passing case as in CI).
  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" device="test" tests="2" failures="1" time="20.1" timestamp="2026-10-20T05:00:00">
    <testcase id="galeri-oyun-light-1" name="galeri-oyun-light-1" classname="galeri-oyun-light-1" file="/w/akis/001-galeri-oyun-light-1.yaml" time="9.5" timestamp="2026-10-20T05:00:00" status="SUCCESS"/>
    <testcase id="galeri-oyun-dark-1" name="galeri-oyun-dark-1" classname="galeri-oyun-dark-1" file="/w/akis/002-galeri-oyun-dark-1.yaml" time="10.6" timestamp="2026-10-20T05:00:10" status="ERROR">
      <failure>Comparison error: Assert screenshot - threshold not met, current: 97.31%</failure>
    </testcase>
  </testsuite>
</testsuites>`;

  it('names each flow and its failure', () => {
    expect(junitCases(xml)).toEqual([
      { name: 'galeri-oyun-light-1', ok: true, message: '' },
      {
        name: 'galeri-oyun-dark-1',
        ok: false,
        message: 'Comparison error: Assert screenshot - threshold not met, current: 97.31%',
      },
    ]);
  });

  it("reads CI's real report of a passing shard", () => {
    const real = readFileSync(join(import.meta.dirname, 'fixtures/report-pass.xml'), 'utf8');
    expect(junitCases(real)).toEqual([{ name: 'P0 kritik yol, parça 1', ok: true, message: '' }]);
  });
});

describe('visual gate: the report', () => {
  let root: string;
  let out: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'gorsel-'));
    out = join(root, 'out');
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    mkdirSync(join(out, 'aday'), { recursive: true });
    writeFileSync(
      join(root, 'e2e/visual/states.json'),
      JSON.stringify({
        esik: 99.5,
        durumlar: [
          { id: 'galeri-oyun', app: 'galeri/games' },
          { id: 'oyun-x', app: 'oyun/x/anlat', baz: false, prototip: { adimlar: [], kirp: '.tg' } },
        ],
      }),
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const passing = (names: string[]) =>
    `<testsuites><testsuite>${names.map((n) => `<testcase name="${n}" status="SUCCESS"/>`).join('')}</testsuite></testsuites>`;
  const all = ['galeri-oyun-light-1', 'galeri-oyun-dark-1', 'oyun-x-light-1', 'oyun-x-dark-1'];
  const photographAll = () => {
    for (const n of all) write(join(out, 'aday', `${n}.png`), png(4, 4));
  };
  const baselines = () => {
    for (const n of ['galeri-oyun-light-1', 'galeri-oyun-dark-1']) {
      write(join(root, 'e2e/visual/baz', `${n}.png`), png(4, 4));
    }
  };

  it('passes with every shot photographed, every baseline there and every flow passed', () => {
    photographAll();
    baselines();
    writeFileSync(join(out, 'report.xml'), passing(all));
    const { gate, text } = buildReport(root, out);
    expect(gate).toEqual({
      ok: true,
      failed: [],
      noCandidate: [],
      noBaseline: [],
      worstNoise: null,
    });
    expect(text).toContain('### Görsel kapı: geçti');
  });

  it('fails without the Maestro report: the flows did not run', () => {
    photographAll();
    baselines();
    const { gate, text } = buildReport(root, out);
    expect(gate.ok).toBe(false);
    expect(text).toContain('Maestro raporu yok');
  });

  it('fails on a failed flow, a missing photo or a missing baseline (not for a trial entry)', () => {
    photographAll();
    rmSync(join(out, 'aday', 'oyun-x-dark-1.png'));
    write(join(root, 'e2e/visual/baz', 'galeri-oyun-light-1.png'), png(4, 4));
    writeFileSync(
      join(out, 'report.xml'),
      '<testsuites><testsuite><testcase name="galeri-oyun-light-1" status="ERROR"><failure>Comparison error: x</failure></testcase></testsuite></testsuites>',
    );
    const { gate, text } = buildReport(root, out, { images: 'https://x/visual' });
    expect(gate).toEqual({
      ok: false,
      failed: ['galeri-oyun-light-1'],
      noCandidate: ['oyun-x-dark-1'],
      noBaseline: ['galeri-oyun-dark-1'],
      worstNoise: null,
    });
    expect(text).toContain('| galeri-oyun-light-1 | Comparison error: x |');
    expect(text).toContain('<img src="https://x/visual/aday/galeri-oyun-light-1.png"');
  });

  it('sets the app beside the prototype with a diff image (the soft report)', () => {
    photographAll();
    mkdirSync(join(out, 'prototip'), { recursive: true });
    const proto = png(4, 4);
    setPixel(proto, 0, 0, [0, 0, 0]);
    write(join(out, 'prototip', 'oyun-x-light.png'), proto);
    const { text } = buildReport(root, out);
    expect(text).toContain('| oyun-x | light | %93.8 | 4×4 / 4×4 |');
    expect(text).toContain('| oyun-x | dark | – | – |');
    expect(readFileSync(join(out, 'fark', 'oyun-x-light.png')).length).toBeGreaterThan(0);
  });

  it("lists the page counts the route asked for, from Maestro's screen hierarchies", () => {
    photographAll();
    baselines();
    const dir = join(out, 'maestro', '2026-10-20_052259', 'galeri-oyun-dark-1', 'screen-hierarchy');
    mkdirSync(dir, { recursive: true });
    // As in #184's first run: the banner's text in the failed step's hierarchy.
    writeFileSync(
      join(dir, 'step-005-assertCondition-gorsel-hazir-2.json'),
      JSON.stringify({
        attributes: {
          text: "Bu durum 5 sayfa, listede 1: e2e/visual/states.json'da sayfa sayısını 5 yap.",
        },
      }),
    );
    expect([...pageHints(out)]).toEqual([['galeri-oyun', { listed: 1, needed: 5 }]]);
    expect(buildReport(root, out).text).toContain('| galeri-oyun | 1 | 5 |');
  });

  it("reports one scheme's job: its shots and prototype pairs only", () => {
    for (const n of ['galeri-oyun-light-1', 'oyun-x-light-1']) {
      write(join(out, 'aday', `${n}.png`), png(4, 4));
    }
    write(join(root, 'e2e/visual/baz', 'galeri-oyun-light-1.png'), png(4, 4));
    writeFileSync(join(out, 'report.xml'), passing(['galeri-oyun-light-1', 'oyun-x-light-1']));
    const { gate, text } = buildReport(root, out, {}, ['light']);
    expect(gate.ok).toBe(true);
    expect(text).toContain('2 görüntü (2 durum, tema light, sayfalar)');
    expect(text).toContain('| oyun-x | light |');
    expect(text).not.toContain('| oyun-x | dark |');
  });

  it('lists the baz: false shots without a v46 counterpart in the report only', () => {
    writeFileSync(
      join(root, 'e2e/visual/states.json'),
      JSON.stringify({
        esik: 99.5,
        durumlar: [
          { id: 'galeri-sahtekar', app: 'galeri/sahtekar', baz: false },
          { id: 'oyun-x', app: 'oyun/x/anlat', baz: false, prototip: { adimlar: [], kirp: '.tg' } },
        ],
      }),
    );
    write(join(out, 'aday', 'galeri-sahtekar-light-1.png'), png(4, 4));
    const { gate, text } = buildReport(root, out, { images: 'https://x/visual-light' }, ['light']);
    expect(gate.noBaseline).toEqual([]);
    expect(text).toContain('### Yalnızca rapor (`baz: false`, v46 karşılığı yok)');
    expect(text).toContain(
      '| galeri-sahtekar-light-1 | <a href="https://x/visual-light/aday/galeri-sahtekar-light-1.png">',
    );
    // The state with a prototype is in the similarity table, not here.
    expect(text).not.toContain('| oyun-x-light-1 |');
  });

  it("measures the noise of two photos of the same state in Maestro's measure", () => {
    photographAll();
    mkdirSync(join(out, 'aday2'), { recursive: true });
    for (const n of all) write(join(out, 'aday2', `${n}.png`), png(4, 4));
    const moved = png(4, 4);
    setPixel(moved, 1, 1, [0, 0, 0]);
    write(join(out, 'aday2', 'galeri-oyun-dark-1.png'), moved);
    const { gate, text } = buildReport(root, out);
    expect(gate.worstNoise).toBe(93.75);
    expect(text).toContain('| galeri-oyun-dark-1 | %93.750 |');
    expect(text).toContain(`önerilen eşik %${thresholdFor(93.75)}`);
  });
});

describe("visual gate: the prototype in the app's fonts", () => {
  it('takes the files apps/mobile/src/theme/fonts.ts imports, and only those', () => {
    const fonts = appFonts(ROOT);
    expect(fonts.map((f) => [f.family, f.weight, f.name])).toEqual([
      ['Plus Jakarta Sans', 500, 'PlusJakartaSans_500Medium'],
      ['Plus Jakarta Sans', 600, 'PlusJakartaSans_600SemiBold'],
      ['Plus Jakarta Sans', 700, 'PlusJakartaSans_700Bold'],
      ['Plus Jakarta Sans', 800, 'PlusJakartaSans_800ExtraBold'],
      ['Roboto', 700, 'Roboto_700Bold'],
    ]);
    for (const f of fonts) {
      expect(existsSync(f.file)).toBe(true);
      expect(f.file.endsWith(`${f.name}.ttf`)).toBe(true);
    }
    // Roboto is the app's own file, not a package.
    expect(fonts.find((f) => f.family === 'Roboto')?.file).toBe(
      join(ROOT, 'apps/mobile/assets/fonts/Roboto_700Bold.ttf'),
    );
  });

  it('keeps a licence next to every font file of the app (OFL for Roboto)', () => {
    const dir = join(ROOT, 'apps/mobile/assets/fonts');
    const licence = readFileSync(join(dir, 'Roboto-OFL.txt'), 'utf8');
    expect(licence).toMatch(/^Copyright 2011 The Roboto Project Authors/);
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1');
  });

  it("answers Google Fonts' stylesheet with one face per app file and no other family", () => {
    const css = fontFaces(appFonts(ROOT));
    expect(css.match(/@font-face/g)).toHaveLength(5);
    expect(css).toContain("font-family:'Roboto';font-style:normal;font-weight:700;");
    expect(css).not.toMatch(/Manrope|Poppins|font-weight:400/);
    expect(css).toContain("font-family:'Plus Jakarta Sans';font-style:normal;font-weight:800;");
  });
});

describe('visual gate: system-ui is Roboto, as in the app', () => {
  it('serves v46 with Roboto wherever it says system-ui, and changes nothing else', () => {
    const html = readFileSync(join(ROOT, 'docs/design/v46/skall-masa-deneme-v46.html'), 'utf8');
    const served = withRoboto(html);
    expect(html).toContain('font:700 14px/18px system-ui,sans-serif');
    expect(served).not.toContain('system-ui');
    expect(served).toContain('font:700 14px/18px Roboto,sans-serif');
    expect(served.replace(/Roboto/g, '')).toBe(html.replace(/system-ui|Roboto/g, ''));
  });

  it("gives the app's notice (v46's .toast) Roboto 700 at 14/18", async () => {
    const { baseTypography } = await import('../../apps/mobile/src/theme/tokens.ts');
    const { THEME } = await import('../../apps/mobile/src/theme/theme.ts');
    expect(baseTypography().notice).toEqual({ font: 'system', size: 14, lineHeight: 18 });
    expect(THEME.fonts.system).toBe('Roboto_700Bold');
  });
});

describe('visual gate: the prototype beside the emulator', () => {
  it("draws at the emulator's screen: the 720 × 1280 skin at density 320 (2×)", () => {
    const workflow = readFileSync(join(ROOT, '.github/workflows/e2e.yml'), 'utf8');
    const script = readFileSync(join(ROOT, 'scripts/visual/run-on-emulator.sh'), 'utf8');
    const visualJob = workflow.slice(workflow.indexOf('\n  visual:'));
    expect(visualJob).toContain(`-skin ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE}`);
    expect(script).toContain(`wm density ${160 * SCALE}`);
  });

  it("seeds Math.random as the app does (deterministic.ts's seededRandom)", () => {
    const realRandom = Math.random;
    const g = globalThis as { window?: unknown };
    const hadWindow = 'window' in g;
    g.window = { addEventListener: () => {} };
    try {
      pageScript({ seed: 46, states: {} });
      const page = Array.from({ length: 5 }, () => Math.random());
      const app = seededRandom(46);
      expect(page).toEqual(Array.from({ length: 5 }, () => app()));
    } finally {
      Math.random = realRandom;
      if (!hadWindow) delete g.window;
    }
  });
});

function fail(): never {
  throw new Error('missing');
}
