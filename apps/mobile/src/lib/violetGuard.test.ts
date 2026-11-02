import { describe, expect, it } from 'vitest';

import { AURA } from '../theme/aura';
import { KIT } from '../theme/auraKit';
import { GLASS_FACE } from '../theme/glass';
import { THEME } from '../theme/theme';

// Aura v65 (U1): the violet family (OKLCH hue 278–325) leaves the interface: the palettes, the
// shadows, the kit, the aura and the glass (beside the style guard, src/theme/styleGuard.test.ts;
// here because the kit's types load React Native's, which the root typecheck leaves out). The brand's mark (BRAND, AURA.mark, the confetti),
// the scenes and the art keep their own colours.
describe('no violet in the interface tokens', () => {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  // OKLCH chroma and hue (Björn Ottosson's OKLab).
  const oklch = (r8: number, g8: number, b8: number): [number, number] => {
    const [r, g, b] = [channel(r8), channel(g8), channel(b8)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
  };
  const strings = (v: unknown): string[] =>
    typeof v === 'string'
      ? [v]
      : v && typeof v === 'object'
        ? Object.values(v as Record<string, unknown>).flatMap(strings)
        : [];
  const violet = (text: string): string[] =>
    [...text.matchAll(/#([0-9a-fA-F]{6})\b|rgba?\((\d+),\s*(\d+),\s*(\d+)/g)]
      .filter((m) => {
        const rgb = m[1]
          ? [0, 2, 4].map((k) => parseInt((m[1] as string).slice(k, k + 2), 16))
          : [Number(m[2]), Number(m[3]), Number(m[4])];
        const [chroma, hue] = oklch(rgb[0] as number, rgb[1] as number, rgb[2] as number);
        return chroma > 0.02 && hue >= 278 && hue <= 325;
      })
      .map((m) => m[0]);
  const { mark: _mark, confetti: _confetti, scene: _scene, ...aura } = AURA;
  it.each([
    ['THEME.palettes', THEME.palettes],
    ['THEME.shadows', THEME.shadows],
    ['KIT', KIT],
    ['AURA', aura],
    ['GLASS_FACE', GLASS_FACE],
  ] as const)('%s', (_name, tokens) => {
    expect(strings(tokens).flatMap(violet)).toEqual([]);
  });
});
