import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_EXPLORE, V46_EXPLORE_MOTION } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { keyframeLoop } from './motion';

// v46's live dot (`.live`): a small green round that beats (`livePulse`, 1.6 s, for ever) under a
// halo of its own colour that spreads and fades with it (`.live::after`, `liveHalo`). With reduce
// motion the dot only fades in and out (`liveFade`) and the halo stays still. Where loops hold (the
// visual gate) or the screen is away, both rest at their own look, as v46 draws them still.
export function LiveDot({ size }: { size: number }) {
  const { scheme } = useTheme();
  const live = V46_EXPLORE[scheme].live;
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const m = V46_EXPLORE_MOTION;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(live.halo.opacity);
  useEffect(() => {
    const parts = [scale, opacity, haloScale, haloOpacity];
    if (!active) return;
    if (reduce) {
      const fade = keyframeLoop(m.liveFade, 'opacity');
      if (fade) opacity.set(fade);
    } else {
      const beat = keyframeLoop(m.livePulse, 'scale');
      const spread = keyframeLoop(m.liveHalo, 'scale');
      const glow = keyframeLoop(m.liveHalo, 'opacity');
      if (beat) scale.set(beat);
      if (spread) haloScale.set(spread);
      if (glow) haloOpacity.set(glow);
    }
    return () => {
      for (const v of parts) cancelAnimation(v);
      scale.set(1);
      opacity.set(1);
      haloScale.set(1);
      haloOpacity.set(live.halo.opacity);
    };
  }, [active, reduce, m, scale, opacity, haloScale, haloOpacity, live.halo.opacity]);
  const dot = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <Animated.View style={[round, { backgroundColor: live.bg }, dot]}>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <Animated.View style={[round, { backgroundColor: live.halo.bg }, halo]} />
      </View>
    </Animated.View>
  );
}
