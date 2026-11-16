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
  type SkRect,
  type SkSurface,
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
import { AppState, PixelRatio, Platform, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  makeMutable,
  runOnJS,
  runOnUI,
  type SharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  keptRect,
  pictureUsable,
  pointsOf,
  type PtRect,
  type PxRect,
  unionRect,
} from '@/capsule/artBounds';
import {
  type ArtNeed,
  type CapsuleArt,
  capsuleArt,
  emptyArt,
  type Made,
  LET_GO_AFTER_MS,
  prepNow,
  setTexturer,
  useArts,
  useArtValues,
  usePinned,
} from '@/capsule/useArt';
import { labTexture } from '@/lib/drawLab';
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
  textureAheadOn,
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

// Now, and again once the GPU copies let go with it are (useArt.ts → drop: a moment later, on
// the UI thread): a copy let go goes back to the cache, and the cache gives it back here.
function purgeGpuAll(): void {
  purgeGpu(0);
  setTimeout(() => purgeGpu(0), LET_GO_AFTER_MS + PURGE_AFTER_LET_GO_MS);
}
const PURGE_AFTER_LET_GO_MS = 250;

purgeGpu(GPU_KEEP_UNUSED_MS);
AppState.addEventListener('change', (state) => {
  if (state !== 'background') return;
  // The GPU copies nothing on the screen holds go too (what Süsle shows stays: its canvas draws
  // it when the app comes back).
  capsuleArt.dropUnused((a) => a.kind === 'image' && a.gpu === true);
  purgeGpuAll();
});

// The pictures' copies to the GPU ahead (capsule/textureQueue.ts; docs/decisions/
// skia-build-plani.md → "Dokunun önceden yüklenmesi"). Skia's GPU context is the thread's own
// (Android: OpenGLContext::getInstance, thread_local), and the canvases draw on the main thread;
// Reanimated's UI runtime runs there too, so the copy is made in a UI worklet, in the context the
// canvases draw with, and let go there (a Skia picture made on a thread is let go on it). Skia's
// own textures (its useImageAsTexture) are made the same way. The patched Skia's makeTextureImage
// uses the thread's context as it is: Skia.Surface.MakeOffscreen makes that context current first
// (another library may have left its own current on the main thread). One copy a frame of the UI
// thread at most (the queue sends the next one only after this one has answered; a frame already
// used waits for the next). A build without the call (0.11.0), or a failure, answers null: the
// picture is drawn from the CPU as before.
type GpuImage = SkImage & {
  makeTextureImage?: () => SkImage | null;
  isTextureBacked?: () => boolean;
};
// The UI frame the last copy was made in.
const lastCopyFrame = makeMutable(-1);

function copyOnUi(image: SkImage, done: (copy: SkImage | null, unsupported: boolean) => void) {
  'worklet';
  const attempt = (frame: number) => {
    if (frame === lastCopyFrame.value) {
      requestAnimationFrame(attempt);
      return;
    }
    lastCopyFrame.value = frame;
    let copy: SkImage | null = null;
    let unsupported = false;
    try {
      const from = image as GpuImage;
      if (typeof from.makeTextureImage !== 'function') unsupported = true;
      else {
        const current = Skia.Surface.MakeOffscreen(1, 1);
        if (current) {
          current.dispose();
          const made = from.makeTextureImage();
          if (made && (made as GpuImage).isTextureBacked?.() === true) copy = made;
          else made?.dispose();
        }
      }
    } catch {
      copy = null;
    }
    runOnJS(done)(copy, unsupported);
  };
  requestAnimationFrame(attempt);
}

function disposeOnUi(image: SkImage) {
  'worklet';
  try {
    image.dispose();
  } catch {
    // Already let go.
  }
}

setTexturer({
  upload: (image, done) => runOnUI(copyOnUi)(image, done),
  dispose: (image) => runOnUI(disposeOnUi)(image),
  on: () => textureAheadOn(Platform.OS, labTexture()),
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
      purgeGpuAll();
    }, EMPTY_AFTER_MS);
  };
}

// The pixels a picture drawn on `surface` covers (artBounds.ts), a pixel round them; the whole
// picture when they cannot be read, or none of them reads as drawn (artBounds.ts → keptRect).
function drawnRect(surface: SkSurface, px: number, py: number): PxRect {
  const whole = { x: 0, y: 0, width: px, height: py };
  const full = surface.makeImageSnapshot();
  try {
    const pixels = full.readPixels();
    return keptRect(pixels instanceof Uint8Array ? pixels : null, px, py);
  } catch {
    return whole;
  } finally {
    full.dispose();
  }
}

// An SVG at a size as the canvas shows it: its picture, made off the screen (the SVG is read for
// this one drawing and let go with its surface: docs/perf/akicilik-denetimi.md → 4.9), else the
// SVG read for drawing from its shapes, else nothing (the picture way draws). `trim`: the picture
// kept to the box of its own pixels (a still layer of the drawing: a part is a small share of the
// figure's box, docs/decisions/skia-build-plani.md → "Bütün kapsül Skia'da"), drawn at the same
// pixels; a mask stays whole (its empty pixels cut what is under it).
function makeArt(xml: string, width: number, height: number, ratio: number, trim: boolean): Made {
  const px = Math.ceil(width * ratio);
  const py = Math.ceil(height * ratio);
  let image: SkImage | null = null;
  let rect: PxRect = { x: 0, y: 0, width: px, height: py };
  try {
    const svg = Skia.SVG.MakeFromString(xml);
    const surface = svg ? Skia.Surface.Make(px, py) : null;
    if (svg && surface) {
      const canvas = surface.getCanvas();
      canvas.scale(ratio, ratio);
      canvas.drawSvg(svg, width, height);
      surface.flush();
      if (trim) {
        const kept = drawnRect(surface, px, py);
        const cut = surface.makeImageSnapshot(
          Skia.XYWHRect(kept.x, kept.y, kept.width, kept.height),
        );
        // A snapshot not of the box asked for (it should be): the whole picture, as before.
        if (pictureUsable(kept, cut.width(), cut.height())) {
          image = cut;
          rect = kept;
        } else cut.dispose();
      }
      image ??= surface.makeImageSnapshot();
    }
    surface?.dispose();
    svg?.dispose();
  } catch {
    image = null;
  }
  if (image) return { art: { kind: 'image', image, rect }, bytes: rect.width * rect.height * 4 };
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
function artNeed(xml: string, width: number, height: number, ratio: number, trim = false): ArtNeed {
  return {
    key: `${trim ? 'trim|' : ''}${ratio}|${width}x${height}|${xml}`,
    make: () => makeArt(xml, width, height, ratio, trim),
  };
}

// A still layer's picture, kept to its own pixels.
function stillNeed(xml: string, width: number, height: number, ratio: number): ArtNeed {
  return artNeed(xml, width, height, ratio, true);
}

// A picture at its pixels (its surface was a whole number of them; a kept box at the whole pixels
// it was cut at), or the SVG from its shapes when there is none.
// A picture (not an SVG: its drawing does not take a paint) may be drawn faded (`opacity`) or
// with a blend (`blend`).
const SHARP = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
function ArtAt({
  art,
  opacity,
  blend,
}: {
  art: Art;
  opacity?: SharedValue<number>;
  blend?: 'dstIn';
}) {
  const ratio = PixelRatio.get();
  const a = art.art;
  if (a.kind === 'image') {
    const at = pointsOf(a.rect, ratio);
    return (
      <Image
        image={a.image}
        x={at.x}
        y={at.y}
        width={at.width}
        height={at.height}
        fit="fill"
        sampling={SHARP}
        {...(opacity ? { opacity } : null)}
        {...(blend ? { blendMode: blend } : null)}
      />
    );
  }
  return <ImageSVG svg={a.svg} x={0} y={0} width={art.width} height={art.height} />;
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
      if (l.kind === 'still') add(stillNeed(l.xml, width, height, ratio));
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

// A picture's size in pixels; none when it cannot be read (a picture already let go).
function sizeOf(image: SkImage): [number, number] {
  try {
    return [image.width(), image.height()];
  } catch {
    return [0, 0];
  }
}

// The layers with their made resources; null when one could not be made (the picture way draws).
function readWhole(
  layers: readonly WholeLayer[],
  width: number,
  height: number,
  ratio: number,
  got: ReadonlyMap<string, CapsuleArt>,
): WholeRead[] | null {
  const artOf = (xml: string, w: number, h: number, trim = false): Art | null => {
    const a = got.get(artNeed(xml, w, h, ratio, trim).key);
    if (!a) return null;
    if (a.kind === 'shapes') return { art: a, width: w, height: h };
    // An empty picture, or one not of its box, is never drawn as nothing: the picture way draws.
    return a.kind === 'image' && pictureUsable(a.rect, ...sizeOf(a.image))
      ? { art: a, width: w, height: h }
      : null;
  };
  const out: WholeRead[] = [];
  for (const l of layers) {
    if (l.kind === 'still') {
      const art = artOf(l.xml, width, height, true);
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
        (text, w, h) => add(stillNeed(text, w, h, ratio)),
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
const NO_READ: WholeRead[] = [];
// The last drawing made, and what it was read from.
type LastDrawing = {
  read: WholeRead[];
  needs: readonly ArtNeed[];
  layers: readonly WholeLayer[];
  width: number;
  height: number;
  ratio: number;
};

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
  // stage has not waited for): never an empty canvas. Held while it is shown. No layers (an idle
  // canvas, FxSvg → idle) draw nothing and keep nothing: what comes after is drawn as on a new
  // canvas, made before the frame when it is not made yet.
  const [last, setLast] = useState<LastDrawing | null>(null);
  const none = read !== null && read.length === 0;
  if (none && last) setLast(null);
  if (read && needs && whole && !none && last?.read !== read)
    setLast({ read, needs, layers: whole, width, height, ratio });
  usePinned(last?.needs ?? null);
  // The last drawing read again from the store: one of its pictures may have been put again (its
  // GPU copy, capsule/textureQueue.ts) while it waits, and the CPU one is let go a moment later.
  const lastArts = useArtValues(last?.needs ?? null);
  const lastRead = useMemo(() => {
    if (!last || !lastArts) return last?.read ?? null;
    const got = new Map<string, CapsuleArt>();
    last.needs.forEach((n, i) => {
      const a = lastArts[i];
      if (a) got.set(n.key, a);
    });
    return readWhole(last.layers, last.width, last.height, last.ratio, got) ?? last.read;
  }, [last, lastArts]);
  const pending = whole === undefined || (whole !== null && !arts);
  const drawing = read ?? (pending ? lastRead : null);
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
  // A canvas once on the screen stays there while nothing is made (an idle canvas given a look:
  // a new one would make its surface again).
  const [mounted, setMounted] = useState(false);
  if (showing && !mounted) setMounted(true);
  if (whole === null || (arts && !read)) return fallback;
  if (!drawing && !mounted) return <View pointerEvents="none" style={{ width, height }} />;
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
            <WholeLayers
              layers={drawing ?? NO_READ}
              width={width}
              height={height}
              on={on}
              lane={lane}
            />
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
  const moved = (
    <Group transform={transform}>
      <ArtAt art={content} />
    </Group>
  );
  return (
    // Drawn's layers at the crop's corner, cut to the crop (a canvas of its own was its edge); a
    // layer here is the crop's size (the clip is set before it).
    <Group transform={[{ translateX: crop.left }, { translateY: crop.top }]} clip={box}>
      {mask.art.kind === 'image' ? (
        // One layer: the content, then the mask drawn over it in dst-in (the content times the
        // mask's alpha), the same product as the mask's layer with the content's over it in
        // src-in (the content times the mask's alpha). The mask's picture covers the whole crop:
        // nothing in the crop is left outside it.
        <Group layer>
          {moved}
          <ArtAt art={mask} blend="dstIn" />
        </Group>
      ) : (
        // The mask from its shapes takes no paint: its own layer, the content's in src-in.
        <Group layer>
          <ArtAt art={mask} />
          <Group layer={<Paint blendMode="srcIn" />}>{moved}</Group>
        </Group>
      )}
    </Group>
  );
}

// The one still picture a move draws, or null.
function onePicture(layers: readonly WholeRead[]): Art | null {
  const [only] = layers;
  return layers.length === 1 && only?.kind === 'still' && only.art.art.kind === 'image'
    ? only.art
    : null;
}

// What a move's layers draw, in its own space, a point more on every side (a clip's smoothed edge
// falls on nothing drawn); null when it is not known: an SVG from its shapes (it may draw past its
// box) or a move inside (it leaves its box).
const BOX_ROOM = 1;
function layersBox(layers: readonly WholeRead[], ratio: number): SkRect | null {
  const rects: PtRect[] = [];
  for (const l of layers) {
    if (l.kind === 'move') return null;
    if (l.kind === 'inside') {
      const { crop } = l.plan;
      rects.push({ x: crop.left, y: crop.top, width: crop.width, height: crop.height });
    } else if (l.art.art.kind === 'image') rects.push(pointsOf(l.art.art.rect, ratio));
    else return null;
  }
  const box = unionRect(rects, BOX_ROOM);
  return box ? Skia.XYWHRect(box.x, box.y, box.width, box.height) : null;
}

function WholeMoved({
  move,
  layers,
  ...draw
}: WholeDraw & { move: WholeMove; layers: readonly WholeRead[] }) {
  const clock = useClock(move.ms, draw.on, draw.lane);
  const matrix = useDerivedValue(() => moveMatrixAt(move, clock.value));
  const opacity = useDerivedValue(() => moveOpacityAt(move, clock.value));
  const ratio = PixelRatio.get();
  // One picture faded: its own opacity (one drawing: the same as its layer faded).
  const one = move.opacity ? onePicture(layers) : null;
  // Else the layer kept to what is drawn in it (a layer with no box is the whole canvas).
  const bounds = useMemo(
    () => (move.opacity && !one ? layersBox(layers, ratio) : null),
    [move.opacity, one, layers, ratio],
  );
  const inner = <WholeLayers layers={layers} {...draw} />;
  return (
    <Group matrix={matrix} {...(bounds ? { clip: bounds } : null)}>
      {one ? (
        <ArtAt art={one} opacity={opacity} />
      ) : move.opacity ? (
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
