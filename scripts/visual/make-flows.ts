// node --experimental-strip-types scripts/visual/make-flows.ts <repo root> <flow dir> [--tekrar]
// Writes the visual gate's Maestro flows (flow.ts), one per shot of e2e/visual/states.json in the
// schemes of TEMA (states.ts → themesFrom). --tekrar photographs every shot that expects a baseline
// a second time (aday2__…), for measuring the noise.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { flowFiles } from './flow.ts';
import { hasBaseline, loadStates, themesFrom } from './states.ts';

const [rootArg, dirArg, ...flags] = process.argv.slice(2);
if (!rootArg || !dirArg) throw new Error('usage: make-flows.ts <repo root> <flow dir> [--tekrar]');
const root = resolve(rootArg);
const dir = resolve(dirArg);
const config = loadStates(root);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const flows = flowFiles(root, config, themesFrom(process.env.TEMA), flags.includes('--tekrar'));
for (const { file, text } of flows) writeFileSync(join(dir, file), text);
const missing = flows.filter(({ shot }) => shot.baseline && !hasBaseline(root, shot));
console.log(`${flows.length} flows in ${dir}; expected baselines missing: ${missing.length}`);
