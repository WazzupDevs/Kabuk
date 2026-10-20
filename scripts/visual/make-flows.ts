// node --experimental-strip-types scripts/visual/make-flows.ts <repo root> <flow dir> [--tekrar]
// Writes the visual gate's Maestro flows (flow.ts), one per shot of e2e/visual/states.json.
// --tekrar photographs every shot a second time (aday2__…), for measuring the noise.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { flowFor } from './flow.ts';
import { hasBaseline, loadStates, shots } from './states.ts';

const [rootArg, dirArg, ...flags] = process.argv.slice(2);
if (!rootArg || !dirArg) throw new Error('usage: make-flows.ts <repo root> <flow dir> [--tekrar]');
const root = resolve(rootArg);
const dir = resolve(dirArg);
const config = loadStates(root);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const all = shots(config);
all.forEach((shot, i) => {
  const file = `${String(i + 1).padStart(3, '0')}-${shot.name}.yaml`;
  writeFileSync(
    join(dir, file),
    flowFor(root, shot, i + 1, config.esik, flags.includes('--tekrar')),
  );
});
const missing = all.filter((s) => s.baseline && !hasBaseline(root, s));
console.log(`${all.length} flows in ${dir}; expected baselines missing: ${missing.length}`);
