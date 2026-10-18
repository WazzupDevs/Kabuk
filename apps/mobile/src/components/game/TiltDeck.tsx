import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { CARD_GLARE, GAME_SHADOW } from '@/theme/gameColors';
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
// The light is drawn this small and scaled up: drawn at the card's size, Android would keep a
// bitmap of about 2800 px square (some 32 MB) for it on every card (the CTO's 4.2c review).
const GLARE_DRAWN = 64;

// Kapsül Anlat's card deck (v43 report §2, the v45 file's .tk; docs/SPEC_V4.md §4.C): the next two
// cards show their edges behind the top one. Held, the top card leans toward the finger on the UI
// thread (react-native-gesture-handler and reanimated) and springs back when let go; a new card
// rises from the deck, and a played one leaves right (Doğru), left (Pas) or down ("Yasak!"). A soft
// light follows the finger while it is down. With reduce motion the card does not lean, there is no
// light and cards change at once. The gesture only follows the finger, it never claims it: buttons
// on the card still take their taps and a scroll still scrolls.
export function TiltDeck({ cardKey, children, exit = null, onExited, testID }: Props) {
  const { scheme, colors, shape } = useTheme();
  const reduce = useReduceMotion();
  const glareId = `glare${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  // The card's size for the light's circle (React) and for the worklets (UI thread).
  const [box, setBox] = useState({ w: 0, h: 0 });
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
    // Cut short too (a new card came in mid-way: the other phone pressed first), the screen hears
    // that the card left; else it would wait for this exit for ever.
    out.set(
      withTiming(1, { duration: CARD_OUT_MS, easing: Easing.bezier(...CURVES.swap) }, () => {
        runOnJS(done)();
      }),
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
    nx.set(withSpring(0, TILT.release));
    ny.set(withSpring(0, TILT.release));
    held.set(withTiming(0, { duration: TILT.holdOutMs }));
  };
  const finger = Gesture.Manual()
    .enabled(!reduce)
    .onTouchesDown((e) => {
      const t = e.allTouches[0];
      if (!t) return;
      follow(t.x, t.y);
      held.set(withTiming(1, { duration: TILT.holdInMs }));
    })
    .onTouchesMove((e) => {
      const t = e.allTouches[0];
      if (t) follow(t.x, t.y);
    })
    // The finger lifted: the gesture is over (it never activated, so it fails); onFinalize
    // then runs as on every other end.
    .onTouchesUp((_e, manager) => {
      release();
      manager.fail();
    })
    .onTouchesCancelled((_e, manager) => {
      release();
      manager.fail();
    })
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

  // The light (v45: radial-gradient(circle at the finger) out to 42 % of the farthest corner): a
  // small circle (GLARE_DRAWN) centred under the finger and scaled up to that corner.
  const glare = useAnimatedStyle(() => {
    const t = tiltFor(nx.value, ny.value);
    const { w, h } = size.value;
    const x = t.glareX * w;
    const y = t.glareY * h;
    const corner = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    const r = GLARE_DRAWN / 2;
    return {
      opacity: held.value,
      transform: [{ translateX: x - r }, { translateY: y - r }, { scale: corner / r }],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.set({ w: width, h: height });
    setBox({ w: width, h: height });
  };

  return (
    <View testID={testID}>
      {DECK.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          className="absolute inset-0"
          style={{
            borderRadius: shape.radius.deck,
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
              borderRadius: shape.radius.deck,
              backgroundColor: colors.surface,
              boxShadow: GAME_SHADOW.forbidden,
            },
            top,
          ]}
        >
          {children}
          {reduce || box.w === 0 ? null : (
            <View
              pointerEvents="none"
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: shape.radius.deck }}
            >
              <Animated.View
                style={[{ position: 'absolute', width: GLARE_DRAWN, height: GLARE_DRAWN }, glare]}
              >
                <Svg width={GLARE_DRAWN} height={GLARE_DRAWN}>
                  <Defs>
                    <RadialGradient id={glareId} cx="50%" cy="50%" r="50%">
                      <Stop
                        offset="0"
                        stopColor={CARD_GLARE[scheme]}
                        stopOpacity={CARD_GLARE.opacity}
                      />
                      <Stop
                        offset={CARD_GLARE.reach}
                        stopColor={CARD_GLARE[scheme]}
                        stopOpacity={0}
                      />
                    </RadialGradient>
                  </Defs>
                  <Circle
                    cx={GLARE_DRAWN / 2}
                    cy={GLARE_DRAWN / 2}
                    r={GLARE_DRAWN / 2}
                    fill={`url(#${glareId})`}
                  />
                </Svg>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
