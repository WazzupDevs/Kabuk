import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { bundledMetrics, normalLineHeight } from './fontMetrics.ts';
import { readInventory } from './inventory.ts';
import { buildTokensModule } from './tokens.ts';

const root = resolve(import.meta.dirname, '../..');
const metrics = bundledMetrics(root);

describe('Plus Jakarta Sans line heights', () => {
  it('reads the bundled files', () => {
    expect(metrics).toEqual({ unitsPerEm: 1000, ascender: 1038, descender: -222, lineGap: 0 });
  });

  // Measured in Chromium (Playwright's, 360×740 at 3×): a one-line block with `line-height: normal`
  // in each size, the four bundled files as @font-face, every weight the same.
  it('is CSS `normal` as Chromium computes it', () => {
    const measured: Record<number, number> = {
      9: 11,
      11: 13,
      12: 15,
      13: 16,
      14: 18,
      15: 19,
      16: 21,
      17: 22,
      18: 23,
      20: 25,
      21: 27,
      22: 28,
      26: 33,
      28: 35,
      34: 43,
    };
    for (const [size, height] of Object.entries(measured)) {
      expect(normalLineHeight(Number(size), metrics), `${size}px`).toBe(height);
    }
  });

  it('gives every type style and component a line height', async () => {
    const normals = readInventory(root).type_styles.filter((t) => t.line_height === 'normal');
    expect(normals.length).toBeGreaterThan(0);
    const module = await buildTokensModule(root);
    expect(module).not.toMatch(/lineHeight: null/);
    expect(module).toMatch(/t14w700ln: \{ size: 14, weight: 700, lineHeight: 18,/);
  });
});
