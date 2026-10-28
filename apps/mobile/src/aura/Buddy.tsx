import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { CachedSvg } from '@/components/CachedSvg';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { lookSvg, posedEyes } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';

import { springConfig } from './motion';

// The figure's box with room for hats and antennas above it (the canvas drew them so).
const FIG_BOX = 'viewBox="-8 -16 64 84"';
const FIG_RATIO = 64 / 84;

function between([lo, hi]: readonly [number, number]): number {
  return lo + Math.random() * (hi - lo);
}

// A capsule buddy standing in a scene (docs/design/aura: the Mekan card, the table, the badges): it
// pops in with a bounce after `delay`, then floats a little and blinks now and then, a soft shadow
// under its feet that shrinks as it rises. Floating loops on the native driver (loopGuard), the
// blink is a timer. Still with reduce motion.
export function Buddy({
  look,
  height,
  delay = 0,
  phase = 0,
}: {
  // A look code (content/capsule-catalog.json → readyLooks, or the person's own).
  look: string;
  height: number;
  delay?: number;
  // Where in its float it starts (ms), so a crew does not move in step.
  phase?: number;
}) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const width = height * FIG_RATIO;
  const base = useMemo(() => lookSvg(look, 'fig').replace(/viewBox="[^"]*"/, FIG_BOX), [look]);
  const [blink, setBlink] = useState(false);
  const xml = useMemo(() => posedEyes(base, { blink }), [base, blink]);

  const [pop] = useState(() => new Animated.Value(reduce ? 1 : 0));
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce) {
      pop.setValue(1);
      return undefined;
    }
    pop.setValue(0);
    const arrive = Animated.spring(pop, { ...springConfig(MOTION.springs.pop), toValue: 1, delay });
    arrive.start();
    const ease = Easing.inOut(Easing.sin);
    const ms = MOTION.idle.floatMs;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: ms, easing: ease, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: ms, easing: ease, useNativeDriver: true }),
      ]),
    );
    const start = setTimeout(() => loop.start(), delay + (phase % (2 * ms)));
    return () => {
      arrive.stop();
      clearTimeout(start);
      loop.stop();
    };
  }, [reduce, delay, phase, pop, float]);

  useEffect(() => {
    if (reduce) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          next();
        }, MOTION.idle.blinkMs);
      }, between(MOTION.idle.blinkEveryMs));
    };
    next();
    return () => clearTimeout(timer);
  }, [reduce]);

  const rise = float.interpolate({ inputRange: [0, 1], outputRange: [0, -MOTION.idle.floatPx] });
  return (
    <Animated.View
      style={{
        width,
        height,
        opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [height * 0.2, 0] }) },
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
        ],
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: width * 0.25,
          right: width * 0.25,
          bottom: height * 0.025,
          height: height * 0.07,
          borderRadius: height,
          backgroundColor: AURA.scene[scheme].shadow,
          opacity: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
          transform: [
            { scaleX: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) },
          ],
        }}
      />
      <Animated.View style={{ transform: [{ translateY: rise }] }}>
        <CachedSvg xml={xml} width={width} height={height} />
      </Animated.View>
    </Animated.View>
  );
}

// Width of a buddy of a height (for layouts that place a crew).
export function buddyWidth(height: number): number {
  return height * FIG_RATIO;
}

// A buddy's place in a scene, from its corner (unused parts stay where they are).
export function Placed({
  right,
  bottom,
  children,
}: {
  right: number;
  bottom: number;
  children: ReactNode;
}) {
  return <View style={{ position: 'absolute', right, bottom }}>{children}</View>;
}
