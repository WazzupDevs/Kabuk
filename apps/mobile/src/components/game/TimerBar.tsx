import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { LOW_TIME, ON_GAME, ON_GAME_ALPHA } from '@/theme/gameColors';
import { isLow, LOW_PULSE, TICK_MS, timeShare } from '@/theme/gameMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from '../Text';

type Props = {
  secondsLeft: number;
  totalSeconds: number;
  testID?: string;
};

// The width the number keeps, so the bar does not jump as 10 becomes 9 (v43: min-width 62px).
const CLOCK_WIDTH = SPACING[16] - SPACING[0.5];
const BAR_HEIGHT = SPACING[3];

// A timed turn's clock on its game ground (v43 report §5, the v45 file's .tg-timer): the seconds
// left, big, and a white bar that empties a second at a time. In the last five seconds the bar turns
// orange and the number pale orange, pulsing once a second. With reduce motion the bar jumps and
// the number stays still.
export function TimerBar({ secondsLeft, totalSeconds, testID }: Props) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const low = isLow(secondsLeft);
  const share = useTickedShare(timeShare(secondsLeft, totalSeconds), reduce);
  const pulse = usePulse(low && !reduce);

  return (
    <View
      className="flex-row items-center"
      style={{ gap: SPACING[3] }}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.gameParts.secondsLeft(secondsLeft)}
      testID={testID}
    >
      <Animated.View
        style={{ minWidth: CLOCK_WIDTH, transformOrigin: 'left', transform: [{ scale: pulse }] }}
      >
        <Text variant="clock" color={low ? LOW_TIME.text : ON_GAME} tabular>
          {String(Math.max(0, secondsLeft))}
        </Text>
      </Animated.View>
      <View
        className="flex-1 overflow-hidden"
        style={{
          height: BAR_HEIGHT,
          borderRadius: shape.radius.pill,
          backgroundColor: withAlpha(ON_GAME, ON_GAME_ALPHA.track),
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: shape.radius.pill,
            backgroundColor: low ? LOW_TIME.fill : ON_GAME,
            transformOrigin: 'left',
            transform: [{ scaleX: share }],
          }}
        />
      </View>
    </View>
  );
}

// The share as an animated value that moves to each new share over a second, linearly; with reduce
// motion it is set at once. `native`: a transform (the bar) runs on the native driver; an SVG
// stroke (the ring) cannot.
export function useTickedShare(target: number, reduce: boolean, native = true): Animated.Value {
  const [value] = useState(() => new Animated.Value(target));
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      value.setValue(target);
      return undefined;
    }
    const anim = Animated.timing(value, {
      toValue: target,
      duration: TICK_MS,
      easing: Easing.linear,
      useNativeDriver: native,
    });
    anim.start();
    return () => anim.stop();
  }, [target, reduce, native, value]);
  return value;
}

// 1 → 1.08 → 1 once a second while on.
function usePulse(on: boolean): Animated.Value {
  const [value] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!on) {
      value.setValue(1);
      return undefined;
    }
    const half = LOW_PULSE.periodMs / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: LOW_PULSE.scale,
          duration: half,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: half,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, value]);
  return value;
}
