// node --experimental-strip-types scripts/visual/report.ts <repo root> <out dir>
// The visual gate's report (gate-report.ts) on stdout, for the job summary, and its result in
// <out>/kapi.json. GORSEL_URL: where <out> is served from, if anywhere (the
// run's images are in its artifact); GORSEL_BAZ_URL: where e2e/visual/baz/ is (the commit under test). Without them the
// report names the files instead of showing them.
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { buildReport } from './gate-report.ts';

const [rootArg, outArg] = process.argv.slice(2);
if (!rootArg || !outArg) throw new Error('usage: report.ts <repo root> <out dir>');
const out = resolve(outArg);
// The report never dies without kapi.json: if building it throws all the same, the gate fails with
// the error written there and in the summary (the Result step reads kapi.json).
try {
  const { text, gate } = buildReport(resolve(rootArg), out, {
    images: process.env.GORSEL_URL,
    baselines: process.env.GORSEL_BAZ_URL,
  });
  writeFileSync(join(out, 'kapi.json'), `${JSON.stringify(gate, null, 1)}\n`);
  console.log(text);
} catch (e) {
  const error = e instanceof Error ? (e.stack ?? e.message) : String(e);
  writeFileSync(join(out, 'kapi.json'), `${JSON.stringify({ ok: false, error }, null, 1)}\n`);
  console.log(`### Görsel kapı: GEÇMEDİ\n\nRapor kurulamadı:\n\n\`\`\`\n${error}\n\`\`\``);
}
