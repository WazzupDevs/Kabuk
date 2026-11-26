import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';

// A beating dot: something is live there (Keşfet's Semt tab, 26 Kasım). It grows to `scale` and
// back over `ms` each way while its screen is in view (useLoopActive); still with reduce motion.
export function LiveDot({
  color,
  size,
  scale,
  ms,
}: {
  color: string;
  size: number;
  scale: number;
  ms: number;
}) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const [beat] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce || !active) {
      beat.setValue(0);
      return undefined;
    }
    const half = { duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { ...half, toValue: 1 }),
        Animated.timing(beat, { ...half, toValue: 0 }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, active, beat, ms]);
  return (
    <Animated.View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }],
      }}
    />
  );
}
