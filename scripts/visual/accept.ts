// pnpm visual:accept <PR number> [state id …]
// Takes the visual gate's candidates from the PR's e2e-screenshots-pr-<n> branch (its last run,
// visual/aday/) into e2e/visual/baz/: every shot that expects a baseline, or only the given
// states'. Only after the CTO has approved them; the PR that changes baz/ needs the `gorsel-baz`
// label (ci → checks). CLAUDE.md → Görsel kapı.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BASELINE_DIR, loadStates, shots } from './states.ts';

const [pr, ...only] = process.argv.slice(2);
if (!pr || !/^\d+$/.test(pr)) throw new Error('usage: pnpm visual:accept <PR number> [state id …]');
const root = join(import.meta.dirname, '..', '..');
const branch = `e2e-screenshots-pr-${pr}`;
execFileSync('git', ['fetch', '--quiet', 'origin', branch], { cwd: root, stdio: 'inherit' });
mkdirSync(join(root, BASELINE_DIR), { recursive: true });
const taken: string[] = [];
const missing: string[] = [];
for (const shot of shots(loadStates(root))) {
  if (!shot.baseline || (only.length > 0 && !only.includes(shot.state.id))) continue;
  try {
    const png = execFileSync('git', ['show', `FETCH_HEAD:visual/aday/${shot.name}.png`], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    writeFileSync(join(root, BASELINE_DIR, `${shot.name}.png`), png);
    taken.push(shot.name);
  } catch {
    missing.push(shot.name);
  }
}
console.log(`${taken.length} baseline(s) from ${branch} into ${BASELINE_DIR}`);
if (missing.length > 0) console.log(`not on the branch: ${missing.join(', ')}`);
