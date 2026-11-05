import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pickWords, SIGNUM, tooAlike } from '../../supabase/functions/_shared/pure/signum.ts';
import { parseProfanity } from './content.ts';
import { cardsSql } from './sections.ts';
import {
  buildSignumWidthsModule,
  MEASURED_CHARS,
  parseSignumWords,
  readSignumWords,
  SIGNUM_WIDTHS_MODULE,
  tileTextWidth,
} from './signum.ts';
import { SIGNUM_TILE_METRICS } from './signumWidths.generated.ts';

const root = resolve(import.meta.dirname, '../..');
const profanity = parseProfanity(
  JSON.parse(readFileSync(resolve(root, 'content/profanity-tr.json'), 'utf8')),
);
const words = readSignumWords(root, profanity);

// A seeded generator, so a failing board can be replayed.
function rng(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Made-up words of five letters, all different (bab eo, cab eo, …).
const filler = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const l = 'bcdfghjklmnprstvyz';
    return `${l[i % 18] ?? 'b'}a${l[Math.floor(i / 18) % 18] ?? 'b'}e${'ou'[Math.floor(i / 324)] ?? 'o'}`;
  });

describe('content/signum-words.json', () => {
  it('holds at least the pool a game needs, each word one word, written plainly, once', () => {
    expect(words.length).toBeGreaterThanOrEqual(SIGNUM.minPool);
    const keys = words.map((w) => w.toLocaleLowerCase('tr-TR'));
    expect(new Set(keys).size).toBe(words.length);
    for (const w of words) {
      expect(w).toMatch(/^\p{L}+$/u);
      expect(w.normalize('NFKC').trim()).toBe(w);
      expect([...w].length).toBeGreaterThanOrEqual(SIGNUM.minWordLength);
    }
  });

  it('fits every word on a tile at 320 dp', () => {
    const wide = words
      .map((w) => ({ w, px: tileTextWidth(w, SIGNUM_TILE_METRICS) }))
      .filter(({ px }) => px > SIGNUM.tileTextPx);
    expect(wide).toEqual([]);
  });

  it('gives 25 words no two of which are too alike, board after board', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const board = pickWords(words, rng(seed));
      expect(board).not.toBeNull();
      const b = board ?? [];
      expect(b).toHaveLength(SIGNUM.tiles);
      for (let i = 0; i < b.length; i++) {
        for (let j = i + 1; j < b.length; j++) expect(tooAlike(b[i] ?? '', b[j] ?? '')).toBe(false);
      }
    }
    // 500 boards take about 5 s on a CI runner, the default limit: the limit is raised, not the
    // boards cut.
  }, 30_000);

  it('refuses too few words, a phrase, a short word, a repeat, an unplain word and a listed word', () => {
    const many = filler(SIGNUM.minPool);
    expect(parseSignumWords({ words: many }, profanity)).toHaveLength(SIGNUM.minPool);
    expect(() => parseSignumWords({ words: many.slice(1) }, profanity)).toThrow('at least');
    expect(() => parseSignumWords({ words: [...many, 'Diş fırçası'] }, profanity)).toThrow(
      'one word',
    );
    expect(() => parseSignumWords({ words: [...many, 'E-posta'] }, profanity)).toThrow('one word');
    expect(() => parseSignumWords({ words: [...many, 'Su'] }, profanity)).toThrow('one word');
    expect(() => parseSignumWords({ words: [...many, 'İnek', 'inek'] }, profanity)).toThrow(
      'twice',
    );
    expect(() => parseSignumWords({ words: [...many, ' Kedi'] }, profanity)).toThrow('plainly');
    expect(() => parseSignumWords({ words: [...many, 'Ke​di'] }, profanity)).toThrow('plainly');
    const listed = profanity.wholeWords[0] ?? profanity.terms[0] ?? '';
    expect(() => parseSignumWords({ words: [...many, listed] }, profanity)).toThrow(
      'profanity list',
    );
  });

  it('seeds one card per word and retires the words left out', () => {
    const sql = cardsSql([], [], [], [], [], [], [], ['Kedi', 'Fil']);
    expect(sql).toContain("('signum', 'Kedi', 'Kedi', null, null, null)");
    expect(sql).toContain("('signum', 'Fil', 'Fil', null, null, null)");
    expect(sql).toContain(
      `update public.cards set is_active = false where deck = 'signum' and is_active and source_key <> all (array['Kedi', 'Fil']::text[]);`,
    );
  });
});

describe(SIGNUM_WIDTHS_MODULE, () => {
  it('is the table built from the font as it is now', async () => {
    expect(readFileSync(resolve(root, SIGNUM_WIDTHS_MODULE), 'utf8')).toBe(
      await buildSignumWidthsModule(root),
    );
  });

  it('measures every letter of both cases', () => {
    for (const c of MEASURED_CHARS) expect(SIGNUM_TILE_METRICS.advance[c]).toBeGreaterThan(0);
  });

  it('measures with kerning and letter spacing', () => {
    const m = SIGNUM_TILE_METRICS;
    const plain = (w: string) =>
      ([...w].reduce((n, c) => n + (m.advance[c] ?? 0), 0) / m.unitsPerEm) * 12 +
      [...w].length * 0.24;
    const pair = Object.keys(m.kern)[0] ?? '';
    expect(pair).toHaveLength(2);
    expect(tileTextWidth(pair, m)).toBeCloseTo(
      plain(pair) + ((m.kern[pair] ?? 0) / m.unitsPerEm) * 12,
      6,
    );
  });
});
