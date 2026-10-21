import { Animated, View } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_EXPLORE, V46_EXPLORE_MOTION } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { useKeyframeLoop } from './nativeLoop';

// v46's live dot (`.live`): a small green round that beats (`livePulse`, 1.6 s, for ever) under a
// halo of its own colour that spreads and fades with it (`.live::after`, `liveHalo`). With reduce
// motion the dot only fades in and out (`liveFade`) and the halo stays still. Where loops hold (the
// visual gate) or the screen is away, both rest at their own look, as v46 draws them still. The
// loops run on the native driver (nativeLoop.ts).
export function LiveDot({ size }: { size: number }) {
  const { scheme } = useTheme();
  const live = V46_EXPLORE[scheme].live;
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const m = V46_EXPLORE_MOTION;
  const beats = active && !reduce;
  const fades = active && reduce;
  const scale = useKeyframeLoop(m.livePulse, 'scale', beats, { rest: 1 });
  const opacity = useKeyframeLoop(m.liveFade, 'opacity', fades, { rest: 1 });
  const haloScale = useKeyframeLoop(m.liveHalo, 'scale', beats, { rest: 1 });
  const haloOpacity = useKeyframeLoop(m.liveHalo, 'opacity', beats, { rest: live.halo.opacity });
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <Animated.View style={[round, { backgroundColor: live.bg, opacity, transform: [{ scale }] }]}>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <Animated.View
          style={[
            round,
            {
              backgroundColor: live.halo.bg,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}
