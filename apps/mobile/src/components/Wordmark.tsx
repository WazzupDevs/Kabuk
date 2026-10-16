import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { APP_NAME } from '@shared/brand.ts';

import { BRAND } from '@/theme/brand';
import { SKA, WORDMARK_BOX as BOX, WORDMARK_L as L } from '@/theme/wordmark';
import { useTheme } from '@/theme/ThemeProvider';

// Smallest height; below it the l pills lose their overlap.
export const WORDMARK_MIN_HEIGHT = 20;

type Props = {
  // In px: login screens 24, "Güncelleme gerekli" 32, Profil → Hakkında 20.
  height: number;
  // On ink or a featured card: letters and overlap white.
  onInk?: boolean;
};

// The in-app wordmark (the skall design system → Wordmark): its colours, proportions and
// capsules never change. Keep at least one l width (26 % of the height) clear around it.
export function Wordmark({ height, onInk }: Props) {
  const { colors } = useTheme();
  const h = Math.max(height, WORDMARK_MIN_HEIGHT);
  const ink = onInk ? BRAND.white : colors.text;
  const overlap = onInk ? BRAND.white : colors.overlap;
  const second = { ...L, x: L.x + L.offset };
  return (
    <Svg
      width={(h * BOX.w) / BOX.h}
      height={h}
      viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={APP_NAME}
    >
      <Defs>
        <ClipPath id="first-l">
          <Rect x={L.x} y={L.y} width={L.w} height={L.h} rx={L.w / 2} />
        </ClipPath>
      </Defs>
      <Path d={SKA} fill={ink} />
      <Rect x={L.x} y={L.y} width={L.w} height={L.h} rx={L.w / 2} fill={BRAND.purple} />
      <Rect x={second.x} y={second.y} width={L.w} height={L.h} rx={L.w / 2} fill={BRAND.pink} />
      <Rect
        x={second.x}
        y={second.y}
        width={L.w}
        height={L.h}
        rx={L.w / 2}
        fill={overlap}
        clipPath="url(#first-l)"
      />
    </Svg>
  );
}
