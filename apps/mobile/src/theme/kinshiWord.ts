// The card's word in its pink band (the project owner's decision of 5 Kasım, after the 320 dp
// audit): a word that fits one line at 22 or more stays as the canvas draws it (800/30, shrinking on
// one line); a phrase that does not goes on two lines, never under 22, never cut, centred, its
// line pitch taken from its own letters in the card's font, and the two lines inside the band.

// Plus Jakarta Sans 800 (the card's font) per character, in font units of 1000: advance width, top
// and bottom of the ink. `kinshiDeck.test.ts` reads them again from the font file and compares.
export const KINSHI_WORD_FONT = {
  unitsPerEm: 1000,
  // hhea ascender and descender: where Android puts the baseline in a line box.
  ascent: 1038,
  descent: 222,
  glyphs: {
    ' ': [180, 0, 0],
    '!': [400, 745, 0],
    '&': [813, 757, -12],
    "'": [333, 745, 440],
    '-': [634, 338, 208],
    '.': [408, 150, 0],
    '0': [700, 757, -12],
    '1': [413, 745, 0],
    '2': [596, 757, 0],
    '3': [612, 745, -12],
    '4': [662, 745, 0],
    '5': [614, 745, -12],
    '6': [604, 745, -12],
    '7': [564, 745, 0],
    '8': [633, 757, -12],
    '9': [604, 757, 0],
    '?': [611, 757, 0],
    A: [732, 745, 0],
    B: [690, 745, 0],
    C: [772, 757, -12],
    D: [739, 745, 0],
    E: [589, 745, 0],
    F: [587, 745, 0],
    G: [804, 757, -12],
    H: [732, 745, 0],
    I: [287, 745, 0],
    J: [396, 745, 0],
    K: [687, 745, 0],
    L: [547, 745, 0],
    M: [912, 745, 0],
    N: [742, 745, 0],
    O: [878, 757, -12],
    P: [649, 745, 0],
    Q: [878, 757, -90],
    R: [667, 745, 0],
    S: [647, 757, -12],
    T: [552, 745, 0],
    U: [724, 745, -12],
    V: [712, 745, 0],
    W: [1032, 745, 0],
    X: [682, 745, 0],
    Y: [672, 745, 0],
    Z: [567, 745, 0],
    Ç: [772, 757, -240],
    Ö: [878, 989, -12],
    Ü: [724, 989, -12],
    Ğ: [804, 1014, -12],
    İ: [287, 989, 0],
    Ş: [647, 757, -240],
  } as Record<string, readonly [number, number, number]>,
} as const;

// A character the table does not know counts as the widest and tallest one: the layout errs on
// the side of two lines, never of a cut.
const UNKNOWN = [1032, 1014, -240] as const;
const glyph = (ch: string) => KINSHI_WORD_FONT.glyphs[ch] ?? UNKNOWN;

export const KINSHI_WORD = {
  size: 30,
  min: 22,
  // The canvas's letter spacing (0.01 em of 30): Android keeps it in pixels when the word shrinks.
  spacing: 0.3,
  // Room left at the band's sides for the phone's rounding (the table has no kerning, which only
  // ever narrows these letters, so its widths are already an upper bound).
  margin: 1,
  // Clear space between the first line's lowest ink and the second's highest.
  lineGap: 2,
  // Clear pink kept above and below two lines when they fit with it (scaled with the card).
  breath: 2,
  step: 0.5,
} as const;

export function wordWidth(text: string, size: number): number {
  let units = 0;
  let n = 0;
  for (const ch of text) {
    units += glyph(ch)[0];
    n++;
  }
  return (units / KINSHI_WORD_FONT.unitsPerEm) * size + n * KINSHI_WORD.spacing;
}

const inkTop = (text: string) => Math.max(0, ...[...text].map((ch) => glyph(ch)[1]));
const inkBottom = (text: string) => Math.max(0, ...[...text].map((ch) => -glyph(ch)[2]));

export type KinshiWordLayout =
  | { lines: 1 }
  | {
      lines: 2;
      text: readonly [string, string];
      fontSize: number;
      lineHeight: number;
      // The two together, for the Text's style.
      type: { fontSize: number; lineHeight: number };
      // Where the text's box starts from the band's top so that its ink sits in the pink's middle.
      top: number;
      // The ink's height (the two lines from the first's top to the second's bottom) and which
      // room it was fitted to: the pink less a breath at its edges, the pink, or (only at 22, when
      // nothing else holds it) the band with the ribbon's outline.
      ink: number;
      room: 'breath' | 'pink' | 'band';
    };

// The band's box (`d.wordBand`) and the pink inside the ribbon's outline in it (`d.wordPink`), and
// the card's scale for the breath.
export type KinshiBand = {
  width: number;
  height: number;
  pink: { top: number; height: number };
  scale: number;
};

// `text` is the word as drawn (upper-cased).
export function kinshiWordLayout(text: string, band: KinshiBand): KinshiWordLayout {
  const room = band.width - KINSHI_WORD.margin;
  if (wordWidth(text, KINSHI_WORD.min) <= room) return { lines: 1 };
  const spaces: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === ' ') spaces.push(i);
  if (spaces.length === 0) return { lines: 1 };
  // The break that leaves the longer line shortest.
  let pair: [string, string] = [text, ''];
  let longest = Infinity;
  for (const i of spaces) {
    const a = text.slice(0, i);
    const b = text.slice(i + 1);
    const w = Math.max(wordWidth(a, KINSHI_WORD.min), wordWidth(b, KINSHI_WORD.min));
    if (w < longest) {
      longest = w;
      pair = [a, b];
    }
  }
  const [a, b] = pair;
  const u = KINSHI_WORD_FONT.unitsPerEm;
  const place = (f: number) => {
    const lineHeight = Math.ceil((f * (inkBottom(a) + inkTop(b))) / u + KINSHI_WORD.lineGap);
    // Android (CustomLineHeightSpan): half the leading above the ascent, so the baseline sits
    // (A − D) / 2 under the line box's middle.
    const baseline =
      (lineHeight + (f * (KINSHI_WORD_FONT.ascent - KINSHI_WORD_FONT.descent)) / u) / 2;
    const top = baseline - (f * inkTop(a)) / u;
    const bottom = lineHeight + baseline + (f * inkBottom(b)) / u;
    return { lineHeight, top, ink: bottom - top };
  };
  const wide = (f: number) => Math.max(wordWidth(a, f), wordWidth(b, f)) > room;
  const rooms = [
    ['breath', band.pink.height - 2 * KINSHI_WORD.breath * band.scale],
    ['pink', band.pink.height],
    ['band', band.height],
  ] as const;
  const [name, height] = rooms.find(([, h]) => place(KINSHI_WORD.min).ink <= h) ?? rooms[2];
  // Only with the breath kept does the word grow past 22; without it (the pink to its edge, or the
  // ribbon's outline) it takes no more than 22 needs.
  let f: number = name === 'breath' ? KINSHI_WORD.size : KINSHI_WORD.min;
  while (f > KINSHI_WORD.min && (wide(f) || place(f).ink > height)) f -= KINSHI_WORD.step;
  const p = place(f);
  // Centred on the pink; held inside the band.
  const inkTop0 = Math.min(
    Math.max(band.pink.top + (band.pink.height - p.ink) / 2, 0),
    band.height - p.ink,
  );
  return {
    lines: 2,
    text: pair,
    fontSize: f,
    lineHeight: p.lineHeight,
    type: { fontSize: f, lineHeight: p.lineHeight },
    top: inkTop0 - p.top,
    ink: p.ink,
    room: name,
  };
}
