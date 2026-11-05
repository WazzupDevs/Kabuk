// Reads what a line of text needs to be measured from a TrueType font: each character's advance
// width (cmap + hmtx) and the pair adjustments of the font's 'kern' feature (GPOS pair positioning,
// formats 1 and 2, also behind extension lookups). No shaping beyond that: the words measured with
// it are plain letters. Its widths match Chromium's to 0.02 px for the Signum words (checked when
// the table was made, 5 Kasım 2026).
import { readFileSync } from 'node:fs';

export type FontMetrics = {
  unitsPerEm: number;
  // character → advance width, in font units
  advance: Record<string, number>;
  // "ab" → the x advance adjustment of a followed by b, in font units (non-zero pairs only)
  kern: Record<string, number>;
};

export function readFontMetrics(path: string, chars: readonly string[]): FontMetrics {
  const buf = readFileSync(path);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o: number) => view.getUint16(o);
  const i16 = (o: number) => view.getInt16(o);
  const u32 = (o: number) => view.getUint32(o);

  const tables = new Map<string, number>();
  for (let i = 0; i < u16(4); i++) {
    const r = 12 + i * 16;
    tables.set(buf.toString('latin1', r, r + 4), u32(r + 8));
  }
  const table = (tag: string): number => {
    const o = tables.get(tag);
    if (o === undefined) throw new Error(`${path}: no ${tag} table`);
    return o;
  };

  const unitsPerEm = u16(table('head') + 18);
  const hMetrics = u16(table('hhea') + 34);
  const hmtx = table('hmtx');
  const advanceOf = (glyph: number) => u16(hmtx + 4 * Math.min(glyph, hMetrics - 1));

  const glyphOf = cmapLookup(table('cmap'), u16, i16, u32);
  const glyphs = new Map<string, number>();
  for (const c of chars) {
    const g = glyphOf(c.codePointAt(0) ?? 0);
    if (g === 0) throw new Error(`${path}: no glyph for "${c}"`);
    glyphs.set(c, g);
  }

  const advance: Record<string, number> = {};
  for (const [c, g] of glyphs) advance[c] = advanceOf(g);

  const kern: Record<string, number> = {};
  if (tables.has('GPOS')) {
    const pair = pairAdjustments(table('GPOS'), buf, u16, i16, u32);
    for (const [a, ga] of glyphs) {
      for (const [b, gb] of glyphs) {
        const x = pair(ga, gb);
        if (x !== 0) kern[a + b] = x;
      }
    }
  }
  return { unitsPerEm, advance, kern };
}

type Reader = (o: number) => number;

// Unicode → glyph from the Windows Unicode subtable (format 12 if there is one, else format 4).
function cmapLookup(cmap: number, u16: Reader, i16: Reader, u32: Reader): (cp: number) => number {
  let sub = -1;
  let format = 0;
  for (let i = 0; i < u16(cmap + 2); i++) {
    const r = cmap + 4 + i * 8;
    const offset = cmap + u32(r + 4);
    const f = u16(offset);
    const windowsUnicode = u16(r) === 3 && (u16(r + 2) === 1 || u16(r + 2) === 10);
    if (windowsUnicode && (f === 12 || (f === 4 && format !== 12))) {
      sub = offset;
      format = f;
    }
  }
  if (sub < 0) throw new Error('no Unicode cmap');
  if (format === 12) {
    return (cp) => {
      for (let i = 0; i < u32(sub + 12); i++) {
        const g = sub + 16 + i * 12;
        if (cp >= u32(g) && cp <= u32(g + 4)) return u32(g + 8) + cp - u32(g);
      }
      return 0;
    };
  }
  const segX2 = u16(sub + 6);
  const ends = sub + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  return (cp) => {
    for (let i = 0; i < segX2 / 2; i++) {
      if (cp > u16(ends + 2 * i)) continue;
      const start = u16(starts + 2 * i);
      if (cp < start) return 0;
      const range = u16(ranges + 2 * i);
      if (range === 0) return (cp + i16(deltas + 2 * i)) & 0xffff;
      const g = u16(ranges + 2 * i + range + 2 * (cp - start));
      return g === 0 ? 0 : (g + i16(deltas + 2 * i)) & 0xffff;
    }
    return 0;
  };
}

// The x advance adjustment of glyph a followed by glyph b under the 'kern' feature's pair lookups.
function pairAdjustments(
  gpos: number,
  buf: Buffer,
  u16: Reader,
  i16: Reader,
  u32: Reader,
): (a: number, b: number) => number {
  const features = gpos + u16(gpos + 6);
  const lookupList = gpos + u16(gpos + 8);
  const lookups = new Set<number>();
  for (let i = 0; i < u16(features); i++) {
    const r = features + 2 + i * 6;
    if (buf.toString('latin1', r, r + 4) !== 'kern') continue;
    const f = features + u16(r + 4);
    for (let j = 0; j < u16(f + 2); j++) lookups.add(u16(f + 4 + 2 * j));
  }

  const subtables: number[] = [];
  for (const index of [...lookups].sort((x, y) => x - y)) {
    const lookup = lookupList + u16(lookupList + 2 + 2 * index);
    for (let s = 0; s < u16(lookup + 4); s++) {
      let st = lookup + u16(lookup + 6 + 2 * s);
      let type = u16(lookup);
      if (type === 9) {
        type = u16(st + 2);
        st += u32(st + 4);
      }
      if (type === 2) subtables.push(st);
    }
  }

  const coverageIndex = (o: number, glyph: number): number => {
    if (u16(o) === 1) {
      for (let i = 0; i < u16(o + 2); i++) if (u16(o + 4 + 2 * i) === glyph) return i;
      return -1;
    }
    for (let i = 0; i < u16(o + 2); i++) {
      const r = o + 4 + i * 6;
      if (glyph >= u16(r) && glyph <= u16(r + 2)) return u16(r + 4) + glyph - u16(r);
    }
    return -1;
  };
  const classOf = (o: number, glyph: number): number => {
    if (u16(o) === 1) {
      const first = u16(o + 2);
      return glyph >= first && glyph < first + u16(o + 4) ? u16(o + 6 + 2 * (glyph - first)) : 0;
    }
    for (let i = 0; i < u16(o + 2); i++) {
      const r = o + 4 + i * 6;
      if (glyph >= u16(r) && glyph <= u16(r + 2)) return u16(r + 4);
    }
    return 0;
  };
  const recordSize = (format: number) => {
    let size = 0;
    for (let bit = 0; bit < 8; bit++) if (format & (1 << bit)) size += 2;
    return size;
  };
  // XAdvance (0x0004) of a value record, after XPlacement (0x0001) and YPlacement (0x0002).
  const xAdvance = (o: number, format: number) =>
    format & 4 ? i16(o + (format & 1 ? 2 : 0) + (format & 2 ? 2 : 0)) : 0;

  return (a, b) => {
    for (const st of subtables) {
      const index = coverageIndex(st + u16(st + 2), a);
      if (index < 0) continue;
      const first = u16(st + 4);
      const size = recordSize(first) + recordSize(u16(st + 6));
      if (u16(st) === 1) {
        const set = st + u16(st + 10 + 2 * index);
        for (let k = 0; k < u16(set); k++) {
          const r = set + 2 + k * (2 + size);
          if (u16(r) === b) return xAdvance(r + 2, first);
        }
        continue; // not in this subtable's pair set: the next subtable may have it
      }
      const c1 = classOf(st + u16(st + 8), a);
      const c2 = classOf(st + u16(st + 10), b);
      return xAdvance(st + 16 + (c1 * u16(st + 14) + c2) * size, first);
    }
    return 0;
  };
}
