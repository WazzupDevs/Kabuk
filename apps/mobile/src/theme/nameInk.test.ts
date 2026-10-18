import { describe, expect, it } from 'vitest';

import { AA_TEXT, contrastRatio } from './contrast';
import { NAME_INKS, nameInk, nameInkIndex, nameInks } from './nameInk';
import { THEME } from './theme';

describe('venue chat name colours (v45: VC.col)', () => {
  it("picks v45's colour for a name, the same every time", () => {
    // v45's hash: h = (h * 41 + charCode) >>> 0, then h % 6.
    expect(nameInkIndex('A')).toBe(5);
    expect(nameInkIndex('Kerem')).toBe(0);
    expect(nameInkIndex('Martı')).toBe(1);
    expect(nameInkIndex('Bot Masa')).toBe(1);
    expect(nameInk('light', 'Martı')).toBe('#C51F62');
    expect(nameInk('light', 'Martı')).toBe(nameInk('light', 'Martı'));
    expect(nameInkIndex('')).toBe(0);
  });

  it('mixes each colour with white on the dark scheme', () => {
    expect(nameInks('light')).toEqual(NAME_INKS);
    const dark = nameInks('dark');
    expect(dark).toHaveLength(NAME_INKS.length);
    for (const [i, c] of dark.entries()) expect(c).not.toBe(NAME_INKS[i]);
  });

  it('reads at 4.5:1 on the others’ bubble and on the reply strip, in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const { surface, raised } = THEME.palettes[scheme];
      for (const ink of nameInks(scheme)) {
        expect(contrastRatio(ink, surface), `${scheme} ${ink}`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(ink, raised), `${scheme} ${ink}`).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });
});
