// node --experimental-strip-types scripts/visual/render-prototype.ts <repo root> <out dir>
// Draws the prototype states e2e/visual/states.json sets beside the app (prototype.ts) into
// <out>/prototip/, light and dark. PLAYWRIGHT_CHROMIUM: a Chromium to use instead of Playwright's
// own (a local machine).
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { renderPrototype, type Wanted } from './prototype.ts';
import { loadStates, THEMES } from './states.ts';

const [rootArg, outArg] = process.argv.slice(2);
if (!rootArg || !outArg) throw new Error('usage: render-prototype.ts <repo root> <out dir>');
const root = resolve(rootArg);
const out = join(resolve(outArg), 'prototip');
mkdirSync(out, { recursive: true });
const wanted: Wanted[] = loadStates(root).durumlar.flatMap(({ id, prototip }) =>
  prototip ? THEMES.map((theme) => ({ id, theme, state: prototip })) : [],
);
const done = await renderPrototype(root, out, wanted, process.env.PLAYWRIGHT_CHROMIUM);
console.log(`prototype: ${done.length} drawn in ${out}`);
