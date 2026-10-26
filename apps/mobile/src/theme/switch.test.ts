import { describe, expect, it } from 'vitest';

import { luminance } from './contrast';
import { switchColors } from './switch';
import { THEME } from './theme';

// skall.css → "Anahtar": `.switch` control, `.switch.on` primary, a white thumb.
describe('switch colours', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const palette = THEME.palettes[scheme];
    it(`${scheme}: the canvas's tracks and a white thumb`, () => {
      expect(switchColors(palette, true).track).toBe(palette.primary);
      expect(switchColors(palette, false).track).toBe(palette.control);
      expect(luminance(switchColors(palette, true).thumb)).toBeGreaterThan(0.85);
    });
  }
});
