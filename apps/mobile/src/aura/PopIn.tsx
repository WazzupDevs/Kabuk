import { type ReactNode, useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

import { springConfig } from './motion';

// Something that arrives with a bounce from below (docs/design/aura → Masa: a join request, a
// notice): from `rise` lower and a little smaller, faded in, on the pop spring. At once when motion
// is reduced.
export function PopIn({ children, rise = POP_RISE }: { children: ReactNode; rise?: number }) {
  const reduce = useReduceMotion();
  const [p] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.spring(p, { ...springConfig(MOTION.springs.pop), toValue: 1 });
    anim.start();
    return () => anim.stop();
  }, [reduce, p]);
  return (
    <Animated.View
      style={{
        opacity: p.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) },
          { scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// The film's join request: it comes up from 80 below.
const POP_RISE = 80;
