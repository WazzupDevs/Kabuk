import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_BUTTON_MOTION, V46_BUTTONS, type V46ButtonId } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_COMPONENTS } from '@/theme/tokens.generated';
import { v46FontStyle } from '@/theme/v46Type';

import { BellGlyph, ButtonGlyph } from './glyph';
import { keyframeRest, keyframeSequence, transitionStyle } from './motion';

// v46's round icon buttons (`.round`, 44): the header's back (`.round.back`) and an icon button
// with a count (`.round.nbell`, the Mesajlar bell and its `.nb-bdg`). The icon is v46's drawing for
// that look; while pressed the button shrinks, and the bell's icon a little more
// (`.nbell:active .nb-ic`). The bell swings at each new `ring` (a new notice: `.nbell.ring`) and its
// count jumps as it changes (`.nb-bdg.bump`); v46 drops both with reduce motion.
export type RoundLook = Extract<V46ButtonId, 'yuvarlak-geri' | 'yuvarlak-simge'>;

type Props = {
  look: RoundLook;
  onPress: () => void;
  accessibilityLabel: string;
  // The count on the bell (`.nb-bdg`); nothing when there is none.
  badge?: string;
  // Goes up by one for each new notice: the bell swings.
  ring?: number;
  testID?: string;
  pressedPreview?: boolean;
};

export function RoundButton({
  look,
  onPress,
  accessibilityLabel,
  badge,
  ring = 0,
  testID,
  pressedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const [pressing, setPressing] = useState(false);
  const box = V46_COMPONENTS[look][scheme];
  const p = V46_BUTTONS[look][scheme];
  const pressed = pressing || pressedPreview;
  const b = p.badge;

  const bump = V46_BUTTON_MOTION.badgeBump;
  const badgeScale = useSharedValue(keyframeRest(bump, 'scale'));
  const shownBadge = useRef(badge);
  useEffect(() => {
    const before = shownBadge.current;
    shownBadge.current = badge;
    if (!badge || badge === before || !bump.looks.includes(look)) return;
    if (reduce && bump.offWhenReduced) return;
    const next = keyframeSequence(bump, 'scale');
    if (next) badgeScale.set(next);
  }, [badge, look, reduce, bump, badgeScale]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

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
            {'drawing' in p.icon && p.icon.clap ? (
              <BellGlyph
                icon={p.icon}
                ring={V46_BUTTON_MOTION.bellRing.looks.includes(look) ? ring : 0}
              />
            ) : (
              <ButtonGlyph icon={p.icon} />
            )}
          </Animated.View>
        ) : null}
        {b && badge ? (
          <Animated.Text
            style={[
              {
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
              },
              badgeStyle,
            ]}
          >
            {badge}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
