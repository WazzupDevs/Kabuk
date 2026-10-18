import type { ReactNode } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { LOW_TIME, ON_GAME, ON_GAME_ALPHA, ON_JUDGE } from '@/theme/gameColors';
import { isLow, RING, RING_CIRCUMFERENCE, timeShare } from '@/theme/gameMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from '../Text';
import { useTickedShare } from './TimerBar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

// The ring around the person whose turn it is (v43 report §5, the v45 file's .bx-ring and .sg-ring):
// a white ring that empties a second at a time, the seconds in a pill under it. In the last five
// seconds the ring and the pill turn orange. With reduce motion the ring jumps.
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
  const share = useTickedShare(timeShare(secondsLeft, totalSeconds), reduce, false);
  const inset = Math.round(size * RING.faceInset);
  const c = RING.box / 2;

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
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={c}
          cy={c}
          r={RING.radius}
          fill="none"
          strokeWidth={RING.stroke}
          stroke={withAlpha(ON_GAME, ON_GAME_ALPHA.ring)}
        />
        <AnimatedCircle
          cx={c}
          cy={c}
          r={RING.radius}
          fill="none"
          strokeWidth={RING.stroke}
          strokeLinecap="round"
          stroke={low ? LOW_TIME.fill : ON_GAME}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={share.interpolate({
            inputRange: [0, 1],
            outputRange: [RING_CIRCUMFERENCE, 0],
          })}
        />
      </Svg>
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
