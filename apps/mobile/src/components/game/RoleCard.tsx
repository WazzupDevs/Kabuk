import { type ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { CURVES, ROLE_TURN, TILT } from '@/theme/playMotion';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  // The side everyone may see (the mark), and the role under it.
  back: ReactNode;
  face: ReactNode;
  // Held: the card shows its face (v45: basılı tutunca döner). Called on the first time.
  onSeen?: () => void;
  // What screen readers hear: the back while it rests, the face (`faceLabel`) said each time it is
  // held, since the face is never on screen otherwise.
  accessibilityLabel: string;
  faceLabel: string;
  testID?: string;
};

// Sahtekar's role card (v43 report §2, the v45 file's .sgc): held, it turns over to its face in
// 550 ms with a slight overshoot; let go, it turns back, so nobody looking over a shoulder sees it.
// With reduce motion the face fades in and out instead of turning. The face never shows unless the
// card is held.
export function RoleCard({ back, face, onSeen, accessibilityLabel, faceLabel, testID }: Props) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const turn = useSharedValue(0);
  const seen = useRef(false);

  useEffect(() => () => turn.set(0), [turn]);

  const hold = (on: boolean) => {
    turn.set(
      withTiming(on ? 1 : 0, {
        duration: reduce ? ROLE_TURN.reducedMs : ROLE_TURN.ms,
        easing: Easing.bezier(...CURVES.turn),
      }),
    );
    if (on) AccessibilityInfo.announceForAccessibility(faceLabel);
    if (on && !seen.current) {
      seen.current = true;
      onSeen?.();
    }
  };

  const backStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: 1 - Math.min(1, turn.value) }
      : {
          transform: [
            { perspective: TILT.perspective },
            { rotateY: `${interpolate(turn.value, [0, 1], [0, ROLE_TURN.degrees])}deg` },
          ],
        },
  );
  const faceStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: Math.min(1, turn.value) }
      : {
          transform: [
            { perspective: TILT.perspective },
            {
              rotateY: `${interpolate(turn.value, [0, 1], [ROLE_TURN.degrees, ROLE_TURN.degrees * 2])}deg`,
            },
          ],
        },
  );
  const side = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: shape.radius.roleCard,
    overflow: 'hidden' as const,
    backfaceVisibility: 'hidden' as const,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => hold(true)}
      onPressOut={() => hold(false)}
      testID={testID}
      style={{ aspectRatio: 3 / 4 }}
    >
      <View className="flex-1">
        <Animated.View style={[side, backStyle]}>{back}</Animated.View>
        <Animated.View style={[side, faceStyle]}>{face}</Animated.View>
      </View>
    </Pressable>
  );
}
