import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { transitionStyle } from './motion';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  // "Lobide görünsün": what it turns on, for screen readers (the row beside it says it on screen).
  accessibilityLabel: string;
  // It cannot change now (v46: Bildirimler while the phone's permission is off): faded, and a press
  // only tells the screen, which says why.
  disabled?: boolean;
  onDisabledPress?: () => void;
  testID?: string;
};

// v46's switch (`.vsw`): a round track and its knob; on, the knob slides over (250 ms, a little
// past and back) and the track turns purple (200 ms). A press does not shrink it. With reduce
// motion the knob moves at once, the colour still eases (v46's own rules). Its touch reaches a
// little past it (`.vsw::after`). A change is felt (`selection`, as a filter chip).
export function Switch({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  onDisabledPress,
  testID,
}: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const w = V46_FORM[scheme].switch;
  const k = w.knob;
  return (
    <Pressable
      onPress={() => {
        if (disabled) {
          onDisabledPress?.();
          return;
        }
        onChange(!value);
      }}
      hitSlop={w.hitSlop}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      testID={testID}
    >
      <Animated.View
        style={[
          {
            width: w.width,
            height: w.height,
            borderRadius: w.radius,
            backgroundColor: value ? w.on : w.off,
            opacity: disabled ? w.disabledOpacity : 1,
          },
          transitionStyle(w.transitions),
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: k.inset,
              left: k.inset,
              width: k.size,
              height: k.size,
              borderRadius: k.radius,
              backgroundColor: k.bg,
              boxShadow: k.shadow ?? undefined,
              transform: [{ translateX: value ? k.onX : 0 }],
            },
            transitionStyle(reduce ? k.reduced : k.transitions),
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
