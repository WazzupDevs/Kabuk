import { useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { svgKey } from '@/lib/svgKey';
import { gradientStyle } from '@/theme/gradient';
import { STAR_BURST } from '@/theme/gifts';

import { useBeat } from './loops';
import type { Stage } from './stage';

// The Efsanevi card's star bursts (the owner's call, 7 Kasım: stars in place of the two capsules;
// the preview he approved): at each side of the foot a cluster of four-pointed stars that swell,
// turn and fade in turn, and white sparks. Every star is drawn once (svgKey); one clock on the
// native driver moves them all (loops.ts); still with reduce motion.
const BOX = { w: 140, h: 136, foot: 104, edge: 4 };
// left, top in the box's shares; size on the board; colour; when in the beat it is fullest.
const STARS = [
  [0.26, 0.1, 86, 'gold', 0],
  [0, 0.52, 43, 'pink', 0.18],
  [0.7, 0, 39, 'pale', 0.38],
  [0.74, 0.56, 51, 'gold', 0.55],
  [0.08, 0.04, 27, 'pink', 0.12],
  [0.5, 0.74, 31, 'pale', 0.3],
  [0.92, 0.3, 23, 'pink', 0.47],
] as const;
const SPARKS = [
  [0.2, 0.4, 5, 0.06],
  [0.58, 0.36, 4, 0.44],
  [0.84, 0.3, 5, 0.25],
  [0.4, 0.88, 4, 0.6],
] as const;
const STAR_PATH = 'M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z';
const BEAT_MS = 1700;
const LOW = { scale: 0.55, opacity: 0.45, turn: 0 };
const HIGH = { scale: 1.12, opacity: 1, turn: 18 };
const STEPS = 8;

// A value that is HIGH at `at` of the beat and LOW half a beat away, smoothly (a sampled cosine).
function wave(t: Animated.Value, at: number, low: number, high: number) {
  const inputRange = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
  const outputRange = inputRange.map(
    (x) => low + ((high - low) * (1 + Math.cos(2 * Math.PI * (x - at)))) / 2,
  );
  return t.interpolate({ inputRange, outputRange });
}

export function StarBursts({ stage }: { stage: Stage }) {
  const t = useBeat(BEAT_MS);
  return (
    <>
      <Burst stage={stage} side="left" t={t} />
      <Burst stage={stage} side="right" t={t} />
    </>
  );
}

function Burst({
  stage,
  side,
  t,
}: {
  stage: Stage;
  side: 'left' | 'right';
  t: Animated.Value | null;
}) {
  const { s } = stage;
  const w = BOX.w * s;
  const h = BOX.h * s;
  const moves = useMemo(
    () =>
      t
        ? STARS.map(([, , , , at]) => ({
            opacity: wave(t, at, LOW.opacity, HIGH.opacity),
            scale: wave(t, at, LOW.scale, HIGH.scale),
            rotate: wave(t, at, LOW.turn, HIGH.turn).interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }),
          }))
        : null,
    [t],
  );
  const sparks = useMemo(
    () => (t ? SPARKS.map(([, , , at]) => wave(t, at, LOW.opacity, HIGH.opacity)) : null),
    [t],
  );
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        [side]: BOX.edge * s,
        bottom: stage.foot(BOX.foot),
        width: w,
        height: h,
        // The right one is the left one mirrored.
        transform: side === 'right' ? [{ scaleX: -1 }] : undefined,
      }}
    >
      {STARS.map(([x, y, size, color, at], i) => {
        const px = (size / 3.9) * s;
        const move = moves?.[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: x * w,
              top: y * h,
              width: px,
              height: px,
              opacity: move ? move.opacity : HIGH.opacity,
              transform: move
                ? [{ scale: move.scale }, { rotate: move.rotate }]
                : [{ scale: at === 0 ? 1 : 0.85 }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: -px * 0.4,
                top: -px * 0.4,
                width: px * 1.8,
                height: px * 1.8,
                ...gradientStyle(STAR_BURST.halo),
              }}
            />
            <Svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              nativeID={svgKey('star-burst', color, Math.round(px))}
            >
              <Path d={STAR_PATH} fill={STAR_BURST[color]} />
            </Svg>
          </Animated.View>
        );
      })}
      {SPARKS.map(([x, y, size], i) => {
        const px = size * s;
        return (
          <Animated.View
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: x * w,
              top: y * h,
              width: px,
              height: px,
              borderRadius: px / 2,
              backgroundColor: STAR_BURST.spark,
              boxShadow: `0 0 ${px * 1.6}px ${px * 0.5}px ${STAR_BURST.glow}`,
              opacity: sparks?.[i] ?? HIGH.opacity,
            }}
          />
        );
      })}
    </View>
  );
}
