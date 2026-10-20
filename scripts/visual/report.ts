// node --experimental-strip-types scripts/visual/report.ts <repo root> <out dir>
// The visual gate's report (gate-report.ts) on stdout, for the job summary, and its result in
// <out>/kapi.json, for the schemes of TEMA (states.ts → themesFrom; both without it). GORSEL_URL:
// where <out> is served from (the run's e2e-screenshots branch, `visual-<tema>/`); GORSEL_BAZ_URL:
// where e2e/visual/baz/ is (the commit under test). Without them the report names the files
// instead of showing them.
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { buildReport } from './gate-report.ts';
import { themesFrom } from './states.ts';

const [rootArg, outArg] = process.argv.slice(2);
if (!rootArg || !outArg) throw new Error('usage: report.ts <repo root> <out dir>');
const out = resolve(outArg);
const { text, gate } = buildReport(
  resolve(rootArg),
  out,
  { images: process.env.GORSEL_URL, baselines: process.env.GORSEL_BAZ_URL },
  themesFrom(process.env.TEMA),
);
writeFileSync(join(out, 'kapi.json'), `${JSON.stringify(gate, null, 1)}\n`);
console.log(text);
