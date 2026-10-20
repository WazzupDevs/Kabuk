// Plus Jakarta Sans as v46 draws it (v46 native, step 3: the weights and line heights first;
// docs/decisions/v46-native-3a-yazi.md). The inventory writes CSS `normal` for a line height it
// did not set; the browser makes that a number from the font's vertical metrics. Android makes
// its own from other metrics (with font padding), so the app writes the browser's number down,
// read here from the very files it bundles.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// The weights the app bundles (apps/mobile/src/theme/fonts.ts), the same four v46 loads from
// Google Fonts (`Plus+Jakarta+Sans:wght@500;600;700;800`).
export const BUNDLED_WEIGHTS = [500, 600, 700, 800] as const;

const FILES: Record<(typeof BUNDLED_WEIGHTS)[number], string> = {
  500: '500Medium/PlusJakartaSans_500Medium.ttf',
  600: '600SemiBold/PlusJakartaSans_600SemiBold.ttf',
  700: '700Bold/PlusJakartaSans_700Bold.ttf',
  800: '800ExtraBold/PlusJakartaSans_800ExtraBold.ttf',
};

export type VerticalMetrics = {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  lineGap: number;
};

// `head` → unitsPerEm and `hhea` → ascender, descender, lineGap of a TrueType file.
export function readVerticalMetrics(bytes: Uint8Array): VerticalMetrics {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables = new Map<string, number>();
  const count = view.getUint16(4);
  for (let i = 0; i < count; i++) {
    const at = 12 + 16 * i;
    const tag = String.fromCharCode(...bytes.subarray(at, at + 4));
    tables.set(tag, view.getUint32(at + 8));
  }
  const head = tables.get('head');
  const hhea = tables.get('hhea');
  if (head === undefined || hhea === undefined) throw new Error('not a TrueType font');
  return {
    unitsPerEm: view.getUint16(head + 18),
    ascender: view.getInt16(hhea + 4),
    descender: view.getInt16(hhea + 6),
    lineGap: view.getInt16(hhea + 8),
  };
}

// The four bundled files' metrics; they share them (the test says so, and this throws if not).
export function bundledMetrics(root: string): VerticalMetrics {
  const require = createRequire(resolve(root, 'apps/mobile/package.json'));
  const all = BUNDLED_WEIGHTS.map((w) =>
    readVerticalMetrics(
      readFileSync(require.resolve(`@expo-google-fonts/plus-jakarta-sans/${FILES[w]}`)),
    ),
  );
  const [first] = all;
  if (!first || all.some((m) => JSON.stringify(m) !== JSON.stringify(first))) {
    throw new Error('the bundled weights differ in their vertical metrics');
  }
  return first;
}

// CSS `normal` in Chromium (Blink's SimpleFontData): ascent, descent and line gap, each scaled
// to the size and rounded on its own, then added.
export function normalLineHeight(size: number, m: VerticalMetrics): number {
  const scaled = (units: number) => Math.round((units * size) / m.unitsPerEm);
  return scaled(m.ascender) + scaled(-m.descender) + scaled(m.lineGap);
}
