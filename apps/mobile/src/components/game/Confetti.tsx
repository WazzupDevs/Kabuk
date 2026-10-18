import { useEffect, useMemo, useState } from 'react';
import { Animated, useWindowDimensions, View } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { CONFETTI_COLORS } from '@/theme/gameColors';
import { CONFETTI, confettiPieces, EASE_FALL } from '@/theme/gameMotion';

type Props = {
  // A new key throws the confetti again.
  burst: number;
  seed?: number;
};

// Confetti for the winners at the end of a game (v43 report §5, the v45 file's .conf): 26 pieces
// fall once through their parent and stop. Decoration only: hidden from screen readers, touches
// pass through, and nothing at all with reduce motion.
export function Confetti({ burst, seed = 1 }: Props) {
  const reduce = useReduceMotion();
  const { height } = useWindowDimensions();
  const pieces = useMemo(() => confettiPieces(seed, CONFETTI_COLORS.length), [seed]);
  const [fall] = useState(() => pieces.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduce) return undefined;
    const anims = pieces.map((p, i) => {
      fall[i]?.setValue(0);
      return Animated.timing(fall[i] as Animated.Value, {
        toValue: 1,
        duration: CONFETTI.fallMs,
        delay: p.delayMs,
        easing: (u) => EASE_FALL(u),
        useNativeDriver: true,
      });
    });
    const all = Animated.parallel(anims);
    all.start();
    return () => all.stop();
  }, [burst, reduce, pieces, fall]);

  if (reduce) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden"
    >
      {pieces.map((p, i) => {
        const v = fall[i] as Animated.Value;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: CONFETTI.startY,
              left: `${p.left * 100}%`,
              width: CONFETTI.piece.width,
              height: CONFETTI.piece.height,
              borderRadius: CONFETTI.piece.radius,
              backgroundColor: CONFETTI_COLORS[p.color],
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                {
                  translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 1.1] }),
                },
                {
                  rotate: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${p.turnDeg}deg`],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
