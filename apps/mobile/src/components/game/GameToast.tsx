import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { GAME_SHADOW, JUDGE_COLORS, ON_GAME, ON_JUDGE } from '@/theme/gameColors';
import { EASE_BACK, TOAST } from '@/theme/gameMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from '../Text';

// A notice: a new `id` shows it again, even with the same text.
export type GameToastMessage = { id: number | string; text: string; bad?: boolean };

type Props = {
  message: GameToastMessage | null;
  // Where it floats, under the game's top row (v43: 62 from the top).
  top?: number;
  testID?: string;
};

// The short notice at the top of a game (v43 report §5, the v45 file's .tg-flash): a white pill,
// in with a pop, gone after 1.6 s ("1 puan aldın"; "Yasak! Kart geçildi" in red). It sits over the
// prompt, never over the buttons, and lets touches through. Screen readers hear it once.
export function GameToast({ message, top = SPACING[16] - SPACING[0.5], testID }: Props) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  // The notice that timed out; a new id shows again.
  const [gone, setGone] = useState<GameToastMessage['id'] | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const shown = message && message.id !== gone ? message : null;

  useEffect(() => {
    if (!message) return undefined;
    progress.setValue(reduce ? 1 : 0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: reduce ? 0 : TOAST.inMs,
      easing: (u) => EASE_BACK(u),
      useNativeDriver: true,
    });
    anim.start();
    const hide = setTimeout(() => setGone(message.id), TOAST.showMs);
    return () => {
      anim.stop();
      clearTimeout(hide);
    };
  }, [message, progress, reduce]);

  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      testID={testID}
      className="absolute self-center"
      style={{
        top,
        maxWidth: '90%',
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[2.5],
        borderRadius: shape.radius.pill,
        backgroundColor: ON_GAME,
        boxShadow: GAME_SHADOW.toast,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [TOAST.fromY, 0] }),
          },
          {
            scale: progress.interpolate({ inputRange: [0, 1], outputRange: [TOAST.fromScale, 1] }),
          },
        ],
      }}
    >
      <Text variant="toast" color={shown.bad ? JUDGE_COLORS.forbidden : ON_JUDGE} align="center">
        {shown.text}
      </Text>
    </Animated.View>
  );
}
