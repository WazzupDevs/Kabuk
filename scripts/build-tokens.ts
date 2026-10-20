// Usage: pnpm tokens → apps/mobile/src/theme/tokens.generated.ts, v46's tokens from the inventory
// (docs/design/v46/skall-v46-envanter.json; scripts/v46/tokens.ts). Rerun when the inventory or
// scripts/v46/ change; the output is committed and tokens.test.ts checks it is current.
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTokensModule, TOKENS_MODULE } from './v46/tokens.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
writeFileSync(resolve(root, TOKENS_MODULE), await buildTokensModule(root));
console.log(`Wrote ${TOKENS_MODULE}`);
