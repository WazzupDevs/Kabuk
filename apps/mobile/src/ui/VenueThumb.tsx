import { Animated, View } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  V46_EXPLORE,
  V46_EXPLORE_MOTION,
  V46_VENUE_THUMBS,
  type V46SteamBar,
  type V46ThumbKind,
} from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { useKeyframeLoop } from './nativeLoop';
import { V46Svg } from './V46Svg';

// A venue's icon (v46 `.vthumb`): a rounded square with the kind's drawing. The cafe's cup steams:
// its two bars rise and fade (`.th-steam`, 2.4 s, for ever, the second .6 s later), clipped by the
// square; v46 stops them with reduce motion and they stand still, as where loops hold. The loops run
// on the native driver (nativeLoop.ts).
export function VenueThumb({ kind }: { kind: V46ThumbKind }) {
  const { scheme } = useTheme();
  const t = V46_EXPLORE[scheme].row.thumb;
  const thumb = V46_VENUE_THUMBS[kind];
  const k = t.size[0] / thumb.drawing.viewBox[2];
  return (
    <View
      style={{ width: t.size[0], height: t.size[1], borderRadius: t.radius, overflow: 'hidden' }}
    >
      <V46Svg drawing={thumb.drawing} size={t.size} />
      {thumb.steam.map((bar, i) => (
        <Steam key={i} bar={bar} k={k} />
      ))}
    </View>
  );
}

function Steam({ bar, k }: { bar: V46SteamBar; k: number }) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const steam = V46_EXPLORE_MOTION.steam;
  const plays = active && !(reduce && steam.offWhenReduced);
  // Before its delay a bar stays where it rests, as CSS shows it before the animation starts.
  const y = useKeyframeLoop(steam, 'translateY', plays, {
    rest: 0,
    scale: k,
    delayMs: bar.delayMs,
  });
  const opacity = useKeyframeLoop(steam, 'opacity', plays, { rest: 1, delayMs: bar.delayMs });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: bar.x * k,
        top: bar.y * k,
        width: bar.width * k,
        height: bar.height * k,
        borderRadius: bar.rx * k,
        backgroundColor: bar.fill,
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}
