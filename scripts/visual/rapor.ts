// pnpm visual:rapor <sürüm kimliği> [önceki ref] [sonraki ref]
// The short report the project owner gets after an OTA (docs/decisions/gorsel-dogrulama.md, karar
// 5), in Turkish markdown on stdout, from e2e/visual/kapsam.json: what changed since the previous
// ref's record (default: no comparison), what is checked against an image, what is written but not
// looked at, what still has the old look (family by family), and where to look on the phone. The
// record is the working tree's, or the third argument's ref.
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Hal, type KapsamSatiri, KAPSAM_FILE, readKapsam, type Tema } from './kapsam.ts';

export const HAL_ADI: Record<Hal, string> = {
  eski: 'eski',
  yazildi: 'yazıldı',
  'goruntuyle-dogrulandi': 'görüntüyle doğrulandı',
  'telefonda-dogrulandi': 'telefonda doğrulandı',
  cizilmeyecek: 'çizilmeyecek',
};
const TEMA_ADI: Record<Tema, string> = { acik: 'açık', koyu: 'koyu' };

type Pano = { pano: string; baslik: string; aile: string; acilis: string; temalar: string[] };

// Rows of the same board taken together: "02 DM sohbeti: açık, koyu".
function byBoard(rows: readonly KapsamSatiri[]): Pano[] {
  const out = new Map<string, Pano>();
  for (const r of rows) {
    const p = out.get(r.pano) ?? {
      pano: r.pano,
      baslik: r.baslik,
      aile: r.aile,
      acilis: r.acilis,
      temalar: [],
    };
    p.temalar.push(TEMA_ADI[r.tema]);
    if (!p.acilis && r.acilis) p.acilis = r.acilis;
    out.set(r.pano, p);
  }
  return [...out.values()];
}

function line(p: Pano): string {
  return `- ${p.pano} ${p.baslik}: ${p.temalar.join(', ')}`;
}

export type RaporGirdisi = {
  surum: string;
  rows: readonly KapsamSatiri[];
  // The record at the previous release, when there is one to compare with.
  onceki?: readonly KapsamSatiri[];
};

export function buildRapor({ surum, rows, onceki }: RaporGirdisi): string {
  const out: string[] = [`# Sürüm raporu: ${surum}`, ''];
  const was = new Map((onceki ?? []).map((r) => [`${r.pano}/${r.tema}`, r.hal]));
  const changed = onceki
    ? rows.filter((r) => (was.get(`${r.pano}/${r.tema}`) ?? 'eski') !== r.hal)
    : [];

  out.push('## Bu sürümde durumu değişen ekranlar', '');
  if (!onceki) out.push('Önceki sürümle karşılaştırılmadı.');
  else if (changed.length === 0) out.push('Bu sürümde durumu değişen ekran yok.');
  else {
    const groups = new Map<string, KapsamSatiri[]>();
    for (const r of changed) {
      const key = `${r.pano}|${was.get(`${r.pano}/${r.tema}`) ?? 'eski'}|${r.hal}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const [key, list] of groups) {
      const [, from, to] = key.split('|') as [string, Hal, Hal];
      const p = byBoard(list)[0];
      if (p) {
        out.push(
          `- ${p.pano} ${p.baslik} (${p.temalar.join(', ')}): ${HAL_ADI[from]} → ${HAL_ADI[to]}`,
        );
      }
    }
  }

  const verified = rows.filter(
    (r) => r.hal === 'goruntuyle-dogrulandi' || r.hal === 'telefonda-dogrulandi',
  );
  out.push('', '## Görüntüyle doğrulandı', '');
  if (verified.length === 0) out.push('Henüz görüntüyle doğrulanmış ekran yok.');
  for (const p of byBoard(verified)) out.push(line(p));

  const written = rows.filter((r) => r.hal === 'yazildi');
  out.push('', '## Yazıldı ama görüntüyle bakılmadı', '');
  if (written.length === 0) out.push('Yok.');
  for (const p of byBoard(written)) out.push(line(p));

  const old = rows.filter((r) => r.hal === 'eski');
  out.push('', `## Hâlâ eski (${byBoard(old).length} pano)`, '');
  if (old.length === 0) out.push('Yok.');
  const families = new Map<string, Pano[]>();
  for (const p of byBoard(old)) families.set(p.aile, [...(families.get(p.aile) ?? []), p]);
  for (const [aile, list] of families) {
    out.push(`### ${aile || 'Ailesiz'}`, '');
    for (const p of list) out.push(line(p));
    out.push('');
  }
  if (old.length > 0) out.pop();

  // What this release changed, and what is written but no image has been looked at.
  const look = rows.filter((r) => changed.includes(r) || r.hal === 'yazildi');
  out.push('', '## Telefonda özellikle bak', '');
  if (look.length === 0) out.push('Bu sürümde özellikle bakılacak ekran yok.');
  for (const p of byBoard(look)) {
    out.push(
      `- ${p.pano} ${p.baslik} (${p.temalar.join(', ')}): ${p.acilis || 'açılış yolu kayıtlı değil'}`,
    );
  }
  return `${out.join('\n')}\n`;
}

// The record at a git ref; none where the ref has no record yet.
function atRef(root: string, ref: string): KapsamSatiri[] {
  try {
    const text = execFileSync('git', ['show', `${ref}:${KAPSAM_FILE}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(text) as KapsamSatiri[];
  } catch {
    return [];
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = join(import.meta.dirname, '..', '..');
  const [surum, from, to] = process.argv.slice(2).filter((a) => a !== '--');
  if (!surum)
    throw new Error('usage: pnpm visual:rapor <sürüm kimliği> [önceki ref] [sonraki ref]');
  const rows = to ? atRef(root, to) : readKapsam(root);
  process.stdout.write(buildRapor({ surum, rows, onceki: from ? atRef(root, from) : undefined }));
}
