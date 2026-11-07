import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';

// The gift screens' motions that go on by themselves, on the native driver (theme/loopGuard.test.ts:
// never a Reanimated loop): only while the screen is on top and the app in front, none with reduce
// motion.

// A float: up and down by `px` over `ms`, starting `delayMs` late (the packs in the air).
export function useFloat(
  px: number,
  ms: number,
  delayMs: number,
): Animated.AnimatedInterpolation<number> {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce || !active) {
      t.setValue(0.5);
      return undefined;
    }
    t.setValue(0);
    const half = (to: number) =>
      Animated.timing(t, {
        toValue: to,
        duration: ms / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.sequence([
      Animated.delay(delayMs),
      Animated.loop(Animated.sequence([half(1), half(0)])),
    ]);
    loop.start();
    return () => loop.stop();
  }, [reduce, active, t, ms, delayMs]);
  return t.interpolate({ inputRange: [0, 1], outputRange: [-px, px] });
}

// A beat: 0 → 1 over `ms`, again and again (the "can open" badge); null with reduce motion.
export function useBeat(ms: number): Animated.Value | null {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce || !active) {
      t.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: ms,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, active, t, ms]);
  return reduce ? null : t;
}
