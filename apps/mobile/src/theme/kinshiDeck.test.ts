import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { upperTr } from '../../../../supabase/functions/_shared/pure/trText.ts';
import { describe, expect, it } from 'vitest';

import { KIT, KIT_TYPE } from './auraKit';
import { TABU_GAME, TABU_POINTS } from '../../../../supabase/functions/_shared/pure/tabuGame.ts';
import {
  KINSHI,
  KINSHI_MIN_TYPE,
  KINSHI_SCORE_FONT,
  KINSHI_TYPE,
  kinshiBand,
  kinshiDeck,
  kinshiDeckHeight,
  kinshiScene,
  kinshiScorePill,
} from './kinshi';
import { KINSHI_WORD, KINSHI_WORD_FONT, kinshiWordLayout } from './kinshiWord';

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

// The cards as they are (content/tabu-cards.json), measured in the card's font (Plus Jakarta Sans
// 800, read from the font file here) and letter spacing, upper-cased as the card draws them.
// Widths leave kerning out: an upper bound of what the phone draws.
const root = findRoot(dirname(fileURLToPath(import.meta.url)));
const fonts = join(root, 'node_modules/@expo-google-fonts/plus-jakarta-sans');
const heavy = readFont(join(fonts, '800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'));
const semi = readFont(join(fonts, '600SemiBold/PlusJakartaSans_600SemiBold.ttf'));
const cards = (
  JSON.parse(readFileSync(join(root, 'content/tabu-cards.json'), 'utf8')) as {
    cards: { word: string; forbidden: string[] }[];
  }
).cards;
const SCREENS = [320, 360, 390, 430] as const;
const band = (screen: number) => {
  const d = kinshiDeck(screen);
  return { ...kinshiBand(d), d, list: d.card.width - 2 * d.list.side };
};
const spacing = (style: { letterSpacing?: number; fontSize?: number }, size: number) =>
  ((style.letterSpacing ?? 0) / (style.fontSize ?? size)) * size;

describe('the card font table', () => {
  it('is the font file’s advances and ink', () => {
    expect(KINSHI_WORD_FONT.unitsPerEm).toBe(heavy.unitsPerEm);
    expect([KINSHI_WORD_FONT.ascent, KINSHI_WORD_FONT.descent]).toEqual([
      heavy.ascent,
      heavy.descent,
    ]);
    for (const [ch, metrics] of Object.entries(KINSHI_WORD_FONT.glyphs)) {
      expect([ch, ...metrics]).toEqual([ch, ...heavy.glyph(ch)]);
    }
  });

  it('knows every letter of every word', () => {
    const missing = new Set(
      cards.flatMap((c) => [...upperTr(c.word)]).filter((ch) => !(ch in KINSHI_WORD_FONT.glyphs)),
    );
    expect([...missing]).toEqual([]);
  });

  it('spaces the letters as the canvas', () => {
    expect(KINSHI_WORD.spacing).toBeCloseTo(KINSHI_TYPE.word.letterSpacing ?? 0);
    expect(KINSHI_WORD.size).toBe(KINSHI_TYPE.word.fontSize);
    expect(KINSHI_WORD.min).toBe(KINSHI_MIN_TYPE.word);
  });
});

describe.each(SCREENS)('every card on %i dp', (screen) => {
  const b = band(screen);
  const at = (text: string, size: number) => heavy.width(text, size, KINSHI_WORD.spacing);

  // No word is cut: one line at 22 or more, or two lines, each at the size drawn, in the band.
  it('fits its word without a cut', () => {
    const cut = cards
      .map((c) => upperTr(c.word))
      .filter((w) => {
        const l = kinshiWordLayout(w, b);
        if (l.lines === 1) return at(w, KINSHI_MIN_TYPE.word) > b.width;
        return (
          l.fontSize < KINSHI_MIN_TYPE.word ||
          `${l.text[0]} ${l.text[1]}` !== w ||
          l.text.some((line) => at(line, l.fontSize) > b.width)
        );
      });
    expect(cut).toEqual([]);
  });

  // Two lines: centred in the pink band, inside it (so off the riso's edges and well above the
  // forbidden list, 26 under the band), and the first line's lowest ink clear of the second's top.
  it('keeps two lines inside the pink band, apart', () => {
    for (const c of cards) {
      const w = upperTr(c.word);
      const l = kinshiWordLayout(w, b);
      if (l.lines === 1) continue;
      expect(l.ink, w).toBeLessThanOrEqual(b.height);
      // Its ink inside the band, and inside the pink unless only the band holds it at 22.
      const top = l.top + inkOffset(l);
      expect(top, w).toBeGreaterThanOrEqual(-0.01);
      expect(top + l.ink, w).toBeLessThanOrEqual(b.height + 0.01);
      if (l.room !== 'band') {
        expect(top, w).toBeGreaterThanOrEqual(b.pink.top - 0.01);
        expect(top + l.ink, w).toBeLessThanOrEqual(b.pink.top + b.pink.height + 0.01);
      }
      if (l.room !== 'breath') expect(l.fontSize, w).toBe(KINSHI_MIN_TYPE.word);
      const first = heavy.ink(l.text[0]);
      const second = heavy.ink(l.text[1]);
      const gap = l.lineHeight - (l.fontSize * (first.bottom + second.top)) / heavy.unitsPerEm;
      expect(gap, w).toBeGreaterThanOrEqual(KINSHI_WORD.lineGap);
    }
  });

  it('fits every forbidden word one line at 16', () => {
    const size = KINSHI_MIN_TYPE.forbidden;
    const space = spacing(KINSHI_TYPE.forbidden, size);
    const over = cards
      .flatMap((c) => c.forbidden)
      .filter((w) => heavy.width(upperTr(w), size, space) > b.list);
    expect(over).toEqual([]);
  });
});

// From the text's box top to its ink's top on Android (half the leading above the ascent).
function inkOffset(l: { text: readonly [string, string]; fontSize: number; lineHeight: number }) {
  const f = l.fontSize / heavy.unitsPerEm;
  const baseline = (l.lineHeight + f * (heavy.ascent - heavy.descent)) / 2;
  return baseline - f * heavy.ink(l.text[0]).top;
}

// Where two lines go on each width: the pink with a breath, the pink, or (at 22) the band.
it('fits two lines to the pink except two phrases at 22 on 320 dp', () => {
  const rooms = SCREENS.flatMap((screen) => {
    const b = band(screen);
    return cards.flatMap((c) => {
      const l = kinshiWordLayout(upperTr(c.word), b);
      return l.lines === 2 && l.room === 'band' ? [`${screen} ${c.word}`] : [];
    });
  });
  expect(rooms).toEqual(['320 Hayvanat bahçesi', '320 Emniyet kemeri']);
});

describe('the canvas’s card on 390 dp', () => {
  // Only the one phrase that cannot fit one line at 22 there goes on two; every other word is
  // drawn as before (800/30, shrinking on one line).
  it('draws every word as before but Hayvanat bahçesi', () => {
    const b = band(390);
    const two = cards.map((c) => c.word).filter((w) => kinshiWordLayout(upperTr(w), b).lines === 2);
    expect(two).toEqual(['Hayvanat bahçesi']);
  });

  it('puts Hayvanat bahçesi on two lines at the full 30', () => {
    const b = band(390);
    const l = kinshiWordLayout(upperTr('Hayvanat bahçesi'), b);
    expect(l.lines === 2 && l.text).toEqual(['HAYVANAT', 'BAHÇESİ']);
    expect(l.lines === 2 && l.fontSize).toBeGreaterThanOrEqual(KINSHI_MIN_TYPE.word);
  });
});

// The two phrases that only the band holds on 320 dp: two lines at 22 with 2 dp between them
// need more than the space between the ribbon's black lines (59.33 of the 296 card, 45.30 here).
// Ink height at its least = 22 × (first line's top + its bottom + second's top + its bottom) + 2.
it('cannot keep Hayvanat bahçesi and Emniyet kemeri off the outline at 22 on 320 dp', () => {
  const b = band(320);
  const least = (a: string, c: string) => {
    const [x, y] = [heavy.ink(a), heavy.ink(c)];
    return (KINSHI_MIN_TYPE.word * (x.top + x.bottom + y.top + y.bottom)) / heavy.unitsPerEm + 2;
  };
  expect(b.pink.height).toBeCloseTo(45.3, 1);
  expect(least('HAYVANAT', 'BAHÇESİ') - b.pink.height).toBeCloseTo(0.13, 2);
  expect(least('EMNİYET', 'KEMERİ') - b.pink.height).toBeCloseTo(0.22, 2);
});

// The score pill between the close and the chat rounds (44 each, 20 in from the screen's sides).
// The scores run from −120 to 120: Yasak! takes 1 (TABU_POINTS), a turn closes at most the 40 cards
// dealt, a team plays 3 of the 6 turns.
describe('the score pill', () => {
  const kit = { side: KIT.size.side, round: KIT.size.round, edge: KIT.size.edge };
  const figure = heavy.named('zero.tf');

  it('reads its numbers’ widths from the font', () => {
    for (const name of ['zero.tf', 'one.tf', 'four.tf', 'seven.tf', 'nine.tf'])
      expect(heavy.named(name)).toBe(KINSHI_SCORE_FONT.figure);
    expect(figure).toBe(KINSHI_SCORE_FONT.figure);
    expect(heavy.glyph('-')[0]).toBe(KINSHI_SCORE_FONT.minus);
  });

  it('allows its chip no less than "Tur n/6" needs', () => {
    for (let n = 1; n <= TABU_GAME.totalTurns; n++) {
      const text = semi.width(`Tur ${n}/${TABU_GAME.totalTurns}`, KIT_TYPE.chip.fontSize ?? 13, 0);
      expect(2 * KIT.size.chipPadX + 2 * KIT.size.edge + text).toBeLessThanOrEqual(
        KINSHI.scoreTight.chipMax,
      );
    }
  });

  it('runs from −120 to 120', () => {
    const most = TABU_GAME.cardsPerTurn * (TABU_GAME.totalTurns / 2);
    expect(most * TABU_POINTS.taboo).toBe(-120);
    expect(most * TABU_POINTS.correct).toBe(120);
  });

  const SCORES = [-120, -100, -99, -9, 0, 9, 99, 100, 120];
  const pairs = SCORES.flatMap((a) => SCORES.map((b) => [a, b] as const));

  it.each([360, 390, 430])('stays between the rounds for every score on %i dp', (screen) => {
    expect(pairs.filter(([a, b]) => !kinshiScorePill(a, b, screen, kit).fits)).toEqual([]);
  });

  // On 320 dp (184 of room) it stays between the rounds, its spaces closing, while the two numbers
  // together are no wider than "-99" and "99" or "100" and "100"; wider pairs (both teams far below
  // zero, or one at −100 or under beside a two- or three-digit score) send it under them.
  it('goes under the rounds on 320 dp only for the widest pairs', () => {
    const at = (a: number, b: number) => kinshiScorePill(a, b, 320, kit).fits;
    for (const [a, b] of [
      [99, 99],
      [-9, -9],
      [-9, 99],
      [100, 100],
      [120, 120],
      [-99, 99],
      [-99, 120],
      [-120, 9],
    ] as const)
      expect(at(a, b), `${a} ${b}`).toBe(true);
    for (const [a, b] of [
      [-99, -99],
      [-100, -100],
      [-120, -120],
      [-100, 100],
      [-120, -9],
    ] as const)
      expect(at(a, b), `${a} ${b}`).toBe(false);
    const inline = pairs.filter(([a, b]) => a >= -9 && b >= -9 && a <= 99 && b <= 99);
    expect(inline.every(([a, b]) => at(a, b))).toBe(true);
  });

  it('never crowds the rounds when it stays between them', () => {
    for (const screen of SCREENS)
      for (const [a, b] of pairs) {
        const p = kinshiScorePill(a, b, screen, kit);
        if (p.fits) expect(p.tightest).toBeLessThanOrEqual(p.room);
      }
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

// A TrueType font's advance widths and ink (`cmap` format 4, `hmtx`, `loca`, `glyf`), and its
// hhea ascender and descender. Kerning (GPOS) is left out.
function readFont(path: string) {
  const buf = readFileSync(path);
  const u16 = (o: number) => buf.readUInt16BE(o);
  const i16 = (o: number) => buf.readInt16BE(o);
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
  const head = table('head');
  const unitsPerEm = u16(head + 18);
  const longLoca = i16(head + 50) === 1;
  const hhea = table('hhea');
  const metrics = u16(hhea + 34);
  const hmtx = table('hmtx');
  const loca = table('loca');
  const glyf = table('glyf');
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
  const id = (code: number): number => {
    for (let i = 0; i < segs; i++) {
      if (code > u16(ends + i * 2)) continue;
      const start = u16(starts + i * 2);
      if (code < start) return 0;
      const delta = i16(deltas + i * 2);
      const ro = u16(offsets + i * 2);
      if (ro === 0) return (code + delta) & 0xffff;
      const g = u16(offsets + i * 2 + ro + (code - start) * 2);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  const at = (g: number) => (longLoca ? buf.readUInt32BE(loca + g * 4) : u16(loca + g * 2) * 2);
  const glyph = (ch: string): [number, number, number] => {
    const g = id(ch.codePointAt(0) ?? 0);
    if (g === 0) throw new Error(`no glyph for ${ch}`);
    const advance = u16(hmtx + Math.min(g, metrics - 1) * 4);
    if (at(g + 1) === at(g)) return [advance, 0, 0];
    return [advance, i16(glyf + at(g) + 8), i16(glyf + at(g) + 4)];
  };
  // A glyph's advance by its name in the `post` table (format 2), e.g. the tabular `zero.tf`.
  const named = (name: string): number => {
    const post = table('post');
    const n = u16(post + 32);
    let o = post + 34 + n * 2;
    const names: string[] = [];
    for (let g = 0; g < n; g++) {
      const index = u16(post + 34 + g * 2);
      while (index >= 258 && names.length <= index - 258) {
        const len = buf[o] ?? 0;
        names.push(buf.toString('latin1', o + 1, o + 1 + len));
        o += len + 1;
      }
      if (index >= 258 && names[index - 258] === name)
        return u16(hmtx + Math.min(g, metrics - 1) * 4);
    }
    throw new Error(`no glyph named ${name}`);
  };
  return {
    unitsPerEm,
    named,
    ascent: i16(hhea + 4),
    descent: -i16(hhea + 6),
    glyph,
    width(text: string, size: number, spacing: number) {
      let units = 0;
      let n = 0;
      for (const ch of text) {
        units += glyph(ch)[0];
        n++;
      }
      return (units / unitsPerEm) * size + n * spacing;
    },
    ink(text: string) {
      const g = [...text].map(glyph);
      return {
        top: Math.max(0, ...g.map((x) => x[1])),
        bottom: Math.max(0, ...g.map((x) => -x[2])),
      };
    },
  };
}

// The 3-2-1's buddies and Oyun sonu's buddies and confetti on narrow screens: on the screen, laid
// out as drawn (every place and overlap the 390 panel's times the scale).
describe('kinshiScene', () => {
  const across = (
    p: { left?: number; right?: number; height: number },
    width: number,
  ): [number, number] => {
    const w = p.height * KINSHI.buddyRatio;
    const left = p.left ?? width - (p.right ?? 0) - w;
    return [left, left + w];
  };
  const overlaps = (spans: [number, number][]) => {
    const sorted = [...spans].sort((x, y) => x[0] - y[0]);
    return sorted.slice(1).map((s, i) => Math.max(0, (sorted[i]?.[1] ?? 0) - s[0]));
  };

  it('is the panel on 390 dp and wider', () => {
    for (const screen of [390, 430]) {
      const s = kinshiScene(screen);
      expect(s.scale).toBe(1);
      expect(s.countdownBuddies.places).toEqual([...KINSHI.countdownBuddies.places]);
      expect(s.confetti).toEqual([...KINSHI.endScene.confetti]);
    }
  });

  it.each([320, 360])('keeps the scene on %i dp, as drawn', (screen) => {
    const s = kinshiScene(screen);
    const k = screen / 390;
    for (const places of [s.countdownBuddies.places, s.endBuddies]) {
      const spans = places.map((p) => across(p, screen));
      for (const [l, r] of spans) {
        expect(l).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(screen);
      }
      const drawn = (
        places === s.endBuddies ? KINSHI.endScene.buddies : KINSHI.countdownBuddies.places
      ).map((p) => across(p, 390));
      overlaps(spans).forEach((o, i) => expect(o).toBeCloseTo((overlaps(drawn)[i] ?? 0) * k));
    }
    for (const b of s.confetti) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.left + KINSHI.endScene.bar.width).toBeLessThanOrEqual(screen);
    }
  });
});
