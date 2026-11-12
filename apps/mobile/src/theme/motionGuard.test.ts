import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { MOTION_ALLOWED } from './motionGuard.allowed';

// docs/design/iskelet.md → 2.3 and 4.2: screens and features take their motion and their presses
// from the motion kit (src/motion): no Reanimated, no React Native Animated and no bare Pressable
// imported straight into `app/**` or `src/features/**` (type-only imports aside). A ratchet: the
// files that still do are listed (motionGuard.allowed.ts) and move to the kit over time; a new one
// fails, and a listed file that no longer does must leave the list, so it cannot come back.
const mobile = join(import.meta.dirname, '..', '..');
const SOURCES = ['app', 'src/features'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const BANNED_NAMES: Record<string, readonly string[]> = {
  'react-native': ['Animated', 'Pressable'],
  'react-native-gesture-handler': ['Pressable'],
};

// What a file imports against the rule: Reanimated at all (but types), Animated or Pressable by name.
function motionImports(text: string): string[] {
  const source = ts.createSourceFile(
    'f.tsx',
    text,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const from = node.moduleSpecifier.text;
    const clause = node.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const bindings = clause.namedBindings;
    const named =
      bindings && ts.isNamedImports(bindings)
        ? bindings.elements.filter((e) => !e.isTypeOnly).map((e) => (e.propertyName ?? e.name).text)
        : [];
    if (from === 'react-native-reanimated') {
      const values =
        !!clause.name || (!!bindings && ts.isNamespaceImport(bindings)) || named.length > 0;
      if (values) found.push('react-native-reanimated');
      continue;
    }
    const banned = BANNED_NAMES[from];
    if (!banned) continue;
    for (const name of named) if (banned.includes(name)) found.push(`${from} → ${name}`);
  }
  return found;
}

const breaking = SOURCES.flatMap((d) => files(join(mobile, d)))
  .map((path) => relative(mobile, path).split('\\').join('/'))
  .filter((file) => motionImports(readFileSync(join(mobile, file), 'utf8')).length > 0)
  .sort();

describe('motion only from the kit (iskelet.md → 4.2)', () => {
  it('reads the imports', () => {
    expect(motionImports("import Animated, { FadeIn } from 'react-native-reanimated';")).toEqual([
      'react-native-reanimated',
    ]);
    expect(motionImports("import type { SharedValue } from 'react-native-reanimated';")).toEqual(
      [],
    );
    expect(motionImports("import { type SharedValue } from 'react-native-reanimated';")).toEqual(
      [],
    );
    expect(motionImports("import { Animated, View } from 'react-native';")).toEqual([
      'react-native → Animated',
    ]);
    expect(motionImports("import { Pressable as P } from 'react-native-gesture-handler';")).toEqual(
      ['react-native-gesture-handler → Pressable'],
    );
    expect(motionImports("import { View } from 'react-native';")).toEqual([]);
  });

  it('no new screen or feature imports motion or a bare Pressable', () => {
    const allowed = new Set(MOTION_ALLOWED);
    expect(breaking.filter((f) => !allowed.has(f))).toEqual([]);
  });

  it('a listed file that moved to the kit leaves the list', () => {
    const now = new Set(breaking);
    expect(MOTION_ALLOWED.filter((f) => !now.has(f))).toEqual([]);
  });

  it('the list is sorted and without repeats', () => {
    expect([...MOTION_ALLOWED]).toEqual([...new Set(MOTION_ALLOWED)].sort());
  });
});
