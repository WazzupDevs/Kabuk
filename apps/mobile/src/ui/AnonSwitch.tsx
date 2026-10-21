import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  V46_BUTTON_MOTION,
  V46_FORM,
  V46_FORM_ICONS,
  type V46IconState,
} from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { keyframeRest, keyframeSequence, transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

type Props = {
  // On: anonymous (the capsule face); off: with the profile (the silhouette).
  value: boolean;
  // This check-in's one change is spent (v46 `.used`): a lock on its corner, and a press shakes it
  // and tells the screen, which says why.
  used?: boolean;
  // A press asks first (the screen opens v46's "Anonim görün?" sheet); it does not switch here.
  onPress: () => void;
  onUsedPress?: () => void;
  // "Anonim katılım kapalı" / "açık": the screen's words for its state.
  accessibilityLabel: string;
  // Drawn as while pressed (the gallery's "basılı").
  pressedPreview?: boolean;
  testID?: string;
};

const turn = (s: V46IconState) => [{ scale: s.scale }, { rotate: `${s.rotate}deg` }];

// v46's anonymous switch (`.anon-sw`, on Mekan's head): a small track with an edge and a knob that
// carries the person's look. Switched on, the track turns purple, the knob slides over (380 ms, a
// little past and back) and its silhouette turns away as the capsule face turns in. With reduce
// motion the knob and the faces change at once. A press shrinks it a little (`.va button:active`);
// its touch reaches past it above and below (`.anon-sw::after`).
export function AnonSwitch({
  value,
  used = false,
  onPress,
  onUsedPress,
  accessibilityLabel,
  pressedPreview = false,
  testID,
}: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const a = V46_FORM[scheme].anon;
  const [pressing, setPressing] = useState(false);
  const look = value ? a.on : a.off;
  const nope = V46_BUTTON_MOTION.nope;
  const shakeX = useSharedValue(keyframeRest(nope, 'translateX'));
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const knobMoves = reduce ? a.knob.reduced : a.knob.transitions;
  const iconMoves = reduce ? a.icon.reduced : a.icon.transitions;
  const face = (state: { off: V46IconState; on: V46IconState }) => {
    const s = value ? state.on : state.off;
    return [
      {
        position: 'absolute' as const,
        width: a.icon.size,
        height: a.icon.size,
        opacity: s.opacity,
        transform: turn(s),
      },
      transitionStyle(iconMoves),
    ];
  };
  return (
    <Pressable
      onPress={() => {
        if (!used) {
          onPress();
          return;
        }
        const next = keyframeSequence(nope, 'translateX');
        if (next && !(reduce && nope.offWhenReduced)) shakeX.set(next);
        onUsedPress?.();
      }}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      hitSlop={a.hitSlop}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      testID={testID}
    >
      <Animated.View style={shake}>
        <Animated.View
          style={[
            {
              width: a.width,
              height: a.height,
              borderRadius: a.radius,
              backgroundColor: look.bg,
              borderWidth: look.border.width,
              borderColor: used ? a.used.border.color : look.border.color,
              transform: [{ scale: pressing || pressedPreview ? a.pressedScale : 1 }],
            },
            transitionStyle(a.transitions),
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: a.knob.inset,
                left: a.knob.inset,
                width: a.knob.size,
                height: a.knob.size,
                borderRadius: a.knob.size / 2,
                backgroundColor: value ? a.knob.on : a.knob.off,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateX: value ? a.knob.onX : 0 }],
              },
              transitionStyle(knobMoves),
            ]}
          >
            <Animated.View style={face(a.photo)}>
              <V46Svg drawing={V46_FORM_ICONS.photo} size={[a.icon.size, a.icon.size]} />
            </Animated.View>
            <Animated.View style={face(a.anon)}>
              <V46Svg drawing={V46_FORM_ICONS.anon} size={[a.icon.size, a.icon.size]} />
            </Animated.View>
          </Animated.View>
          {used ? <Lock /> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// The lock on a used switch's corner (`.anon-sw.used::before`): a round badge with an edge of the
// screen's ground, out past the track's corner.
function Lock() {
  const { scheme } = useTheme();
  const l = V46_FORM[scheme].anon.used.lock;
  return (
    <View
      style={{
        position: 'absolute',
        right: l.right,
        bottom: l.bottom,
        zIndex: 2,
        width: l.size,
        height: l.size,
        borderRadius: l.size / 2,
        borderWidth: l.border.width,
        borderColor: l.border.color,
        backgroundColor: l.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <V46Svg drawing={V46_FORM_ICONS.lock} size={[l.image, l.image]} color={l.color} />
    </View>
  );
}
