import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { upperTr } from '../../../../supabase/functions/_shared/pure/trText.ts';
import { describe, expect, it } from 'vitest';

import { KINSHI, KINSHI_MIN_TYPE, KINSHI_TYPE, kinshiDeck, kinshiDeckHeight } from './kinshi';

describe('kinshiDeck', () => {
  it('is the panels’ card on 390 dp', () => {
    const d = kinshiDeck(390);
    expect(d.scale).toBe(1);
    expect(d.card).toEqual(KINSHI.card);
    expect(d.edges).toEqual([...KINSHI.edges]);
    expect(d.panel.width).toBe(KINSHI.panel.width);
  });

  it('is the screen less 94 at 320 dp, 3:4, the rest scaled with it', () => {
    const d = kinshiDeck(320);
    expect(d.card.width).toBe(226);
    expect(d.card.height).toBe(301);
    expect(d.edges.at(-1)).toBeCloseTo((15 * 226) / 296);
    expect(d.peek.above).toBeCloseTo((78 * 226) / 296);
    expect(d.panel.width).toBe(226 - 32);
  });

  it('never grows past the drawn card', () => {
    expect(kinshiDeck(430).card.width).toBe(KINSHI.card.width);
  });

  it('lets the words shrink no further than 22 and 16', () => {
    expect(KINSHI_TYPE.word.fontSize).toBe(30);
    expect(KINSHI_TYPE.forbidden.fontSize).toBe(20);
    expect(KINSHI_MIN_TYPE).toEqual({ word: 22, forbidden: 16 });
  });
});

describe('kinshiDeckHeight', () => {
  const d = kinshiDeck(320);
  const own = d.peek.above + d.card.height + d.shadow.below;

  it('is the buddies, the card and its shadow when nothing lies lower', () => {
    expect(kinshiDeckHeight(d)).toBeCloseTo(own);
    expect(kinshiDeckHeight(d, d.peek.above + d.card.height - 40)).toBeCloseTo(own);
  });

  // The guesser's panel at 320 dp with three long words (each on two lines) is 334 high from 96:
  // its foot at 430, below the card's (361). The counters go 37 under it, not behind it.
  it('reaches down to a panel that ends below the card', () => {
    expect(kinshiDeckHeight(d, 430)).toBeCloseTo(430 + d.shadow.below);
  });
});

// The cards as they are (content/tabu-cards.json), in the card's font (800, Plus Jakarta Sans) and
// letter spacing, upper-cased as the card draws them. Widths are an upper bound (no kerning).
describe('the cards at their smallest type', () => {
  const root = findRoot(dirname(fileURLToPath(import.meta.url)));
  const width = fontAdvance(
    join(
      root,
      'node_modules/@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf',
    ),
  );
  const cards = (
    JSON.parse(readFileSync(join(root, 'content/tabu-cards.json'), 'utf8')) as {
      cards: { word: string; forbidden: string[] }[];
    }
  ).cards;
  const space = (style: { letterSpacing?: number; fontSize?: number }, size: number) =>
    ((style.letterSpacing ?? 0) / (style.fontSize ?? size)) * size;
  const wordAt = (w: string) =>
    width(upperTr(w), KINSHI_MIN_TYPE.word, space(KINSHI_TYPE.word, KINSHI_MIN_TYPE.word));
  const forbiddenAt = (w: string) =>
    width(
      upperTr(w),
      KINSHI_MIN_TYPE.forbidden,
      space(KINSHI_TYPE.forbidden, KINSHI_MIN_TYPE.forbidden),
    );
  const band = (screen: number) => {
    const d = kinshiDeck(screen);
    return { word: d.card.width - 2 * d.wordBand.side, list: d.card.width - 2 * d.list.side };
  };

  it.each([320, 360, 390, 430])('every forbidden word fits one line at 16 on %i dp', (screen) => {
    const room = band(screen).list;
    expect(cards.flatMap((c) => c.forbidden).filter((w) => forbiddenAt(w) > room)).toEqual([]);
  });

  // Not fitting at 22 means Android ends the word in "…" (numberOfLines 1). These wait for the
  // design's answer (docs/decisions/kinshi-320dp.md → "Açık"); a new card must not add to them.
  it.each([
    [320, 11],
    [360, 4],
    [390, 1],
    [430, 1],
  ])('the words that do not fit at 22 on %i dp are the known %i', (screen, known) => {
    const room = band(screen).word;
    const over = cards.map((c) => c.word).filter((w) => wordAt(w) > room);
    expect(over.length).toBe(known);
    expect(over.every((w) => w.includes(' '))).toBe(true);
  });
});

function findRoot(from: string): string {
  let dir = from;
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const up = resolve(dir, '..');
    if (up === dir) throw new Error('no workspace root');
    dir = up;
  }
  return dir;
}

// The advance widths of a TrueType font (its `cmap` format 4 and `hmtx`), for tests that check
// whether a text fits a width. Kerning (GPOS) is left out: the width it gives is an upper bound of
// what the phone draws (kerning only brings letters closer in these fonts).
function fontAdvance(path: string): (text: string, size: number, spacing?: number) => number {
  const buf = readFileSync(path);
  const u16 = (o: number) => buf.readUInt16BE(o);
  const tables = new Map<string, number>();
  for (let i = 0; i < u16(4); i++) {
    const at = 12 + i * 16;
    tables.set(buf.toString('latin1', at, at + 4), buf.readUInt32BE(at + 8));
  }
  const table = (tag: string) => {
    const at = tables.get(tag);
    if (at === undefined) throw new Error(`no ${tag} table`);
    return at;
  };
  const unitsPerEm = u16(table('head') + 18);
  const metrics = u16(table('hhea') + 34);
  const hmtx = table('hmtx');
  const cmap = table('cmap');
  let sub = -1;
  for (let i = 0; i < u16(cmap + 2); i++) {
    const rec = cmap + 4 + i * 8;
    const at = cmap + buf.readUInt32BE(rec + 4);
    if (u16(rec) === 3 && u16(rec + 2) === 1 && u16(at) === 4) sub = at;
  }
  if (sub < 0) throw new Error('no cmap format 4');
  const segs = u16(sub + 6) / 2;
  const ends = sub + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const offsets = deltas + segs * 2;
  const glyph = (code: number): number => {
    for (let i = 0; i < segs; i++) {
      if (code > u16(ends + i * 2)) continue;
      const start = u16(starts + i * 2);
      if (code < start) return 0;
      const delta = buf.readInt16BE(deltas + i * 2);
      const ro = u16(offsets + i * 2);
      if (ro === 0) return (code + delta) & 0xffff;
      const g = u16(offsets + i * 2 + ro + (code - start) * 2);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  const advance = (g: number) => u16(hmtx + Math.min(g, metrics - 1) * 4);
  return (text, size, spacing = 0) => {
    let units = 0;
    let n = 0;
    for (const ch of text) {
      units += advance(glyph(ch.codePointAt(0) ?? 0));
      n++;
    }
    return (units / unitsPerEm) * size + n * spacing;
  };
}
