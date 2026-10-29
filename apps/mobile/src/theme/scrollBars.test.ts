import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

// No scroll bar on any screen (the owner's call, 29 Ekim): every scrolling view and list turns
// both bars off.
const mobile = join(import.meta.dirname, '..', '..');
// A JSX tag, not a type argument (`useRef<ScrollView>`): nothing word-like right before its `<`.
const TAG =
  /(?<![\w.])<(ScrollView|FlatList|SectionList|Animated\.ScrollView|Reanimated\.ScrollView|Animated\.FlatList)(?=[\s>/])/g;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return name.endsWith('.tsx') ? [path] : [];
  });
}

// The opening tag from `start`, up to its `>` outside any `{}`.
function openingTag(source: string, start: number): string {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return source.slice(start, i);
  }
  return source.slice(start);
}

describe('no scroll bars', () => {
  const paths = ['app', 'src'].flatMap((d) => files(join(mobile, d)));

  it.each(paths.map((p) => relative(mobile, p)))('%s', (path) => {
    const source = readFileSync(join(mobile, path), 'utf8');
    const missing: string[] = [];
    for (const m of source.matchAll(TAG)) {
      const tag = openingTag(source, m.index);
      if (
        !tag.includes('showsVerticalScrollIndicator={false}') ||
        !tag.includes('showsHorizontalScrollIndicator={false}')
      ) {
        missing.push(`line ${source.slice(0, m.index).split('\n').length}: <${m[1]}>`);
      }
    }
    expect(missing).toEqual([]);
  });
});
