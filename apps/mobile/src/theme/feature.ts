import type { ColorScheme, Palette } from './tokens';

// "#rrggbb" of `fg` laid over `bg` at `alpha`.
export function mix(fg: string, bg: string, alpha: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) =>
    Math.round(ch(fg, i) * alpha + ch(bg, i) * (1 - alpha))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${out.join('')}`.toUpperCase();
}

// Inside the featured card (Card `feature`) the palette is the other scheme's: ink with the dark
// semantics in the light scheme, the near-white inverted surface (Aura v65 `.dark.pA` → `--feature`)
// with the light semantics in the dark one. Its ground is `feature`, text `onFeature`, secondary
// text `featureMuted`. Controls and quiet fills are the card's ink laid over its ground. Every
// component inside the card draws from it unchanged; contrast.test.ts checks its pairs.
export function featurePalette(
  palettes: Record<ColorScheme, Palette>,
  scheme: ColorScheme,
): Palette {
  const own = palettes[scheme];
  const other = palettes[scheme === 'light' ? 'dark' : 'light'];
  const ground = own.feature;
  return {
    ...other,
    canvas: ground,
    surface: ground,
    // Quiet fills: the ink laid over the ink ground in the light scheme; the light scheme's own
    // fills on the near-white ground in the dark one.
    surface2: scheme === 'light' ? mix(own.onFeature, ground, 0.08) : other.surface2,
    raised: scheme === 'light' ? mix(own.onFeature, ground, 0.14) : other.raised,
    text: own.onFeature,
    muted: own.featureMuted,
    border: own.featureMuted,
    divider: mix(own.onFeature, ground, 0.16),
    feature: ground,
    onFeature: own.onFeature,
    featureMuted: own.featureMuted,
    overlap: other.overlap,
    focus: own.onFeature,
  };
}
