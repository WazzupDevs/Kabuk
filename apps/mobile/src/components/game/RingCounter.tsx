import type { ReactNode } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { LOW_TIME, ON_GAME, ON_GAME_ALPHA, ON_JUDGE } from '@/theme/gameColors';
import { isLow, RING, RING_HALVES, timeShare } from '@/theme/gameMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from '../Text';
import { useTickedShare } from './TimerBar';

type Props = {
  secondsLeft: number;
  totalSeconds: number;
  // The person speaking or grabbing: an avatar filling the inner disc.
  children: ReactNode;
  // v43 sizes the ring to the screen (112 to 148).
  size?: number;
  testID?: string;
};

export const RING_SIZE = { sm: 112, lg: 148 } as const;
// The seconds' pill under the ring (v43: .bx-sec, 44 x 28, 8 below the ring's edge).
const PILL = { minWidth: SPACING[11], height: SPACING[7], drop: SPACING[2] } as const;
const FACE_BORDER = SPACING[1];
// A share this small past a half's start shows that half.
const EDGE = 0.002;

// The ring around the person whose turn it is (v43 report §5, the v45 file's .bx-ring and .sg-ring):
// a white ring that empties a second at a time, the seconds in a pill under it. In the last five
// seconds the ring and the pill turn orange. With reduce motion the ring jumps. The SVGs never
// change while it runs: two half arcs turn on the native driver (gameMotion.ts → RING_HALVES), so
// nothing is redrawn on a frame.
export function RingCounter({
  secondsLeft,
  totalSeconds,
  children,
  size = RING_SIZE.lg,
  testID,
}: Props) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const low = isLow(secondsLeft);
  const share = useTickedShare(timeShare(secondsLeft, totalSeconds), reduce);
  const inset = Math.round(size * RING.faceInset);
  // Whole halves: no hairline where the two clips meet.
  const side = Math.round(size / 2) * 2;
  const half = side / 2;
  const turn = (to: readonly number[]) =>
    share.interpolate({
      inputRange: [...RING_HALVES.at],
      outputRange: to.map((deg) => `${deg}deg`),
    });
  const arc = low ? LOW_TIME.fill : ON_GAME;
  // A half that has not turned in yet is hidden: its round end would peek over the clip's edge.
  const shownAfter = (at: number) =>
    share.interpolate({ inputRange: [at, at + EDGE], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.gameParts.secondsLeft(secondsLeft)}
      testID={testID}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${RING.box} ${RING.box}`}
        style={{ position: 'absolute' }}
      >
        <Circle
          cx={RING.box / 2}
          cy={RING.box / 2}
          r={RING.radius}
          fill="none"
          strokeWidth={RING.stroke}
          stroke={withAlpha(ON_GAME, ON_GAME_ALPHA.ring)}
        />
      </Svg>
      {/* The right half: an arc on the left turns into view (0 → 180°). */}
      <View
        className="absolute overflow-hidden"
        style={{ left: half, top: 0, width: half, height: side }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: -half,
            width: side,
            height: side,
            opacity: shownAfter(0),
            transform: [{ rotate: turn(RING_HALVES.right) }],
          }}
        >
          <HalfArc size={side} side="left" color={arc} />
        </Animated.View>
      </View>
      {/* The left half: an arc on the right turns into view after half the time (180 → 360°). */}
      <View
        className="absolute overflow-hidden"
        style={{ left: 0, top: 0, width: half, height: side }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            width: side,
            height: side,
            opacity: shownAfter(0.5),
            transform: [{ rotate: turn(RING_HALVES.left) }],
          }}
        >
          <HalfArc size={side} side="right" color={arc} />
        </Animated.View>
      </View>
      <View
        className="absolute items-center justify-center overflow-hidden"
        style={{
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: shape.radius.pill,
          borderWidth: FACE_BORDER,
          borderColor: ON_GAME,
          backgroundColor: ON_GAME,
        }}
      >
        {children}
      </View>
      <View
        className="absolute items-center justify-center self-center"
        style={{
          bottom: -PILL.drop,
          minWidth: PILL.minWidth,
          height: PILL.height,
          paddingHorizontal: SPACING[2.5],
          borderRadius: shape.radius.pill,
          backgroundColor: low ? LOW_TIME.fill : ON_GAME,
        }}
      >
        <Text variant="gameButton" color={ON_JUDGE} tabular>
          {String(Math.max(0, secondsLeft))}
        </Text>
      </View>
    </View>
  );
}

// Half of the ring, from 12 to 6 o'clock on one side, drawn once; round where the arc ends.
function HalfArc({ size, side, color }: { size: number; side: 'left' | 'right'; color: string }) {
  const c = RING.box / 2;
  const sweep = side === 'right' ? 1 : 0;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${RING.box} ${RING.box}`}>
      <Path
        d={`M ${c} ${c - RING.radius} A ${RING.radius} ${RING.radius} 0 0 ${sweep} ${c} ${c + RING.radius}`}
        fill="none"
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        stroke={color}
      />
    </Svg>
  );
}
