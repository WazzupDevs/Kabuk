import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_BUTTON_MOTION, V46_BUTTONS } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_COMPONENTS } from '@/theme/tokens.generated';

import { ButtonGlyph, SendBars } from './glyph';
import { transitionStyle } from './motion';

// v46's send button (`.send`, 52, round) beside the chats' composer. Its two bars wait grey and
// turn to the brand colours once there is something to send (`ready`: `.send.ready`, eased by
// `.send-ic rect`). Pressed while ready, the bars fly off and come back (`.send.shoot .sg`). While
// pressed it shrinks (`.va button:active`, eased by `.send`'s own transform transition).
export function SendButton({
  onPress,
  accessibilityLabel,
  ready = false,
  disabled = false,
  testID,
  pressedPreview = false,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  ready?: boolean;
  disabled?: boolean;
  testID?: string;
  pressedPreview?: boolean;
}) {
  const { scheme } = useTheme();
  const [pressing, setPressing] = useState(false);
  const [shot, setShot] = useState(0);
  const box = V46_COMPONENTS.gonder[scheme];
  const p = V46_BUTTONS.gonder[scheme];
  const pressed = (pressing || pressedPreview) && !disabled;
  const press = () => {
    if (ready && V46_BUTTON_MOTION.shoot.looks.includes('gonder')) setShot((n) => n + 1);
    onPress();
  };
  return (
    <Pressable
      onPress={press}
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
        {p.icon && 'send' in p.icon ? (
          <SendBars icon={p.icon} ready={ready} shot={shot} />
        ) : p.icon ? (
          <ButtonGlyph icon={p.icon} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
