import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  boardFile,
  boardStates,
  buildKapsam,
  ESLEME_FILE,
  generate,
  HALLER,
  KAPSAM_FILE,
  kodRefs,
  kodTokens,
  parseDenetim,
  parseEsleme,
  readKapsam,
  resolveToken,
  serializeKapsam,
  TEMA_DOSYA,
  TEMALAR,
} from './kapsam.ts';
import { BASELINE_DIR, loadStates } from './states.ts';

const ROOT = join(import.meta.dirname, '..', '..');

describe('kapsam.json', () => {
  const rows = readKapsam(ROOT);
  const panolar = parseEsleme(readFileSync(join(ROOT, ESLEME_FILE), 'utf8'));
  const states = new Set(loadStates(ROOT).durumlar.map((s) => s.id));

  it('has one row per board of ESLEME and theme, nothing more', () => {
    expect(panolar.length).toBe(203);
    const want = panolar.flatMap((p) => TEMALAR.map((t) => `${p.pano}/${t}`));
    expect(rows.map((r) => `${r.pano}/${r.tema}`)).toEqual(want);
  });

  it('is what the script writes from it (pnpm visual:kapsam changes nothing)', () => {
    expect(serializeKapsam(generate(ROOT).rows)).toBe(
      readFileSync(join(ROOT, KAPSAM_FILE), 'utf8'),
    );
  });

  it("names, on a board's rows, the state of states.json drawn after it (pano)", () => {
    for (const s of loadStates(ROOT).durumlar) {
      if (!s.pano) continue;
      const board = rows.filter((r) => r.dosya === boardFile(s.pano?.dosya ?? ''));
      expect(
        board.map((r) => r.tema),
        s.id,
      ).toEqual([...TEMALAR]);
      for (const r of board) expect(r.durum, `${r.pano}/${r.tema}`).toBe(s.id);
    }
  });

  it('keeps every row in its rules', () => {
    for (const r of rows) {
      const at = `${r.pano}/${r.tema}`;
      expect(HALLER, at).toContain(r.hal);
      if (r.durum !== null) expect(states.has(r.durum), `${at}: durum ${r.durum}`).toBe(true);
      if (r.hal === 'cizilmeyecek') expect(r.sebep?.trim(), `${at}: sebep`).toBeTruthy();
      if (r.hal === 'yazildi') expect(r.kod.length, `${at}: kod`).toBeGreaterThan(0);
      if (r.hal === 'goruntuyle-dogrulandi' || r.hal === 'telefonda-dogrulandi') {
        expect(r.durum, `${at}: durum`).not.toBeNull();
        expect(
          existsSync(join(ROOT, BASELINE_DIR, `${r.durum}-${TEMA_DOSYA[r.tema]}-1.png`)),
          `${at}: baz görüntüsü`,
        ).toBe(true);
        expect(r.kanit, `${at}: kanit`).toBeGreaterThan(0);
      }
      for (const m of r.muaf ?? []) {
        expect(Number.isInteger(m.pr) && m.pr > 0, `${at}: muaf pr`).toBe(true);
        expect(m.sebep?.trim(), `${at}: muaf sebep`).toBeTruthy();
      }
      for (const f of r.kod) expect(existsSync(join(ROOT, f)), `${at}: ${f}`).toBe(true);
    }
  });
});

describe('kapsam.ts', () => {
  it('reads ESLEME rows, a `\\|` inside the title and the theme suffix', () => {
    const text = [
      '| numara | başlık | dosya | sayfa | t |',
      '| --- | --- | --- | --- | --- |',
      '| 01b | Mesajlar · kaydırılmış · açık \\| koyu | project/A.dc.html | Ekranlar | M |',
      '| 70 | Hareket · ortak değerler | project/H.dc.html | Hareket | H |',
      '| r1 | Mesajlar |  | 0 | -260 |',
    ].join('\n');
    expect(parseEsleme(text)).toEqual([
      { pano: '01b', baslik: 'Mesajlar · kaydırılmış', dosya: 'project/A.dc.html' },
      { pano: '70', baslik: 'Hareket · ortak değerler', dosya: 'project/H.dc.html' },
    ]);
  });

  it('reads the path-like words of a Kod: line', () => {
    expect(
      kodTokens(
        'app/(app)/(tabs)/messages/index.tsx; aura/kit.tsx (Seg, Round); `Switch` (`src/aura/kit.tsx:1607`), theme/{a,b}.ts, motion BarBack',
      ),
    ).toEqual([
      'app/(app)/(tabs)/messages/index.tsx',
      'aura/kit.tsx',
      'src/aura/kit.tsx',
      'theme/a.ts',
      'theme/b.ts',
    ]);
  });

  it('makes a short path whole only when one file matches', () => {
    const files = [
      'apps/mobile/src/aura/kit.tsx',
      'apps/mobile/src/a/X.tsx',
      'apps/mobile/src/b/X.tsx',
    ];
    expect(resolveToken('kit.tsx', files)).toBe('apps/mobile/src/aura/kit.tsx');
    expect(resolveToken('X.tsx', files)).toBeNull();
    expect(resolveToken('a/X.tsx', files)).toBe('apps/mobile/src/a/X.tsx');
    expect(resolveToken('Y.tsx', files)).toBeNull();
  });

  it('follows "aynı" to the board above and "NN ile aynı" to that board', () => {
    expect(kodRefs('03d ile aynı + `Input.tsx`')).toEqual(['03d']);
    expect(kodRefs("73'tekiyle aynı + options.ts")).toEqual(['73']);
    expect(kodRefs('aynı (01c) + InboxRows.tsx')).toEqual(['01c']);
    expect(kodRefs('bkz. 92; menü kodda yok')).toEqual(['92']);
    const d = parseDenetim([
      {
        name: 'grup-99',
        text: '# Denetim (Deneme)\n\n## 40 A — a.html\nKod: a.tsx\n\n## 41 B — b.html\nKod: aynı\n',
      },
    ]);
    expect(d.get('41')).toEqual({ aile: 'Deneme', kod: '40 ile aynı; aynı' });
  });

  it("sets a linked board's durum over the row's own, and rejects a board ESLEME lacks", () => {
    const panolar = [
      { pano: '15', baslik: 'Semt', dosya: 'project/SemtSecenek.dc.html' },
      { pano: '16', baslik: 'Diğer', dosya: 'project/Diger.dc.html' },
    ];
    const bagli = boardStates({
      esik: 99,
      durumlar: [
        { id: 'ekran-semt', app: 'ekran/semt', pano: { dosya: 'SemtSecenek' } },
        { id: 'galeri-a', app: 'galeri/a' },
      ],
    });
    expect([...bagli]).toEqual([['project/SemtSecenek.dc.html', 'ekran-semt']]);
    const old = buildKapsam(panolar, new Map(), new Map(), [], {
      '15': { durum: 'eski-durum' },
      '16': { durum: 'kendi' },
    });
    const rows = buildKapsam(panolar, new Map(), new Map(), old, {}, bagli);
    expect(rows.map((r) => `${r.pano}/${r.tema}:${r.durum}`)).toEqual([
      '15/acik:ekran-semt',
      '15/koyu:ekran-semt',
      '16/acik:kendi',
      '16/koyu:kendi',
    ]);
    expect(() =>
      buildKapsam(panolar, new Map(), new Map(), [], {}, new Map([['project/Yok.dc.html', 'x']])),
    ).toThrow(/no board of ESLEME/);
  });

  it('keeps a row’s own fields, seeds a new board and writes the fields in order', () => {
    const panolar = [{ pano: '10', baslik: 'Keşfet', dosya: 'project/K.dc.html' }];
    const denetim = new Map([['10', { aile: 'Keşfet', kod: 'x' }]]);
    const kod = new Map([['10', ['apps/mobile/x.tsx']]]);
    const fresh = buildKapsam(panolar, denetim, kod, [], { '10': { hal: 'yazildi' } });
    expect(fresh.map((r) => r.hal)).toEqual(['yazildi', 'yazildi']);
    const kept = buildKapsam(
      panolar,
      denetim,
      kod,
      [
        {
          muaf: [{ sebep: 's', pr: 9 }],
          hal: 'goruntuyle-dogrulandi',
          kanit: 9,
          durum: 'ekran-k',
          acilis: 'Keşfet',
          tema: 'acik',
          kod: [],
          aile: '',
          dosya: '',
          baslik: 'eski başlık',
          pano: '10',
        },
      ],
      { '10': { hal: 'yazildi' } },
    );
    expect(Object.keys(kept[0] ?? {})).toEqual([
      'pano',
      'baslik',
      'dosya',
      'aile',
      'kod',
      'acilis',
      'tema',
      'durum',
      'hal',
      'kanit',
      'muaf',
    ]);
    expect(kept[0]).toMatchObject({ baslik: 'Keşfet', hal: 'goruntuyle-dogrulandi', kanit: 9 });
    expect(kept[1]?.hal).toBe('yazildi');
  });
});
