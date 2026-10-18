import { type ReactNode, useEffect, useRef } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { GAME_SHADOW } from '@/theme/gameColors';
import {
  CARD_EXITS,
  CARD_IN,
  CARD_OUT_MS,
  type CardExit,
  CURVES,
  DECK,
  fingerOnCard,
  TILT,
  tiltFor,
} from '@/theme/playMotion';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  // A new key brings a new card up from the deck.
  cardKey: string | number;
  children: ReactNode;
  // Set, the top card leaves that way, then onExited (the screen shows the next card).
  exit?: CardExit | null;
  onExited?: () => void;
  testID?: string;
};

// The cards behind: the paper of the top card, a shade and two shades darker (v45: .tk-s).
const BACK_FILLS = ['surface2', 'divider'] as const;
const RELEASE = { damping: 14, stiffness: 180 } as const;

// Kapsül Anlat's card deck (v43 report §2, the v45 file's .tk; docs/SPEC_V4.md §4.C): the next two
// cards show their edges behind the top one. Held, the top card leans toward the finger on the UI
// thread (react-native-gesture-handler and reanimated) and springs back when let go; a new card
// rises from the deck, and a played one leaves right (Doğru), left (Pas) or down ("Yasak!"). With
// reduce motion the card does not lean and cards change at once. The gesture only follows the
// finger, it never claims it: buttons on the card still take their taps and a scroll still scrolls.
export function TiltDeck({ cardKey, children, exit = null, onExited, testID }: Props) {
  const { colors, shape } = useTheme();
  const reduce = useReduceMotion();
  const size = useSharedValue({ w: 0, h: 0 });
  const nx = useSharedValue(0);
  const ny = useSharedValue(0);
  const held = useSharedValue(0);
  // 0 resting; 1 risen from the deck's first card (then animated to 0).
  const rise = useSharedValue(0);
  // 0 in place; 1 gone the way of `leave`.
  const out = useSharedValue(0);
  const leave = useSharedValue<CardExit>('correct');
  const exited = useRef(onExited);
  useEffect(() => {
    exited.current = onExited;
  }, [onExited]);

  // A new card: from the deck's first card into place, with the pop.
  useEffect(() => {
    out.set(0);
    if (reduce) {
      rise.set(0);
      return;
    }
    rise.set(1);
    rise.set(withTiming(0, { duration: CARD_IN.ms, easing: Easing.bezier(...CURVES.back) }));
  }, [cardKey, reduce, rise, out]);

  useEffect(() => {
    if (!exit) return;
    const done = () => exited.current?.();
    leave.set(exit);
    if (reduce) {
      done();
      return;
    }
    out.set(
      withTiming(
        1,
        { duration: CARD_OUT_MS, easing: Easing.bezier(...CURVES.swap) },
        (finished) => {
          if (finished) runOnJS(done)();
        },
      ),
    );
  }, [exit, reduce, leave, out]);

  const follow = (x: number, y: number) => {
    'worklet';
    const [fx, fy] = fingerOnCard(x, y, size.get().w, size.get().h);
    nx.set(fx);
    ny.set(fy);
  };
  // A manual gesture that never activates: it hears the finger while it is down and lets a scroll
  // (the stage's middle, the preview) take the touch over, which ends the tilt.
  const release = () => {
    'worklet';
    nx.set(withSpring(0, RELEASE));
    ny.set(withSpring(0, RELEASE));
    held.set(withTiming(0, { duration: 180 }));
  };
  const finger = Gesture.Manual()
    .enabled(!reduce)
    .onTouchesDown((e) => {
      const t = e.allTouches[0];
      if (!t) return;
      follow(t.x, t.y);
      held.set(withTiming(1, { duration: 90 }));
    })
    .onTouchesMove((e) => {
      const t = e.allTouches[0];
      if (t) follow(t.x, t.y);
    })
    .onTouchesUp(release)
    .onTouchesCancelled(release)
    .onFinalize(release);

  const top = useAnimatedStyle(() => {
    const t = tiltFor(nx.value, ny.value, false);
    const r = rise.value;
    const e = CARD_EXITS[leave.value];
    const o = out.value;
    return {
      opacity: 1 - o,
      transform: [
        { perspective: TILT.perspective },
        { translateX: e.x * size.value.w * o },
        { translateY: CARD_IN.from.y * r + e.y * o },
        { rotateZ: `${CARD_IN.from.rotate * r + e.rotate * o}deg` },
        { rotateY: `${t.rotateY}deg` },
        { rotateX: `${t.rotateX}deg` },
        {
          scale:
            (1 - r + CARD_IN.from.scale * r) *
            (1 - held.value * (1 - TILT.heldScale)) *
            (1 - o + e.scale * o),
        },
      ],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.set({ w: width, h: height });
  };

  return (
    <View testID={testID}>
      {DECK.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          className="absolute inset-0"
          style={{
            borderRadius: shape.radius.xl - 4,
            backgroundColor: colors[BACK_FILLS[i] ?? 'surface2'],
            boxShadow: GAME_SHADOW.button,
            transform: [{ translateY: d.y }, { rotate: `${d.rotate}deg` }, { scale: d.scale }],
          }}
        />
      )).reverse()}
      <GestureDetector gesture={finger}>
        <Animated.View
          onLayout={onLayout}
          style={[
            {
              borderRadius: shape.radius.xl - 4,
              backgroundColor: colors.surface,
              boxShadow: GAME_SHADOW.forbidden,
            },
            top,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
