import { Canvas, Group, ImageSVG, Paint, Skia, type SkSVG } from '@shopify/react-native-skia';
import { Component, type ReactNode, useEffect, useMemo } from 'react';
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
  skiaAt,
  type SkiaPlan,
} from '@/theme/capsuleSkia';

import { Inside, type InsideProps } from './FxSvg';

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
