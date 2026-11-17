import { type ReactNode, useEffect, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { springConfig } from '@/aura/motion';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

// The motions of Kapsülünü süsle and Tüm aksesuarlar (yeni arayüz tuvali, hareket A5, A6) that the
// kit did not have yet; the screens take them from here (theme/motionGuard.test.ts).

// A mark that fades in and out with `on` (hareket 6.3: the piece's pink ring, 140 ms, at once with
// reduced motion). It lets touches through.
export function FadeMark({
  on,
  style,
  children,
}: {
  on: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const reduce = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(on ? 1 : 0));
  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: on ? 1 : 0,
      duration: reduce ? 0 : MOTION.tab.iconFadeMs,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [on, reduce, opacity]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

// The line under the open tab: it slides to `x` (and its `width`) on springs.seg (hareket 5.5); at
// once with reduced motion.
export function SlideLine({ x, style }: { x: number; style: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const slide = useAnimatedStyle(
    () => ({ transform: [{ translateX: reduce ? x : withSpring(x, MOTION.springs.seg) }] }),
    [x, reduce],
  );
  return <Reanimated.View pointerEvents="none" style={[style, slide]} />;
}

// What grows in from `from` on the pop spring when it first shows (hareket 6.4: "Kapsülüne tak" from
// 0.4); at once with reduced motion.
export function PopScale({
  from = MOTION.messageIn.sendFromScale,
  style,
  children,
}: {
  from?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
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
      pointerEvents="box-none"
      style={[
        style,
        {
          opacity: p.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
