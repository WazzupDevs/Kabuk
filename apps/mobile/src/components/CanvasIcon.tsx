import { useMemo } from 'react';

import { BRAND } from '@/theme/brand';
import { BAR_IN_PRIMARY, BAR_TONES, CANVAS_BAR, CANVAS_LINE } from '@/theme/canvasIcons';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';
import { CachedSvg } from './CachedSvg';

// The skall tuvali's icons, drawn as the canvas draws them (theme/canvasIcons.ts).
export type CanvasBarIcon = keyof typeof CANVAS_BAR;
export type CanvasLineIcon = keyof typeof CANVAS_LINE;
export type CanvasTone = 'neutral' | 'onPrimary' | 'positive' | 'negative';

// A bar icon (skall.css → `.bi`): `neutral` in the brand's purple and pink with the overlap colour,
// `onPrimary` on a primary fill, `positive` greens, `negative` reds.
export function CanvasBar({
  name,
  size = ICON.md,
  tone = 'neutral',
}: {
  name: CanvasBarIcon;
  size?: number;
  tone?: CanvasTone;
}) {
  const { colors, scheme } = useTheme();
  const xml = useMemo(() => {
    const fills =
      tone === 'onPrimary'
        ? { a: colors.onPrimary, b: colors.onPrimary, x: BAR_IN_PRIMARY[scheme] }
        : tone === 'positive' || tone === 'negative'
          ? BAR_TONES[tone]
          : { a: BRAND.purple, b: BRAND.pink, x: colors.overlap };
    const sb = tone === 'onPrimary' ? BAR_IN_PRIMARY[scheme] : fills.b;
    const slot = tone === 'onPrimary' ? colors.onPrimary : BRAND.purple;
    const body = CANVAS_BAR[name]
      .replaceAll('class="a"', `fill="${fills.a}"`)
      .replaceAll('class="b"', `fill="${fills.b}"`)
      .replaceAll('class="x"', `fill="${fills.x}"`)
      .replaceAll('class="track"', `fill="${colors.control}"`)
      .replaceAll('class="sa"', `fill="none" stroke="${fills.a}" stroke-width="2"`)
      .replaceAll('class="sb"', `fill="none" stroke="${sb}" stroke-width="2"`)
      .replaceAll(
        'class="slot"',
        `fill="none" stroke="${slot}" stroke-width="1.6" stroke-dasharray="2.4 1.9"`,
      );
    return `<svg viewBox="0 0 24 24">${body}</svg>`;
  }, [name, tone, colors, scheme]);
  return <CachedSvg xml={xml} width={size} height={size} />;
}

// A line icon in one colour (skall.css → `.ico`: 1.8 wide, round ends; 2 at the small size).
export function CanvasLine({
  name,
  size = ICON.md,
  color,
}: {
  name: CanvasLineIcon;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text;
  const width = size <= ICON.sm ? 2 : 1.8;
  const xml = useMemo(
    () =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${CANVAS_LINE[name]}</svg>`,
    [name, stroke, width],
  );
  return <CachedSvg xml={xml} width={size} height={size} />;
}
