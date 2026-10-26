import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import {
  parseThemePreference,
  resolveScheme,
  resolveShadows,
  SCHEME_PREFERENCES,
} from './registry';
import { THEME } from './theme';
import { colorClass, PALETTE_KEYS } from './tokens';

const require = createRequire(import.meta.url);

describe('resolveScheme', () => {
  it('uses the theme default without a preference', () => {
    expect(resolveScheme(THEME, null, 'dark')).toBe('dark');
    expect(resolveScheme(THEME, null, 'light')).toBe('light');
    expect(resolveScheme({ ...THEME, defaultScheme: 'dark' }, null, 'light')).toBe('dark');
  });

  it('follows an explicit choice', () => {
    expect(resolveScheme(THEME, 'light', 'dark')).toBe('light');
    expect(resolveScheme(THEME, 'dark', 'light')).toBe('dark');
  });

  it('reads anything but "dark" from the system as light', () => {
    expect(resolveScheme(THEME, 'system', null)).toBe('light');
    expect(resolveScheme(THEME, 'system', 'unspecified')).toBe('light');
    expect(resolveScheme(THEME, 'system', 'dark')).toBe('dark');
  });
});

// Ayarlar → Görünüm (K-54; v46 §5): Sistem, Açık, Koyu on one line, Sistem by default.
describe('appearance', () => {
  it('offers Sistem, Açık and Koyu in that order, Sistem by default', () => {
    expect(SCHEME_PREFERENCES).toEqual(['system', 'light', 'dark']);
    expect(THEME.defaultScheme).toBe('system');
  });
});

describe('parseThemePreference', () => {
  it('falls back to the defaults', () => {
    const fallback = { scheme: null };
    expect(parseThemePreference(null)).toEqual(fallback);
    expect(parseThemePreference('not json')).toEqual(fallback);
    expect(parseThemePreference('"dark"')).toEqual(fallback);
    expect(parseThemePreference('{"scheme":"dim"}')).toEqual(fallback);
  });

  it('reads a stored choice', () => {
    expect(parseThemePreference('{"scheme":"dark"}')).toEqual({ scheme: 'dark' });
  });

  it('keeps the scheme of a choice stored with a theme by earlier builds', () => {
    expect(parseThemePreference('{"theme":"play","scheme":"light"}')).toEqual({ scheme: 'light' });
  });
});

describe('tokens', () => {
  it('draws no shadow for null', () => {
    const shadows = resolveShadows({ ...THEME.shadows.light, card: null });
    expect(shadows.card).toBeUndefined();
    expect(shadows.tabBar).toBe(THEME.shadows.light.tabBar);
  });

  // skall: soft shadows only, no hard offset shadow of the old "3D" look.
  it('has no hard shadows', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const shadow of Object.values(THEME.shadows[scheme])) {
        for (const layer of (shadow ?? '').split(/,(?![^(]*\))/)) {
          const [x, y, blur, spread] = layer
            .trim()
            .split(/\s+/)
            .map((v) => parseFloat(v));
          if (!blur) expect([x, y]).toEqual([0, 0]);
          expect(spread ?? 0).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('the theme defines every palette key in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      expect(Object.keys(THEME.palettes[scheme]).sort()).toEqual([...PALETTE_KEYS].sort());
    }
  });

  it('tailwind.config.js exposes exactly the semantic colours', () => {
    const config = require('../../tailwind.config.js') as {
      theme: { colors?: object; extend?: { colors?: object } };
    };
    const colors = config.theme.colors ?? config.theme.extend?.colors ?? {};
    const names = Object.keys(colors).filter((c) => c !== 'transparent');
    expect(names.sort()).toEqual(PALETTE_KEYS.map(colorClass).sort());
  });
});

describe('type scale', () => {
  // Tab labels and small counters stay 11 px; only a label that does not fit its tab shrinks
  // (TabBar: adjustsFontSizeToFit, one line), never the size for every screen.
  it('keeps caption at 11 px', () => {
    expect(THEME.typography.caption).toMatchObject({ font: 'display', size: 11, lineHeight: 14 });
  });
});
