import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Faz 3 (docs/SPEC_V3.md §23.C): "oda" is never shown; everything is "masa". Every string literal
// and template text in tr.ts is read from its source (comments and import paths are not text
// the user sees); the server's names (`rooms`, `room_members`, `rooms/*`) stay in code.
describe('no "oda" in what the user sees', () => {
  it('has no word starting with "oda" in any text', () => {
    const file = fileURLToPath(new URL('./tr.ts', import.meta.url));
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
    const texts: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
        texts.push(node.text);
      if (ts.isTemplateExpression(node)) {
        texts.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text));
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
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
