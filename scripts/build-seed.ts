// Builds supabase/seeds/content-<id>.sql from content/*.json and removes the file it replaces, and
// the pure modules of the capsule catalog (scripts/seed/capsule.ts), the table icons
// (scripts/seed/tableIcons.ts) and the table's games (scripts/seed/games.ts). The output is
// committed. Why the seed's name changes with the content: scripts/seed/build.ts.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSeed, isSeedFileName, SEEDS_DIR, seedFileName } from './seed/build.ts';
import { buildCapsuleModule, CAPSULE_MODULE } from './seed/capsule.ts';
import { buildTableGamesModule, TABLE_GAMES_MODULE } from './seed/games.ts';
import { buildTableIconsModule, TABLE_ICONS_MODULE } from './seed/tableIcons.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, SEEDS_DIR);
mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir)
  .filter(isSeedFileName)
  .map((name) => ({ name, sql: readFileSync(resolve(dir, name), 'utf8') }));
const seed = buildSeed(root);
const name = seedFileName(seed.sql, existing);

writeFileSync(resolve(dir, name), seed.sql);
for (const file of existing) {
  if (file.name !== name) rmSync(resolve(dir, file.name));
}
console.log(
  `Wrote ${SEEDS_DIR}/${name} (${seed.venues} venues, ${seed.testVenues} test venues, ${seed.campusVenues} campus venues)`,
);

writeFileSync(resolve(root, CAPSULE_MODULE), await buildCapsuleModule(root));
console.log(`Wrote ${CAPSULE_MODULE}`);
writeFileSync(resolve(root, TABLE_ICONS_MODULE), await buildTableIconsModule(root));
console.log(`Wrote ${TABLE_ICONS_MODULE}`);
writeFileSync(resolve(root, TABLE_GAMES_MODULE), await buildTableGamesModule(root));
console.log(`Wrote ${TABLE_GAMES_MODULE}`);
