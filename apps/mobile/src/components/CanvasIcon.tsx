import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

import { BRAND } from '@/theme/brand';
import { BAR_IN_PRIMARY, CANVAS_BAR, CANVAS_LINE } from '@/theme/canvasIcons';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

// The skall tuvali's icons, drawn as the canvas draws them (theme/canvasIcons.ts).
export type CanvasBarIcon = keyof typeof CANVAS_BAR;
export type CanvasLineIcon = keyof typeof CANVAS_LINE;

// A bar icon: `neutral` in the brand's purple and pink with the overlap colour, `onPrimary` on a
// primary fill (skall.css → `.bi.on-primary`).
export function CanvasBar({
  name,
  size = ICON.md,
  tone = 'neutral',
}: {
  name: CanvasBarIcon;
  size?: number;
  tone?: 'neutral' | 'onPrimary';
}) {
  const { colors, scheme } = useTheme();
  const xml = useMemo(() => {
    const on = tone === 'onPrimary';
    const a = on ? colors.onPrimary : BRAND.purple;
    const b = on ? colors.onPrimary : BRAND.pink;
    const x = on ? BAR_IN_PRIMARY[scheme] : colors.overlap;
    const sb = on ? BAR_IN_PRIMARY[scheme] : BRAND.pink;
    const body = CANVAS_BAR[name]
      .replaceAll('class="a"', `fill="${a}"`)
      .replaceAll('class="b"', `fill="${b}"`)
      .replaceAll('class="x"', `fill="${x}"`)
      .replaceAll('class="track"', `fill="${colors.control}"`)
      .replaceAll('class="sa"', `fill="none" stroke="${a}" stroke-width="2"`)
      .replaceAll('class="sb"', `fill="none" stroke="${sb}" stroke-width="2"`);
    return `<svg viewBox="0 0 24 24">${body}</svg>`;
  }, [name, tone, colors, scheme]);
  return <SvgXml xml={xml} width={size} height={size} />;
}

// A line icon in one colour (skall.css → `.ico`: 1.8 wide, round ends).
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
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CANVAS_LINE[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
