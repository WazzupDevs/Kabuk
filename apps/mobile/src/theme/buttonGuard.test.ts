import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { BUTTON_ALLOWED } from './buttonGuard.allowed';

// docs/design/iskelet.md → 2.1: every button is the kit's Btn (src/aura/kit.tsx); components/Button
// is its thin wrapper for the files that still take it. A ratchet: those files are listed
// (buttonGuard.allowed.ts); a new one fails, and a listed file that no longer imports it must leave
// the list, so it cannot come back. A type-only import (IconName) does not count.
const mobile = join(import.meta.dirname, '..', '..');
const SOURCES = ['app', 'src'];
const SELF = 'src/components/Button.tsx';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const BUTTON_MODULE = /(^|\/)components\/Button$|^\.\/Button$/;

// Whether a file imports a value (not only types) from components/Button.
function importsButton(text: string): boolean {
  const source = ts.createSourceFile(
    'f.tsx',
    text,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  return source.statements.some((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return false;
    if (!BUTTON_MODULE.test(node.moduleSpecifier.text)) return false;
    const clause = node.importClause;
    if (!clause || clause.isTypeOnly) return false;
    if (clause.name) return true;
    const bindings = clause.namedBindings;
    if (!bindings) return false;
    if (ts.isNamespaceImport(bindings)) return true;
    return bindings.elements.some((e) => !e.isTypeOnly);
  });
}

const importing = SOURCES.flatMap((d) => files(join(mobile, d)))
  .map((path) => relative(mobile, path).split('\\').join('/'))
  .filter((file) => file !== SELF && importsButton(readFileSync(join(mobile, file), 'utf8')))
  .sort();

describe('buttons from the kit (iskelet.md → 2.1)', () => {
  it('reads the imports', () => {
    expect(importsButton("import { Button } from '@/components/Button';")).toBe(true);
    expect(importsButton("import { Button } from './Button';")).toBe(true);
    expect(importsButton("import type { IconName } from './Button';")).toBe(false);
    expect(importsButton("import { type IconName } from '@/components/Button';")).toBe(false);
    expect(importsButton("import { Btn } from '@/aura/kit';")).toBe(false);
  });

  it('no new file imports components/Button', () => {
    const allowed = new Set(BUTTON_ALLOWED);
    expect(importing.filter((f) => !allowed.has(f))).toEqual([]);
  });

  it('a listed file that moved to Btn leaves the list', () => {
    const now = new Set(importing);
    expect(BUTTON_ALLOWED.filter((f) => !now.has(f))).toEqual([]);
  });

  it('the list is sorted and without repeats', () => {
    expect([...BUTTON_ALLOWED]).toEqual([...new Set(BUTTON_ALLOWED)].sort());
  });
});
