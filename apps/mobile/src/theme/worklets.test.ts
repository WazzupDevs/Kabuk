import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// A worklet runs on the UI thread with the values it closes over copied there; a default
// parameter's module constant is not copied, and reading it throws ("Property 'CURVES' doesn't
// exist", E2E on WazzupDevs/Kabuk#141). So a worklet's default parameters are literals only.
const SRC = fileURLToPath(new URL('../', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

function isWorklet(body: ts.Node | undefined): boolean {
  if (!body || !ts.isBlock(body)) return false;
  const first = body.statements[0];
  return (
    !!first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'worklet'
  );
}

function literal(node: ts.Expression): boolean {
  return (
    ts.isNumericLiteral(node) ||
    ts.isStringLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand))
  );
}

// Defaults that name another parameter (`sy = sx`) are fine: parameters travel with the call.
function badDefaults(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  if (!text.includes("'worklet'")) return [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isFunctionLike(node) && 'body' in node && isWorklet(node.body as ts.Node | undefined)) {
      const names = new Set(node.parameters.map((p) => p.name.getText(source)));
      for (const p of node.parameters) {
        const init = p.initializer;
        if (!init || literal(init)) continue;
        if (ts.isIdentifier(init) && names.has(init.text)) continue;
        out.push(`${file.slice(SRC.length)}: ${p.getText(source)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

describe('worklets', () => {
  it('have only literal default parameters', () => {
    const all = files(SRC);
    expect(all.length).toBeGreaterThan(100);
    expect(all.flatMap(badDefaults)).toEqual([]);
  });
});
