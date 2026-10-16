import { describe, expect, it } from 'vitest';

import { COLORS } from '../../../../scripts/icon/mark.ts';

import { TABLE_AVATAR_ICONS } from '../../../../supabase/functions/_shared/pure/tableAvatar.ts';

import { initials, TABLE_AVATAR_COLORS, TABLE_AVATAR_INK, tableAvatarOf } from './avatar';
import { BRAND, LAUNCH_MASK } from './brand';
import { contrastRatio } from './contrast';
import { THEME } from './theme';

describe('logo colours', () => {
  // The app icon and the in-app mark are one drawing in one set of colours.
  it('are the app icon’s (scripts/icon/mark.ts)', () => {
    expect(BRAND.purple).toBe(COLORS.purple);
    expect(BRAND.pink).toBe(COLORS.pink);
    expect(BRAND.ink).toBe(COLORS.night);
    expect(BRAND.orange).toBe(COLORS.crossLight);
    expect(BRAND.white).toBe(COLORS.crossDark);
  });

  it('meet the theme where the mark overlaps', () => {
    expect(THEME.palettes.light.overlap).toBe(BRAND.orange);
    expect(THEME.palettes.dark.overlap).toBe(BRAND.white);
    expect(THEME.palettes.light.feature).toBe(BRAND.ink);
  });
});

describe('launch mask', () => {
  // react-native-svg's luminance-to-alpha (Android RenderableView), on the sRGB values.
  const alpha = (hex: string) => {
    const channel = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
    return 0.2125 * channel(1) + 0.7154 * channel(3) + 0.0721 * channel(5);
  };

  it('keeps the curtain whole and cuts the window clean', () => {
    expect(alpha(LAUNCH_MASK.keep)).toBeCloseTo(1, 3);
    expect(alpha(LAUNCH_MASK.cut)).toBe(0);
    // The ink, as the cut, would leave a veil over the open window.
    expect(alpha(BRAND.ink)).toBeGreaterThan(0.07);
  });
});

describe('table avatar', () => {
  it('gives one seed one icon and one colour', () => {
    expect(tableAvatarOf('3f2a9c1e-77b4-4e0a-9a61-5d2c8e4b1f70')).toEqual(
      tableAvatarOf('3f2a9c1e-77b4-4e0a-9a61-5d2c8e4b1f70'),
    );
    const { icon, color } = tableAvatarOf('Sarı Tilki');
    expect(TABLE_AVATAR_COLORS).toContain(color);
    expect(icon).toBeLessThan(TABLE_AVATAR_ICONS);
  });

  // The skall discs: the ink glyph is well over AA on each (kontrast.md: 8.4:1 and up).
  it('has eight distinct discs the ink icon reads on', () => {
    expect(new Set(TABLE_AVATAR_COLORS).size).toBe(8);
    for (const c of TABLE_AVATAR_COLORS) {
      expect(contrastRatio(TABLE_AVATAR_INK, c)).toBeGreaterThanOrEqual(8.4);
    }
  });
});

describe('initials', () => {
  it('takes the first letters of two words, Turkish upper case', () => {
    expect(initials('Ayşe Nur')).toBe('AN');
    expect(initials('deniz')).toBe('D');
    expect(initials('ıraz ilkin')).toBe('Iİ');
  });
});
