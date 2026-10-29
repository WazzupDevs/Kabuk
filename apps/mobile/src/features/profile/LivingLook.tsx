import { useEffect, useMemo, useState } from 'react';
import { Animated as RNAnimated, Pressable } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LayeredLook, snapTo } from '@/components/LayeredLook';
import { CanvasBar } from '@/components/CanvasIcon';
import { useLoopActive } from '@/components/Loader';
import { JUMP, sample } from '@/features/capsule/motion';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { lookSvg } from '@/theme/capsuleLook';
import { ICON } from '@/theme/tokens';

// The profile's capsule alive (the owner's call, 27 and 28 Ekim): now and then it blinks
// (sometimes twice), every while it turns its eyes to the photo beside it on the left, looks there
// a moment and rolls its eyes (up, across and back), and a tap makes it jump and wink. Still with
// reduce motion; a tap is still felt.
const BLINK_MS = 110;
const BLINK_EVERY: readonly [number, number] = [2600, 5600];
const TWICE = 0.25;
const LOOK_MS = 1500;
const LOOK_EVERY: readonly [number, number] = [7000, 13000];
// How far the eyes turn, in the drawing's units (its disc is 48 across).
const LOOK_SHIFT = -1.8;
const ROLL_UP = -1.6;
// The roll: from the photo up over the top to the other side and home, a step each ROLL_MS.
const ROLL: readonly { look: number; up: number }[] = [
  { look: LOOK_SHIFT, up: ROLL_UP / 2 },
  { look: LOOK_SHIFT / 2, up: ROLL_UP },
  { look: 0, up: ROLL_UP },
  { look: -LOOK_SHIFT / 2, up: ROLL_UP },
  { look: -LOOK_SHIFT, up: ROLL_UP / 2 },
  { look: 0, up: 0 },
];
const ROLL_MS = 110;
const REST = { look: 0, up: 0 };

function between([lo, hi]: readonly [number, number]): number {
  return lo + Math.random() * (hi - lo);
}

export function LivingLook({
  look,
  size,
  accessibilityLabel,
}: {
  look: string;
  size: number;
  accessibilityLabel?: string;
}) {
  const reduce = useReduceMotion();
  // Only while its screen is on top and the app in front, as every loop (Loader.tsx).
  const active = useLoopActive();
  // The blink and the look move pictures on the native driver (LayeredLook), in the same steps as
  // the drawing posed them: the capsule is not drawn again.
  const [blink] = useState(() => new RNAnimated.Value(0));
  const [eyeX] = useState(() => new RNAnimated.Value(0));
  const [eyeY] = useState(() => new RNAnimated.Value(0));
  // The drawing's units in pixels (its disc is 48 across).
  const unit = size / 48;

  useEffect(() => {
    const setPose = (pose: { look: number; up: number }) => {
      snapTo(eyeX, pose.look * unit);
      snapTo(eyeY, pose.up * unit);
    };
    if (reduce || !active) {
      snapTo(blink, 0);
      setPose(REST);
      return undefined;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, run: () => void) => timers.push(setTimeout(run, ms));
    const close = (then: () => void) => {
      snapTo(blink, 1);
      later(BLINK_MS, () => {
        snapTo(blink, 0);
        then();
      });
    };
    const blinkLoop = () =>
      later(between(BLINK_EVERY), () =>
        close(() =>
          Math.random() < TWICE ? later(BLINK_MS * 2, () => close(blinkLoop)) : blinkLoop(),
        ),
      );
    const lookLoop = () =>
      later(between(LOOK_EVERY), () => {
        setPose({ look: LOOK_SHIFT, up: 0 });
        later(LOOK_MS, () => {
          ROLL.forEach((step, i) => later(i * ROLL_MS, () => setPose(step)));
          later(ROLL.length * ROLL_MS, lookLoop);
        });
      });
    blinkLoop();
    lookLoop();
    return () => {
      timers.forEach(clearTimeout);
      snapTo(blink, 0);
      setPose(REST);
    };
  }, [reduce, active, blink, eyeX, eyeY, unit]);

  const base = useMemo(() => lookSvg(look, 'av'), [look]);

  // A tap: the jump of the editor (features/capsule/motion.ts → JUMP) and a wink.
  const t = useSharedValue(1);
  const ty = useMemo(() => sample(JUMP, 'ty', size / 48), [size]);
  const sy = useMemo(() => sample(JUMP, 'sy'), []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, ty.inputRange, ty.outputRange, Extrapolation.CLAMP) },
      { scaleY: interpolate(t.value, sy.inputRange, sy.outputRange, Extrapolation.CLAMP) },
    ],
  }));
  const tap = () => {
    haptic('selection');
    if (reduce) return;
    t.set(0);
    t.set(withTiming(1, { duration: JUMP.ms, easing: Easing.linear }));
    snapTo(blink, 1);
    setTimeout(() => snapTo(blink, 0), BLINK_MS * 2);
  };

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onPress={tap}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <Animated.View style={style}>
        <LayeredLook
          xml={base}
          width={size}
          height={size}
          blink={blink}
          lookX={eyeX}
          lookY={eyeY}
        />
      </Animated.View>
    </Pressable>
  );
}

// The capsule's edit badge, alive: the family's pencil scribbles a little every few seconds. Each
// scribble is a short motion of its own, started by a timer (no Reanimated frame loop between
// them, loopGuard.test.ts).
const SCRIBBLE_EVERY_MS = 3200;
const SCRIBBLE_MS = 140;

export function LivePencil() {
  const reduce = useReduceMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduce) return undefined;
    const step = (to: number) => withTiming(to, { duration: SCRIBBLE_MS });
    const timer = setInterval(() => {
      turn.set(withSequence(step(-1), step(1), step(-0.6), step(0.4), step(0)));
    }, SCRIBBLE_EVERY_MS);
    return () => clearInterval(timer);
  }, [reduce, turn]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: turn.value * 1.5 }, { rotate: `${turn.value * 14}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <CanvasBar name="edit" size={ICON.sm} />
    </Animated.View>
  );
}
