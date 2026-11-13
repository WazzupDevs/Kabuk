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
type Art = { svg: SkSVG; kept: Kept; width: number; height: number };
type WholeRead =
  | { kind: 'still'; art: Art }
  | { kind: 'inside'; plan: SkiaPlan; mask: Art; content: Art }
  | { kind: 'move'; move: WholeMove; layers: WholeRead[] };

// The pictures kept: a look's few layers at the stage's size (about 2 MB each at three pixels a
// point), the look shown, the one fading out and the ones read ahead. A picture's pixels are not
// the JS heap's: one dropped from here is let go by hand (`dispose`), not left to the collector,
// which does not see them (docs/perf/akicilik-denetimi.md → 4.5: 1,47 GB after a few rolls of the
// dice, and not given back on leaving Süsle). One a canvas on the screen still shows is let go
// when that canvas goes; when no canvas is left, all of them are, a moment later.
type Kept = { image: SkImage | null; uses: number; cached: boolean };
const KEEP = 32;
const kept = new Map<string, Kept>();
let shown = 0;
let emptying: ReturnType<typeof setTimeout> | null = null;
const EMPTY_AFTER_MS = 2000;
const LET_GO_AFTER_MS = 500;

function letGo(k: Kept): void {
  if (k.uses > 0 || k.cached || !k.image) return;
  k.image.dispose();
  k.image = null;
}

function keep(key: string, k: Kept): void {
  kept.delete(key);
  kept.set(key, k);
  while (kept.size > KEEP) {
    const oldest = kept.entries().next();
    if (oldest.done) break;
    const [oldKey, old] = oldest.value;
    kept.delete(oldKey);
    old.cached = false;
    letGo(old);
  }
}

// A canvas takes the pictures it shows and gives them back when it goes.
function holdArts(arts: readonly Art[]): () => void {
  if (emptying) {
    clearTimeout(emptying);
    emptying = null;
  }
  for (const a of arts) a.kept.uses += 1;
  shown += 1;
  return () => {
    for (const a of arts) a.kept.uses -= 1;
    // A little after the canvas went: its last frame may still be on its way to the screen.
    setTimeout(() => {
      for (const a of arts) letGo(a.kept);
    }, LET_GO_AFTER_MS);
    shown -= 1;
    if (shown > 0 || emptying) return;
    // The last canvas went (Süsle closed): everything kept goes too, unless one comes back at once
    // (a look changed: the old canvas goes before the new one is counted).
    emptying = setTimeout(() => {
      emptying = null;
      if (shown > 0) return;
      for (const [key, k] of [...kept]) {
        kept.delete(key);
        k.cached = false;
        letGo(k);
      }
    }, EMPTY_AFTER_MS);
  };
}

function imageOf(xml: string, svg: SkSVG, width: number, height: number, ratio: number): Kept {
  const key = `${ratio}|${width}x${height}|${xml}`;
  const hit = kept.get(key);
  if (hit) {
    keep(key, hit);
    return hit;
  }
  let image: SkImage | null = null;
  try {
    const surface = Skia.Surface.Make(Math.ceil(width * ratio), Math.ceil(height * ratio));
    if (surface) {
      const canvas = surface.getCanvas();
      canvas.scale(ratio, ratio);
      canvas.drawSvg(svg, width, height);
      surface.flush();
      image = surface.makeImageSnapshot();
      // The picture keeps its own pixels; the surface it was drawn on is not needed again.
      surface.dispose();
    }
  } catch {
    image = null;
  }
  const made: Kept = { image, uses: 0, cached: true };
  keep(key, made);
  return made;
}

function artOf(xml: string, width: number, height: number, ratio: number): Art | null {
  const svg = svgOf(xml, width, height);
  return svg ? { svg, kept: imageOf(xml, svg, width, height, ratio), width, height } : null;
}

// A picture at its pixels (its surface was a whole number of them), or the SVG from its shapes
// when there is none.
const SHARP = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
function ArtAt({ art }: { art: Art }) {
  const ratio = PixelRatio.get();
  const image = art.kept.image;
  return image ? (
    <Image
      image={image}
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

// A small still drawing (an option's tile in Süsle's strips) as a picture's address: drawn once
// off the screen at the screen's pixels and kept as a PNG's text, which an Image shows in one view.
// The picture way made a native view of each of the tile's shapes and drew it on the UI thread the
// frame it came on the screen: a roll of the dice, which moves every strip, held that frame for a
// second or two (docs/perf/akicilik-denetimi.md → 4.6). Null when it cannot be made: the SVG then.
const tiles = createLru<{ uri: string | null }>(400);

export function tileUri(xml: string, size: number): string | null {
  const ratio = PixelRatio.get();
  const key = `${ratio}|${size}|${xml}`;
  const hit = tiles.get(key);
  if (hit !== undefined) return hit.uri;
  let uri: string | null = null;
  try {
    const svg = Skia.SVG.MakeFromString(xml);
    const px = Math.ceil(size * ratio);
    const surface = svg ? Skia.Surface.Make(px, px) : null;
    if (svg && surface) {
      const canvas = surface.getCanvas();
      canvas.scale(ratio, ratio);
      canvas.drawSvg(svg, size, size);
      surface.flush();
      const image = surface.makeImageSnapshot();
      uri = `data:image/png;base64,${image.encodeToBase64()}`;
      image.dispose();
    }
    surface?.dispose();
    svg?.dispose();
  } catch {
    uri = null;
  }
  tiles.set(key, { uri });
  return uri;
}

function artsOf(layers: readonly WholeRead[]): Art[] {
  return layers.flatMap((l) =>
    l.kind === 'still' ? [l.art] : l.kind === 'inside' ? [l.mask, l.content] : artsOf(l.layers),
  );
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
  // The pictures this canvas shows are its own while it is on the screen.
  useEffect(() => (read ? holdArts(artsOf(read)) : undefined), [read]);
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
