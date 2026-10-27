import { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CachedSvg } from '@/components/CachedSvg';
import { CanvasBar } from '@/components/CanvasIcon';
import { JUMP, sample } from '@/features/capsule/motion';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { lookSvg, posedEyes } from '@/theme/capsuleLook';
import { ICON } from '@/theme/tokens';

// The profile's capsule alive (the owner's call, 27 Ekim): now and then it blinks (sometimes
// twice), every while it turns its eyes to the photo beside it on the left and looks there a long
// moment, and a tap makes it jump and wink. Still with reduce motion; a tap is still felt.
const BLINK_MS = 110;
const BLINK_EVERY: readonly [number, number] = [2600, 5600];
const TWICE = 0.25;
const LOOK_MS = 2600;
const LOOK_EVERY: readonly [number, number] = [8000, 15000];
// How far the eyes turn, in the drawing's units (its disc is 48 across).
const LOOK_SHIFT = -1.8;

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
  const [blink, setBlink] = useState(false);
  const [aside, setAside] = useState(false);

  useEffect(() => {
    if (reduce) return undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, run: () => void) => timers.push(setTimeout(run, ms));
    const close = (then: () => void) => {
      setBlink(true);
      later(BLINK_MS, () => {
        setBlink(false);
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
        setAside(true);
        later(LOOK_MS, () => {
          setAside(false);
          lookLoop();
        });
      });
    blinkLoop();
    lookLoop();
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const base = useMemo(() => lookSvg(look, 'av'), [look]);
  const xml = useMemo(
    () => posedEyes(base, { blink, look: aside ? LOOK_SHIFT : 0 }),
    [base, blink, aside],
  );

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
    setBlink(true);
    setTimeout(() => setBlink(false), BLINK_MS * 2);
  };

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onPress={tap}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <Animated.View style={style}>
        <CachedSvg xml={xml} width={size} height={size} />
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
