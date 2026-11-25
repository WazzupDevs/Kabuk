import type { LookSlot } from '@shared/capsule.ts';
import { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

// Süsle's tab icons as little capsule buddies (the owner's call, 22 Kasım): the same small capsule
// in each, the slot's own part in the strong tone. On a 24 grid, two tones as the app's icon family
// draws them (aura/CapIcon.tsx): the part in `color`, the body in `second` at `soft`. Renk: the
// whole body; Göz: the eyes; Baş: a hat; Yüz: glasses; Ağız: the mouth; Gövde: a necklace.

const BODY = { x: 5, y: 5, width: 14, height: 18, rx: 7 } as const;

export const SlotIcon = memo(function SlotIcon({
  slot,
  color,
  second,
  soft = 0.5,
  size,
}: {
  slot: LookSlot;
  color: string;
  second?: string;
  soft?: number;
  size: number;
}) {
  const { colors } = useTheme();
  const b = second ?? color;
  const whole = slot === 'c';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      importantForAccessibility="no-hide-descendants"
    >
      <Rect {...BODY} fill={whole ? color : b} fillOpacity={whole ? 1 : soft} />
      {whole ? (
        // The visor cut in the surface's colour, its eyes in the strong tone.
        <>
          <Rect x={7} y={8.2} width={10} height={5} rx={2.5} fill={colors.surface} />
          <Circle cx={10} cy={10.7} r={1.1} fill={color} />
          <Circle cx={14} cy={10.7} r={1.1} fill={color} />
        </>
      ) : null}
      {slot === 'e' ? (
        <>
          <Circle cx={9.8} cy={10.6} r={2} fill={color} />
          <Circle cx={14.2} cy={10.6} r={2} fill={color} />
        </>
      ) : null}
      {slot === 'h' ? (
        // A beanie over the head: its crown and its band.
        <>
          <Path d="M5 7.8C5 3.6 8.2 1.4 12 1.4S19 3.6 19 7.8Z" fill={color} />
          <Rect x={3.6} y={6.6} width={16.8} height={2.8} rx={1.4} fill={color} />
        </>
      ) : null}
      {slot === 'f' ? (
        // Round glasses over the eyes.
        <>
          <Circle cx={9.3} cy={10.6} r={2.8} fill="none" stroke={color} strokeWidth={1.8} />
          <Circle cx={14.7} cy={10.6} r={2.8} fill="none" stroke={color} strokeWidth={1.8} />
          <Path d="M11.9 10.4H12.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </>
      ) : null}
      {slot === 'm' ? (
        <Path
          d="M9.2 14Q12 17.4 14.8 14"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
      {slot === 'n' ? (
        // A necklace round the neck, its pendant.
        <>
          <Path
            d="M5.6 15.6Q12 20.4 18.4 15.6"
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={19.4} r={1.9} fill={color} />
        </>
      ) : null}
    </Svg>
  );
});
