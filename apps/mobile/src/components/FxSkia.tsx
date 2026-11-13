import {
  Canvas,
  FilterMode,
  Group,
  Image,
  ImageSVG,
  MipmapMode,
  Paint,
  Skia,
  type SkImage,
  type SkSVG,
} from '@shopify/react-native-skia';
import { Component, Fragment, type ReactNode, useEffect, useMemo } from 'react';
import { PixelRatio, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  makeMutable,
  type SharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { createLru } from '@/lib/lru';
import type { FxInside, FxPlace } from '@/theme/capsuleFx';
import {
  clockLead,
  insideAt,
  insidePlan,
  insidePlanKey,
  moveMatrixAt,
  moveOpacityAt,
  skiaAt,
  type SkiaPlan,
  type WholeLayer,
  wholeLayers,
  type WholeMove,
} from '@/theme/capsuleSkia';

import { Inside, type InsideProps, type WholeProps } from './FxSvg';

// Skia's drawing of a motion inside its clip (theme/capsuleSkia.ts; docs/decisions/skia-build-plani.md
// → P6). Loaded only through components/skiaInside.ts's lazy import: nothing here is read at the
// app's launch, nor while the switch is off. One canvas a layer, whatever the drawing's size: the
// clip drawn as an alpha mask, the content under it moved by a shared value all along its cycle.
// Anything that cannot be drawn this way (a plan or an SVG not read, a canvas that throws while it
// is made) is the picture way's (FxSvg → Inside).

// The clocks: the picture way's rules (FxSvg → hold, release) on shared values, one for each length
// of cycle and lane, held by every canvas on the screen; the last to let go stops it where it stands
// and the next one runs from there to the end of its cycle first.
type Clock = { value: SharedValue<number>; users: number; running: boolean; phase: number };
const clocks = new Map<string, Clock>();

function clockOf(ms: number, lane: string): Clock {
  const id = `${lane}:${ms}`;
  let c = clocks.get(id);
  if (!c) {
    c = { value: makeMutable(0), users: 0, running: false, phase: 0 };
    clocks.set(id, c);
  }
  return c;
}

function hold(ms: number, lane: string): void {
  const clock = clockOf(ms, lane);
  clock.users += 1;
  if (clock.running) return;
  clock.running = true;
  const from = clock.phase;
  clock.phase = 0;
  const lead = clockLead(from, ms);
  const loop = withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false);
  if (lead === null) {
    clock.value.set(0);
    clock.value.set(loop);
    return;
  }
  clock.value.set(from);
  clock.value.set(
    withSequence(
      withTiming(1, { duration: lead, easing: Easing.linear }),
      withTiming(0, { duration: 0 }),
      loop,
    ),
  );
}

function release(ms: number, lane: string): void {
  const clock = clockOf(ms, lane);
  clock.users -= 1;
  if (clock.users === 0 && clock.running) {
    clock.running = false;
    cancelAnimation(clock.value);
    clock.phase = clock.value.get();
  }
}

export function useClock(ms: number, on: boolean, lane: string): SharedValue<number> {
  useEffect(() => {
    if (!on) return undefined;
    hold(ms, lane);
    return () => release(ms, lane);
  }, [ms, on, lane]);
  return clockOf(ms, lane).value;
}

// Each plan and each SVG read once, shared by every canvas that draws the same (twelve avatars of
// one look and size are one plan, one mask and one content). A shared SVG is drawn at its own size
// only (Skia sets its container's size before each drawing), so the size is in its key.
const plans = createLru<SkiaPlan | null>(64);
const svgs = createLru<SkSVG | null>(128);

export function planOf(layer: FxInside, place: FxPlace, ratio: number): SkiaPlan | null {
  const key = insidePlanKey(layer, place, ratio);
  const hit = plans.get(key);
  if (hit !== undefined) return hit;
  const made = insidePlan(layer, place, ratio);
  plans.set(key, made);
  return made;
}

export function svgOf(xml: string, width: number, height: number): SkSVG | null {
  const key = `${width}x${height}|${xml}`;
  const hit = svgs.get(key);
  if (hit !== undefined) return hit;
  const made = Skia.SVG.MakeFromString(xml);
  svgs.set(key, made);
  return made;
}

// Reads a layer's plan and its two SVGs ahead, in idle time, into the caches SkiaInside reads (the
// options next to the chosen one in Kapsülünü süsle), so that choosing it parses nothing.
export function prepareInside(layer: FxInside, place: FxPlace): void {
  const plan = planOf(layer, place, PixelRatio.get());
  if (!plan) return;
  svgOf(plan.mask, plan.crop.width, plan.crop.height);
  svgOf(plan.content, plan.width, plan.height);
}

// A canvas of one point that draws nothing (an empty SVG), put on the screen ahead: the first
// canvas makes Skia's drawing context and reads its SVG module, so the first capsule with a motion
// inside its clip does not wait for them.
const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>';
const WARM_PT = 1;

export function SkiaWarm() {
  const svg = useMemo(() => svgOf(EMPTY_SVG, WARM_PT, WARM_PT), []);
  if (!svg) return null;
  return (
    <SkiaBoundary fallback={null}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, width: WARM_PT, height: WARM_PT }}
      >
        <Canvas style={{ width: WARM_PT, height: WARM_PT }}>
          <ImageSVG svg={svg} x={0} y={0} width={WARM_PT} height={WARM_PT} />
        </Canvas>
      </View>
    </SkiaBoundary>
  );
}

export function SkiaInside(props: InsideProps) {
  const ratio = PixelRatio.get();
  // Read from the caches by text: the same for every canvas of the same look and size.
  const plan = planOf(props.layer, props.place, ratio);
  const drawn = useMemo(() => {
    if (!plan) return null;
    const mask = svgOf(plan.mask, plan.crop.width, plan.crop.height);
    const content = svgOf(plan.content, plan.width, plan.height);
    return mask && content ? { mask, content } : null;
  }, [plan]);
  const fallback = <Inside {...props} />;
  if (!plan || !drawn) return fallback;
  return (
    <SkiaBoundary fallback={fallback}>
      <Drawn
        plan={plan}
        mask={drawn.mask}
        content={drawn.content}
        on={props.on}
        lane={props.lane}
      />
    </SkiaBoundary>
  );
}

function Drawn({
  plan,
  mask,
  content,
  on,
  lane,
}: {
  plan: SkiaPlan;
  mask: SkSVG;
  content: SkSVG;
  on: boolean;
  lane: string;
}) {
  const clock = useClock(plan.ms, on, lane);
  // The worklet closes over the numbers only: the plan's texts stay on this thread.
  const at = useMemo(() => skiaAt(plan), [plan]);
  const transform = useDerivedValue(() => {
    const p = insideAt(at, clock.value);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
  const { crop } = plan;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: crop.left,
        top: crop.top,
        width: crop.width,
        height: crop.height,
      }}
    >
      <Canvas style={{ width: crop.width, height: crop.height }}>
        {/* The mask, then the content kept only where the mask is (src-in: its alpha times the
            mask's). Skia's own Mask draws its children a second time with src-in on their paint,
            which an SVG's drawing does not take; this way both are layers. */}
        <Group layer>
          <ImageSVG svg={mask} x={0} y={0} width={crop.width} height={crop.height} />
          <Group layer={<Paint blendMode="srcIn" />}>
            {/* ImageSVG moves only when both x and y are not 0: the move is the group's. */}
            <Group transform={transform}>
              <ImageSVG svg={content} x={0} y={0} width={plan.width} height={plan.height} />
            </Group>
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}

// The whole drawing on one canvas (theme/capsuleSkia.ts → wholeLayers): every layer Skia's, none a
// view. A still layer is its SVG over the drawing, a motion inside its clip the mask and the content
// of P6 at its crop, a moving layer a group moved (and faded) on the UI thread by its clock. The
// canvas is larger than the drawing by `pad` on every side: a moving layer may leave the drawing's
// box, as a view does. Anything not read (a plan, an SVG) draws the pictures instead, whole.
// Each SVG is drawn once into a picture of its own, at the screen's pixels, and the canvas shows
// that picture on every frame after (docs/perf/akicilik-denetimi.md → 4.4: drawn from its shapes on
// each frame, a look's layers took twice the UI thread's time while anything on the canvas moved).
// Made off the screen, on this thread, where the SVG is read; `image` null (no surface) draws the
// SVG from its shapes as before.
type Art = { svg: SkSVG; image: SkImage | null; width: number; height: number };
type WholeRead =
  | { kind: 'still'; art: Art }
  | { kind: 'inside'; plan: SkiaPlan; mask: Art; content: Art }
  | { kind: 'move'; move: WholeMove; layers: WholeRead[] };

// The pictures kept: a look's few layers at the stage's size (about 2 MB each at three pixels a
// point), the look shown, the one fading out and the ones read ahead.
const images = createLru<{ image: SkImage | null }>(32);

function imageOf(
  xml: string,
  svg: SkSVG,
  width: number,
  height: number,
  ratio: number,
): SkImage | null {
  const key = `${ratio}|${width}x${height}|${xml}`;
  const hit = images.get(key);
  if (hit !== undefined) return hit.image;
  let image: SkImage | null = null;
  try {
    const surface = Skia.Surface.Make(Math.ceil(width * ratio), Math.ceil(height * ratio));
    if (surface) {
      const canvas = surface.getCanvas();
      canvas.scale(ratio, ratio);
      canvas.drawSvg(svg, width, height);
      surface.flush();
      image = surface.makeImageSnapshot();
    }
  } catch {
    image = null;
  }
  images.set(key, { image });
  return image;
}

function artOf(xml: string, width: number, height: number, ratio: number): Art | null {
  const svg = svgOf(xml, width, height);
  return svg ? { svg, image: imageOf(xml, svg, width, height, ratio), width, height } : null;
}

// A picture at its pixels (its surface was a whole number of them), or the SVG from its shapes
// when there is none.
const SHARP = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
function ArtAt({ art }: { art: Art }) {
  const ratio = PixelRatio.get();
  return art.image ? (
    <Image
      image={art.image}
      x={0}
      y={0}
      width={Math.ceil(art.width * ratio) / ratio}
      height={Math.ceil(art.height * ratio) / ratio}
      fit="fill"
      sampling={SHARP}
    />
  ) : (
    <ImageSVG svg={art.svg} x={0} y={0} width={art.width} height={art.height} />
  );
}

function readWhole(
  layers: readonly WholeLayer[],
  width: number,
  height: number,
  ratio: number,
): WholeRead[] | null {
  const out: WholeRead[] = [];
  for (const l of layers) {
    if (l.kind === 'still') {
      const art = artOf(l.xml, width, height, ratio);
      if (!art) return null;
      out.push({ kind: 'still', art });
    } else if (l.kind === 'inside') {
      const { plan } = l;
      const mask = artOf(plan.mask, plan.crop.width, plan.crop.height, ratio);
      const content = artOf(plan.content, plan.width, plan.height, ratio);
      if (!mask || !content) return null;
      out.push({ kind: 'inside', plan, mask, content });
    } else {
      const inner = readWhole(l.layers, width, height, ratio);
      if (!inner) return null;
      out.push({ kind: 'move', move: l.move, layers: inner });
    }
  }
  return out;
}

// Reads a drawing's still layer ahead for the whole canvas, in idle time (prepareInside reads the
// motions inside a clip): the SVG is parsed once, at the size the canvas draws it.
export function prepareStill(xml: string, width: number, height: number): void {
  artOf(xml, width, height, PixelRatio.get());
}

// The same for a motion inside its clip, for the whole canvas: its mask's and its content's
// pictures too (prepareInside reads their SVGs only, as P6's own canvases draw them).
export function prepareWholeInside(layer: FxInside, place: FxPlace): void {
  const ratio = PixelRatio.get();
  const plan = planOf(layer, place, ratio);
  if (!plan) return;
  artOf(plan.mask, plan.crop.width, plan.crop.height, ratio);
  artOf(plan.content, plan.width, plan.height, ratio);
}

const WHOLE_PAD = 0.15;

export function SkiaWhole({ layers, place, width, height, on, lane, fallback }: WholeProps) {
  const ratio = PixelRatio.get();
  const read = useMemo(() => {
    const whole = wholeLayers(layers, place, ratio, planOf);
    return whole ? readWhole(whole, width, height, ratio) : null;
  }, [layers, place, ratio, width, height]);
  if (!read) return fallback;
  const pad = Math.ceil(Math.max(width, height) * WHOLE_PAD);
  return (
    <SkiaBoundary fallback={fallback}>
      <View pointerEvents="none" style={{ width, height }}>
        <Canvas
          style={{
            position: 'absolute',
            left: -pad,
            top: -pad,
            width: width + 2 * pad,
            height: height + 2 * pad,
          }}
        >
          <Group transform={[{ translateX: pad }, { translateY: pad }]}>
            <WholeLayers layers={read} width={width} height={height} on={on} lane={lane} />
          </Group>
        </Canvas>
      </View>
    </SkiaBoundary>
  );
}

type WholeDraw = { width: number; height: number; on: boolean; lane: string };

function WholeLayers({ layers, ...draw }: WholeDraw & { layers: readonly WholeRead[] }) {
  return layers.map((l, i) =>
    l.kind === 'still' ? (
      <ArtAt key={i} art={l.art} />
    ) : l.kind === 'inside' ? (
      <WholeInside key={i} plan={l.plan} mask={l.mask} content={l.content} {...draw} />
    ) : (
      <WholeMoved key={i} move={l.move} layers={l.layers} {...draw} />
    ),
  );
}

function WholeInside({
  plan,
  mask,
  content,
  on,
  lane,
}: WholeDraw & { plan: SkiaPlan; mask: Art; content: Art }) {
  const clock = useClock(plan.ms, on, lane);
  const at = useMemo(() => skiaAt(plan), [plan]);
  const transform = useDerivedValue(() => {
    const p = insideAt(at, clock.value);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
  const { crop } = plan;
  const box = useMemo(() => Skia.XYWHRect(0, 0, crop.width, crop.height), [crop]);
  return (
    // Drawn's layers at the crop's corner, cut to the crop (a canvas of its own was its edge).
    <Group transform={[{ translateX: crop.left }, { translateY: crop.top }]} clip={box}>
      <Group layer>
        <ArtAt art={mask} />
        <Group layer={<Paint blendMode="srcIn" />}>
          <Group transform={transform}>
            <ArtAt art={content} />
          </Group>
        </Group>
      </Group>
    </Group>
  );
}

function WholeMoved({
  move,
  layers,
  ...draw
}: WholeDraw & { move: WholeMove; layers: readonly WholeRead[] }) {
  const clock = useClock(move.ms, draw.on, draw.lane);
  const matrix = useDerivedValue(() => moveMatrixAt(move, clock.value));
  const opacity = useDerivedValue(() => moveOpacityAt(move, clock.value));
  const inner = <WholeLayers layers={layers} {...draw} />;
  return (
    <Group matrix={matrix}>
      {move.opacity ? (
        // An SVG's drawing does not take a paint's opacity: faded as a layer.
        <Group layer={<Paint opacity={opacity} />}>{inner}</Group>
      ) : (
        <Fragment>{inner}</Fragment>
      )}
    </Group>
  );
}

// A canvas that throws while it is made draws the pictures instead.
class SkiaBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
