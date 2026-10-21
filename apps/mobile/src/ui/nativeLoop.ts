import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { keyframeCurve } from '@/theme/keyframeCurve';
import { sampleCurve } from '@/theme/markMotion';
import type { V46Animation, V46Channel } from '@/theme/parts.generated';

// Where the progress sits outside a round (before the delay, while the loop rests): below the
// curve's first sample, mapped to the part's own look.
const RESTING = -1;

// One channel of a v46 keyframe animation played over and over (`animation-iteration-count`: as
// many times as v46's rule says, for ever when it says `infinite`) on React Native's native driver:
// a linear run 0 → 1 per round, looped natively, its keyframes and easing sampled into the
// interpolation (theme/keyframeCurve.ts). While `plays` is off, and for the delay before the first
// round, the value is `rest`, the part's own look, as CSS shows it outside the animation.
//
// Not Reanimated: on Android every frame of a Reanimated loop commits the whole UI tree (its native
// flag ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS is off), which kept the main thread busy on every
// frame on a long screen (the v46 gallery, Keşfet's list). The native driver changes only the
// view's transform and opacity, as the loaders do (components/Mark.tsx).
export function useKeyframeLoop(
  motion: Pick<V46Animation, 'channels' | 'ease' | 'delayMs' | 'iterations'>,
  channel: V46Channel,
  plays: boolean,
  { rest, scale = 1, delayMs = motion.delayMs }: { rest: number; scale?: number; delayMs?: number },
): Animated.AnimatedInterpolation<number> | number {
  const [progress] = useState(() => new Animated.Value(RESTING));
  const curve = useMemo(() => keyframeCurve(motion, channel, scale), [motion, channel, scale]);
  const iterations = motion.iterations ?? -1;
  useEffect(() => {
    if (!plays || !curve) return undefined;
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: curve.period,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations },
    );
    const start = () => {
      progress.setValue(0);
      loop.start();
    };
    const timer = delayMs > 0 ? setTimeout(start, delayMs) : null;
    if (!timer) start();
    return () => {
      if (timer) clearTimeout(timer);
      loop.stop();
      progress.setValue(RESTING);
    };
  }, [plays, curve, iterations, delayMs, progress]);
  return useMemo(() => {
    if (!curve) return rest;
    const { inputRange, outputRange } = sampleCurve(curve.period, curve.at);
    return progress.interpolate({
      inputRange: [RESTING, ...inputRange],
      outputRange: [rest, ...outputRange],
    });
  }, [curve, rest, progress]);
}
