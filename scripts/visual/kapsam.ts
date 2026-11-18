// node --experimental-strip-types scripts/visual/kapsam.ts  (pnpm visual:kapsam)
// The visual check's coverage record, e2e/visual/kapsam.json (docs/decisions/gorsel-dogrulama.md):
// every board of the new canvas (docs/design/yeni-arayuz/ESLEME.md), once per theme, with the app
// files that draw it (the audit's "Kod:" line, denetim/grup-NN.md, each path made whole against the
// repo) and how far it is: still the old look, written, checked against an image, checked on a
// phone, or never to be drawn. Run again after ESLEME or the audit changes: a row's own fields
// (hal, sebep, kanit, muaf, acilis, durum) are kept, a new board comes in as "eski" (or as TOHUM
// says), the rest is rewritten from the sources, in a fixed order (a second run changes nothing).
// A board that a state of e2e/visual/states.json names (`pano`) gets that state as its `durum`, in
// both themes; the other rows keep theirs.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type GateConfig, loadStates } from './states.ts';

export const KAPSAM_FILE = 'e2e/visual/kapsam.json';
export const ESLEME_FILE = 'docs/design/yeni-arayuz/ESLEME.md';
export const DENETIM_DIR = 'docs/design/yeni-arayuz/denetim';

export const HALLER = [
  'eski',
  'yazildi',
  'goruntuyle-dogrulandi',
  'telefonda-dogrulandi',
  'cizilmeyecek',
] as const;
export type Hal = (typeof HALLER)[number];
export const TEMALAR = ['acik', 'koyu'] as const;
export type Tema = (typeof TEMALAR)[number];
// A verified row's theme in the gate's file names (e2e/visual/baz/<id>-<light|dark>-1.png).
export const TEMA_DOSYA: Record<Tema, 'light' | 'dark'> = { acik: 'light', koyu: 'dark' };

// A PR allowed to touch the row's files without checking it (its reason said).
export type Muaf = { pr: number; sebep: string };

export type KapsamSatiri = {
  pano: string;
  baslik: string;
  dosya: string;
  // The audit group's family (its heading's parentheses, or the group's name).
  aile: string;
  kod: string[];
  acilis: string;
  tema: Tema;
  durum: string | null;
  hal: Hal;
  sebep?: string;
  kanit?: number;
  muaf?: Muaf[];
};

export type Pano = { pano: string; baslik: string; dosya: string };

// The fields a row keeps over a run (written by hand, in the PR that checks or excuses it).
type Kendi = Pick<KapsamSatiri, 'acilis' | 'durum' | 'hal' | 'sebep' | 'kanit' | 'muaf'>;

// What a board starts with when it first comes into the record (the packages merged before the
// record existed, 18 Kasım; docs/decisions/gorsel-dogrulama.md). Not read again for a row that is
// already in kapsam.json.
const GELMEYECEK = 'Proje sahibinin kararı (18 Kasım): bu oyun uygulamaya gelmeyecek.';
const EKRAN_DEGIL = 'ekran değil: kural/hareket panosu, koddan denetlenir';
// This PR (the record's own) adds one read-only line to Ayarlar's test section.
const BU_PR = 738;
const AYARLAR_MUAF: Muaf[] = [
  {
    pr: BU_PR,
    sebep:
      'Test sürümü bölümüne salt okunur sürüm kimliği satırı; ekranın görünüşü bu PR’da doğrulanmıyor.',
  },
];
export const TOHUM: Record<string, Partial<Kendi>> = {
  // #728
  '66': { hal: 'yazildi', acilis: 'Aktiviteler sekmesi, internet kapalıyken' },
  '66a': { hal: 'yazildi', acilis: 'Aktiviteler sekmesi, sunucu hata verince' },
  '01h': { hal: 'yazildi', acilis: 'Mesajlar → Arşivlenenler, arşivde sohbet yokken' },
  '65': { hal: 'yazildi', acilis: 'Uygulamanın açılışı, sürüm en düşük sürümün altındayken' },
  // #729
  '125': { hal: 'yazildi', acilis: 'Mekan → kendi masan, biri Katıl’a basınca' },
  '129': { hal: 'yazildi', acilis: 'Mekan → kendi masan, biri "Bu masadayım" deyince' },
  '25': { hal: 'yazildi', acilis: 'Mekan → ⋮ → Profiline geç' },
  '25b': { hal: 'yazildi', acilis: 'Mekan → ⋮ → Anonim görün' },
  '26': { hal: 'yazildi', acilis: 'Mekan → ⋮ → Mekandan ayrıl' },
  '123': { hal: 'yazildi', acilis: 'Keşfet → mekan → Check-in → nokta seçimi' },
  // #733
  '14': { hal: 'yazildi', acilis: 'Keşfet → Semte git → Geçit → semt sohbeti, ilk giren' },
  '15': {
    hal: 'yazildi',
    durum: 'ekran-semt-secenekler',
    acilis: 'Semt sohbeti → sağ üstteki ⋮',
  },
  '98': { hal: 'yazildi', acilis: 'Keşfet → Semte git → semt sohbeti, mesajlar varken' },
  '31': { hal: 'yazildi', acilis: 'Mekan → Mekan sohbeti' },
  '32': { hal: 'yazildi', acilis: 'Mekan sohbeti → sağ üstteki ⋮' },
  '37': { hal: 'yazildi', acilis: 'Mekan → masan → Masa sohbeti, mesaj yokken' },
  // The gate's DM state (states.json → ekran-dm); the board's package (#737) is not merged yet.
  '02': { durum: 'ekran-dm', acilis: 'Mesajlar → bir sohbete bas' },
  // Ayarlar: this PR's line.
  '03i': { muaf: AYARLAR_MUAF, acilis: 'Profil → Ayarlar' },
  '153': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  '154': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  '155': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  '156': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  '157': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  '158': { hal: 'cizilmeyecek', sebep: GELMEYECEK },
  // Boards that are no screen: the motion values, the motion table, the shared rules.
  '70': { hal: 'cizilmeyecek', sebep: EKRAN_DEGIL },
  '71': { hal: 'cizilmeyecek', sebep: EKRAN_DEGIL },
  '85': { hal: 'cizilmeyecek', sebep: EKRAN_DEGIL },
};

// ESLEME's board table: `| numara | başlık | dosya | sayfa | <title> |`, `\|` inside a cell.
export function parseEsleme(text: string): Pano[] {
  const out: Pano[] = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line
      .slice(1)
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, '|'));
    const [no, title, file] = cells;
    if (!no || !title || !file || !/^\d{2,3}[a-z]?$/.test(no)) continue;
    out.push({
      pano: no,
      baslik: title.replace(/\s*·\s*açık \| koyu$/, ''),
      dosya: file,
    });
  }
  return out;
}

export type Denetim = { aile: string; kod: string };

// The audit groups: each board's `## <no> <title> — <file>` heading and the `Kod:` line under it;
// a line that says "aynı" (the same as the board above, or as `(NN)`) or "NN ile aynı" brings that
// board's files too.
export function parseDenetim(groups: { name: string; text: string }[]): Map<string, Denetim> {
  const out = new Map<string, Denetim>();
  for (const { name, text } of groups) {
    const head = /^#\s.*?\(([^)]+)\)/m.exec(text);
    const ids = [...text.matchAll(/^## (\d{2,3}[a-z]?)\s/gm)].map((m) => m[1]);
    const aile =
      head?.[1] && !/pano|\d/.test(head[1])
        ? head[1]
        : ids.length > 0
          ? `Panolar ${ids[0]}–${ids[ids.length - 1]}`
          : name;
    let current: string | null = null;
    let previous: string | null = null;
    for (const line of text.split('\n')) {
      const h = /^## (\d{2,3}[a-z]?)\s/.exec(line);
      if (h?.[1]) {
        previous = current;
        current = h[1];
        continue;
      }
      if (line.startsWith('## ')) {
        current = null;
        continue;
      }
      if (current && line.startsWith('Kod:') && !out.has(current)) {
        let kod = line.slice(4).trim();
        if (/^aynı(?!\p{L})/u.test(kod) && !/^aynı \(\d/.test(kod) && previous) {
          kod = `${previous} ile aynı; ${kod}`;
        }
        out.set(current, { aile, kod });
      }
    }
  }
  return out;
}

// The board numbers a `Kod:` line points at ("03d ile aynı", "73'tekiyle aynı", "aynı (01c)",
// "bkz. 92").
export function kodRefs(kod: string): string[] {
  const refs: string[] = [];
  const re =
    /\b(\d{2,3}[a-z]?)(?:'[a-zçğıöşü]+)? ile aynı|\b(\d{2,3}[a-z]?)'[a-zçğıöşü]*kiyle aynı|\baynı \((\d{2,3}[a-z]?)\)|\bbkz\. (\d{2,3}[a-z]?)\b/g;
  for (const m of kod.matchAll(re)) {
    const id = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (id) refs.push(id);
  }
  return refs;
}

// The path-like words of a `Kod:` line: `a/b/C.tsx`, `C.tsx:12-40`, `theme/{a,b}.ts`.
export function kodTokens(kod: string): string[] {
  const out: string[] = [];
  const re = /[A-Za-z0-9_\-./()[\]{},@]+?\.(?:tsx|ts|json)\b/g;
  for (const m of kod.matchAll(re)) {
    let t = m[0];
    // A word in brackets ("(`src/x.tsx`") or after a list comma.
    t = t.replace(/^[,.]+/, '');
    while (t.startsWith('(') && count(t, '(') > count(t, ')')) t = t.slice(1);
    const brace = /^(.*)\{([^}]*)\}(.*)$/.exec(t);
    if (brace) {
      for (const part of (brace[2] ?? '').split(',')) out.push(`${brace[1]}${part}${brace[3]}`);
    } else if (!t.includes(',')) {
      out.push(t);
    } else {
      // "a.tsx,b.tsx" without spaces: the last one only is whole.
      const last = t.split(',').pop();
      if (last) out.push(last);
    }
  }
  return out.filter((t) => /[A-Za-z]/.test(t.replace(/\.(tsx|ts|json)$/, '')));
}

function count(s: string, ch: string): number {
  return s.split(ch).length - 1;
}

// Where a token is in the repo: the one tracked file whose path is it or ends with `/<it>`; none
// when no file or more than one does.
export function resolveToken(token: string, files: readonly string[]): string | null {
  const t = token.replace(/^\.\//, '').replace(/^@shared\//, 'supabase/functions/_shared/pure/');
  const hits = files.filter((f) => f === t || f.endsWith(`/${t}`));
  return hits.length === 1 ? (hits[0] ?? null) : null;
}

// The repo's files a board's code can be in: the app, its content and the shared pure code.
export const KOD_KOKLERI = ['apps/mobile/', 'content/', 'supabase/functions/_shared/pure/'];

export type Cozum = { kod: Map<string, string[]>; cozulemeyen: Map<string, string[]> };

// Every board's files, made whole: its own words and the boards it says it is the same as.
export function resolveKod(denetim: Map<string, Denetim>, files: readonly string[]): Cozum {
  const kod = new Map<string, string[]>();
  const cozulemeyen = new Map<string, string[]>();
  const own = (no: string, seen: Set<string>): string[] => {
    const done = kod.get(no);
    if (done) return done;
    const d = denetim.get(no);
    if (!d || seen.has(no)) return [];
    seen.add(no);
    const paths = new Set<string>();
    const missed: string[] = [];
    for (const token of kodTokens(d.kod)) {
      const path = resolveToken(token, files);
      if (path) paths.add(path);
      else missed.push(token);
    }
    for (const ref of kodRefs(d.kod)) if (ref !== no) for (const p of own(ref, seen)) paths.add(p);
    const list = [...paths].sort();
    kod.set(no, list);
    if (missed.length > 0) cozulemeyen.set(no, [...new Set(missed)].sort());
    return list;
  };
  for (const no of denetim.keys()) own(no, new Set());
  return { kod, cozulemeyen };
}

// One row, its fields in the record's order (a field left out when it has no value).
function row(fields: KapsamSatiri): KapsamSatiri {
  const r: KapsamSatiri = {
    pano: fields.pano,
    baslik: fields.baslik,
    dosya: fields.dosya,
    aile: fields.aile,
    kod: fields.kod,
    acilis: fields.acilis,
    tema: fields.tema,
    durum: fields.durum,
    hal: fields.hal,
  };
  if (fields.sebep) r.sebep = fields.sebep;
  if (fields.kanit !== undefined) r.kanit = fields.kanit;
  if (fields.muaf && fields.muaf.length > 0) {
    r.muaf = fields.muaf.map((m) => ({ pr: m.pr, sebep: m.sebep }));
  }
  return r;
}

// The board file of a state's `pano` (states.ts → BoardLink): ESLEME's `project/<dosya>.dc.html`.
export const boardFile = (dosya: string) => `project/${dosya}.dc.html`;

// The states that name a board, by the board's file (ESLEME's `dosya`).
export function boardStates(config: GateConfig): Map<string, string> {
  return new Map(
    config.durumlar.flatMap((s) => (s.pano ? [[boardFile(s.pano.dosya), s.id] as const] : [])),
  );
}

// The record: ESLEME's boards in its order, açık then koyu, the old rows' own fields kept, the
// `durum` of a board a state names (`bagli`, by board file) set to that state.
export function buildKapsam(
  panolar: readonly Pano[],
  denetim: Map<string, Denetim>,
  kod: Map<string, string[]>,
  existing: readonly KapsamSatiri[],
  tohum: Record<string, Partial<Kendi>> = TOHUM,
  bagli: ReadonlyMap<string, string> = new Map(),
): KapsamSatiri[] {
  const files = new Set(panolar.map((p) => p.dosya));
  for (const [file, id] of bagli) {
    if (!files.has(file)) throw new Error(`states.json: ${id}: pano ${file} is no board of ESLEME`);
  }
  const old = new Map(existing.map((r) => [`${r.pano}/${r.tema}`, r]));
  const out: KapsamSatiri[] = [];
  for (const p of panolar) {
    for (const tema of TEMALAR) {
      const was = old.get(`${p.pano}/${tema}`);
      const seed = tohum[p.pano] ?? {};
      const kendi: Kendi = was
        ? {
            acilis: was.acilis,
            durum: was.durum,
            hal: was.hal,
            sebep: was.sebep,
            kanit: was.kanit,
            muaf: was.muaf,
          }
        : {
            acilis: seed.acilis ?? '',
            durum: seed.durum ?? null,
            hal: seed.hal ?? 'eski',
            sebep: seed.sebep,
            kanit: seed.kanit,
            muaf: seed.muaf,
          };
      const linked = bagli.get(p.dosya);
      if (linked) kendi.durum = linked;
      out.push(
        row({
          ...p,
          aile: denetim.get(p.pano)?.aile ?? '',
          kod: kod.get(p.pano) ?? [],
          tema,
          ...kendi,
        }),
      );
    }
  }
  return out;
}

export function serializeKapsam(rows: readonly KapsamSatiri[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

export function readKapsam(root: string): KapsamSatiri[] {
  const file = join(root, KAPSAM_FILE);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, 'utf8')) as KapsamSatiri[];
}

// The tracked files under KOD_KOKLERI (git, so that a stray local file does not change the record).
export function trackedFiles(root: string): string[] {
  return execFileSync('git', ['ls-files', '--', ...KOD_KOKLERI], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(tsx|ts|json)$/.test(f));
}

export type Uretim = { rows: KapsamSatiri[]; cozulemeyen: Map<string, string[]>; kodsuz: string[] };

// The record as the sources and the current kapsam.json make it.
export function generate(root: string): Uretim {
  const panolar = parseEsleme(readFileSync(join(root, ESLEME_FILE), 'utf8'));
  const dir = join(root, DENETIM_DIR);
  const groups = readdirSync(dir)
    .filter((f) => /^grup-\d+\.md$/.test(f))
    .sort()
    .map((f) => ({ name: f.replace(/\.md$/, ''), text: readFileSync(join(dir, f), 'utf8') }));
  const denetim = parseDenetim(groups);
  const { kod, cozulemeyen } = resolveKod(denetim, trackedFiles(root));
  const rows = buildKapsam(
    panolar,
    denetim,
    kod,
    readKapsam(root),
    TOHUM,
    boardStates(loadStates(root)),
  );
  const kodsuz = panolar.filter((p) => (kod.get(p.pano) ?? []).length === 0).map((p) => p.pano);
  return { rows, cozulemeyen, kodsuz };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = join(import.meta.dirname, '..', '..');
  const { rows, cozulemeyen, kodsuz } = generate(root);
  writeFileSync(join(root, KAPSAM_FILE), serializeKapsam(rows));
  const hal = new Map<string, number>();
  for (const r of rows) hal.set(r.hal, (hal.get(r.hal) ?? 0) + 1);
  console.log(`${KAPSAM_FILE}: ${rows.length} satır (${rows.length / 2} pano × 2 tema)`);
  for (const h of HALLER) console.log(`  ${h}: ${hal.get(h) ?? 0}`);
  const missed = [...cozulemeyen.values()].reduce((n, l) => n + l.length, 0);
  console.log(`Çözülemeyen kod yolu: ${missed} yol, ${cozulemeyen.size} panoda`);
  for (const [no, list] of cozulemeyen) console.log(`  ${no}: ${list.join(', ')}`);
  console.log(
    `Kod yolu hiç çözülemeyen pano: ${kodsuz.length}${kodsuz.length ? ` (${kodsuz.join(', ')})` : ''}`,
  );
}
