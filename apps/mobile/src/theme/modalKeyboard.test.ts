import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// A code guard beside styleGuard.test.ts (the theme's tests run outside the app's tsconfig).
const ROOT = join(import.meta.dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

describe('useLeaveKeyboard', () => {
  it('is called by every file that opens a Modal', () => {
    const files = [...sources(join(ROOT, 'src')), ...sources(join(ROOT, 'app'))].filter((f) =>
      /<Modal\b/.test(readFileSync(f, 'utf8')),
    );
    expect(files.length).toBeGreaterThan(0);
    const missing = files.filter((f) => !/useLeaveKeyboard\(/.test(readFileSync(f, 'utf8')));
    expect(missing).toEqual([]);
  });
});
