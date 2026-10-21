// Usage: pnpm tokens → apps/mobile/src/theme/tokens.generated.ts, v46's tokens from the inventory
// (docs/design/v46/skall-v46-envanter.json; scripts/v46/tokens.ts), and
// apps/mobile/src/theme/parts.generated.ts, what the measurement adds that the src/ui components
// read (docs/design/v46/olcum/skall-v46-olcum.json). Rerun when either or
// scripts/v46/ change; the output is committed and tokens.test.ts checks it is current.
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPartsModule, buildTokensModule, PARTS_MODULE, TOKENS_MODULE } from './v46/tokens.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
writeFileSync(resolve(root, TOKENS_MODULE), await buildTokensModule(root));
console.log(`Wrote ${TOKENS_MODULE}`);
writeFileSync(resolve(root, PARTS_MODULE), await buildPartsModule(root));
console.log(`Wrote ${PARTS_MODULE}`);
