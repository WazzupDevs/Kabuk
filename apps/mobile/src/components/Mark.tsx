import { APP_NAME } from '@shared/brand.ts';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';

import { BRAND } from '@/theme/brand';
import {
  capsules,
  type Channel,
  drawingFor,
  FLARE_RADIUS,
  MARK_WINDOW,
  type MarkScene,
  MONO_GAP,
  type Motion,
  overlapCentre,
  type Rect,
  sampleCurve,
} from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';

type Num = Animated.AnimatedInterpolation<number> | number;

// The capsules' colours: the logo's, or one colour with a gap in the ground's colour around the
// second capsule (inside a filled button), or each part's own (v46's loader inside a button:
// src/ui/Button.tsx, from theme/parts).
export type MarkColors =
  | { mono: string; ground: string }
  | { onInk?: boolean }
  | { fills: { a: string; b: string; overlap: string } };

// One Animated value per motion, looping 0 → 1 over its period while `active`.
// `once`: each motion plays one period and stays on its last frame (no loop).
function useLoops(motions: readonly Motion[], active: boolean, once: boolean): Animated.Value[] {
  const [values] = useState(() => motions.map(() => new Animated.Value(0)));
  useEffect(() => {
    if (!active) return undefined;
    // A paused loop starts again from its beginning.
    values.forEach((v) => v.setValue(0));
    const loops = motions.map((motion, i) => {
      const run = Animated.timing(values[i] ?? new Animated.Value(0), {
        toValue: 1,
        duration: motion.period,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      return once ? run : Animated.loop(run);
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [motions, values, active, once]);
  return values;
}

type Props = {
  size: number;
  scene: MarkScene;
  // Must keep its length for the component's life (key the component by what changes it).
  motions?: readonly Motion[];
  active?: boolean;
  colors?: MarkColors;
  // The dashed outline where the second capsule belongs (the empty and offline states).
  outline?: boolean;
  // The overlap-coloured flash where the capsules meet again (the offline state).
  flare?: boolean;
  // Played once and left on its last frame (the miss), not looped.
  once?: boolean;
};

const NO_MOTION: readonly Motion[] = [];

// The skall mark drawn with Views: two capsules (`borderRadius`), the overlap a copy of the second
// capsule inside the first one's clipped box. Motion changes only transforms and opacities, on the
// native driver, so it keeps going while JS is busy.
export function MotionMark({
  size,
  scene,
  motions = NO_MOTION,
  active = true,
  colors = {},
  outline = false,
  flare = false,
  once = false,
}: Props) {
  const theme = useTheme();
  const values = useLoops(motions, active, once);
  const k = size / MARK_WINDOW;
  const [a, b] = capsules(scene.m, scene.dx, scene.dy);

  // Every channel as an animated value (offsets scaled to px), or its resting value. Built once
  // per motion set, so a re-render does not rebuild the native animation graph.
  const anim = useMemo(() => {
    type Curve = (t: number) => number;
    // The first motion that drives the channel, with its sampled curve.
    const find = (curveOf: (m: Motion) => Curve | undefined) => {
      for (const [i, motion] of motions.entries()) {
        const curve = curveOf(motion);
        const value = values[i];
        if (curve && value) return { value, ...sampleCurve(motion.period, curve) };
      }
      return null;
    };
    const num = (
      name: Channel,
      rest: number,
      scale = 1,
      curveOf?: (m: Motion) => Curve | undefined,
    ): Num => {
      const found = find(curveOf ?? ((m) => m.channels[name]));
      if (!found) return rest;
      return found.value.interpolate({
        inputRange: found.inputRange,
        outputRange: found.outputRange.map((v) => v * scale),
      });
    };
    // The overlap moves with the second capsule relative to the first.
    const relative = (axis: 'X' | 'Y'): Num =>
      num(`b${axis}`, 0, k, (m) => {
        const ca = m.channels[`a${axis}`];
        const cb = m.channels[`b${axis}`];
        if (!ca && !cb) return undefined;
        return (t) => (cb?.(t) ?? 0) - (ca?.(t) ?? 0);
      });
    const spin = find((m) => m.channels.rot);
    return {
      aX: num('aX', 0, k),
      aY: num('aY', 0, k),
      bX: num('bX', 0, k),
      bY: num('bY', 0, k),
      cX: relative('X'),
      cY: relative('Y'),
      bScale: num('bScale', 1),
      bOpacity: num('bOpacity', 1),
      outline: num('outline', 0),
      opacity: num('opacity', 1),
      flareScale: num('flareScale', 0),
      flareOpacity: num('flareOpacity', 0),
      rot: spin
        ? spin.value.interpolate({
            inputRange: spin.inputRange,
            outputRange: spin.outputRange.map((v) => `${v}deg`),
          })
        : '0deg',
    };
  }, [motions, values, k]);

  const box = (r: Rect, grow = 0): ViewStyle => ({
    position: 'absolute',
    left: (r.x - grow) * k,
    top: (r.y - grow) * k,
    width: (r.w + 2 * grow) * k,
    height: (r.h + 2 * grow) * k,
    borderRadius: ((r.w + 2 * grow) * k) / 2,
  });

  const mono = 'mono' in colors ? colors : null;
  const own = 'fills' in colors ? colors.fills : null;
  const onInk = 'onInk' in colors && colors.onInk === true;
  const fillA = mono ? mono.mono : (own?.a ?? BRAND.purple);
  const fillB = mono ? mono.mono : (own?.b ?? BRAND.pink);
  const overlap = own?.overlap ?? (onInk ? BRAND.white : theme.colors.overlap);
  const aMove = { transform: [{ translateX: anim.aX }, { translateY: anim.aY }] };
  const bMove = [{ translateX: anim.bX }, { translateY: anim.bY }];
  const centre = overlapCentre(a, b);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        opacity: anim.opacity,
        transform: [{ rotate: anim.rot }],
      }}
    >
      {mono ? null : (
        <Animated.View
          style={[
            box(b),
            {
              backgroundColor: fillB,
              opacity: anim.bOpacity,
              transform: [...bMove, { scale: anim.bScale }],
            },
          ]}
        />
      )}
      <Animated.View
        style={[box(a), { backgroundColor: fillA, overflow: 'hidden' }, aMove] as ViewStyle[]}
      >
        {mono ? null : (
          <Animated.View
            style={{
              position: 'absolute',
              left: (b.x - a.x) * k,
              top: (b.y - a.y) * k,
              width: b.w * k,
              height: b.h * k,
              borderRadius: (b.w * k) / 2,
              backgroundColor: overlap,
              opacity: anim.bOpacity,
              transform: [{ translateX: anim.cX }, { translateY: anim.cY }, { scale: anim.bScale }],
            }}
          />
        )}
      </Animated.View>
      {mono ? (
        // The gap around the second capsule is a ring in the ground's colour over the first.
        <Animated.View
          style={[
            box(b, MONO_GAP),
            {
              backgroundColor: fillB,
              borderWidth: MONO_GAP * k,
              borderColor: mono.ground,
              transform: bMove,
            },
          ]}
        />
      ) : null}
      {outline ? (
        <Animated.View
          style={[
            box(b),
            {
              borderWidth: 8 * k,
              borderStyle: 'dashed',
              borderColor: BRAND.pink,
              opacity: anim.outline,
              transform: bMove,
            },
          ]}
        />
      ) : null}
      {flare ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: (centre.x - FLARE_RADIUS) * k,
            top: (centre.y - FLARE_RADIUS) * k,
            width: 2 * FLARE_RADIUS * k,
            height: 2 * FLARE_RADIUS * k,
            borderRadius: FLARE_RADIUS * k,
            backgroundColor: overlap,
            opacity: anim.flareOpacity,
            transform: [{ scale: anim.flareScale }],
          }}
        />
      ) : null}
    </Animated.View>
  );
}

type MarkProps = {
  size: number;
  // On ink (a featured card): the overlap is white.
  onInk?: boolean;
  // Read as "skall"; null when the mark is decoration next to a label.
  label?: string | null;
};

// The mark: two capsules, 35 % overlap. A logo: its colours never change, it is never rotated, and
// nothing replaces it. 48 px and below draw the small drawing.
export function Mark({ size, onInk, label = APP_NAME }: MarkProps) {
  const m = drawingFor(size);
  return (
    <View
      accessible={label !== null}
      accessibilityRole={label !== null ? 'image' : undefined}
      accessibilityLabel={label ?? undefined}
    >
      <MotionMark size={size} scene={{ m, dx: m.dx, dy: m.dy }} colors={{ onInk }} />
    </View>
  );
}
