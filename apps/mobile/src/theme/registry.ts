import type { ColorScheme, ShadowSet, ThemeDefinition } from './tokens';

export type SchemePreference = ColorScheme | 'system';
// Ayarlar → Görünüm (docs/SPEC_V4.md K-54; v46 §5), in v46's order. The choice is kept only on the
// phone.
export const SCHEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = { scheme: SchemePreference | null };

// `scheme: null` means the theme's own default.
export function resolveScheme(
  theme: ThemeDefinition,
  preference: SchemePreference | null,
  system: string | null | undefined, // useColorScheme(): may also be "unspecified"
): ColorScheme {
  const wanted = preference ?? theme.defaultScheme;
  if (wanted !== 'system') return wanted;
  return system === 'dark' ? 'dark' : 'light';
}

function isSchemePreference(v: unknown): v is SchemePreference {
  return typeof v === 'string' && (SCHEME_PREFERENCES as readonly string[]).includes(v);
}

// The stored choice; anything unreadable falls back to the defaults. Test builds stored theirs
// under the same key, so their choice carries over.
export function parseThemePreference(raw: string | null): ThemePreference {
  const fallback: ThemePreference = { scheme: null };
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return fallback;
    const v = value as Record<string, unknown>;
    // Earlier builds also stored a `theme`; it is ignored.
    return { scheme: isSchemePreference(v.scheme) ? v.scheme : null };
  } catch {
    return fallback;
  }
}

// A scheme's shadows for React Native styles (`null` → no `boxShadow`).
export function resolveShadows(set: ShadowSet): Record<keyof ShadowSet, string | undefined> {
  return {
    card: set.card ?? undefined,
    raised: set.raised ?? undefined,
    sheet: set.sheet ?? undefined,
    tabBar: set.tabBar ?? undefined,
    focus: set.focus ?? undefined,
  };
}
