// pnpm visual:accept <PR number> [state id …]
// Takes the visual gate's candidates from the PR's last e2e run (its e2e-run-visual artifact,
// aday/; artifacts are kept 7 days) into e2e/visual/baz/: every shot that expects a baseline, or
// only the given states'. Only after the CTO has approved them; the PR that changes baz/ needs the
// `gorsel-baz` label (ci → checks). Needs `gh` signed in. .claude/skills/e2e → Görsel kapı.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { BASELINE_DIR, loadStates, shots } from './states.ts';

const [pr, ...only] = process.argv.slice(2);
if (!pr || !/^\d+$/.test(pr)) throw new Error('usage: pnpm visual:accept <PR number> [state id …]');
const root = join(import.meta.dirname, '..', '..');
const gh = (...args: string[]) =>
  execFileSync('gh', args, {
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
mkdirSync(join(root, BASELINE_DIR), { recursive: true });
const taken: string[] = [];
const missing: string[] = [];
for (const shot of shots(loadStates(root))) {
  if (!shot.baseline || (only.length > 0 && !only.includes(shot.state.id))) continue;
  try {
    const png = readFileSync(join(dir, 'aday', `${shot.name}.png`));
    writeFileSync(join(root, BASELINE_DIR, `${shot.name}.png`), png);
    taken.push(shot.name);
  } catch {
    missing.push(shot.name);
  }
}
console.log(`${taken.length} baseline(s) from run ${run} into ${BASELINE_DIR}`);
if (missing.length > 0) console.log(`not in the artifact: ${missing.join(', ')}`);
