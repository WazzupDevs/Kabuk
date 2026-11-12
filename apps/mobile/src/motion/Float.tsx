import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';

// The floating stage (docs/design/iskelet.md → 2.5, 5.10): what it holds floats `MOTION.idle
// .floatPx` up and down over `floatMs`, a shadow under it breathing as it rises (narrower and
// fainter, as a buddy's); each new `drop` drops it `dropPx` onto its feet on `springs.pop`. Only
// its transform and opacity move, on the UI thread: what it holds is never drawn again.
// Reanimated, not Animated's native driver: on Android an SVG inside a view the native driver moves
// was not drawn until the move ended (CapsuleStage, 27 Ekim), and the float never ends. The float
// runs only while the screen is on top with the app in front (useLoopActive); with reduce motion
// nothing moves.
export function FloatStage({
  drop,
  dropPx,
  shadow,
  children,
}: {
  // Each new value drops it (0: none yet).
  drop: number;
  dropPx: number;
  shadow: { width: number; height: number; color: string; gap: number };
  children: ReactNode;
}) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const float = useSharedValue(0);
  const fall = useSharedValue(1);

  useEffect(() => {
    if (reduce || !active) {
      cancelAnimation(float);
      if (reduce) float.set(0);
      return undefined;
    }
    float.set(
      withRepeat(
        withTiming(1, { duration: MOTION.idle.floatMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(float);
  }, [reduce, active, float]);

  useEffect(() => {
    if (drop === 0 || reduce) return;
    fall.set(0);
    fall.set(withSpring(1, MOTION.springs.pop));
  }, [drop, reduce, fall]);

  const rise = MOTION.idle.floatPx;
  const holdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -rise * float.get() - dropPx * (1 - fall.get()) }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.get(), [0, 1], [1, BREATH_FADE]),
    transform: [{ scaleX: interpolate(float.get(), [0, 1], [1, BREATH_NARROW]) }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <Reanimated.View style={holdStyle}>{children}</Reanimated.View>
      <Reanimated.View
        pointerEvents="none"
        style={[
          {
            marginTop: shadow.gap,
            width: shadow.width,
            height: shadow.height,
            borderRadius: shadow.height / 2,
            backgroundColor: shadow.color,
          },
          shadowStyle,
        ]}
      />
    </View>
  );
}

// A buddy's shadow as it rises (aura/Buddy.tsx): 0.86 of its width, 0.7 of its strength.
const BREATH_NARROW = 0.86;
const BREATH_FADE = 0.7;
