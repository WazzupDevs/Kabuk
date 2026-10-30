// PostToolUse hook on Edit and Write: Prettier on the one file just changed, so a format slip never
// turns ci red. Files Prettier ignores (.prettierignore) or cannot parse are left as they are.
// Never fails the tool call.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = input?.tool_input?.file_path;
if (typeof file !== 'string') process.exit(0);
const path = resolve(root, file);
const rel = relative(root, path);
if (rel.startsWith('..') || !existsSync(path)) process.exit(0);
const prettier = join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
if (!existsSync(prettier)) process.exit(0);
spawnSync(
  process.execPath,
  [prettier, '--write', '--ignore-unknown', '--log-level', 'silent', rel],
  {
    cwd: root,
    stdio: 'ignore',
    timeout: 10_000,
  },
);
