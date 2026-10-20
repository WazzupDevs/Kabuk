import { useEffect, useId } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';

import { BAR, BAR_ICONS, BAR_VIEW_BOX, type BarRect, barRect } from '@/theme/barIcons';
import { V46_BUTTON_MOTION } from '@/theme/parts.generated';

export type BarGlyphKind = 'plus' | 'cross' | 'check';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const rectProps = (r: BarRect) => ({
  x: r.x,
  y: r.y,
  width: r.width,
  height: r.height,
  rx: r.rx,
  transform: `rotate(${r.rotate.join(' ')})`,
});

// A two-bar icon of v46 (`.bi`): bar a, bar b, and b again where it crosses a. The bars are v46's
// drawing at rest (theme/barIcons.ts: its IC springs settle there); the fills are the ones v46
// computes for this place (parts.generated.ts: `.bi-a`, `.bi-b`, `.bi-x`). Bar a's fill eases to a
// new one as v46's does (`.bi-a`: fill .2s; the other two change at once there too).
export function BarGlyph({
  kind,
  fills,
  size,
}: {
  kind: BarGlyphKind;
  fills: { a: string; b: string; x: string };
  size: readonly [number, number];
}) {
  const clip = useId().replace(/[^a-zA-Z0-9]/g, '');
  const icon = BAR_ICONS[kind];
  const a = barRect(icon.a, BAR.thin);
  const b = barRect(icon.b, BAR.thin);
  const [width, height] = size;
  const fillA = useSharedValue(fills.a);
  const [t] = V46_BUTTON_MOTION.barFill.transitions;
  useEffect(() => {
    fillA.set(
      t ? withTiming(fills.a, { duration: t.ms, easing: Easing.bezier(...t.ease) }) : fills.a,
    );
  }, [fills.a, fillA, t]);
  const aProps = useAnimatedProps(() => ({ fill: fillA.value }));
  return (
    <Svg width={width} height={height} viewBox={BAR_VIEW_BOX}>
      <Defs>
        <ClipPath id={clip}>
          <Rect {...rectProps(a)} />
        </ClipPath>
      </Defs>
      <AnimatedRect {...rectProps(a)} animatedProps={aProps} />
      <Rect {...rectProps(b)} fill={fills.b} />
      <G clipPath={`url(#${clip})`}>
        <Rect {...rectProps(b)} fill={fills.x} />
      </G>
    </Svg>
  );
}
