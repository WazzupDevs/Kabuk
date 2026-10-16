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

// Inside the featured card (Card `feature`: ink in the light scheme) the palette is a dark one:
// its ground is `feature`, text `onFeature`, secondary text `featureMuted`, and the semantic
// colours are the dark scheme's, which read on ink. Controls are white laid over the ground (the
// design system's `on-feature` button and chip); quiet fills lift off the ink in the light scheme
// and sink into the canvas in the dark one, whose card is lighter. Every component inside the card
// draws from it unchanged; contrast.test.ts checks its pairs.
export function featurePalette(
  palettes: Record<ColorScheme, Palette>,
  scheme: ColorScheme,
): Palette {
  const own = palettes[scheme];
  const ground = own.feature;
  return {
    ...palettes.dark,
    canvas: ground,
    surface: ground,
    surface2: scheme === 'light' ? mix(own.onFeature, ground, 0.12) : mix(own.canvas, ground, 0.5),
    raised: mix(own.onFeature, ground, 0.14),
    text: own.onFeature,
    muted: own.featureMuted,
    border: own.featureMuted,
    divider: mix(own.onFeature, ground, 0.16),
    feature: ground,
    onFeature: own.onFeature,
    featureMuted: own.featureMuted,
    overlap: palettes.dark.overlap,
    focus: own.onFeature,
  };
}
