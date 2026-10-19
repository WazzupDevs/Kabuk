import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { GAME_NAMES } from '../../../../supabase/functions/_shared/pure/brand.ts';

// Every string literal and template text in tr.ts, read from its source (comments, import paths
// and type literals such as the concept keys are not text the user sees).
function trTexts(): string[] {
  const file = fileURLToPath(new URL('./tr.ts', import.meta.url));
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isLiteralTypeNode(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) texts.push(node.text);
    if (ts.isTemplateExpression(node)) {
      texts.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return texts;
}

// Faz 3 (docs/SPEC_V3.md §23.C): "oda" is never shown; everything is "masa". Every string literal
// and template text in tr.ts is read from its source (comments and import paths are not text
// the user sees); the server's names (`rooms`, `room_members`, `rooms/*`) stay in code.
describe('no "oda" in what the user sees', () => {
  it('has no word starting with "oda" in any text', () => {
    const texts = trTexts();
    expect(texts.length).toBeGreaterThan(500);
    expect(texts.filter((text) => /(?<!\p{L})oda/iu.test(text))).toEqual([]);
  });

  it('would catch one', () => {
    const word = /(?<!\p{L})oda/iu;
    for (const text of ['Oda kur', 'Odadakiler', 'odana katılmak', 'sohbet odası']) {
      expect(word.test(text)).toBe(true);
    }
    for (const text of ['Bugün', 'today', 'Kodu gir', 'Masadakiler']) {
      expect(word.test(text)).toBe(false);
    }
  });
});

// Faz 4 (docs/SPEC_V4.md §4.C, step 4.3; K-5): "Tabu" is never shown. The game is "Kapsül Anlat"
// (GAME_NAMES), the rival's button "Yasak!"; code, tables, content files and the concept key
// (`tabu`) keep their names. The store texts are checked too.
describe('no "Tabu" in what the user sees', () => {
  const word = /(?<!\p{L})tabu/iu;
  const storeDir = fileURLToPath(new URL('../../../../docs/store/', import.meta.url));
  const legalDir = fileURLToPath(new URL('../../../../docs/legal/', import.meta.url));
  const pushFile = fileURLToPath(
    new URL('../../../../supabase/functions/_shared/pure/push.ts', import.meta.url),
  );

  it('has none in tr.ts, the game names or the store texts', () => {
    expect(trTexts().filter((text) => word.test(text))).toEqual([]);
    expect(Object.values(GAME_NAMES).filter((name) => word.test(name))).toEqual([]);
    const store = readdirSync(storeDir).filter((f) => f.endsWith('.md') || f.endsWith('.json'));
    expect(store.length).toBeGreaterThan(2);
    const lines = store.flatMap((f) =>
      readFileSync(storeDir + f, 'utf8')
        .split('\n')
        .filter((line) => word.test(line))
        .map((line) => `${f}: ${line}`),
    );
    expect(lines).toEqual([]);
  });

  it('has none in the push texts or the legal pages (the CTO review of 4.3a)', () => {
    const legal = readdirSync(legalDir).filter((f) => f.endsWith('.md'));
    expect(legal.length).toBeGreaterThan(2);
    const files = [...legal.map((f) => legalDir + f), pushFile];
    const lines = files.flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .filter((line) => word.test(line))
        .map((line) => `${path}: ${line}`),
    );
    expect(lines).toEqual([]);
  });

  it('would catch one', () => {
    for (const text of ['Sesli Tabu', 'Tabu −1', "Tabu'ya basar", 'tabu,oyun']) {
      expect(word.test(text)).toBe(true);
    }
    for (const text of ['Kapsül Anlat', 'Yasak!', 'tabular', 'Masa']) {
      expect(word.test(text)).toBe(text === 'tabular');
    }
  });
});
