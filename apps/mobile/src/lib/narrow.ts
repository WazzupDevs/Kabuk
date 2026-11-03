import { NARROW_SCREEN } from '../theme/tokens';

// Text grows at most this much on skall's screens (kit `maxFontSizeMultiplier`).
const MAX_FONT_SCALE = 1.3;

// 320 dp or the largest text (Aura v75 E4; the owner's call, 3 Kasım: the same rule as the lobby's
// rows): the screen counts as narrow when it is under 360 dp once the text's growth is taken out.
// Only then do the narrow sizes apply (kapsül 44, 3 sütun, alan 56, çip 46, seçici 52, etiket 30);
// otherwise the 2 Kasım scale stays.
export function isNarrow(width: number, fontScale: number): boolean {
  return width / Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE) < NARROW_SCREEN;
}
