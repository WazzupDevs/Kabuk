// Usage: pnpm ota:production "<açıklama>" — the production OTA, owner only (CLAUDE.md → Asla).
// Refuses while an env file is in apps/mobile (scripts/ota/guard.ts, canlı öncesi denetim C2).
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { blockingEnvFiles, updateArgs } from './ota/guard.ts';

const mobile = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'mobile');

let args: string[];
try {
  args = updateArgs(process.argv[2]);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const blocking = blockingEnvFiles(readdirSync(mobile));
if (blocking.length > 0) {
  console.error(
    `Durdu: apps/mobile içinde ${blocking.join(', ')} var. Üretim OTA'sı yerel EXPO_PUBLIC_* değerlerini pakete koyar. Dosyanın adını değiştir (ör. .env → env.dev) ve yeniden çalıştır.`,
  );
  process.exit(1);
}

const run = spawnSync('npx', args, {
  cwd: mobile,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(run.status ?? 1);
