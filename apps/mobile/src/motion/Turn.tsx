import { type ReactNode, useEffect } from 'react';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';

// "Karıştır" (the owner's call, 27 Ekim): what it holds (the die) turns once round and swells a
// little with each new `turn`; still with reduce motion.
const TURN_MS = 520;
const SWELL = 1.18;

export function Turn({ turn, children }: { turn: number; children: ReactNode }) {
  const reduce = useReduceMotion();
  const spin = useSharedValue(0);
  const swell = useSharedValue(1);
  useEffect(() => {
    if (turn === 0 || reduce) return;
    spin.set(0);
    spin.set(withTiming(1, { duration: TURN_MS, easing: Easing.out(Easing.back(1.4)) }));
    swell.set(
      withSequence(
        withTiming(SWELL, { duration: TURN_MS / 2 }),
        withTiming(1, { duration: TURN_MS / 2 }),
      ),
    );
  }, [turn, reduce, spin, swell]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.get() * 360}deg` }, { scale: swell.get() }],
  }));
  return <Reanimated.View style={style}>{children}</Reanimated.View>;
}
