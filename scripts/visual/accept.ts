// pnpm visual:accept <PR number> [state id …]
// pnpm visual:accept --dir <folder> [state id …]
// pnpm visual:accept --log <job log file> [state id …]
// Takes the visual gate's candidates from the PR's last e2e run (its e2e-run-visual artifact,
// aday/; artifacts are kept 7 days) into e2e/visual/baz/: every shot that expects a baseline, or
// only the given states'. Only after the CTO has approved them; the PR that changes baz/ needs the
// `gorsel-baz` label (ci → checks). With a PR number it needs `gh` signed in (`gh run download`).
// Where `gh` cannot download (a session without it), --dir takes an artifact already unpacked into
// <folder> (its aday/ beside kapi.json), however it was fetched: the artifact's zip from the API
// (`GET /repos/{owner}/{repo}/actions/runs/{run}/artifacts` → `archive_download_url`, with a token
// that reads the repo's actions) or the GitHub MCP tools; --log reads the candidates from the
// visual job's log as saved to a file (a PR run prints each as `ADAY <name>.png <base64>`,
// scripts/visual/run-on-emulator.sh; the MCP tools read job logs). .claude/skills/e2e → Görsel kapı.
// --deneme (anywhere): only says what it would take, each candidate's size beside the emulator's
// frame, and writes nothing.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { candidatesFromLog, pngOf, tryReadPng } from './compare.ts';
import { BASELINE_DIR, FRAME_WIDTH_PX, loadStates, shots } from './states.ts';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const dryRun = argv.includes('--deneme');
const args = argv.filter((a) => a !== '--deneme');
const root = join(import.meta.dirname, '..', '..');
// pnpm runs the script in scripts/: paths given on the command line are from where it was typed.
const fromCaller = (p: string) => resolve(process.env.INIT_CWD ?? process.cwd(), p);
const usage =
  'usage: pnpm visual:accept <PR number> | --dir <folder> | --log <job log file>, then [state id …]';

function fromRun(pr: string): { dir: string; from: string } {
  const gh = (...a: string[]) =>
    execFileSync('gh', a, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim();
  const sha = gh('api', `repos/{owner}/{repo}/pulls/${pr}`, '--jq', '.head.sha');
  const run = gh(
    'api',
    `repos/{owner}/{repo}/actions/workflows/e2e.yml/runs?head_sha=${sha}&per_page=1`,
    '--jq',
    '.workflow_runs[0].id // ""',
  );
  if (!run) throw new Error(`no e2e run for PR #${pr}'s last commit (${sha.slice(0, 7)})`);
  const dir = mkdtempSync(join(tmpdir(), 'gorsel-'));
  gh('run', 'download', run, '-n', 'e2e-run-visual', '-D', dir);
  return { dir, from: `run ${run}` };
}

let source: { dir: string; from: string };
let only: string[];
if (args[0] === '--log') {
  const file = args[1];
  if (!file) throw new Error(usage);
  const found = candidatesFromLog(readFileSync(fromCaller(file), 'utf8'));
  if (found.size === 0) throw new Error(`${file}: no ADAY lines in it`);
  const dir = mkdtempSync(join(tmpdir(), 'gorsel-'));
  mkdirSync(join(dir, 'aday'));
  for (const [name, png] of found) writeFileSync(join(dir, 'aday', name), png);
  source = { dir, from: `${file} (${found.size} candidates)` };
  only = args.slice(2);
} else if (args[0] === '--dir') {
  const dir = args[1];
  if (!dir) throw new Error(usage);
  const full = fromCaller(dir);
  if (!existsSync(join(full, 'aday'))) throw new Error(`${full}: no aday/ folder in it`);
  source = { dir: full, from: full };
  only = args.slice(2);
} else {
  const [pr, ...rest] = args;
  if (!pr || !/^\d+$/.test(pr)) throw new Error(usage);
  source = fromRun(pr);
  only = rest;
}

if (!dryRun) mkdirSync(join(root, BASELINE_DIR), { recursive: true });
const taken: string[] = [];
const missing: string[] = [];
for (const shot of shots(loadStates(root))) {
  if (!shot.baseline || (only.length > 0 && !only.includes(shot.state.id))) continue;
  const file = join(source.dir, 'aday', `${shot.name}.png`);
  // An empty or broken candidate is never a baseline.
  const png = pngOf(tryReadPng(file));
  if (!png) {
    missing.push(shot.name);
    continue;
  }
  if (dryRun) {
    const note =
      shot.state.uygulamaKirp || png.width === FRAME_WIDTH_PX ? '' : ' (not the frame width)';
    console.log(`would take ${shot.name}: ${png.width}×${png.height}${note}`);
  } else {
    writeFileSync(join(root, BASELINE_DIR, `${shot.name}.png`), readFileSync(file));
  }
  taken.push(shot.name);
}
console.log(
  `${taken.length} baseline(s) from ${source.from} ${dryRun ? 'would go' : 'into'} ${BASELINE_DIR}${dryRun ? ' (--deneme: nothing written)' : ''}`,
);
if (missing.length > 0) console.log(`not in the artifact (or unreadable): ${missing.join(', ')}`);
