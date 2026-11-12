import { type ReactNode, useState } from 'react';
import {
  Animated,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { springConfig } from '@/aura/motion';
import { haptic } from '@/lib/haptics';
import type { HapticMoment } from '@/lib/hapticMoments';
import { MOTION } from '@/theme/aura';

// A press that sinks a little and springs back (iskelet.md → 2.3, hareket.json → press), on the
// native driver: down to MOTION.press.scale in MOTION.press.downMs, back on springs.press. `delay`
// goes to the Pressable's `unstable_pressDelay`: the press shows a moment after the touch, and a
// scroll that starts first takes the touch (its responder ends before the press is in), so rows
// under a scrolling finger never look pressed. A quick tap still sinks and springs back as it lifts.
// The one source of the press: Tap and every kit button (aura/kit → Btn, Round, Chip) use it.
export const PRESS_DELAY = MOTION.press.delayMs;
export function usePress() {
  const [scale] = useState(() => new Animated.Value(1));
  return {
    scale,
    delay: PRESS_DELAY,
    onPressIn: () =>
      Animated.timing(scale, {
        toValue: MOTION.press.scale,
        duration: MOTION.press.downMs,
        useNativeDriver: true,
      }).start(),
    onPressOut: () =>
      Animated.spring(scale, { ...springConfig(MOTION.springs.press), toValue: 1 }).start(),
  };
}

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  // The touch its role makes as it is pressed (lib/hapticMoments.ts: a choice changed is
  // `selection`); none by default, a touch confirms an outcome, never every press.
  feel?: HapticMoment;
  // Unset: it sinks; false keeps it still (a row that only dims).
  sink?: boolean;
  testID?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  hitSlop?: Insets | number;
  // On the part that sinks: NativeWind drops a function `style` on Pressable in release
  // (docs/arsiv/DECISIONS.md), so the look is on the inner view.
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// The one press (iskelet.md → 2.3): everything pressable goes through it, no bare Pressable.
export function Tap({
  onPress,
  onLongPress,
  disabled,
  feel,
  sink = true,
  testID,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  hitSlop,
  style,
  children,
}: Props) {
  const press = usePress();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      hitSlop={hitSlop}
      disabled={disabled}
      unstable_pressDelay={press.delay}
      onPressIn={sink ? press.onPressIn : undefined}
      onPressOut={sink ? press.onPressOut : undefined}
      onLongPress={onLongPress}
      onPress={
        onPress
          ? () => {
              if (feel) haptic(feel);
              onPress();
            }
          : undefined
      }
    >
      <Animated.View style={[style, sink ? { transform: [{ scale: press.scale }] } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
