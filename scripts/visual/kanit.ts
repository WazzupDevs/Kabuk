// pnpm visual:kanit [--pr <no>] [--base <ref>] [--head <ref>] [--files <list file>]
// The visual check's evidence step (ci → checks, pull requests only; docs/decisions/
// gorsel-dogrulama.md): every row of e2e/visual/kapsam.json whose `kod` the PR's changed files
// touch must be checked against an image or on a phone with this PR as its `kanit`, or never to be
// drawn, or excused for this PR (`muaf: [{ pr, sebep }]`). A file in more than ORTAK_ESIK boards'
// `kod` (the kit, the strings, the themes) is shared and asks for nothing on its own. The changed
// files: `git diff --name-only <base>...<head>` (KANIT_BASE, default origin/main; head HEAD), or
// one per line in --files. The PR: --pr or KANIT_PR; without one only "cizilmeyecek" passes.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type KapsamSatiri, readKapsam } from './kapsam.ts';

// More boards than this naming a file make it shared.
export const ORTAK_ESIK = 12;

// The files more than `esik` boards name, with how many.
export function ortakDosyalar(
  rows: readonly KapsamSatiri[],
  esik: number = ORTAK_ESIK,
): Map<string, number> {
  const boards = new Map<string, Set<string>>();
  for (const r of rows) {
    for (const f of r.kod) {
      const set = boards.get(f) ?? new Set<string>();
      set.add(r.pano);
      boards.set(f, set);
    }
  }
  const out = new Map<string, number>();
  for (const [f, set] of [...boards].sort(([a], [b]) => a.localeCompare(b))) {
    if (set.size > esik) out.set(f, set.size);
  }
  return out;
}

export type Dokunan = {
  satir: KapsamSatiri;
  dosyalar: string[];
  // How the row passes, or why it does not.
  sonuc: 'kanitli' | 'cizilmeyecek' | 'muaf' | 'kanitsiz';
};

export type KanitSonucu = {
  dokunan: Dokunan[];
  kanitsiz: Dokunan[];
  // The changed files that are shared (and so asked for nothing on their own).
  ortak: string[];
  gecti: boolean;
};

const DOGRULANMIS = new Set(['goruntuyle-dogrulandi', 'telefonda-dogrulandi']);

export function kanitDenetle(
  rows: readonly KapsamSatiri[],
  changed: readonly string[],
  pr: number | null,
  esik: number = ORTAK_ESIK,
): KanitSonucu {
  const shared = ortakDosyalar(rows, esik);
  const files = [...new Set(changed)].sort();
  const ortak = files.filter((f) => shared.has(f));
  const own = new Set(files.filter((f) => !shared.has(f)));
  const dokunan: Dokunan[] = [];
  for (const satir of rows) {
    const dosyalar = satir.kod.filter((f) => own.has(f));
    if (dosyalar.length === 0) continue;
    let sonuc: Dokunan['sonuc'] = 'kanitsiz';
    if (satir.hal === 'cizilmeyecek') sonuc = 'cizilmeyecek';
    else if (pr !== null && DOGRULANMIS.has(satir.hal) && satir.kanit === pr) sonuc = 'kanitli';
    else if (pr !== null && (satir.muaf ?? []).some((m) => m.pr === pr && m.sebep?.trim())) {
      sonuc = 'muaf';
    }
    dokunan.push({ satir, dosyalar, sonuc });
  }
  const kanitsiz = dokunan.filter((d) => d.sonuc === 'kanitsiz');
  return { dokunan, kanitsiz, ortak, gecti: kanitsiz.length === 0 };
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = join(import.meta.dirname, '..', '..');
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const prArg = arg(args, '--pr') ?? process.env.KANIT_PR;
  const pr = prArg && /^\d+$/.test(prArg) ? Number(prArg) : null;
  const list = arg(args, '--files');
  let changed: string[];
  let from: string;
  if (list) {
    changed = readFileSync(resolve(list), 'utf8').split('\n');
    from = list;
  } else {
    const base = arg(args, '--base') ?? process.env.KANIT_BASE ?? 'origin/main';
    const head = arg(args, '--head') ?? 'HEAD';
    changed = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
      cwd: root,
      encoding: 'utf8',
    }).split('\n');
    from = `${base}...${head}`;
  }
  changed = changed.map((f) => f.trim()).filter(Boolean);
  const rows = readKapsam(root);
  const r = kanitDenetle(rows, changed, pr);
  console.log(
    `Görsel kanıt: ${pr === null ? 'PR numarası yok' : `PR #${pr}`}, ${changed.length} dosya (${from})`,
  );
  const shared = ortakDosyalar(rows);
  console.log(`Ortak dosyalar (${ORTAK_ESIK}'den çok panoda, tek başına kanıt istemez):`);
  for (const [f, n] of shared)
    console.log(`  ${f}: ${n} pano${r.ortak.includes(f) ? ' (bu değişiklikte)' : ''}`);
  console.log(`Değişikliğin değdiği kapsam satırı: ${r.dokunan.length}`);
  for (const d of r.dokunan) {
    console.log(
      `  ${d.sonuc === 'kanitsiz' ? '✗' : '✓'} ${d.satir.pano} ${d.satir.baslik} (${d.satir.tema}): ${d.sonuc}; ${d.dosyalar.join(', ')}`,
    );
  }
  if (r.gecti) {
    console.log('Geçti.');
  } else {
    const names = [...new Set(r.kanitsiz.map((d) => `${d.satir.pano} ${d.satir.baslik}`))];
    console.log(
      `::error title=Görsel kanıt eksik::${r.kanitsiz.length} kapsam satırı kanıtsız (${names.join('; ')}). e2e/visual/kapsam.json: satırı bu PR'ı kanıt göstererek doğrula ya da sebepli muafiyet yaz (docs/decisions/gorsel-dogrulama.md).`,
    );
    process.exitCode = 1;
  }
}
