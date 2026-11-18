// The visual gate's board beside the app (gate-report.ts → yanyana/<id>-<theme>.png): the board's
// image on the left, the app's photo (the candidate) in the middle, the pixel diff on the right,
// each under a short label, top aligned and never scaled (a narrow board, 640 px, or a long page
// keeps its own size; the rest of a column is the neutral backdrop). The labels are drawn with the
// small pixel font below, so the image needs nothing but pngjs.
import { PNG } from 'pngjs';

// 5 × 7 glyphs, a row per string, `#` lit: the letters, digits and signs the labels use.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '%': ['##...', '##..#', '...#.', '..#..', '.#...', '#..##', '...##'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
// Turkish letters drawn as their plain Latin form (labels are short ASCII-ish words).
const FOLD: Record<string, string> = { Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U' };

// One label pixel is this many image pixels.
export const LABEL_SCALE = 3;
const GLYPH_W = 5;
const GLYPH_H = 7;
const PAD = 12;
// The label band's height and the gap between the columns (px).
export const LABEL_BAND = GLYPH_H * LABEL_SCALE + 2 * PAD;
export const GAP = 16;
type Rgb = [number, number, number];
const BACKDROP: Rgb = [96, 96, 104];
const INK: Rgb = [255, 255, 255];

// The label as the font can draw it: upper case (Turkish İ/I alike), unknown characters dropped.
export function labelText(text: string): string {
  return [...text.toLocaleUpperCase('tr-TR')]
    .map((c) => FOLD[c] ?? c)
    .filter((c) => c in GLYPHS)
    .join('');
}

// The label's width in image px.
export function labelWidth(text: string): number {
  const n = [...labelText(text)].length;
  return n === 0 ? 0 : (n * (GLYPH_W + 1) - 1) * LABEL_SCALE;
}

function fill(png: PNG, x0: number, y0: number, w: number, h: number, rgb: Rgb): void {
  for (let y = Math.max(0, y0); y < Math.min(png.height, y0 + h); y++) {
    for (let x = Math.max(0, x0); x < Math.min(png.width, x0 + w); x++) {
      const i = (png.width * y + x) * 4;
      png.data[i] = rgb[0];
      png.data[i + 1] = rgb[1];
      png.data[i + 2] = rgb[2];
      png.data[i + 3] = 255;
    }
  }
}

// Draws the label at (x, y), its glyphs' top left; clipped to `maxWidth`.
export function drawLabel(png: PNG, text: string, x: number, y: number, maxWidth: number): void {
  let at = x;
  for (const c of labelText(text)) {
    const glyph = GLYPHS[c];
    if (!glyph) continue;
    if (at + GLYPH_W * LABEL_SCALE > x + maxWidth) break;
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit === '#') {
          fill(png, at + gx * LABEL_SCALE, y + gy * LABEL_SCALE, LABEL_SCALE, LABEL_SCALE, INK);
        }
      });
    });
    at += (GLYPH_W + 1) * LABEL_SCALE;
  }
}

export type Column = { label: string; image: PNG | null };

// The columns side by side, each under its label, top aligned, unscaled; a missing image leaves
// its column the backdrop, as wide as its label.
export function sideBySide(columns: readonly Column[]): PNG {
  const widths = columns.map((c) =>
    Math.max(c.image?.width ?? 0, labelWidth(c.label) + 2 * PAD, 2 * PAD),
  );
  const height = LABEL_BAND + Math.max(1, ...columns.map((c) => c.image?.height ?? 0));
  const width = widths.reduce((a, b) => a + b, 0) + GAP * (columns.length - 1);
  const out = new PNG({ width, height });
  fill(out, 0, 0, width, height, BACKDROP);
  let x = 0;
  columns.forEach((c, i) => {
    const w = widths[i] ?? 0;
    drawLabel(out, c.label, x + PAD, PAD, w - 2 * PAD);
    if (c.image) PNG.bitblt(c.image, out, 0, 0, c.image.width, c.image.height, x, LABEL_BAND);
    x += w + GAP;
  });
  return out;
}
