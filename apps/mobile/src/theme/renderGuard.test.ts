import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MODAL_ALLOWED } from './renderGuard.allowed';

// CLAUDE.md → Çizim bütçesi (the owner's rule, 21 Kasım): nothing is drawn again for nothing. The
// parts of it the code can be held to here: no new layer opens a window of its own (a Modal), and
// nothing is drawn unseen to be measured and then mounted again under a new key.
const mobile = join(import.meta.dirname, '..', '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const sources = ['app', 'src']
  .flatMap((d) => files(join(mobile, d)))
  .map((path) => ({
    file: relative(mobile, path).split('\\').join('/'),
    text: readFileSync(path, 'utf8'),
  }));

describe('drawn once (CLAUDE.md → Çizim bütçesi)', () => {
  const modal = sources
    .filter((s) => /<Modal\b/.test(s.text))
    .map((s) => s.file)
    .sort();

  it('no new layer opens a Modal (the app’s layer draws it: motion/menuLayer.tsx)', () => {
    const list = new Set(MODAL_ALLOWED);
    expect(modal.filter((f) => !list.has(f))).toEqual([]);
  });

  it('a listed file that no longer opens a Modal leaves the list', () => {
    const now = new Set(modal);
    expect(MODAL_ALLOWED.filter((f) => !now.has(f))).toEqual([]);
    expect([...MODAL_ALLOWED]).toEqual([...new Set(MODAL_ALLOWED)].sort());
  });

  it('nothing is drawn to be measured and then mounted again under a new key', () => {
    const remeasured = sources
      .filter((s) => /key=\{[^}]*['"`][\w-]*measure[\w-]*['"`]/.test(s.text))
      .map((s) => s.file);
    expect(remeasured).toEqual([]);
  });
});
