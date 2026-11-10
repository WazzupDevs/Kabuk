import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// On a file system that ignores case (Windows, macOS) `./TableEnd` and `./tableEnd` are one file:
// TypeScript stops with "file name differs from already included file name only in casing", and a
// checkout keeps only one of two paths that differ in case. Linux and CI see neither. So no two
// tracked names in one folder may differ only in case, the extension aside (`TableEnd.tsx` and
// `tableEnd.ts` are one import), and no folder may be spelled two ways.
const withoutExtension = (path: string): string => {
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  return dot > slash + 1 ? path.slice(0, dot) : path;
};

const caseCollisions = (paths: readonly string[]): string[][] => {
  const spellings = new Map<string, Map<string, Set<string>>>();
  const add = (name: string, path: string) => {
    const key = name.toLowerCase();
    const known = spellings.get(key) ?? new Map<string, Set<string>>();
    known.set(name, (known.get(name) ?? new Set<string>()).add(path));
    spellings.set(key, known);
  };
  for (const path of paths) {
    add(withoutExtension(path), path);
    for (let slash = path.indexOf('/'); slash !== -1; slash = path.indexOf('/', slash + 1))
      add(path.slice(0, slash), path);
  }
  return [...spellings.values()]
    .filter((known) => known.size > 1)
    .map((known) => [...known.values()].map((found) => [...found].sort()[0] ?? '').sort());
};

describe('file names', () => {
  it('finds names that differ only in case', () => {
    expect(caseCollisions(['a/TableEnd.tsx', 'a/tableEnd.ts', 'a/tableEnd.test.ts'])).toEqual([
      ['a/TableEnd.tsx', 'a/tableEnd.ts'],
    ]);
    expect(caseCollisions(['a/Rooms/x.ts', 'a/rooms/y.ts'])).toEqual([
      ['a/Rooms/x.ts', 'a/rooms/y.ts'],
    ]);
    expect(caseCollisions(['a/Menu.tsx', 'a/menu/index.ts'])).toEqual([
      ['a/Menu.tsx', 'a/menu/index.ts'],
    ]);
  });

  it('allows one spelling with several extensions, and the same name in two folders', () => {
    expect(
      caseCollisions(['web/site.css', 'web/site.js', 'a/tableEnd.ts', 'b/TableEnd.tsx', '.env']),
    ).toEqual([]);
  });

  it('no two tracked files differ only in case', () => {
    const tracked = execFileSync('git', ['ls-files', '-z'], {
      cwd: resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\0')
      .filter(Boolean);
    expect(tracked.length).toBeGreaterThan(0);
    expect(caseCollisions(tracked)).toEqual([]);
  });
});
