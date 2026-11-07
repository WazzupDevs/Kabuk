import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { gradientStyle } from '@/theme/gradient';
import { SPACING } from '@/theme/tokens';

// The gift screens' stage (Aura v134 Paketler, PaketAcilis, PaketAcilisNadirlik): the boards are
// 390 × 844 with a 52 status bar and a 34 home bar. A board's number is placed on the phone by the
// width's share (`s`), from the safe area's top or foot; nothing is cut on a 320 phone.
export const BOARD_W = 390;
const BOARD_TOP = 52;
const BOARD_FOOT = 34;

export type Rect = { x: number; y: number; w: number; h: number };

export type Stage = {
  s: number;
  width: number;
  // A board's distance from its top, on this phone.
  top: (y: number) => number;
  // A board's distance from its foot, on this phone.
  foot: (b: number) => number;
};

export function useStage(): Stage {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = width / BOARD_W;
  const footInset = Math.max(insets.bottom, SPACING[3]);
  return {
    s,
    width,
    top: (y) => insets.top + (y - BOARD_TOP) * s,
    foot: (b) => footInset + (b - BOARD_FOOT) * s,
  };
}

// A soft round glow (hediye.css `.glow`: a disc under a 64 px blur), drawn as a radial gradient a
// little wider than the disc so that it fades as the blur does.
const GLOW_SPREAD = 1.45;
export function Glow({
  x,
  y,
  size,
  color,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}) {
  const wide = size * GLOW_SPREAD;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - (wide - size) / 2,
        top: y - (wide - size) / 2,
        width: wide,
        height: wide,
        opacity,
        ...gradientStyle(`radial-gradient(closest-side, ${color} 25%, ${color}00 100%)`),
      }}
    />
  );
}

// A four-pointed sparkle (PaketAcilisNadirlik), in a 24 box.
const SPARKLE_PATH = 'M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z';
export function Sparkle({
  x,
  y,
  size,
  color,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={SPARKLE_PATH} fill={color} />
      </Svg>
    </View>
  );
}

export function centerOf(r: Rect): { cx: number; cy: number } {
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}
