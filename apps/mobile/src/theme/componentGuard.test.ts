import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { OLD_AVATAR_ALLOWED, OLD_TEXT_ALLOWED, RAW_INPUT_ALLOWED } from './componentGuard.allowed';

// docs/decisions/temel.md (21 Kasım): one shared part for each role. The files that still take an
// older one are listed (componentGuard.allowed.ts); a new one fails, and a listed file that no
// longer takes it must leave the list, so the list only shrinks.
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

const RULES = [
  {
    name: 'the older Text (components/Text)',
    self: 'src/components/Text.tsx',
    takes: /from '(?:@\/components|\.)\/Text'/,
    allowed: OLD_TEXT_ALLOWED,
  },
  {
    name: 'the older Avatar (components/Avatar)',
    self: 'src/components/Avatar.tsx',
    takes: /from '(?:@\/components|\.)\/Avatar'/,
    allowed: OLD_AVATAR_ALLOWED,
  },
  {
    name: 'a bare TextInput (a field is components/Field.tsx)',
    self: 'src/components/Field.tsx',
    takes: /<TextInput\b/,
    allowed: RAW_INPUT_ALLOWED,
  },
] as const;

describe.each(RULES)('$name', ({ self, takes, allowed }) => {
  const using = sources
    .filter((s) => s.file !== self && takes.test(s.text))
    .map((s) => s.file)
    .sort();

  it('no new file takes it', () => {
    const list = new Set(allowed);
    expect(using.filter((f) => !list.has(f))).toEqual([]);
  });

  it('a listed file that no longer takes it leaves the list', () => {
    const now = new Set(using);
    expect(allowed.filter((f) => !now.has(f))).toEqual([]);
  });

  it('the list is sorted and without repeats', () => {
    expect([...allowed]).toEqual([...new Set(allowed)].sort());
  });
});
