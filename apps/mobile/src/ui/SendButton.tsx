import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_BUTTONS } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_COMPONENTS } from '@/theme/tokens.generated';

import { ButtonGlyph } from './glyph';
import { transitionStyle } from './motion';

// v46's send button (`.send`, 52, round) beside the chats' composer, as it waits: its two bars
// drawn as measured. While pressed it shrinks (`.va button:active`, eased by `.send`'s own
// transform transition).
export function SendButton({
  onPress,
  accessibilityLabel,
  disabled = false,
  testID,
  pressedPreview = false,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
  pressedPreview?: boolean;
}) {
  const { scheme } = useTheme();
  const [pressing, setPressing] = useState(false);
  const box = V46_COMPONENTS.gonder[scheme];
  const p = V46_BUTTONS.gonder[scheme];
  const pressed = (pressing || pressedPreview) && !disabled;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Animated.View
        style={[
          {
            width: box.height,
            height: box.height,
            borderRadius: box.radius,
            backgroundColor: box.bg ?? 'transparent',
            boxShadow: box.shadow ?? undefined,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: [{ scale: pressed ? p.pressedScale : 1 }],
          },
          transitionStyle(p.transitions),
        ]}
      >
        {p.icon ? <ButtonGlyph icon={p.icon} /> : null}
      </Animated.View>
    </Pressable>
  );
}
