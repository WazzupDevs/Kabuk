import { type ReactNode, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

import { ARRIVE, BLURS } from './motion';

type Props = {
  children: ReactNode;
  // Its place in a cascade: each part arrives `step` after the one before (at most MOTION.stagger.max).
  index?: number;
  step?: number;
  // A change plays the arrival again (a tab opened again).
  replay?: number;
  // Through blur as well (the film's dissolve); kept for a few parts, since blur costs a layer.
  blur?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A part arriving (docs/design/aura/project/hareket.json → dissolve): from below and a little
// smaller, faded, and through blur where asked, to its place. At once when motion is reduced.
export function Reveal({
  children,
  index = 0,
  step = MOTION.stagger.part,
  replay = 0,
  blur = false,
  style,
}: Props) {
  const reduce = useReduceMotion();
  const p = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(
      Math.min(index, MOTION.stagger.max) * step,
      withTiming(1, { duration: MOTION.dissolve.inMs, easing: ARRIVE }),
    );
  }, [replay, reduce, index, step, p]);
  const blurs = blur && BLURS;
  const arrive = useAnimatedStyle(() => {
    const v = p.value;
    const d = MOTION.dissolve;
    const moved = {
      opacity: v,
      transform: [{ translateY: (1 - v) * d.rise }, { scale: d.fromScale + (1 - d.fromScale) * v }],
    };
    // The blur only where asked: the filter goes through a slower path than opacity and transform.
    return blurs ? { ...moved, filter: v < 0.99 ? [{ blur: (1 - v) * d.blur }] : [] } : moved;
  });
  return <Animated.View style={[style, arrive]}>{children}</Animated.View>;
}
