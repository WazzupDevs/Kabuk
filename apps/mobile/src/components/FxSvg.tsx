import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FX, type FxLayer, type FxProp, fxTree, sampled, stillSvg } from '@/theme/capsuleFx';

import { CachedSvg } from './CachedSvg';

// A drawing whose pack accessories move (theme/capsuleFx.ts; docs/SPEC_V4.md §4.U): it is cut into
// layers once, each drawn once; a moving layer is a picture moved on the native driver (as the
// blink, LayeredLook), so nothing is drawn again while it moves. One clock for each length of cycle
// serves every drawing on the screen; it runs while one of them is on a screen on top with the app
// in front (useLoopActive). With reduce motion the drawing is still, as the boards draw it.
type Clock = { value: Animated.Value; users: number; loop: Animated.CompositeAnimation | null };
const clocks = new Map<number, Clock>();

function clockOf(ms: number): Clock {
  let c = clocks.get(ms);
  if (!c) {
    c = { value: new Animated.Value(0), users: 0, loop: null };
    clocks.set(ms, c);
  }
  return c;
}

// A drawing on the screen holds its clock; the last to let go stops it.
function hold(ms: number): void {
  const clock = clockOf(ms);
  clock.users += 1;
  if (clock.loop) return;
  clock.value.setValue(0);
  clock.loop = Animated.loop(
    Animated.timing(clock.value, {
      toValue: 1,
      duration: ms,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
  clock.loop.start();
}

function release(ms: number): void {
  const clock = clockOf(ms);
  clock.users -= 1;
  if (clock.users === 0 && clock.loop) {
    clock.loop.stop();
    clock.loop = null;
  }
}

function useClock(ms: number, on: boolean): Animated.Value {
  useEffect(() => {
    if (!on) return undefined;
    hold(ms);
    return () => release(ms);
  }, [ms, on]);
  return clockOf(ms).value;
}

type Place = { unit: number; dx: number; dy: number; bx: number; by: number };

// Where the accessories move (the owner's call, 7 Kasım): the opened card, the profile's capsule,
// Kapsülünü süsle's big capsule, the venue chat, the table and its games. Everywhere else (lists,
// Süsle's small capsules, the pack's card under the rip) a drawing is still, as the boards draw it.
const FxMotion = createContext(false);

export function FxMoves({ children, on = true }: { children: ReactNode; on?: boolean }) {
  return <FxMotion.Provider value={on}>{children}</FxMotion.Provider>;
}

export function FxSvg({ xml, width, height }: { xml: string; width: number; height: number }) {
  const moves = useContext(FxMotion);
  const reduceMotion = useReduceMotion();
  const reduce = !moves || reduceMotion;
  const active = useLoopActive();
  const tree = useMemo(() => (reduce ? null : fxTree(xml)), [xml, reduce]);
  if (!tree) return <CachedSvg xml={reduce ? stillSvg(xml) : xml} width={width} height={height} />;
  // The box drawn as react-native-svg draws it (meet, in the middle).
  const [bx, by, bw, bh] = tree.box;
  const unit = Math.min(width / bw, height / bh);
  const place: Place = {
    unit,
    dx: (width - bw * unit) / 2,
    dy: (height - bh * unit) / 2,
    bx,
    by,
  };
  return (
    <View style={{ width, height }}>
      <Layers layers={tree.layers} width={width} height={height} place={place} on={active} />
    </View>
  );
}

function Layers({
  layers,
  width,
  height,
  place,
  on,
}: {
  layers: FxLayer[];
  width: number;
  height: number;
  place: Place;
  on: boolean;
}) {
  return layers.map((l, i) =>
    l.kind === 'still' ? (
      <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
        <CachedSvg xml={l.xml} width={width} height={height} />
      </View>
    ) : l.kind === 'frames' ? (
      <Frames key={i} layer={l} width={width} height={height} on={on} />
    ) : (
      <Move key={i} layer={l} width={width} height={height} place={place} on={on} />
    ),
  );
}

const ORDER: readonly FxProp[] = ['tx', 'ty', 'rotate', 'scale', 'sx', 'sy', 'skewX'];

function Move({
  layer,
  width,
  height,
  place,
  on,
}: {
  layer: Extract<FxLayer, { kind: 'move' }>;
  width: number;
  height: number;
  place: Place;
  on: boolean;
}) {
  const motion = FX[layer.fx];
  const clock = useClock(motion?.ms ?? 1000, on && motion !== undefined);
  const style = useMemo(() => {
    if (!motion) return null;
    // A translate is in the group's own units: `k` of the drawing's, `unit` pixels each.
    const px = layer.k * place.unit;
    type Step = Partial<Record<string, Animated.AnimatedInterpolation<string | number>>>;
    const transform = ORDER.flatMap((prop): Step[] => {
      if (!motion.keys[prop]) return [];
      const deg = prop === 'rotate' || prop === 'skewX';
      const r = sampled(motion, prop, prop === 'tx' || prop === 'ty' ? px : 1);
      const v = clock.interpolate({
        inputRange: r.inputRange,
        outputRange: deg ? r.outputRange.map((d) => `${d}deg`) : r.outputRange,
      });
      switch (prop) {
        case 'tx':
          return [{ translateX: v }];
        case 'ty':
          return [{ translateY: v }];
        case 'rotate':
          return [{ rotate: v }];
        case 'scale':
          return [{ scale: v }];
        case 'sx':
          return [{ scaleX: v }];
        case 'sy':
          return [{ scaleY: v }];
        case 'skewX':
          return [{ skewX: v }];
        default:
          return [];
      }
    });
    const o = motion.keys.opacity ? sampled(motion, 'opacity') : null;
    return {
      transformOrigin: [
        place.dx + (layer.x - place.bx) * place.unit,
        place.dy + (layer.y - place.by) * place.unit,
        0,
      ],
      transform,
      ...(o ? { opacity: clock.interpolate(o) } : null),
    };
  }, [motion, clock, layer, place]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style as Animated.WithAnimatedObject<object>]}
    >
      <Layers layers={layer.layers} width={width} height={height} place={place} on={on} />
    </Animated.View>
  );
}

// A motion inside its picture: its pictures shown in turn, each in its part of the clock.
function Frames({
  layer,
  width,
  height,
  on,
}: {
  layer: Extract<FxLayer, { kind: 'frames' }>;
  width: number;
  height: number;
  on: boolean;
}) {
  const motion = FX[layer.fx];
  const clock = useClock(motion?.ms ?? 1000, on && motion !== undefined);
  const [shown] = useState(() =>
    layer.frames.map((f) => {
      const e = 1e-4;
      const input = [0, Math.max(f.from - e, 0), f.from, Math.max(f.to - e, f.from), f.to, 1];
      const output = [
        f.from === 0 ? 1 : 0,
        f.from === 0 ? 1 : 0,
        1,
        1,
        f.to === 1 ? 1 : 0,
        f.to === 1 ? 1 : 0,
      ];
      return clock.interpolate({ inputRange: input, outputRange: output });
    }),
  );
  return layer.frames.map((f, i) => (
    <Animated.View
      key={i}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: shown[i] ?? 0 }]}
    >
      <CachedSvg xml={f.xml} width={width} height={height} />
    </Animated.View>
  ));
}
