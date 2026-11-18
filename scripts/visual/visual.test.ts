import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { seededRandom } from '../../apps/mobile/src/features/design/gorsel/deterministic.ts';
import {
  candidatesFromLog,
  junitCases,
  maestroMatch,
  padTo,
  similarity,
  thresholdFor,
  tryReadPng,
} from './compare.ts';
import {
  appSteps,
  cropId,
  flowFor,
  NEVER_THERE,
  PAGE_NEEDED_MAX,
  pageCheck,
  shotLink,
} from './flow.ts';
import { buildReport, pageHints } from './gate-report.ts';
import { appFonts, fontFaces, pageScript, SCALE, VIEWPORT, withRoboto } from './prototype.ts';
import { boardsWanted } from './render-pano.ts';
import { parseArgs, writeCandidates } from './yerel.ts';
import { GAP, LABEL_BAND, labelText, labelWidth, sideBySide } from './sideBySide.ts';
import {
  boardImage,
  FRAME_WIDTH_PX,
  type GateConfig,
  loadStates,
  parseStates,
  shots,
  staleBaseline,
} from './states.ts';

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
          prototip: {
            dosya: 'docs/design/x.html',
            adimlar: [{ tikla: '[data-x]' }, { bekle: 300 }],
            kirp: '.tg',
          },
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
            prototip: {
              dosya: 'docs/design/x.html',
              adimlar: [{ tikla: 'x', bekle: 1 }],
              kirp: 'x',
            },
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
    [
      'a width wider than the emulator',
      { esik: 99, durumlar: [{ id: 'a', app: 'galeri/a', genislik: 400 }] },
    ],
    [
      'an app crop that is not a testID',
      { esik: 99, durumlar: [{ id: 'a', app: 'galeri/a', uygulamaKirp: 'Gorsel Oge' }] },
    ],
    [
      'a prototype query that is not key=value pairs',
      {
        esik: 99,
        durumlar: [
          {
            id: 'a',
            app: 'galeri/a',
            prototip: {
              dosya: 'docs/design/x.html',
              adimlar: [],
              kirp: 'x',
              sorgu: 'page=galeri&x',
            },
          },
        ],
      },
    ],
    [
      'a prototype page width out of range',
      {
        esik: 99,
        durumlar: [
          {
            id: 'a',
            app: 'galeri/a',
            prototip: { dosya: 'docs/design/x.html', adimlar: [], kirp: 'x', genislik: 1200 },
          },
        ],
      },
    ],
  ])('rejects %s', (_, raw) => {
    expect(() => parseStates(raw)).toThrow(/states\.json/);
  });

  // A component beside the same component in a prototype: cropped to it on both sides, at 320.
  it('takes a component state: a narrower layout, the app cropped to it, the prototype query', () => {
    const config = parseStates({
      esik: 99.5,
      durumlar: [
        {
          id: 'x-320',
          app: 'galeri/x',
          genislik: 320,
          uygulamaKirp: 'gorsel-oge',
          baz: false,
          prototip: {
            dosya: 'docs/design/x.html',
            sorgu: 's=mekan&theme={tema}&demo=0',
            genislik: 480,
            adimlar: [{ bekle: 6000 }],
            kirp: '[data-x]',
          },
        },
      ],
    });
    const [shot] = shots(config);
    expect(shot && shotLink(shot, 3)).toBe(
      'masa:///gorsel?durum=galeri/x&tema=light&sayfa=0&sayfalar=1&genislik=320&n=3',
    );
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
    expect(flow).toContain(`${pageCheck().join('\n')}\n`);
    expect(flow).toContain('path: aday__galeri-oyun-light-1');
    expect(flow).toContain('id: gorsel-cerceve');
    expect(flow).not.toContain('assertScreenshot');
  });

  it("crops to the state's own element when it names one, the photo and the comparison alike", () => {
    const own: GateConfig = {
      esik: 99.5,
      durumlar: [{ id: 'x', app: 'galeri/x', uygulamaKirp: 'gorsel-oge' }],
    };
    const [shot] = shots(own);
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    write(join(root, 'e2e/visual/baz/x-light-1.png'), png(4, 4));
    const flow = flowFor(root, shot ?? fail(), 1, 99.5, false);
    expect(flow).not.toContain('gorsel-cerceve');
    expect(flow.match(/cropOn:\n {6}id: gorsel-oge/g)).toHaveLength(2);
  });

  it('checks the page count one n at a time, so a failure names the count', () => {
    const lines = pageCheck();
    expect(lines.slice(0, 4)).toEqual([
      '- assertNotVisible:',
      '    id: gorsel-sayfa-gereken-1',
      '- assertNotVisible:',
      '    id: gorsel-sayfa-gereken-2',
    ]);
    expect(lines).toContain(`    id: gorsel-sayfa-gereken-${PAGE_NEEDED_MAX}`);
    expect(lines.slice(-2)).toEqual(['- assertNotVisible:', '    id: gorsel-eksik-sayfa']);
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
    write(join(root, 'e2e/visual/baz/galeri-oyun-light-1.png'), png(FRAME_WIDTH_PX, 2));
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
          {
            id: 'oyun-x',
            app: 'oyun/x/anlat',
            baz: false,
            prototip: { dosya: 'docs/design/x.html', adimlar: [], kirp: '.tg' },
          },
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
      write(join(root, 'e2e/visual/baz', `${n}.png`), png(FRAME_WIDTH_PX, 2));
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
      unreadable: [],
      noBaseline: [],
      staleBaseline: [],
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
    write(join(root, 'e2e/visual/baz', 'galeri-oyun-light-1.png'), png(FRAME_WIDTH_PX, 2));
    writeFileSync(
      join(out, 'report.xml'),
      '<testsuites><testsuite><testcase name="galeri-oyun-light-1" status="ERROR"><failure>Comparison error: x</failure></testcase></testsuite></testsuites>',
    );
    const { gate, text } = buildReport(root, out, { images: 'https://x/visual' });
    expect(gate).toEqual({
      ok: false,
      failed: ['galeri-oyun-light-1'],
      noCandidate: ['oyun-x-dark-1'],
      unreadable: [],
      noBaseline: ['galeri-oyun-dark-1'],
      staleBaseline: [],
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

  it("names the page count from the failed flow's message (flow.ts → pageCheck)", () => {
    photographAll();
    baselines();
    writeFileSync(
      join(out, 'report.xml'),
      '<testsuites><testsuite><testcase name="galeri-oyun-dark-1" status="ERROR"><failure>Assertion is false: id: gorsel-sayfa-gereken-2 is not visible</failure></testcase></testsuite></testsuites>',
    );
    expect(buildReport(root, out).text).toContain('| galeri-oyun | 1 | 2 |');
  });

  it('survives an empty or broken candidate: names it, fails, writes the rest', () => {
    photographAll();
    baselines();
    writeFileSync(join(out, 'aday', 'galeri-oyun-dark-1.png'), '');
    writeFileSync(join(out, 'aday', 'oyun-x-light-1.png'), 'not a png');
    mkdirSync(join(out, 'aday2'), { recursive: true });
    write(join(out, 'aday2', 'galeri-oyun-dark-1.png'), png(4, 4));
    mkdirSync(join(out, 'prototip'), { recursive: true });
    write(join(out, 'prototip', 'oyun-x-light.png'), png(4, 4));
    write(join(out, 'prototip', 'oyun-x-dark.png'), png(4, 4));
    writeFileSync(join(out, 'report.xml'), passing(all));
    const { gate, text } = buildReport(root, out);
    expect(gate.ok).toBe(false);
    expect(gate.noCandidate).toEqual([]);
    expect(gate.unreadable).toEqual(['galeri-oyun-dark-1', 'oyun-x-light-1']);
    expect(text).toContain('Aday okunamadı');
    expect(text).toContain('`galeri-oyun-dark-1` (0 bayt)');
    expect(text).toContain('| oyun-x | light | – | – | okunamadı |');
    expect(text).toContain('| oyun-x | dark | %100.0 |');
    expect(text).toContain('| galeri-oyun-dark-1 | okunamadı |');
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
  it('serves a prototype with Roboto wherever it says system-ui, and changes nothing else', () => {
    const html =
      '<style>.toast{font:700 14px/18px system-ui,sans-serif}.b{font-family:Roboto}</style>';
    const served = withRoboto(html);
    expect(html).toContain('font:700 14px/18px system-ui,sans-serif');
    expect(served).not.toContain('system-ui');
    expect(served).toContain('font:700 14px/18px Roboto,sans-serif');
    expect(served.replace(/Roboto/g, '')).toBe(html.replace(/system-ui|Roboto/g, ''));
  });

  it("gives the app's notice Roboto 700 at 14/18", async () => {
    const { baseTypography } = await import('../../apps/mobile/src/theme/tokens.ts');
    const { THEME } = await import('../../apps/mobile/src/theme/theme.ts');
    expect(baseTypography().notice).toEqual({ font: 'system', size: 14, lineHeight: 18 });
    expect(THEME.fonts.system).toBe('Roboto_700Bold');
  });
});

describe('visual gate: the prototype beside the emulator', () => {
  it("draws at the emulator's screen, the boards' phone: the 780 × 1688 skin at density 320 (2×)", () => {
    expect(VIEWPORT).toEqual({ width: 390, height: 844 });
    expect(SCALE).toBe(2);
    expect(FRAME_WIDTH_PX).toBe(780);
    const workflow = readFileSync(join(ROOT, '.github/workflows/e2e.yml'), 'utf8');
    const script = readFileSync(join(ROOT, 'scripts/visual/run-on-emulator.sh'), 'utf8');
    const visualJob = workflow.slice(workflow.indexOf('\n  visual:'));
    expect(visualJob).toContain(`-skin ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE}`);
    expect(script).toContain(`wm size ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE}`);
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

describe('visual gate: the board and the app steps in the states list', () => {
  it('takes a board link and app steps, and names the board image by theme', () => {
    const config = parseStates({
      esik: 99.5,
      durumlar: [
        {
          id: 'ekran-x',
          app: 'ekran/x',
          baz: false,
          pano: { dosya: 'SemtSecenek' },
          uygulamaAdimlar: [{ bas: 'district-chat-options' }, { bekle: 1500 }],
        },
      ],
    });
    const [state] = config.durumlar;
    expect(state?.uygulamaAdimlar).toEqual([{ bas: 'district-chat-options' }, { bekle: 1500 }]);
    expect(state?.pano && boardImage(state.pano, 'light')).toBe('SemtSecenek-acik.webp');
    expect(state?.pano && boardImage(state.pano, 'dark')).toBe('SemtSecenek-koyu.webp');
    expect(boardsWanted(config)).toEqual([
      { id: 'ekran-x', theme: 'light', image: 'SemtSecenek-acik.webp' },
      { id: 'ekran-x', theme: 'dark', image: 'SemtSecenek-koyu.webp' },
    ]);
  });

  it.each([
    ['a board that is a path', { pano: { dosya: 'project/SemtSecenek.dc.html' } }],
    ['a board with more fields', { pano: { dosya: 'SemtSecenek', tema: 'acik' } }],
    ['a board without its file', { pano: {} }],
    ['app steps that are no list', { uygulamaAdimlar: { bas: 'x' } }],
    ['an app step of two kinds', { uygulamaAdimlar: [{ bas: 'x', bekle: 1 }] }],
    ['an app step pressing no testID', { uygulamaAdimlar: [{ bas: 'Seçenekler' }] }],
    ['a wait of 0', { uygulamaAdimlar: [{ bekle: 0 }] }],
    ['a wait over 10 s', { uygulamaAdimlar: [{ bekle: 10001 }] }],
    ['a step of another kind', { uygulamaAdimlar: [{ tikla: 'x' }] }],
  ])('rejects %s', (_, extra) => {
    expect(() =>
      parseStates({ esik: 99, durumlar: [{ id: 'a', app: 'ekran/a', ...extra }] }),
    ).toThrow(/states\.json/);
  });

  it('rejects one board for two states', () => {
    expect(() =>
      parseStates({
        esik: 99,
        durumlar: [
          { id: 'a', app: 'ekran/a', pano: { dosya: 'X' } },
          { id: 'b', app: 'ekran/b', pano: { dosya: 'X' } },
        ],
      }),
    ).toThrow(/pano X is a's too/);
  });

  it("opens the semt options as a person does: the real ⋮ pressed, beside the board's menu", () => {
    const state = loadStates(ROOT).durumlar.find((s) => s.id === 'ekran-semt-secenekler');
    expect(state?.pano).toEqual({ dosya: 'SemtSecenek' });
    expect(state?.uygulamaAdimlar?.[0]).toEqual({ bas: 'district-chat-options' });
    // The fixture draws the menu closed: nothing opens it but the press.
    const fixture = readFileSync(
      join(ROOT, 'apps/mobile/src/features/design/gorsel/semtFixture.tsx'),
      'utf8',
    );
    expect(fixture).toContain('testID="district-chat-options"');
    expect(fixture).not.toContain('openAt');
  });
});

describe('visual gate: the app steps in the flow', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'gorsel-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const config: GateConfig = {
    esik: 99.5,
    durumlar: [
      {
        id: 'ekran-x',
        app: 'ekran/x',
        uygulamaAdimlar: [{ bas: 'district-chat-options' }, { bekle: 1500 }],
      },
    ],
  };

  it('taps by testID and waits for a testID no screen has, its timeout long', () => {
    expect(appSteps([{ bas: 'district-chat-options' }, { bekle: 1500 }])).toEqual([
      '- tapOn:',
      '    id: district-chat-options',
      '- extendedWaitUntil:',
      '    visible:',
      `      id: ${NEVER_THERE}`,
      '    timeout: 1500',
      '    optional: true',
    ]);
  });

  it('does them after the state has settled, before the photo and the comparison', () => {
    const [shot] = shots(config);
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    write(join(root, 'e2e/visual/baz/ekran-x-light-1.png'), png(FRAME_WIDTH_PX, 2));
    const flow = flowFor(root, shot ?? fail(), 4, 99.5, false);
    const tap = flow.indexOf('- tapOn:\n    id: district-chat-options');
    expect(tap).toBeGreaterThan(flow.lastIndexOf('id: gorsel-eksik-sayfa'));
    expect(flow.indexOf('timeout: 1500')).toBeGreaterThan(tap);
    expect(flow.indexOf('- takeScreenshot:')).toBeGreaterThan(flow.indexOf('timeout: 1500'));
    expect(flow.indexOf('- assertScreenshot:')).toBeGreaterThan(flow.indexOf('- takeScreenshot:'));
  });

  it('photographs the whole screen after them: what they open can be its own window', () => {
    const [shot] = shots(config);
    mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
    write(join(root, 'e2e/visual/baz/ekran-x-light-1.png'), png(FRAME_WIDTH_PX, 2));
    expect(cropId(shot ?? fail())).toBeNull();
    const flow = flowFor(root, shot ?? fail(), 4, 99.5, false);
    expect(flow).not.toContain('cropOn');
    expect(flow).toContain('- takeScreenshot:\n    path: aday__ekran-x-light-1\n');
    // Its own element, if it names one, still wins.
    const own = shots({
      esik: 99.5,
      durumlar: [{ ...config.durumlar[0], id: 'ekran-y', uygulamaKirp: 'gorsel-oge' }],
    } as GateConfig)[0];
    expect(cropId(own ?? fail())).toBe('gorsel-oge');
    // The repo's menu state, the one #739's first run lost.
    const menu = shots(loadStates(ROOT)).find((s) => s.state.id === 'ekran-semt-secenekler');
    expect(menu && cropId(menu)).toBeNull();
    const dialog = shots(loadStates(ROOT)).find((s) => s.state.id === 'ekran-semt-oturum-kapat');
    expect(dialog && cropId(dialog)).toBe('gorsel-cerceve');
  });

  it('does them again for the second photo (TEKRAR), after its own open', () => {
    const [shot] = shots(config);
    const flow = flowFor(root, shot ?? fail(), 4, 99.5, true);
    expect(flow.match(/- tapOn:\n {4}id: district-chat-options/g)).toHaveLength(2);
    const second = flow.indexOf('id: gorsel-hazir-100004');
    expect(flow.indexOf('- tapOn:', second)).toBeGreaterThan(second);
  });

  it('a state without steps presses nothing', () => {
    const [shot] = shots({ esik: 99, durumlar: [{ id: 'a', app: 'galeri/a' }] });
    // Only the system dialog's Wait, nested in its runFlow.
    expect(flowFor(root, shot ?? fail(), 1, 99, false)).not.toMatch(/^- tapOn:/m);
  });
});

describe("visual gate: a baseline of an earlier emulator's size", () => {
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
          { id: 'galeri-a', app: 'galeri/a' },
          { id: 'galeri-b', app: 'galeri/b', uygulamaKirp: 'gorsel-oge' },
        ],
      }),
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('is never compared, and the gate fails naming it until it is accepted again', () => {
    // The 360 dp emulator's frame: 720 px wide.
    write(join(root, 'e2e/visual/baz/galeri-a-light-1.png'), png(720, 2));
    write(join(root, 'e2e/visual/baz/galeri-a-dark-1.png'), png(FRAME_WIDTH_PX, 2));
    // Cropped to its own element: its width is its own.
    write(join(root, 'e2e/visual/baz/galeri-b-light-1.png'), png(300, 2));
    write(join(root, 'e2e/visual/baz/galeri-b-dark-1.png'), png(300, 2));
    const config = loadStates(root);
    const [light, dark, bLight] = shots(config);
    expect(staleBaseline(root, light ?? fail())).toBe(true);
    expect(staleBaseline(root, dark ?? fail())).toBe(false);
    expect(staleBaseline(root, bLight ?? fail())).toBe(false);
    expect(flowFor(root, light ?? fail(), 1, 99.5, false)).not.toContain('assertScreenshot');
    expect(flowFor(root, dark ?? fail(), 2, 99.5, false)).toContain('assertScreenshot');
    const names = ['galeri-a-light-1', 'galeri-a-dark-1', 'galeri-b-light-1', 'galeri-b-dark-1'];
    for (const n of names) write(join(out, 'aday', `${n}.png`), png(4, 4));
    writeFileSync(
      join(out, 'report.xml'),
      `<testsuites><testsuite>${names.map((n) => `<testcase name="${n}" status="SUCCESS"/>`).join('')}</testsuite></testsuites>`,
    );
    const { gate, text } = buildReport(root, out);
    expect(gate.ok).toBe(false);
    expect(gate.staleBaseline).toEqual(['galeri-a-light-1']);
    expect(text).toContain('eski boyda olan 1 görüntü (720 px; emülatörün çerçevesi 780 px)');
    expect(text).toContain('pnpm visual:accept');
  });
});

describe('visual gate: the board beside the app', () => {
  it('sets the columns side by side under their labels, top aligned and unscaled', () => {
    const board = png(64, 30, [10, 20, 30]);
    const app = png(78, 20, [200, 0, 0]);
    const diff = png(78, 30, [0, 200, 0]);
    const image = sideBySide([
      { label: 'PANO', image: board },
      { label: 'UYGULAMA', image: app },
      { label: 'FARK %50.0', image: diff },
    ]);
    const [w0, w1, w2] = [
      Math.max(64, labelWidth('PANO') + 24),
      Math.max(78, labelWidth('UYGULAMA') + 24),
      Math.max(78, labelWidth('FARK %50.0') + 24),
    ];
    expect(image.width).toBe(w0 + w1 + w2 + 2 * GAP);
    expect(image.height).toBe(LABEL_BAND + 30);
    const at = (x: number, y: number) => {
      const i = (image.width * y + x) * 4;
      return [image.data[i], image.data[i + 1], image.data[i + 2]];
    };
    // Each image from the top of its column, pixel for pixel.
    expect(at(0, LABEL_BAND)).toEqual([10, 20, 30]);
    expect(at(63, LABEL_BAND + 29)).toEqual([10, 20, 30]);
    const appX = w0 + GAP;
    expect(at(appX, LABEL_BAND)).toEqual([200, 0, 0]);
    expect(at(appX + 77, LABEL_BAND + 19)).toEqual([200, 0, 0]);
    // Below the shorter image: the backdrop.
    expect(at(appX, LABEL_BAND + 25)).not.toEqual([200, 0, 0]);
    expect(at(appX + w1 + GAP, LABEL_BAND)).toEqual([0, 200, 0]);
    // The label is drawn in the band: some white pixels in the first column's band.
    let lit = 0;
    for (let y = 0; y < LABEL_BAND; y++) {
      for (let x = 0; x < w0; x++) if (at(x, y).every((c) => c === 255)) lit++;
    }
    expect(lit).toBeGreaterThan(0);
  });

  it('draws only what its font has, Turkish letters in their plain form', () => {
    expect(labelText('Fark %93.8 · çğış')).toBe('FARK %93.8 CGIS');
    expect(labelWidth('')).toBe(0);
  });

  it('leaves a missing image its label alone', () => {
    const image = sideBySide([
      { label: 'PANO YOK', image: null },
      { label: 'UYGULAMA', image: png(10, 10) },
    ]);
    expect(image.height).toBe(LABEL_BAND + 10);
  });
});

describe('visual gate: the report beside the board', () => {
  let root: string;
  let out: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'gorsel-'));
    out = join(root, 'out');
    mkdirSync(join(out, 'aday'), { recursive: true });
    mkdirSync(join(out, 'pano'), { recursive: true });
    mkdirSync(join(root, 'e2e/visual'), { recursive: true });
    writeFileSync(
      join(root, 'e2e/visual/states.json'),
      JSON.stringify({
        esik: 99.5,
        durumlar: [{ id: 'ekran-x', app: 'ekran/x', baz: false, pano: { dosya: 'Dar' } }],
      }),
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('writes yanyana/<id>-<theme>.png with the similarity, and never fails the gate on it', () => {
    // A narrow board (640) beside the app (780), both 6 high; the board half another colour.
    const board = png(640 / 20, 6, [0, 0, 0]);
    const app = png(780 / 20, 6, [0, 0, 0]);
    write(join(out, 'pano', 'ekran-x-light.png'), board);
    write(join(out, 'aday', 'ekran-x-light-1.png'), app);
    write(join(out, 'aday', 'ekran-x-dark-1.png'), app);
    writeFileSync(
      join(out, 'report.xml'),
      '<testsuites><testsuite><testcase name="ekran-x-light-1" status="SUCCESS"/><testcase name="ekran-x-dark-1" status="SUCCESS"/></testsuite></testsuites>',
    );
    const { gate, text } = buildReport(root, out, { images: 'https://x/visual' });
    expect(gate.ok).toBe(true);
    expect(text).toContain('### Pano ile yan yana');
    // 32 of 39 columns match, the rest is the size difference.
    expect(text).toContain(
      '| ekran-x | light | `Dar-acik.webp` | %82.1 | 39×6 / 32×6 | <a href="https://x/visual/yanyana/ekran-x-light.png">',
    );
    expect(text).toContain('| ekran-x | dark | `Dar-koyu.webp` (yok) | – | 39×6 / yok |');
    for (const theme of ['light', 'dark']) {
      expect(existsSync(join(out, 'yanyana', `ekran-x-${theme}.png`))).toBe(true);
    }
  });

  it('still writes the side by side image when the candidate is empty, its column labelled', () => {
    write(join(out, 'pano', 'ekran-x-light.png'), png(4, 4));
    write(join(out, 'pano', 'ekran-x-dark.png'), png(4, 4));
    writeFileSync(join(out, 'aday', 'ekran-x-light-1.png'), '');
    write(join(out, 'aday', 'ekran-x-dark-1.png'), png(4, 4));
    const { gate, text } = buildReport(root, out);
    expect(gate.unreadable).toEqual(['ekran-x-light-1']);
    expect(text).toContain('| ekran-x | light | `Dar-acik.webp` | – | okunamadı / 4×4 |');
    expect(text).toContain('| ekran-x | dark | `Dar-koyu.webp` | %100.0 | 4×4 / 4×4 |');
    for (const theme of ['light', 'dark']) {
      expect(existsSync(join(out, 'yanyana', `ekran-x-${theme}.png`))).toBe(true);
    }
  });
});

describe('visual gate: reading a photo that may be bad', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'gorsel-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('says missing, unreadable (empty, cut, not a PNG) or gives the image, never throws', () => {
    expect(tryReadPng(join(dir, 'yok.png')).kind).toBe('missing');
    writeFileSync(join(dir, 'bos.png'), '');
    expect(tryReadPng(join(dir, 'bos.png'))).toEqual({ kind: 'unreadable', reason: '0 bayt' });
    const whole = PNG.sync.write(png(8, 8));
    writeFileSync(join(dir, 'kesik.png'), whole.subarray(0, whole.length - 20));
    expect(tryReadPng(join(dir, 'kesik.png')).kind).toBe('unreadable');
    writeFileSync(join(dir, 'iyi.png'), whole);
    const ok = tryReadPng(join(dir, 'iyi.png'));
    expect(ok.kind === 'ok' && ok.png.width).toBe(8);
  });
});

describe("visual gate: the candidates in a job's log", () => {
  it('reads `ADAY <name>.png <base64>` lines, a timestamp before them or not', () => {
    const a = PNG.sync.write(png(2, 2));
    const log = [
      '2026-11-18T01:02:03.4567890Z ##[group]Candidates (base64)',
      `2026-11-18T01:02:03.4567890Z ADAY ekran-x-light-1.png ${a.toString('base64')}`,
      `ADAY ekran-x-dark-1.png ${a.toString('base64')}`,
      'ADAY not a line',
    ].join('\n');
    const found = candidatesFromLog(log);
    expect([...found.keys()]).toEqual(['ekran-x-light-1.png', 'ekran-x-dark-1.png']);
    expect(found.get('ekran-x-dark-1.png')?.equals(a)).toBe(true);
  });
});

describe('visual gate: the board beside the app from a job log (pnpm visual:yerel)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'gorsel-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("takes --log, --out and --pano, after pnpm's --", () => {
    expect(parseArgs(['--', '--log', 'a.txt', '--out', 'o'])).toEqual({
      log: 'a.txt',
      out: 'o',
      pano: undefined,
    });
    expect(parseArgs(['--log', 'a.txt', '--out', 'o', '--pano', 'p']).pano).toBe('p');
    expect(() => parseArgs(['--log', 'a.txt'])).toThrow('usage');
  });

  it('writes the candidates and names the ones the log printed empty', () => {
    const a = PNG.sync.write(png(2, 2));
    const log = [
      `2026-11-18T01:02:03.4567890Z ADAY ekran-x-light-1.png ${a.toString('base64')}`,
      '2026-11-18T01:02:03.4567890Z ADAY ekran-x-dark-1.png ',
    ].join('\n');
    const r = writeCandidates(log, dir);
    expect(r).toEqual({ names: ['ekran-x-light-1.png'], empty: ['ekran-x-dark-1.png'] });
    expect(readFileSync(join(dir, 'aday', 'ekran-x-light-1.png')).equals(a)).toBe(true);
    expect(existsSync(join(dir, 'aday', 'ekran-x-dark-1.png'))).toBe(false);
  });
});

describe('visual gate: the gorsel label', () => {
  const workflow = readFileSync(join(ROOT, '.github/workflows/e2e.yml'), 'utf8');
  const job = (name: string) => {
    const start = workflow.indexOf(`\n  ${name}:\n`);
    const next = workflow.slice(start + 1).search(/\n {2}[a-z-]+:\n/);
    return workflow.slice(start, next < 0 ? undefined : start + 1 + next);
  };
  const condition = (name: string) => /\n {4}if: >-\n([\s\S]*?)\n {4}runs-on:/.exec(job(name))?.[1];

  it('runs the build and the visual gate, never the shards', () => {
    expect(condition('build')).toContain("github.event.label.name == 'gorsel'");
    expect(condition('build')).toContain(
      "contains(github.event.pull_request.labels.*.name, 'gorsel')",
    );
    expect(condition('visual')).toContain("github.event.label.name == 'gorsel'");
    expect(condition('visual')).toContain(
      "contains(github.event.pull_request.labels.*.name, 'gorsel')",
    );
    expect(condition('e2e')).toBeDefined();
    expect(condition('e2e')).not.toContain('gorsel');
  });

  it('reads the boards from their branch in the visual job', () => {
    expect(job('visual')).toContain('git fetch --depth 1 --no-tags origin pano-goruntuleri');
    expect(job('visual')).toContain('scripts/visual/render-pano.ts');
  });
});

function fail(): never {
  throw new Error('missing');
}
