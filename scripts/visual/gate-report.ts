// The visual gate's report after its run (scripts/visual/run-on-emulator.sh, render-prototype.ts,
// render-pano.ts): the hard gate's result, the app beside its board (yanyana/: board | app | diff,
// with the similarity; soft, the reviewer decides), the similarity table beside the design
// prototype with its diff images, and the noise when every shot was photographed twice. report.ts prints it into the job summary
// and writes the result (Gate) to <out>/kapi.json, which the workflow's last step reads.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PNG } from 'pngjs';

import {
  junitCases,
  maestroMatch,
  type PngRead,
  pngOf,
  similarity,
  thresholdFor,
  tryReadPng,
} from './compare.ts';
import { sideBySide } from './sideBySide.ts';
import {
  boardImage,
  FRAME_WIDTH_PX,
  type GateConfig,
  hasBaseline,
  loadStates,
  pngWidth,
  runShots,
  staleBaseline,
  THEMES,
} from './states.ts';

// Where render-pano.ts puts a state's board image, converted to PNG: <out>/pano/<id>-<theme>.png.
export const BOARD_DIR = 'pano';
// The side-by-side images: <out>/yanyana/<id>-<theme>.png.
export const SIDE_DIR = 'yanyana';

export type Gate = {
  ok: boolean;
  // Shots whose flow failed (Maestro's JUnit report): the comparison with the baseline, or the
  // state did not open.
  failed: string[];
  // Shots without a candidate photo.
  noCandidate: string[];
  // Shots whose candidate is there but cannot be read (an empty or cut PNG): the gate fails, the
  // rest of the report is still written.
  unreadable: string[];
  // Shots that expect a baseline and have none yet.
  noBaseline: string[];
  // Shots whose baseline is of another width than the emulator's frame (an earlier emulator): not
  // compared, to be accepted again.
  staleBaseline: string[];
  // The worst match of two photos of the same state (Maestro's measure), when photographed twice.
  worstNoise: number | null;
};

export type Urls = {
  // Where <out> is served from, if anywhere (CI keeps it in the run's artifact).
  images?: string;
  // Where e2e/visual/baz/ is served from (the commit under test).
  baselines?: string;
};

export function buildReport(
  root: string,
  out: string,
  urls: Urls = {},
  // The run's environment (states.ts → runShots): a pull request's run takes its own states only.
  env: Record<string, string | undefined> = {},
): { text: string; gate: Gate } {
  const at = (base: string | undefined, rel: string) =>
    base ? `${base.replace(/\/$/, '')}/${rel}` : rel;
  // A thumbnail linking to the full image, or the file's path without an address.
  const thumb = (rel: string, base = urls.images) =>
    base ? `<a href="${at(base, rel)}"><img src="${at(base, rel)}" width="120"></a>` : `\`${rel}\``;
  const config = loadStates(root);
  const all = runShots(root, config, env);
  const lines: string[] = [];

  // The hard gate: every shot photographed, every expected baseline there, every flow passed.
  const reportFile = join(out, 'report.xml');
  const ran = existsSync(reportFile);
  const cases = ran ? junitCases(readFileSync(reportFile, 'utf8')) : [];
  const failed = cases.filter((c) => !c.ok);
  const candidates = new Map(
    all.map((s) => [s.name, tryReadPng(join(out, 'aday', `${s.name}.png`))] as const),
  );
  const noCandidate = all.filter((s) => candidates.get(s.name)?.kind === 'missing');
  const unreadable = all.filter((s) => candidates.get(s.name)?.kind === 'unreadable');
  const noBaseline = all.filter((s) => s.baseline && !hasBaseline(root, s));
  const stale = all.filter((s) => s.baseline && staleBaseline(root, s));
  const ok =
    ran &&
    failed.length === 0 &&
    noCandidate.length === 0 &&
    unreadable.length === 0 &&
    noBaseline.length === 0 &&
    stale.length === 0;
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
  const hints = pageHints(out, cases);
  if (hints.size > 0) {
    lines.push(
      '',
      'Sayfa sayısı yanlış (rotanın uyarısı; `e2e/visual/states.json` → `sayfa`):',
      '',
      '| Durum | Listede | Gereken |',
      '| --- | ---: | ---: |',
      ...[...hints].map(
        ([id, h]) =>
          `| ${id} | ${Number.isNaN(h.listed) ? (config.durumlar.find((d) => d.id === id)?.sayfa ?? 1) : h.listed} | ${h.needed} |`,
      ),
    );
  }
  const failedNames = new Set(failed.map((c) => c.name));
  const silent = noCandidate.filter((s) => !failedNames.has(s.name));
  if (silent.length > 0) {
    lines.push('', `Fotoğrafı çekilmeyen: ${silent.map((s) => `\`${s.name}\``).join(', ')}`);
  }
  if (unreadable.length > 0) {
    lines.push(
      '',
      `Aday okunamadı (dosya var ama PNG değil): ${unreadable
        .map((s) => {
          const r = candidates.get(s.name);
          return `\`${s.name}\` (${r?.kind === 'unreadable' ? r.reason.slice(0, 80) : '?'})`;
        })
        .join(', ')}`,
    );
  }
  if (noBaseline.length > 0) {
    lines.push(
      '',
      `Baz görüntüsü olmayan ${noBaseline.length} görüntü (adaylar \`aday/\` içinde; CTO onayından sonra \`gorsel-baz\` etiketi ve \`pnpm visual:accept <PR>\`): ` +
        noBaseline.map((s) => `\`${s.name}\``).join(', '),
    );
  }

  if (stale.length > 0) {
    const widths = [
      ...new Set(stale.map((s) => pngWidth(join(root, 'e2e/visual/baz', `${s.name}.png`)))),
    ];
    lines.push(
      '',
      `Baz görüntüsü eski boyda olan ${stale.length} görüntü (${widths.join(', ')} px; emülatörün çerçevesi ${FRAME_WIDTH_PX} px): karşılaştırılmadı. Adaylar \`aday/\` içinde; CTO onayından sonra \`gorsel-baz\` etiketi ve \`pnpm visual:accept <PR>\`: ` +
        stale.map((s) => `\`${s.name}\``).join(', '),
    );
  }

  // The app beside its board (soft: the similarity never fails the gate).
  const sides = writeBoardSides(config, out);
  if (sides.length > 0) {
    lines.push(
      '',
      '### Pano ile yan yana: yumuşak, karar denetçide',
      '',
      'Solda pano, ortada uygulama, sağda fark; üstten hizalı, ölçeklenmeden. pixelmatch (renk eşiği 0,1); boyut farkı fark sayılır.',
      '',
      '| Durum | Tema | Pano | Benzerlik | Boyut (uygulama / pano) | Yan yana |',
      '| --- | --- | --- | ---: | --- | --- |',
    );
    for (const r of sides) {
      lines.push(
        `| ${r.id} | ${r.theme} | \`${r.board}\`${readNote(r.pano)} | ${r.percent === null ? '–' : `%${r.percent.toFixed(1)}`} | ` +
          `${sizeOf(r.app)} / ${sizeOf(r.pano)} | ${thumb(r.side)} |`,
      );
    }
  }

  // The soft report: the app beside the prototype, for the states that name their counterpart.
  const pairs = config.durumlar.filter((s) => s.prototip);
  if (pairs.length > 0) {
    mkdirSync(join(out, 'fark'), { recursive: true });
    lines.push(
      '',
      "### Prototip benzerliği: yumuşak eşik, karar CTO'da",
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
        const appRead = tryReadPng(join(out, app));
        const protoRead = tryReadPng(join(out, proto));
        const a = pngOf(appRead);
        const b = pngOf(protoRead);
        if (!a || !b) {
          const cell = (r: PngRead, rel: string) =>
            r.kind === 'ok' ? thumb(rel) : r.kind === 'missing' ? 'yok' : 'okunamadı';
          lines.push(
            `| ${s.id} | ${theme} | – | – | ${cell(appRead, app)} | ${cell(protoRead, proto)} | – |`,
          );
          continue;
        }
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
      const a = pngOf(candidates.get(s.name) ?? { kind: 'missing' });
      const b = pngOf(tryReadPng(join(out, 'aday2', `${s.name}.png`)));
      if (!a || !b) {
        lines.push(`| ${s.name} | okunamadı |`);
        continue;
      }
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
      unreadable: unreadable.map((s) => s.name),
      noBaseline: noBaseline.map((s) => s.name),
      staleBaseline: stale.map((s) => s.name),
      worstNoise: worst,
    },
  };
}

export type BoardSide = {
  id: string;
  theme: (typeof THEMES)[number];
  // The board's image on the pano-goruntuleri branch.
  board: string;
  app: PngRead;
  pano: PngRead;
  // pixelmatch's share of matching pixels, when both images could be read.
  percent: number | null;
  // <out>-relative path of the side-by-side image.
  side: string;
};

// Every state with a board, in both themes: the board (<out>/pano/<id>-<theme>.png), the app's
// first page (<out>/aday/<id>-<theme>-1.png) and their diff side by side into
// <out>/yanyana/<id>-<theme>.png. A missing or unreadable image leaves its column empty and
// labelled so. The report (CI) and pnpm visual:yerel (a job's log) both draw them here.
export function writeBoardSides(config: GateConfig, out: string): BoardSide[] {
  const boarded = config.durumlar.filter((s) => s.pano);
  if (boarded.length === 0) return [];
  mkdirSync(join(out, SIDE_DIR), { recursive: true });
  const rows: BoardSide[] = [];
  for (const s of boarded) {
    for (const theme of THEMES) {
      const app = tryReadPng(join(out, 'aday', `${s.id}-${theme}-1.png`));
      const pano = tryReadPng(join(out, BOARD_DIR, `${s.id}-${theme}.png`));
      const a = pngOf(app);
      const b = pngOf(pano);
      const r = a && b ? similarity(a, b) : null;
      const side = `${SIDE_DIR}/${s.id}-${theme}.png`;
      const label = (read: PngRead, name: string) =>
        read.kind === 'ok' ? name : read.kind === 'missing' ? `${name} YOK` : `${name} OKUNAMADI`;
      const image = sideBySide([
        { label: label(pano, 'PANO'), image: b },
        { label: label(app, 'UYGULAMA'), image: a },
        { label: r ? `FARK %${r.percent.toFixed(1)}` : 'FARK -', image: r?.diff ?? null },
      ]);
      writeFileSync(join(out, side), PNG.sync.write(image));
      rows.push({
        id: s.id,
        theme,
        board: s.pano ? boardImage(s.pano, theme) : '',
        app,
        pano,
        percent: r ? r.percent : null,
        side,
      });
    }
  }
  return rows;
}

export const sizeOf = (r: PngRead): string =>
  r.kind === 'ok' ? `${r.png.width}×${r.png.height}` : r.kind === 'missing' ? 'yok' : 'okunamadı';
const readNote = (r: PngRead): string =>
  r.kind === 'ok' ? '' : r.kind === 'missing' ? ' (yok)' : ' (okunamadı)';

// The flow's page check names the count the route asked for (flow.ts → PAGE_NEEDED): the failed
// assertion says `gorsel-sayfa-gereken-<n>`.
const NEEDED_IN_MESSAGE = /gorsel-sayfa-gereken-(\d+)/;

// The page counts the route asked for: from the failed flows' messages (flow.ts asserts that
// no `gorsel-sayfa-gereken-<n>` banner is there, one n at a time; `listed` NaN there, the report
// takes it from states.json), else from GateState's banner
// text ("Bu durum N sayfa, listede M") in the screen hierarchies Maestro saved for the failed
// steps: <out>/maestro/<run>/<shot>/screen-hierarchy/.
export function pageHints(
  out: string,
  cases: readonly { name: string; ok: boolean; message: string }[] = [],
): Map<string, { listed: number; needed: number }> {
  const hints = new Map<string, { listed: number; needed: number }>();
  for (const c of cases) {
    const needed = c.ok ? null : NEEDED_IN_MESSAGE.exec(c.message)?.[1];
    const m = /^(.*)-(light|dark)-(\d+)$/.exec(c.name);
    if (needed && m?.[1]) hints.set(m[1], { listed: NaN, needed: Number(needed) });
  }
  const root = join(out, 'maestro');
  if (existsSync(root)) {
    for (const run of readdirSync(root)) {
      if (!existsSync(join(root, run)) || run.includes('.')) continue;
      for (const shot of readdirSync(join(root, run))) {
        const dir = join(root, run, shot, 'screen-hierarchy');
        if (!existsSync(dir)) continue;
        for (const file of readdirSync(dir)) {
          const m = /Bu durum (\d+) sayfa, listede (\d+)/.exec(
            readFileSync(join(dir, file), 'utf8'),
          );
          const id = /^(.*)-(light|dark)-\d+$/.exec(shot)?.[1];
          if (m && id) hints.set(id, { listed: Number(m[2]), needed: Number(m[1]) });
        }
      }
    }
  }
  return hints;
}
