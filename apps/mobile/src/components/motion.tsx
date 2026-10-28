import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

// Small motion (the airy look's standard, theme/aura.ts → MOTION): a pressed card or button shrinks
// a little, list items rise softly into place one after another. Neither runs when the system asks
// to reduce motion.
const PRESSED_SCALE = 0.97;
const RISE_MS = MOTION.dissolve.inMs;
const RISE_STEP_MS = MOTION.stagger.row;
const RISE_MAX_DELAY_MS = MOTION.stagger.row * MOTION.stagger.max;
const RISE_EASE = Easing.bezier(...MOTION.curves.arrive);

export function usePressScale(): (pressed: boolean) => ViewStyle | null {
  const reduce = useReduceMotion();
  return (pressed) => (pressed && !reduce ? { transform: [{ scale: PRESSED_SCALE }] } : null);
}

type RiseProps = { children: ReactNode; index?: number };

// Fades and lifts its children in once, the n-th item a little after the one before.
export function Rise({ children, index = 0 }: RiseProps) {
  const reduce = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: RISE_MS,
      delay: Math.min(index * RISE_STEP_MS, RISE_MAX_DELAY_MS),
      easing: RISE_EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, progress, reduce]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [MOTION.dissolve.rise, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
