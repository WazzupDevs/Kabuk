import { useEffect, useId } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { DIAL_COVER } from '@/theme/gameColors';
import { COVER_OPEN, CURVES, DIAL, dialFacePath } from '@/theme/playMotion';

type Props = {
  // Open: swing away and show the dial under it (the result).
  open: boolean;
  // The dial's width; the cover lies over it, same box.
  width: number;
  testID?: string;
};

// İbre's cover (v43 report §2, the v45 file's .nx-shut): pale stripes over the dial's face while the
// target is hidden. At the result it swings 175° away about the dial's pivot and fades. With reduce
// motion it simply goes. It lies over the dial in the same box and lets touches through.
export function DialCover({ open, width, testID }: Props) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(open ? 1 : 0);
  const stripes = `cover${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const height = (width * DIAL.height) / DIAL.width;

  useEffect(() => {
    if (!open) {
      progress.set(0);
      return;
    }
    progress.set(
      reduce
        ? 1
        : withDelay(
            COVER_OPEN.delayMs,
            withTiming(1, { duration: COVER_OPEN.ms, easing: Easing.bezier(...CURVES.cover) }),
          ),
    );
  }, [open, reduce, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, COVER_OPEN.degrees])}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          // The dial's pivot, so the cover swings about it.
          transformOrigin: `${(DIAL.cx / DIAL.width) * 100}% ${(DIAL.cy / DIAL.height) * 100}%`,
        },
        style,
      ]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${DIAL.width} ${DIAL.height}`}>
        <Defs>
          <Pattern
            id={stripes}
            width={14}
            height={14}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <Rect width={14} height={14} fill={DIAL_COVER[0]} />
            <Rect width={7} height={14} fill={DIAL_COVER[1]} />
          </Pattern>
        </Defs>
        <Path d={dialFacePath()} fill={`url(#${stripes})`} />
      </Svg>
    </Animated.View>
  );
}
