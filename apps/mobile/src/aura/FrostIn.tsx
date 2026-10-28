import { type ReactNode, useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

import { ARRIVE_RN, springConfig } from './motion';

// A card that arrives frosted, then resolves (docs/design/aura/project/hareket.json → frostedFirst):
// it pops in as a pane of frosted glass, and a moment later the frost fades off what it holds. The
// n-th card a step after the one before. `radius` is the card's corner as a share of its width.
export function FrostIn({
  children,
  index = 0,
  radius,
}: {
  children: ReactNode;
  index?: number;
  radius: number;
}) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [pop] = useState(() => new Animated.Value(reduce ? 1 : 0));
  const [frost] = useState(() => new Animated.Value(reduce ? 0 : 1));
  useEffect(() => {
    if (reduce) return undefined;
    const delay = index * MOTION.stagger.row;
    const anim = Animated.parallel([
      Animated.spring(pop, { ...springConfig(MOTION.springs.pop), toValue: 1, delay }),
      Animated.timing(frost, {
        toValue: 0,
        duration: RESOLVE_MS,
        delay: delay + RESOLVE_AFTER_MS,
        easing: ARRIVE_RN,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduce, index, pop, frost]);
  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
        ],
      }}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: frost,
            borderRadius: width * radius,
            backgroundColor: scheme === 'dark' ? AURA.frost.fillDark : AURA.frost.fill,
            borderWidth: AURA.card.edgeWidth,
            borderColor: AURA[scheme].glass.edge,
          },
        ]}
      />
    </Animated.View>
  );
}

// From hareket.json → frostedFirst: the frost starts fading 320 ms after the card, over 500 ms.
const RESOLVE_AFTER_MS = 320;
const RESOLVE_MS = 500;
