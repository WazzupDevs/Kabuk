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
import { createLru, type Lru } from '@/lib/lru';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  FX,
  type FxCut,
  type FxInside,
  type FxLayer,
  type FxPlace,
  type FxProp,
  type FxTree,
  fxTree,
  insideCuts,
  placeKey,
  placeOf,
  sampled,
  stillSvg,
} from '@/theme/capsuleFx';

import { CachedSvg, readAhead } from './CachedSvg';

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

// What draws the whole drawing on one canvas (Skia's, components/FxSkia.tsx → SkiaWhole): the
// drawing's layers at its place, and the picture way's drawing to fall back on.
export type WholeProps = {
  layers: readonly FxLayer[];
  place: FxPlace;
  width: number;
  height: number;
  on: boolean;
  lane: string;
  fallback: ReactNode;
};
export type WholePainter = ComponentType<WholeProps>;

// A still drawing's one layer, the same object for the same text.
const stillLayers = createLru<FxLayer[]>(64);
function stillLayersOf(xml: string): FxLayer[] {
  const hit = stillLayers.get(xml);
  if (hit !== undefined) return hit;
  const made: FxLayer[] = [{ kind: 'still', xml }];
  stillLayers.set(xml, made);
  return made;
}
const NO_PLACE: FxPlace = { unit: 1, dx: 0, dy: 0, bx: 0, by: 0 };

// `still`: drawn still here (a set balloon past the newest few); `paused`: its motion held where it
// stands (a set balloon while its stream scrolls), on the clocks of its `lane`. `inside`: what draws
// the motions inside a clip (the pictures in turn when not given). `whole`: what draws all of it on
// one canvas (the views and their pictures when not given).
export function FxSvg({
  xml,
  width,
  height,
  still = false,
  paused = false,
  lane = 'main',
  inside,
  whole: Whole,
}: {
  xml: string;
  width: number;
  height: number;
  still?: boolean;
  paused?: boolean;
  lane?: string;
  inside?: InsidePainter;
  whole?: WholePainter;
}) {
  const moves = useContext(FxMotion);
  const reduceMotion = useReduceMotion();
  // A still drawing holds no focus or app state subscription (useLoopActive); only a moving one.
  // A drawing with no motion's mark in it (a capsule with no moving accessory) is still as well.
  if (!moves || reduceMotion || still || !xml.includes(' data-fx="')) {
    const drawn = <CachedSvg xml={stillOf(xml)} width={width} height={height} />;
    return Whole ? (
      <Whole
        layers={stillLayersOf(stillOf(xml))}
        place={NO_PLACE}
        width={width}
        height={height}
        on={false}
        lane={lane}
        fallback={drawn}
      />
    ) : (
      drawn
    );
  }
  return (
    <MovingSvg
      xml={xml}
      width={width}
      height={height}
      paused={paused}
      lane={lane}
      inside={inside}
      whole={Whole}
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

// fxTree's result for a text, made once: the same drawing mounted again (the old look fading out
// over the new one in Kapsülünü süsle, a look read ahead) cuts nothing again. Its layers are the
// same objects then, which insideCuts' cache below keys on.
const trees = createLru<{ tree: FxTree | null }>(32);
function treeOf(xml: string): FxTree | null {
  const hit = trees.get(xml);
  if (hit !== undefined) return hit.tree;
  const tree = fxTree(xml);
  trees.set(xml, { tree });
  return tree;
}

// insideCuts' result for a layer at a place, made once (a layer's few places: its sizes).
const PLACES = 4;
const cuts = new WeakMap<FxInside, Lru<FxCut[]>>();
function cutsOf(layer: FxInside, place: FxPlace, ratio: number): FxCut[] {
  let of = cuts.get(layer);
  if (!of) {
    of = createLru<FxCut[]>(PLACES);
    cuts.set(layer, of);
  }
  const key = placeKey(place, ratio);
  const hit = of.get(key);
  if (hit !== undefined) return hit;
  const made = insideCuts(layer, place, ratio);
  of.set(key, made);
  return made;
}

// Reads a drawing ahead, in idle time, as FxSvg will draw it at this size (`moving`: in FxMoves and
// not with reduce motion), so that showing it later has nothing left to read: its still pictures,
// and each motion inside a clip by `prepare` (Skia's, skiaInside.ts) or as its pictures in turn.
export function readFxAhead(
  xml: string,
  width: number,
  height: number,
  moving: boolean,
  prepare?: (layer: FxInside, place: FxPlace) => void,
  // The whole canvas's (FxSkia.tsx → prepareStill): a still layer is read as its canvas draws it,
  // not as a view's picture.
  still?: (xml: string, width: number, height: number) => void,
): void {
  const readStill = (text: string) => (still ? still(text, width, height) : readAhead(text));
  if (!moving || !xml.includes(' data-fx="')) {
    readStill(stillOf(xml));
    return;
  }
  const tree = treeOf(xml);
  if (!tree) {
    readStill(xml);
    return;
  }
  const place = placeOf(tree.box, width, height);
  const ratio = PixelRatio.get();
  const walk = (layers: readonly FxLayer[]) => {
    for (const l of layers) {
      if (l.kind === 'still') readStill(l.xml);
      else if (l.kind === 'move') walk(l.layers);
      else if (prepare) prepare(l, place);
      else for (const f of cutsOf(l, place, ratio)) readAhead(f.xml);
    }
  };
  walk(tree.layers);
}

// Reads a still drawing ahead, as FxSvg draws it still (a list's avatar).
export function readStillAhead(xml: string): void {
  readAhead(stillOf(xml));
}

function MovingSvg({
  xml,
  width,
  height,
  paused,
  lane,
  inside,
  whole: Whole,
}: {
  xml: string;
  width: number;
  height: number;
  paused: boolean;
  lane: string;
  inside: InsidePainter | undefined;
  whole: WholePainter | undefined;
}) {
  const active = useLoopActive();
  const tree = useMemo(() => treeOf(xml), [xml]);
  // The box drawn as react-native-svg draws it (meet, in the middle).
  const place = useMemo(
    () => (tree ? placeOf(tree.box, width, height) : null),
    [tree, width, height],
  );
  if (!tree || !place) {
    const drawn = <CachedSvg xml={xml} width={width} height={height} />;
    return Whole ? (
      <Whole
        layers={stillLayersOf(xml)}
        place={NO_PLACE}
        width={width}
        height={height}
        on={false}
        lane={lane}
        fallback={drawn}
      />
    ) : (
      drawn
    );
  }
  if (Whole) {
    return (
      <Whole
        layers={tree.layers}
        place={place}
        width={width}
        height={height}
        on={active && !paused}
        lane={lane}
        fallback={
          <MovingSvg
            xml={xml}
            width={width}
            height={height}
            paused={paused}
            lane={lane}
            inside={inside}
            whole={undefined}
          />
        }
      />
    );
  }
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
  const cuts = useMemo(() => cutsOf(layer, place, PixelRatio.get()), [layer, place]);
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
