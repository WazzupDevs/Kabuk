// pnpm visual:yerel -- --log <job log file> --out <folder> [--pano <folder>]
// The visual gate's board beside the app, on this machine, from a PR run's job log: where the run's
// artifact cannot be downloaded (.claude/skills/e2e → Görsel kapı), the candidates are read from
// the log's `ADAY <name>.png <base64>` lines (scripts/visual/run-on-emulator.sh, the same reader as
// pnpm visual:accept --log) into <out>/aday/, the boards' WebP from --pano (the pano-goruntuleri
// branch's tree) or, without it, from `git show origin/pano-goruntuleri:<image>` (fetch it first:
// `git fetch --depth 1 origin pano-goruntuleri`), converted as CI converts them (render-pano.ts:
// Playwright's Chromium, or PLAYWRIGHT_CHROMIUM) into <out>/pano/, then drawn by CI's own code
// (gate-report.ts → writeBoardSides) into <out>/yanyana/<id>-<theme>.png, with <out>/ozet.md: the
// states, themes and similarities.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { candidatesFromLog } from './compare.ts';
import { BOARD_DIR, sizeOf, writeBoardSides } from './gate-report.ts';
import { boardsWanted, webpToPng } from './render-pano.ts';
import { BOARD_BRANCH, loadStates } from './states.ts';

export type YerelArgs = { log: string; out: string; pano?: string };

export function parseArgs(argv: readonly string[]): YerelArgs {
  const args = argv.filter((a) => a !== '--');
  const value = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const log = value('--log');
  const out = value('--out');
  if (!log || !out) {
    throw new Error(
      'usage: pnpm visual:yerel -- --log <job log file> --out <folder> [--pano <folder>]',
    );
  }
  return { log, out, pano: value('--pano') };
}

// The candidates into <out>/aday/: their names, and the ones the log printed empty (an empty file
// on the runner: `ADAY <name>.png` and nothing after it; not written, as CI skips them).
export function writeCandidates(log: string, out: string): { names: string[]; empty: string[] } {
  const found = candidatesFromLog(log);
  mkdirSync(join(out, 'aday'), { recursive: true });
  for (const [name, png] of found) writeFileSync(join(out, 'aday', name), png);
  const empty = [...log.matchAll(/ADAY ([a-z0-9-]+\.png)\s*$/gm)]
    .map((m) => m[1] ?? '')
    .filter((name) => name !== '' && !found.has(name));
  return { names: [...found.keys()], empty };
}

function boardBytes(root: string, image: string, dir?: string): Buffer | null {
  if (dir) {
    const file = join(dir, image);
    return existsSync(file) ? readFileSync(file) : null;
  }
  try {
    return execFileSync('git', ['show', `origin/${BOARD_BRANCH}:${image}`], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

// pnpm runs the script in scripts/: paths given on the command line are from where it was typed.
const fromCaller = (p: string) => resolve(process.env.INIT_CWD ?? process.cwd(), p);

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { log, out: outArg, pano } = parseArgs(process.argv.slice(2));
  const root = join(import.meta.dirname, '..', '..');
  const out = fromCaller(outArg);
  const config = loadStates(root);
  const { names, empty } = writeCandidates(readFileSync(fromCaller(log), 'utf8'), out);
  if (names.length === 0) throw new Error(`${log}: no ADAY lines in it`);

  mkdirSync(join(out, BOARD_DIR), { recursive: true });
  const wanted = boardsWanted(config);
  const missingBoards: string[] = [];
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  try {
    const page = await browser.newPage();
    for (const w of wanted) {
      const webp = boardBytes(root, w.image, pano && fromCaller(pano));
      if (!webp) {
        missingBoards.push(w.image);
        continue;
      }
      writeFileSync(join(out, BOARD_DIR, `${w.id}-${w.theme}.png`), await webpToPng(page, webp));
    }
  } finally {
    await browser.close();
  }

  const rows = writeBoardSides(config, out);
  const summary = [
    '# Pano ile yan yana (yerel)',
    '',
    `Log: \`${fromCaller(log)}\`; ${names.length} aday${empty.length > 0 ? `; logda boş basılan (0 bayt): ${empty.join(', ')}` : ''}.`,
    `Pano: ${pano ? `\`${fromCaller(pano)}\`` : `\`origin/${BOARD_BRANCH}\``}${missingBoards.length > 0 ? `; bulunamayan: ${missingBoards.join(', ')}` : ''}.`,
    '',
    'pixelmatch (renk eşiği 0,1); boyut farkı fark sayılır. CI raporuyla aynı kod (gate-report.ts → writeBoardSides).',
    '',
    '| Durum | Tema | Pano | Benzerlik | Boyut (uygulama / pano) | Yan yana |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.id} | ${r.theme} | \`${r.board}\` | ${r.percent === null ? '–' : `%${r.percent.toFixed(1)}`} | ${sizeOf(r.app)} / ${sizeOf(r.pano)} | \`${r.side}\` |`,
    ),
    '',
  ].join('\n');
  writeFileSync(join(out, 'ozet.md'), summary);
  console.log(summary);
}
