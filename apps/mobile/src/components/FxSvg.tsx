import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { createLru } from '@/lib/lru';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FX, type FxLayer, type FxProp, fxTree, sampled, stillSvg } from '@/theme/capsuleFx';

import { CachedSvg } from './CachedSvg';

// A drawing whose pack accessories move (theme/capsuleFx.ts; docs/SPEC_V4.md §4.U): it is cut into
// layers once, each drawn once; a moving layer is a picture moved on the native driver (as the
// blink, LayeredLook), so nothing is drawn again while it moves. One clock for each length of cycle
// serves every drawing on the screen; it runs while one of them is on a screen on top with the app
// in front (useLoopActive). With reduce motion the drawing is still, as the boards draw it.
// A lane is a set of clocks of its own (the set balloons': paused while their stream scrolls, the
// faces elsewhere on the screen moving on); `phase`: where a stopped clock stood, to go on from.
type Clock = {
  value: Animated.Value;
  users: number;
  loop: Animated.CompositeAnimation | null;
  phase: number;
};
const clocks = new Map<string, Clock>();

function clockOf(ms: number, lane: string): Clock {
  const id = `${lane}:${ms}`;
  let c = clocks.get(id);
  if (!c) {
    c = { value: new Animated.Value(0), users: 0, loop: null, phase: 0 };
    clocks.set(id, c);
  }
  return c;
}

function cycle(clock: Clock, ms: number): void {
  clock.value.setValue(0);
  const loop = Animated.loop(
    Animated.timing(clock.value, {
      toValue: 1,
      duration: ms,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
  clock.loop = loop;
  loop.start();
}

// A drawing on the screen holds its clock; the last to let go stops it. A clock stopped part way
// first runs to the end of its cycle, so nothing jumps when it starts again.
function hold(ms: number, lane: string): void {
  const clock = clockOf(ms, lane);
  clock.users += 1;
  if (clock.loop) return;
  const from = clock.phase;
  clock.phase = 0;
  if (from <= 0 || from >= 1) {
    cycle(clock, ms);
    return;
  }
  clock.value.setValue(from);
  const lead = Animated.timing(clock.value, {
    toValue: 1,
    duration: ms * (1 - from),
    easing: Easing.linear,
    useNativeDriver: true,
  });
  clock.loop = lead;
  lead.start(({ finished }) => {
    if (finished && clock.loop === lead) cycle(clock, ms);
  });
}

function release(ms: number, lane: string): void {
  const clock = clockOf(ms, lane);
  clock.users -= 1;
  if (clock.users === 0 && clock.loop) {
    const loop = clock.loop;
    clock.loop = null;
    loop.stop();
    clock.value.stopAnimation((v) => {
      if (clock.loop === null) clock.phase = v;
    });
  }
}

function useClock(ms: number, on: boolean, lane: string): Animated.Value {
  useEffect(() => {
    if (!on) return undefined;
    hold(ms, lane);
    return () => release(ms, lane);
  }, [ms, on, lane]);
  return clockOf(ms, lane).value;
}

type Place = { unit: number; dx: number; dy: number; bx: number; by: number };

// Where the accessories move (the owner's call, 7 Kasım): the opened card, the profile's capsule,
// Kapsülünü süsle's big capsule, the venue chat, the table and its games. Everywhere else (lists,
// Süsle's small capsules, the pack's card under the rip) a drawing is still, as the boards draw it.
const FxMotion = createContext(false);

export function FxMoves({ children, on = true }: { children: ReactNode; on?: boolean }) {
  return <FxMotion.Provider value={on}>{children}</FxMotion.Provider>;
}

// `still`: drawn still here (a set balloon past the newest few); `paused`: its motion held where it
// stands (a set balloon while its stream scrolls), on the clocks of its `lane`.
export function FxSvg({
  xml,
  width,
  height,
  still = false,
  paused = false,
  lane = 'main',
}: {
  xml: string;
  width: number;
  height: number;
  still?: boolean;
  paused?: boolean;
  lane?: string;
}) {
  const moves = useContext(FxMotion);
  const reduceMotion = useReduceMotion();
  // A still drawing holds no focus or app state subscription (useLoopActive); only a moving one.
  if (!moves || reduceMotion || still) {
    return <CachedSvg xml={stillOf(xml)} width={width} height={height} />;
  }
  return <MovingSvg xml={xml} width={width} height={height} paused={paused} lane={lane} />;
}

// stillSvg's result for a text, made once.
const stills = createLru<string>(600);
function stillOf(xml: string): string {
  const hit = stills.get(xml);
  if (hit !== undefined) return hit;
  const made = stillSvg(xml);
  stills.set(xml, made);
  return made;
}

function MovingSvg({
  xml,
  width,
  height,
  paused,
  lane,
}: {
  xml: string;
  width: number;
  height: number;
  paused: boolean;
  lane: string;
}) {
  const active = useLoopActive();
  const tree = useMemo(() => fxTree(xml), [xml]);
  if (!tree) return <CachedSvg xml={xml} width={width} height={height} />;
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
      <Layers
        layers={tree.layers}
        width={width}
        height={height}
        place={place}
        on={active && !paused}
        lane={lane}
      />
    </View>
  );
}

function Layers({
  layers,
  width,
  height,
  place,
  on,
  lane,
}: {
  layers: FxLayer[];
  width: number;
  height: number;
  place: Place;
  on: boolean;
  lane: string;
}) {
  return layers.map((l, i) =>
    l.kind === 'still' ? (
      <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
        <CachedSvg xml={l.xml} width={width} height={height} />
      </View>
    ) : l.kind === 'frames' ? (
      <Frames key={i} layer={l} width={width} height={height} on={on} lane={lane} />
    ) : (
      <Move key={i} layer={l} width={width} height={height} place={place} on={on} lane={lane} />
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
  lane,
}: {
  layer: Extract<FxLayer, { kind: 'move' }>;
  width: number;
  height: number;
  place: Place;
  on: boolean;
  lane: string;
}) {
  const motion = FX[layer.fx];
  const clock = useClock(motion?.ms ?? 1000, on && motion !== undefined, lane);
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
      <Layers
        layers={layer.layers}
        width={width}
        height={height}
        place={place}
        on={on}
        lane={lane}
      />
    </Animated.View>
  );
}

// A motion inside its picture: its pictures shown in turn, each in its part of the clock.
function Frames({
  layer,
  width,
  height,
  on,
  lane,
}: {
  layer: Extract<FxLayer, { kind: 'frames' }>;
  width: number;
  height: number;
  on: boolean;
  lane: string;
}) {
  const motion = FX[layer.fx];
  const clock = useClock(motion?.ms ?? 1000, on && motion !== undefined, lane);
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
