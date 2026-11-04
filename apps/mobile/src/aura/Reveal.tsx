import { type ReactNode, useEffect, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import type { TabOpenings } from '@/lib/tabOpenings';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

import { ARRIVE_RN } from './motion';

type Props = {
  children: ReactNode;
  // Its place in a cascade: each part arrives `step` after the one before (at most MOTION.stagger.max).
  index?: number;
  step?: number;
  // A change plays the arrival again (a kind chosen).
  replay?: number;
  // Its tab's openings (aura/motion → useTabOpenings): each plays the arrival again, on the native
  // driver, with no render.
  openings?: TabOpenings | null;
  style?: StyleProp<ViewStyle>;
};

// A part arriving (docs/design/aura/project/hareket.json → dissolve): from below and a little
// smaller, faded in, to its place. On the native driver, so a long screen's cascade costs no frame
// of the JavaScript or UI tree. At once when motion is reduced.
export function Reveal({
  children,
  index = 0,
  step = MOTION.stagger.part,
  replay = 0,
  openings,
  style,
}: Props) {
  const reduce = useReduceMotion();
  const [p] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      p.setValue(1);
      return undefined;
    }
    let anim: Animated.CompositeAnimation | null = null;
    const play = () => {
      anim?.stop();
      p.setValue(0);
      anim = Animated.timing(p, {
        toValue: 1,
        duration: MOTION.dissolve.inMs,
        delay: Math.min(index, MOTION.stagger.max) * step,
        easing: ARRIVE_RN,
        useNativeDriver: true,
      });
      anim.start();
    };
    play();
    const off = openings?.subscribe(play);
    return () => {
      off?.();
      anim?.stop();
    };
  }, [replay, openings, reduce, index, step, p]);
  const d = MOTION.dissolve;
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: p,
          transform: [
            { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [d.rise, 0] }) },
            { scale: p.interpolate({ inputRange: [0, 1], outputRange: [d.fromScale, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
