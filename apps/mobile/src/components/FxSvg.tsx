import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Animated, Easing, PixelRatio, StyleSheet, View } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { createLru } from '@/lib/lru';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  FX,
  type FxInside,
  type FxLayer,
  type FxPlace,
  type FxProp,
  fxTree,
  insideCuts,
  placeOf,
  sampled,
  stillSvg,
} from '@/theme/capsuleFx';

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

// Where the accessories move (the owner's call, 7 Kasım): the opened card, the profile's capsule,
// Kapsülünü süsle's big capsule, the venue chat, the table and its games. Everywhere else (lists,
// Süsle's small capsules, the pack's card under the rip) a drawing is still, as the boards draw it.
const FxMotion = createContext(false);

export function FxMoves({ children, on = true }: { children: ReactNode; on?: boolean }) {
  return <FxMotion.Provider value={on}>{children}</FxMotion.Provider>;
}

// What draws a motion inside its clip: the pictures in turn (Inside) unless one is given (Skia's,
// components/FxSkia.tsx; docs/decisions/skia-build-plani.md → P6).
export type InsideProps = { layer: FxInside; place: FxPlace; on: boolean; lane: string };
export type InsidePainter = ComponentType<InsideProps>;

// `still`: drawn still here (a set balloon past the newest few); `paused`: its motion held where it
// stands (a set balloon while its stream scrolls), on the clocks of its `lane`. `inside`: what draws
// the motions inside a clip (the pictures in turn when not given).
export function FxSvg({
  xml,
  width,
  height,
  still = false,
  paused = false,
  lane = 'main',
  inside,
}: {
  xml: string;
  width: number;
  height: number;
  still?: boolean;
  paused?: boolean;
  lane?: string;
  inside?: InsidePainter;
}) {
  const moves = useContext(FxMotion);
  const reduceMotion = useReduceMotion();
  // A still drawing holds no focus or app state subscription (useLoopActive); only a moving one.
  // A drawing with no motion's mark in it (a capsule with no moving accessory) is still as well.
  if (!moves || reduceMotion || still || !xml.includes(' data-fx="')) {
    return <CachedSvg xml={stillOf(xml)} width={width} height={height} />;
  }
  return (
    <MovingSvg
      xml={xml}
      width={width}
      height={height}
      paused={paused}
      lane={lane}
      inside={inside}
    />
  );
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
  inside,
}: {
  xml: string;
  width: number;
  height: number;
  paused: boolean;
  lane: string;
  inside: InsidePainter | undefined;
}) {
  const active = useLoopActive();
  const tree = useMemo(() => fxTree(xml), [xml]);
  if (!tree) return <CachedSvg xml={xml} width={width} height={height} />;
  // The box drawn as react-native-svg draws it (meet, in the middle).
  const place = placeOf(tree.box, width, height);
  return (
    <View style={{ width, height }}>
      <Layers
        layers={tree.layers}
        width={width}
        height={height}
        place={place}
        on={active && !paused}
        lane={lane}
        inside={inside}
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
  inside,
}: {
  layers: FxLayer[];
  width: number;
  height: number;
  place: FxPlace;
  on: boolean;
  lane: string;
  inside: InsidePainter | undefined;
}) {
  const Painter = inside ?? Inside;
  return layers.map((l, i) =>
    l.kind === 'still' ? (
      <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
        <CachedSvg xml={l.xml} width={width} height={height} />
      </View>
    ) : l.kind === 'inside' ? (
      <Painter key={i} layer={l} place={place} on={on} lane={lane} />
    ) : (
      <Move
        key={i}
        layer={l}
        width={width}
        height={height}
        place={place}
        on={on}
        lane={lane}
        inside={inside}
      />
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
  inside,
}: {
  layer: Extract<FxLayer, { kind: 'move' }>;
  width: number;
  height: number;
  place: FxPlace;
  on: boolean;
  lane: string;
  inside: InsidePainter | undefined;
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
        inside={inside}
      />
    </Animated.View>
  );
}

// A motion inside its clip: its pictures shown in turn, each in its part of the clock, each only as
// large as what it shows of the clip's box on the screen (theme/capsuleFx.ts → insideCuts).
export function Inside({ layer, place, on, lane }: InsideProps) {
  const motion = FX[layer.fx];
  const clock = useClock(motion?.ms ?? 1000, on && motion !== undefined, lane);
  const cuts = useMemo(() => insideCuts(layer, place, PixelRatio.get()), [layer, place]);
  const shown = useMemo(
    () =>
      cuts.map((f) => {
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
    [cuts, clock],
  );
  return cuts.map((f, i) => (
    <Animated.View
      key={i}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: f.crop.left,
        top: f.crop.top,
        opacity: shown[i] ?? 0,
      }}
    >
      <CachedSvg xml={f.xml} width={f.crop.width} height={f.crop.height} />
    </Animated.View>
  ));
}
