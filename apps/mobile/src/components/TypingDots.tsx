import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// v45: the dots rise one after another, a beat each (.prev.typing i, @keyframes typing 1.2 s).
const BEAT_MS = 1200;
const STAGGER_MS = 180;
const DOT = 5;
const COLORS = [BRAND.purple, BRAND.pink, BRAND.orange] as const;

// "yazıyor" in the Mesajlar row (v45: .prev.typing): three dots in the mark's colours, like the
// loaders. Still with reduce motion. The text beside them says it; the dots are not read.
export function TypingDots() {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const [dots] = useState(() => COLORS.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduce) {
      dots.forEach((d) => d.setValue(0));
      return undefined;
    }
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * STAGGER_MS),
          Animated.timing(d, { toValue: 1, duration: BEAT_MS / 4, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: BEAT_MS / 4, useNativeDriver: true }),
          Animated.delay(BEAT_MS / 2 - i * STAGGER_MS),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, dots]);

  return (
    <View
      className="flex-row items-center"
      style={{ gap: SPACING[1], marginLeft: SPACING[1] }}
      importantForAccessibility="no-hide-descendants"
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: DOT,
            height: DOT,
            borderRadius: shape.radius.pill,
            backgroundColor: COLORS[i],
            opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [
              {
                translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -SPACING[0.5]] }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
