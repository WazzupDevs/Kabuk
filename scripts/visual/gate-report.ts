// The visual gate's report after its run (scripts/visual/run-on-emulator.sh, render-prototype.ts):
// the hard gate's result, the similarity table beside the design prototype with its diff images,
// and the noise when every shot was photographed twice. report.ts prints it into the job summary
// and writes the result (Gate) to <out>/kapi.json, which the workflow's last step reads.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { junitCases, maestroMatch, readPng, similarity, thresholdFor } from './compare.ts';
import { hasBaseline, loadStates, shots, THEMES } from './states.ts';

export type Gate = {
  ok: boolean;
  // Shots whose flow failed (Maestro's JUnit report): the comparison with the baseline, or the
  // state did not open.
  failed: string[];
  // Shots without a candidate photo.
  noCandidate: string[];
  // Shots that expect a baseline and have none yet.
  noBaseline: string[];
  // The worst match of two photos of the same state (Maestro's measure), when photographed twice.
  worstNoise: number | null;
};

export type Urls = {
  // Where <out> is served from (the run's e2e-screenshots branch, `visual/`).
  images?: string;
  // Where e2e/visual/baz/ is served from (the commit under test).
  baselines?: string;
};

export function buildReport(
  root: string,
  out: string,
  urls: Urls = {},
): { text: string; gate: Gate } {
  const at = (base: string | undefined, rel: string) =>
    base ? `${base.replace(/\/$/, '')}/${rel}` : rel;
  // A thumbnail linking to the full image, or the file's path without an address.
  const thumb = (rel: string, base = urls.images) =>
    base ? `<a href="${at(base, rel)}"><img src="${at(base, rel)}" width="120"></a>` : `\`${rel}\``;
  const config = loadStates(root);
  const all = shots(config);
  const lines: string[] = [];

  // The hard gate: every shot photographed, every expected baseline there, every flow passed.
  const reportFile = join(out, 'report.xml');
  const ran = existsSync(reportFile);
  const cases = ran ? junitCases(readFileSync(reportFile, 'utf8')) : [];
  const failed = cases.filter((c) => !c.ok);
  const noCandidate = all.filter((s) => !existsSync(join(out, 'aday', `${s.name}.png`)));
  const noBaseline = all.filter((s) => s.baseline && !hasBaseline(root, s));
  const ok = ran && failed.length === 0 && noCandidate.length === 0 && noBaseline.length === 0;
  lines.push(
    `### Görsel kapı: ${ok ? 'geçti' : 'GEÇMEDİ'}`,
    '',
    `${all.length} görüntü (${config.durumlar.length} durum, ${THEMES.length} tema, sayfalar), eşik %${config.esik}.`,
  );
  if (!ran) lines.push('', '- Maestro raporu yok: akışlar koşmadı.');
  if (failed.length > 0) {
    lines.push('', '| Görüntü | Hata | Aday | Baz | Fark |', '| --- | --- | --- | --- | --- |');
    for (const c of failed) {
      const message = (c.message.split('\n')[0] ?? '').slice(0, 200).replace(/\|/g, '\\|');
      const candidate = `aday/${c.name}.png`;
      const diff = `maestro-fark/${c.name}.png`;
      lines.push(
        `| ${c.name} | ${message} | ${existsSync(join(out, candidate)) ? thumb(candidate) : '–'} | ` +
          `${existsSync(join(root, 'e2e/visual/baz', `${c.name}.png`)) ? thumb(`${c.name}.png`, urls.baselines) : '–'} | ` +
          `${existsSync(join(out, diff)) ? thumb(diff) : '–'} |`,
      );
    }
  }
  const failedNames = new Set(failed.map((c) => c.name));
  const silent = noCandidate.filter((s) => !failedNames.has(s.name));
  if (silent.length > 0) {
    lines.push('', `Fotoğrafı çekilmeyen: ${silent.map((s) => `\`${s.name}\``).join(', ')}`);
  }
  if (noBaseline.length > 0) {
    lines.push(
      '',
      `Baz görüntüsü olmayan ${noBaseline.length} görüntü (adaylar \`aday/\` içinde; CTO onayından sonra \`gorsel-baz\` etiketi ve \`pnpm visual:accept <PR>\`): ` +
        noBaseline.map((s) => `\`${s.name}\``).join(', '),
    );
  }

  // The soft report: the app beside the prototype, for the states that name their counterpart.
  const pairs = config.durumlar.filter((s) => s.prototip);
  if (pairs.length > 0) {
    mkdirSync(join(out, 'fark'), { recursive: true });
    lines.push(
      '',
      "### Prototip (v46) benzerliği: yumuşak eşik, karar CTO'da",
      '',
      'pixelmatch (renk eşiği 0,1, kenar yumuşatma hariç); boyut farkı fark sayılır.',
      '',
      '| Durum | Tema | Benzerlik | Boyut (uygulama / prototip) | Uygulama | Prototip | Fark |',
      '| --- | --- | ---: | --- | --- | --- | --- |',
    );
    for (const s of pairs) {
      for (const theme of THEMES) {
        const app = `aday/${s.id}-${theme}-1.png`;
        const proto = `prototip/${s.id}-${theme}.png`;
        const diff = `fark/${s.id}-${theme}.png`;
        const haveApp = existsSync(join(out, app));
        const haveProto = existsSync(join(out, proto));
        if (!haveApp || !haveProto) {
          lines.push(
            `| ${s.id} | ${theme} | – | – | ${haveApp ? thumb(app) : 'yok'} | ${haveProto ? thumb(proto) : 'yok'} | – |`,
          );
          continue;
        }
        const a = readPng(join(out, app));
        const b = readPng(join(out, proto));
        const r = similarity(a, b, join(out, diff));
        lines.push(
          `| ${s.id} | ${theme} | %${r.percent.toFixed(1)} | ${a.width}×${a.height} / ${b.width}×${b.height} | ` +
            `${thumb(app)} | ${thumb(proto)} | ${thumb(diff)} |`,
        );
      }
    }
  }

  // The noise: the same state photographed twice in this run (TEKRAR=1), in Maestro's measure.
  const again = all.filter((s) => existsSync(join(out, 'aday2', `${s.name}.png`)));
  let worst: number | null = null;
  if (again.length > 0) {
    lines.push(
      '',
      "### Gürültü: aynı durum iki kez, Maestro'nun ölçüsüyle",
      '',
      '| Görüntü | Eşleşme |',
      '| --- | ---: |',
    );
    for (const s of again) {
      const a = readPng(join(out, 'aday', `${s.name}.png`));
      const b = readPng(join(out, 'aday2', `${s.name}.png`));
      const sameSize = a.width === b.width && a.height === b.height;
      const match = sameSize ? maestroMatch(a, b) : 0;
      worst = Math.min(worst ?? 100, match);
      lines.push(
        `| ${s.name} | ${sameSize ? `%${match.toFixed(3)}` : `boyut farklı: ${a.width}×${a.height} / ${b.width}×${b.height}`} |`,
      );
    }
    lines.push(
      '',
      `En kötü eşleşme %${(worst ?? 0).toFixed(3)}: önerilen eşik %${thresholdFor(worst ?? 0)}.`,
    );
  }

  return {
    text: lines.join('\n'),
    gate: {
      ok,
      failed: failed.map((c) => c.name),
      noCandidate: noCandidate.map((s) => s.name),
      noBaseline: noBaseline.map((s) => s.name),
      worstNoise: worst,
    },
  };
}
