// .github/workflows/e2e.yml → "Test environment crash? (one retry)": reads a shard's failed attempt
// from its folder ($OUT; scripts/e2e/run-on-emulator.sh) and prints why it is run once more
// (retry.ts), or nothing. node --experimental-strip-types scripts/e2e/retry-check.ts <OUT>
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { retryReason } from './retry.ts';

const out = process.argv[2];
if (!out) throw new Error('usage: retry-check.ts <OUT>');

// Maestro's logs of the flow, under --test-output-dir; a retry's first attempt (attempt-1/) never.
function found(dir: string, name: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === 'attempt-1' ? [] : found(path, name);
    return entry === name ? [path] : [];
  });
}
const read = (paths: string[]): string => paths.map((p) => readFileSync(p, 'utf8')).join('\n');

const reason = retryReason({
  maestroLog: read(found(out, 'maestro.log')),
  deviceLogcat: read(found(out, 'device-logcat.txt')),
  logcat: read([join(out, 'logcat.txt')].filter((p) => existsSync(p))),
  console: read([join(out, 'maestro-console.txt')].filter((p) => existsSync(p))),
});
if (reason) console.log(reason);
