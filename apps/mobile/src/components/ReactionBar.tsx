import { REACTIONS, type Reaction } from '@shared/reactions.ts';
import { useEffect, useState } from 'react';
import { Animated, Easing as RNEasing, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  cancelAnimation,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { DM } from '@/theme/dm';

import { ReactionFace } from './ReactionFace';

// The held message's reaction bar's faces (MessagePop), alive the way Facebook's and Telegram
// Android's are (the owner's call, 21 Kasım): each face springs in from small, a little after the
// one before it, and settles with a slight overshoot; then each one sways and breathes on its own
// loop, out of step with its neighbours. A finger slid along the bar lifts the face under it (it
// grows and rises) and letting go there gives that reaction; a tap gives it too. Everything runs on
// the UI thread (Reanimated): the layer draws no more for it. None of it with reduce motion.

const STEP_MS = 25;
const FACE_SPRING = { damping: 11, stiffness: 420, mass: 0.7 } as const;
const HOT_SPRING = { damping: 14, stiffness: 520, mass: 0.6 } as const;
const HOT_SCALE = 1.38;
const HOT_RISE = -8;
// The idle loop: a sway of a few degrees and a breath, each face starting at its own moment.
const SWAY_DEG = 6;
const SWAY_MS = 900;
const BREATH = 1.06;
// A finger this far over or under the bar lifts no face.
const SLACK_Y = 40;

export function ReactionFaces({
  current,
  onPick,
  reduce,
  look,
}: {
  current: string | null | undefined;
  onPick: (emoji: Reaction) => void;
  reduce: boolean;
  look: { sel: string; selRing: string };
}) {
  const S = DM.pick;
  const step = S.slot + S.gap;
  // The face under the finger, -1 for none.
  const hot = useSharedValue(-1);
  const pick = (i: number) => {
    const emoji = REACTIONS[i];
    if (emoji) onPick(emoji);
  };
  const feel = () => haptic('selection');
  const at = (x: number, y: number) => {
    'worklet';
    if (y < -SLACK_Y || y > S.slot + 2 * S.pad + SLACK_Y) return -1;
    const i = Math.floor((x - S.pad) / step);
    return i >= 0 && i < REACTIONS.length ? i : -1;
  };
  const slide = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      hot.value = at(e.x, e.y);
    })
    .onUpdate((e) => {
      const i = at(e.x, e.y);
      if (i !== hot.value) {
        hot.value = i;
        if (i >= 0) runOnJS(feel)();
      }
    })
    .onEnd((e) => {
      const i = at(e.x, e.y);
      if (i >= 0) runOnJS(pick)(i);
    })
    .onFinalize(() => {
      hot.value = -1;
    });
  return (
    <GestureDetector gesture={slide}>
      <View style={{ flexDirection: 'row', gap: S.gap }}>
        {REACTIONS.map((emoji, i) => (
          <Face
            key={emoji}
            emoji={emoji}
            index={i}
            hot={hot}
            reduce={reduce}
            selected={current === emoji}
            look={look}
            onPick={() => pick(i)}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

function Face({
  emoji,
  index,
  hot,
  reduce,
  selected,
  look,
  onPick,
}: {
  emoji: Reaction;
  index: number;
  hot: SharedValue<number>;
  reduce: boolean;
  selected: boolean;
  look: { sel: string; selRing: string };
  onPick: () => void;
}) {
  const S = DM.pick;
  const enter = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return undefined;
    enter.value = withDelay(index * STEP_MS, withSpring(1, FACE_SPRING));
    return () => cancelAnimation(enter);
  }, [reduce, index, enter]);
  // The idle loop on the native driver (loopGuard.test.ts: what goes on by itself loops there):
  // a sway and a breath, each face starting at its own moment so neighbours never move together.
  const [idle] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce) return undefined;
    const ease = RNEasing.inOut(RNEasing.sin);
    const loop = Animated.sequence([
      Animated.delay(index * STEP_MS + 180 + index * 140),
      Animated.loop(
        Animated.sequence([
          Animated.timing(idle, {
            toValue: 1,
            duration: SWAY_MS,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(idle, {
            toValue: -1,
            duration: SWAY_MS * 2,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(idle, {
            toValue: 0,
            duration: SWAY_MS,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [reduce, index, idle]);
  // 1 while the finger is over this face, sprung (a face lifts and falls back).
  const lift = useDerivedValue(() => withSpring(hot.value === index ? 1 : 0, HOT_SPRING));
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 1.5),
    transform: [
      { translateY: HOT_RISE * lift.value },
      { scale: enter.value * (1 + (HOT_SCALE - 1) * lift.value) },
    ],
  }));
  return (
    <Reanimated.View
      testID={`react-${index}`}
      accessible
      accessibilityRole="menuitem"
      accessibilityLabel={tr.chat.reactWith(tr.chat.reactions[emoji])}
      accessibilityState={{ selected }}
      onAccessibilityTap={onPick}
      style={[
        {
          width: S.slot,
          height: S.slot,
          borderRadius: S.slot / 2,
          alignItems: 'center',
          justifyContent: 'center',
          // `.f.sel` on --surface2 in a 2 ring of the ink.
          borderWidth: selected ? S.ring : 0,
          borderColor: look.selRing,
          backgroundColor: selected ? look.sel : 'transparent',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          transform: [
            {
              rotate: idle.interpolate({
                inputRange: [-1, 1],
                outputRange: [`-${SWAY_DEG}deg`, `${SWAY_DEG}deg`],
              }),
            },
            {
              scale: idle.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [BREATH, 1, BREATH],
              }),
            },
          ],
        }}
      >
        <ReactionFace emoji={emoji} size="pick" />
      </Animated.View>
    </Reanimated.View>
  );
}
