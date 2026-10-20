import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_BUTTONS, type V46ButtonId } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_COMPONENTS } from '@/theme/tokens.generated';
import { v46FontStyle } from '@/theme/v46Type';

import { ButtonGlyph } from './glyph';
import { transitionStyle } from './motion';

// v46's round icon buttons (`.round`, 44): the header's back (`.round.back`) and an icon button
// with a count (`.round.nbell`, the Mesajlar bell and its `.nb-bdg`). The icon is v46's drawing for
// that look; while pressed the button shrinks, and the bell's icon a little more
// (`.nbell:active .nb-ic`).
export type RoundLook = Extract<V46ButtonId, 'yuvarlak-geri' | 'yuvarlak-simge'>;

type Props = {
  look: RoundLook;
  onPress: () => void;
  accessibilityLabel: string;
  // The count on the bell (`.nb-bdg`); nothing when there is none.
  badge?: string;
  testID?: string;
  pressedPreview?: boolean;
};

export function RoundButton({
  look,
  onPress,
  accessibilityLabel,
  badge,
  testID,
  pressedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const [pressing, setPressing] = useState(false);
  const box = V46_COMPONENTS[look][scheme];
  const p = V46_BUTTONS[look][scheme];
  const pressed = pressing || pressedPreview;
  const b = p.badge;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View
        style={[
          {
            width: box.height,
            height: box.height,
            borderRadius: box.radius,
            backgroundColor: box.bg ?? 'transparent',
            borderWidth: box.border?.width ?? 0,
            borderColor: box.border?.color,
            boxShadow: box.shadow ?? undefined,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? p.pressedScale : 1 }],
          },
          transitionStyle(p.transitions),
        ]}
      >
        {p.icon ? (
          <Animated.View
            style={[
              { transform: [{ scale: pressed ? p.icon.pressedScale : 1 }] },
              transitionStyle(p.icon.transitions),
            ]}
          >
            <ButtonGlyph icon={p.icon} />
          </Animated.View>
        ) : null}
        {b && badge ? (
          <Animated.Text
            style={{
              position: 'absolute',
              top: b.top,
              right: b.right,
              minWidth: b.size[0],
              height: b.size[1],
              borderRadius: b.radius,
              paddingRight: b.padding[1],
              paddingLeft: b.padding[3],
              backgroundColor: b.bg,
              boxShadow: b.shadow ?? undefined,
              color: b.color,
              ...v46FontStyle(b.font),
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
              overflow: 'hidden',
            }}
          >
            {badge}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
