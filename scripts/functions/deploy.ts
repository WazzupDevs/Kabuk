// `pnpm functions:deploy`: publishes every Edge Function in supabase/config.toml to the linked
// project in one command (no long line to paste; a new function needs no change here). Ends with
// the project it published to and how many functions.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { functionNames, linkedProjectRef } from './config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const refFile = resolve(root, 'supabase/.temp/project-ref');

const ref = linkedProjectRef(existsSync(refFile) ? readFileSync(refFile, 'utf8') : null);
if (!ref) {
  console.error('Bağlı proje yok. Önce: pnpm supabase link --project-ref <ref>');
  process.exit(1);
}

const names = functionNames(readFileSync(resolve(root, 'supabase/config.toml'), 'utf8'));
if (names.length === 0) {
  console.error('supabase/config.toml içinde [functions.*] bloğu yok.');
  process.exit(1);
}

console.log(`Proje ${ref}: ${names.length} fonksiyon yayınlanıyor: ${names.join(' ')}`);
// The names are [a-z0-9_-] only (config.ts), so the shell Windows needs for pnpm.cmd sees no
// special characters.
const result = spawnSync(
  'pnpm',
  ['exec', 'supabase', 'functions', 'deploy', ...names, '--project-ref', ref],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);
if (result.status !== 0) {
  console.error(`Yayın başarısız (çıkış kodu ${result.status ?? 'yok'}). Proje: ${ref}`);
  process.exit(result.status ?? 1);
}
console.log(`Bağlı proje: ${ref}`);
console.log(`Yayınlanan fonksiyon: ${names.length} (${names.join(', ')})`);
