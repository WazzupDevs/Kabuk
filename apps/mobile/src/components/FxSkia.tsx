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
import {
  Component,
  Fragment,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, PixelRatio, View } from 'react-native';
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

import {
  type ArtNeed,
  type CapsuleArt,
  capsuleArt,
  emptyArt,
  type Made,
  prepNow,
  useArts,
  usePinned,
} from '@/capsule/useArt';
import { createLru } from '@/lib/lru';
import type { FxInside, FxLayer, FxPlace } from '@/theme/capsuleFx';
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

import { Inside, type InsideProps, readFxAhead, type WholeProps } from './FxSvg';

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
// The pictures are made off the screen and outside any render, one a turn (capsule/prepQueue.ts),
// and kept by their one owner (capsule/artStore.ts, one limit in bytes); a canvas reads only the
// ones made. No picture (no surface): the SVG drawn from its shapes, as before.
type Art = {
  art: Extract<CapsuleArt, { kind: 'image' | 'shapes' }>;
  width: number;
  height: number;
};
type WholeRead =
  | { kind: 'still'; art: Art }
  | { kind: 'inside'; plan: SkiaPlan; mask: Art; content: Art }
  | { kind: 'move'; move: WholeMove; layers: WholeRead[] };

// The pictures are let go by the store (artStore.ts → drop): one dropped over the limit and not
// shown by a canvas, `dispose`d a moment later; when no canvas is left (Süsle closed), all of them
// are, a moment later (docs/perf/akicilik-denetimi.md → 4.5).
let shown = 0;
let emptying: ReturnType<typeof setTimeout> | null = null;
const EMPTY_AFTER_MS = 2000;

// The GPU's copies of the pictures. A picture is copied to the GPU when a canvas first draws it,
// and that copy stays in Skia's GPU cache after the picture is let go, up to the cache's limit
// (256 MB by default), and nothing gives it back: not leaving Süsle, not the background, not the
// system asking for memory (docs/perf/akicilik-denetimi.md → 4.11: 282–378 MB stayed). The
// patched Skia (patches/@shopify__react-native-skia@2.6.2.patch) lets the app set the limit and
// empty what is unused, on the main thread the canvases draw on; an older build has no such call.
type GpuCache = { PurgeGpu?: (limitBytes: number, msNotUsed: number) => void };
const GPU_CACHE_BYTES = 96 * 1024 * 1024;
const GPU_KEEP_UNUSED_MS = 60_000;

function purgeGpu(msNotUsed: number): void {
  try {
    (Skia.Surface as typeof Skia.Surface & GpuCache).PurgeGpu?.(GPU_CACHE_BYTES, msNotUsed);
  } catch {
    // An older build without the call, or no GPU yet: nothing to give back.
  }
}

purgeGpu(GPU_KEEP_UNUSED_MS);
AppState.addEventListener('change', (state) => {
  if (state === 'background') purgeGpu(0);
});

// A canvas on the screen; its going (the last one) empties the pictures a moment later. Taken in a
// layout effect: a canvas that comes back (Süsle opened again) stops the emptying before anything
// else can run.
function holdCanvas(): () => void {
  if (emptying) {
    clearTimeout(emptying);
    emptying = null;
  }
  shown += 1;
  return () => {
    shown -= 1;
    if (shown > 0 || emptying) return;
    // The last canvas went (Süsle closed): everything kept goes too, unless one comes back at once
    // (a look changed: the old canvas goes before the new one is counted).
    emptying = setTimeout(() => {
      emptying = null;
      if (shown > 0) return;
      // Pictures, tiles and plans alike (what a drawing still holds stays).
      emptyArt();
      purgeGpu(0);
    }, EMPTY_AFTER_MS);
  };
}

// An SVG at a size as the canvas shows it: its picture, made off the screen (the SVG is read for
// this one drawing and let go with its surface: docs/perf/akicilik-denetimi.md → 4.9), else the
// SVG read for drawing from its shapes, else nothing (the picture way draws).
function makeArt(xml: string, width: number, height: number, ratio: number): Made {
  const px = Math.ceil(width * ratio);
  const py = Math.ceil(height * ratio);
  let image: SkImage | null = null;
  try {
    const svg = Skia.SVG.MakeFromString(xml);
    const surface = svg ? Skia.Surface.Make(px, py) : null;
    if (svg && surface) {
      const canvas = surface.getCanvas();
      canvas.scale(ratio, ratio);
      canvas.drawSvg(svg, width, height);
      surface.flush();
      image = surface.makeImageSnapshot();
    }
    surface?.dispose();
    svg?.dispose();
  } catch {
    image = null;
  }
  if (image) return { art: { kind: 'image', image }, bytes: px * py * 4 };
  let svg: SkSVG | null = null;
  try {
    svg = Skia.SVG.MakeFromString(xml);
  } catch {
    svg = null;
  }
  // The text's length is a floor for the parsed tree (its native size is not measured).
  return svg
    ? { art: { kind: 'shapes', svg }, bytes: xml.length }
    : { art: { kind: 'none' }, bytes: NONE_BYTES };
}
// What a resource that could not be made weighs in the limit (its key only, roughly).
const NONE_BYTES = 64;

// A shared SVG is drawn at its own size only (Skia sets its container's size before each drawing),
// so the size is in its key.
function artNeed(xml: string, width: number, height: number, ratio: number): ArtNeed {
  return {
    key: `${ratio}|${width}x${height}|${xml}`,
    make: () => makeArt(xml, width, height, ratio),
  };
}

// A picture at its pixels (its surface was a whole number of them), or the SVG from its shapes
// when there is none.
const SHARP = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
function ArtAt({ art }: { art: Art }) {
  const ratio = PixelRatio.get();
  const a = art.art;
  return a.kind === 'image' ? (
    <Image
      image={a.image}
      x={0}
      y={0}
      width={Math.ceil(art.width * ratio) / ratio}
      height={Math.ceil(art.height * ratio) / ratio}
      fit="fill"
      sampling={SHARP}
    />
  ) : (
    <ImageSVG svg={a.svg} x={0} y={0} width={art.width} height={art.height} />
  );
}

// Every resource a drawing's layers need, each once, in their order.
function wholeNeeds(
  layers: readonly WholeLayer[],
  width: number,
  height: number,
  ratio: number,
): ArtNeed[] {
  const out = new Map<string, ArtNeed>();
  const add = (n: ArtNeed) => {
    if (!out.has(n.key)) out.set(n.key, n);
  };
  const walk = (ls: readonly WholeLayer[]) => {
    for (const l of ls) {
      if (l.kind === 'still') add(artNeed(l.xml, width, height, ratio));
      else if (l.kind === 'inside') {
        const { plan } = l;
        add(artNeed(plan.mask, plan.crop.width, plan.crop.height, ratio));
        add(artNeed(plan.content, plan.width, plan.height, ratio));
      } else walk(l.layers);
    }
  };
  walk(layers);
  return [...out.values()];
}

// The layers with their made resources; null when one could not be made (the picture way draws).
function readWhole(
  layers: readonly WholeLayer[],
  width: number,
  height: number,
  ratio: number,
  got: ReadonlyMap<string, CapsuleArt>,
): WholeRead[] | null {
  const artOf = (xml: string, w: number, h: number): Art | null => {
    const a = got.get(artNeed(xml, w, h, ratio).key);
    return a && (a.kind === 'image' || a.kind === 'shapes')
      ? { art: a, width: w, height: h }
      : null;
  };
  const out: WholeRead[] = [];
  for (const l of layers) {
    if (l.kind === 'still') {
      const art = artOf(l.xml, width, height);
      if (!art) return null;
      out.push({ kind: 'still', art });
    } else if (l.kind === 'inside') {
      const { plan } = l;
      const mask = artOf(plan.mask, plan.crop.width, plan.crop.height);
      const content = artOf(plan.content, plan.width, plan.height);
      if (!mask || !content) return null;
      out.push({ kind: 'inside', plan, mask, content });
    } else {
      const inner = readWhole(l.layers, width, height, ratio, got);
      if (!inner) return null;
      out.push({ kind: 'move', move: l.move, layers: inner });
    }
  }
  return out;
}

// A motion's plan at a place (theme/capsuleSkia.ts → insidePlan): made in the queue, read by the
// canvas from the store (null: it cannot be drawn on the canvas, the picture way draws).
function planNeed(layer: FxInside, place: FxPlace, ratio: number): ArtNeed {
  return {
    key: `plan|${insidePlanKey(layer, place, ratio)}`,
    make: () => {
      const plan = planOf(layer, place, ratio);
      return {
        art: { kind: 'plan', plan },
        bytes: plan ? plan.mask.length + plan.content.length : NONE_BYTES,
      };
    },
  };
}

// The plans a drawing's layers need, each once.
function planNeeds(layers: readonly FxLayer[], place: FxPlace, ratio: number): ArtNeed[] {
  const out = new Map<string, ArtNeed>();
  const walk = (ls: readonly FxLayer[]) => {
    for (const l of ls) {
      if (l.kind === 'inside') {
        const n = planNeed(l, place, ratio);
        if (!out.has(n.key)) out.set(n.key, n);
      } else if (l.kind === 'move') walk(l.layers);
    }
  };
  walk(layers);
  return [...out.values()];
}

// The canvas's layers with the plans made (wholeLayers); null when one cannot be drawn.
function wholeOf(
  layers: readonly FxLayer[],
  place: FxPlace,
  ratio: number,
  plans: ReadonlyMap<string, CapsuleArt | undefined>,
): WholeLayer[] | null {
  return wholeLayers(layers, place, ratio, (l, p, r) => {
    const a = plans.get(`plan|${insidePlanKey(l, p, r)}`);
    return a?.kind === 'plan' ? a.plan : null;
  });
}

// What the whole canvas will need to draw `xml` at this size (`moving`: in FxMoves and not with
// reduce motion), as FxSvg gives it its layers (readFxAhead walks them the same way): its plans
// and its pictures. Itself a resource, made in the queue (reading the drawing's tree and its plans
// is work too): Süsle reads it ahead, and its stage keeps the look shown until it is made.
export function lookNeed(xml: string, width: number, height: number, moving: boolean): ArtNeed {
  const ratio = PixelRatio.get();
  return {
    key: `look|${ratio}|${width}x${height}|${moving ? 1 : 0}|${xml}`,
    make: () => {
      const out = new Map<string, ArtNeed>();
      const add = (n: ArtNeed) => {
        if (!out.has(n.key)) out.set(n.key, n);
      };
      readFxAhead(
        xml,
        width,
        height,
        moving,
        (layer, place) => {
          add(planNeed(layer, place, ratio));
          const plan = planOf(layer, place, ratio);
          if (!plan) return;
          add(artNeed(plan.mask, plan.crop.width, plan.crop.height, ratio));
          add(artNeed(plan.content, plan.width, plan.height, ratio));
        },
        (text, w, h) => add(artNeed(text, w, h, ratio)),
      );
      const needs = [...out.values()];
      return {
        art: { kind: 'needs', needs },
        bytes: needs.reduce((sum, n) => sum + n.key.length, 0),
      };
    },
  };
}

// A small still drawing (an option's tile in Süsle's strips) as a picture's address: drawn once
// off the screen at the screen's pixels and kept as a PNG's text, which an Image shows in one view.
// The picture way made a native view of each of the tile's shapes and drew it on the UI thread the
// frame it came on the screen: a roll of the dice, which moves every strip, held that frame for a
// second or two (docs/perf/akicilik-denetimi.md → 4.6). Nothing when it cannot be made: the SVG.
export function tileNeed(xml: string, size: number): ArtNeed {
  const ratio = PixelRatio.get();
  return {
    key: `tile|${ratio}|${size}|${xml}`,
    make: () => {
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
      return uri
        ? { art: { kind: 'uri', uri }, bytes: uri.length }
        : { art: { kind: 'none' }, bytes: NONE_BYTES };
    },
  };
}

const WHOLE_PAD = 0.15;

export function SkiaWhole({ layers, place, width, height, on, lane, fallback }: WholeProps) {
  const ratio = PixelRatio.get();
  // Its motions' plans, then its pictures: only what is made is read here (the queue makes them,
  // the ones missing asked for first).
  const plansNeeded = useMemo(() => planNeeds(layers, place, ratio), [layers, place, ratio]);
  const plans = useArts(plansNeeded);
  // Undefined while a plan is not made; null when one cannot be drawn (the picture way draws).
  const whole = useMemo(() => {
    if (!plans) return undefined;
    const got = new Map<string, CapsuleArt | undefined>();
    plansNeeded.forEach((n, i) => got.set(n.key, plans[i]));
    return wholeOf(layers, place, ratio, got);
  }, [plans, plansNeeded, layers, place, ratio]);
  const needs = useMemo(
    () => (whole ? wholeNeeds(whole, width, height, ratio) : null),
    [whole, width, height, ratio],
  );
  const arts = useArts(needs);
  const read = useMemo(() => {
    if (!whole || !needs || !arts) return null;
    const got = new Map<string, CapsuleArt>();
    needs.forEach((n, i) => {
      const a = arts[i];
      if (a) got.set(n.key, a);
    });
    return readWhole(whole, width, height, ratio, got);
  }, [whole, needs, arts, width, height, ratio]);
  // The last drawing made stays on the canvas until the next one is (a feeling's face, a look the
  // stage has not waited for): never an empty canvas. Held while it is shown.
  const [last, setLast] = useState<{ read: WholeRead[]; needs: readonly ArtNeed[] } | null>(null);
  if (read && needs && last?.read !== read) setLast({ read, needs });
  usePinned(last?.needs ?? null);
  const pending = whole === undefined || (whole !== null && !arts);
  const drawing = read ?? (pending ? (last?.read ?? null) : null);
  // Nothing made and nothing shown before (a canvas that comes with a look not read ahead): made
  // here, before the frame, as the drawing read them before; this commit is not on the screen.
  // The store's own note reaches this canvas only once it listens (after the frame): it listens
  // here too, and is drawn again before the frame.
  const waiting = pending && !last;
  const [, again] = useState(0);
  useLayoutEffect(() => {
    if (!waiting) return undefined;
    const offs: (() => void)[] = [];
    const now = (ns: readonly ArtNeed[]) => {
      offs.push(
        capsuleArt.watch(
          ns.map((n) => n.key),
          () => again((n) => n + 1),
        ),
      );
      prepNow(ns);
    };
    now(plansNeeded);
    const got = new Map<string, CapsuleArt | undefined>();
    for (const n of plansNeeded) got.set(n.key, capsuleArt.peek(n.key));
    const made = wholeOf(layers, place, ratio, got);
    if (made) now(wholeNeeds(made, width, height, ratio));
    return () => {
      for (const off of offs) off();
    };
  }, [waiting, plansNeeded, layers, place, ratio, width, height]);
  const showing = drawing !== null;
  useLayoutEffect(() => (showing ? holdCanvas() : undefined), [showing]);
  if (whole === null || (arts && !read)) return fallback;
  if (!drawing) return <View pointerEvents="none" style={{ width, height }} />;
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
            <WholeLayers layers={drawing} width={width} height={height} on={on} lane={lane} />
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
