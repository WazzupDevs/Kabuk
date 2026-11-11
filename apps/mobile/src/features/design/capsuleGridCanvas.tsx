import { Canvas, Group, ImageSVG, Paint, Skia, type SkSVG } from '@shopify/react-native-skia';
import { Component, type ReactNode, useMemo, useState } from 'react';
import { type LayoutChangeEvent, PixelRatio, View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { planOf, svgOf, useClock } from '@/components/FxSkia';
import { useLoopActive } from '@/components/Loader';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  type CanvasLayer,
  canvasCells,
  type CanvasSkip,
  canvasLook,
  MEASURE_GRID,
} from '@/theme/capsuleCanvas';
import { lookSvg } from '@/theme/capsuleLook';
import { insideAt, type SkiaPlan, skiaAt } from '@/theme/capsuleSkia';

// Kapsül ölçümü → Izgara, tek Canvas (docs/decisions/skia-build-plani.md → P9): the grid's twelve
// avatars on one Skia canvas, each drawn whole by it (theme/capsuleCanvas.ts), none a view of its
// own. Read only through capsuleMeasurePreview.tsx's lazy import, as FxSkia.tsx is: nothing here is
// read at the app's launch. The plans, the SVGs and the clocks are FxSkia's (planOf, svgOf,
// useClock): the twelve share one plan, one mask, one content and one shared value a motion.

// The clocks of FxSvg's default lane: as the twelve views' avatars would hold them.
const LANE = 'main';

// Whether Skia's native module is there (a build without it, a test: the import gives no Skia).
export function skiaReady(): boolean {
  return typeof Skia === 'object' && Skia !== null;
}

export function GridCanvas() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View testID="capsule-measure-grid-one" onLayout={onLayout}>
      <CanvasBoundary>{width > 0 ? <Drawn width={width} /> : null}</CanvasBoundary>
    </View>
  );
}

// A layer's SVGs, read once: a still layer's over the avatar, a clip's mask and content.
type Read =
  { kind: 'still'; svg: SkSVG } | { kind: 'inside'; plan: SkiaPlan; mask: SkSVG; content: SkSVG };

function readLayers(layers: readonly CanvasLayer[], size: number): Read[] | null {
  const out: Read[] = [];
  for (const l of layers) {
    if (l.kind === 'still') {
      const svg = svgOf(l.xml, size, size);
      if (!svg) return null;
      out.push({ kind: 'still', svg });
    } else {
      const { plan } = l;
      const mask = svgOf(plan.mask, plan.crop.width, plan.crop.height);
      const content = svgOf(plan.content, plan.width, plan.height);
      if (!mask || !content) return null;
      out.push({ kind: 'inside', plan, mask, content });
    }
  }
  return out;
}

const G = MEASURE_GRID;

function Drawn({ width }: { width: number }) {
  const active = useLoopActive();
  const reduceMotion = useReduceMotion();
  const moving = !reduceMotion;
  const ratio = PixelRatio.get();
  const look = useMemo(
    () => canvasLook(lookSvg(G.look, 'av'), G.size, ratio, moving, planOf),
    [ratio, moving],
  );
  const read = useMemo(() => (look.layers ? readLayers(look.layers, G.size) : null), [look]);
  const grid = useMemo(() => canvasCells(width, G.count, G.columns, G.size, G.gap), [width]);
  const round = useMemo(
    () => Skia.RRectXY(Skia.XYWHRect(0, 0, G.size, G.size), G.size / 2, G.size / 2),
    [],
  );
  const skip: CanvasSkip | 'svg' | null = look.skip ?? (read ? null : 'svg');
  if (skip || !read) return <Skipped />;
  const plans = read.flatMap((r) => (r.kind === 'inside' ? [r.plan] : []));
  return (
    <Shifts plans={plans} on={active && moving} got={[]}>
      {(shifts) => (
        <Canvas style={{ width, height: grid.height }}>
          {grid.cells.map((cell, i) => (
            <Group
              key={i}
              transform={[{ translateX: cell.x }, { translateY: cell.y }]}
              clip={round}
            >
              {/* Each avatar's layers in the drawing's order, at its own corner, cut by its disc
                  (LookAvatar's). The n-th motion is the n-th clip's, shared by the twelve. */}
              {layersOf(read, shifts, G.size)}
            </Group>
          ))}
        </Canvas>
      )}
    </Shifts>
  );
}

function layersOf(read: readonly Read[], shifts: readonly Shift[], size: number): ReactNode[] {
  let n = 0;
  return read.map((r, j) => {
    if (r.kind === 'still') {
      return <ImageSVG key={j} svg={r.svg} x={0} y={0} width={size} height={size} />;
    }
    const shift = shifts[n];
    n += 1;
    if (!shift) return null;
    const { crop } = r.plan;
    return (
      <Group key={j} transform={[{ translateX: crop.left }, { translateY: crop.top }]}>
        {/* FxSkia → Drawn's layers: the mask, then the content kept only where the mask is. */}
        <Group layer>
          <ImageSVG svg={r.mask} x={0} y={0} width={crop.width} height={crop.height} />
          <Group layer={<Paint blendMode="srcIn" />}>
            {/* ImageSVG moves only when both x and y are not 0: the move is the group's. */}
            <Group transform={shift}>
              <ImageSVG svg={r.content} x={0} y={0} width={r.plan.width} height={r.plan.height} />
            </Group>
          </Group>
        </Group>
      </Group>
    );
  });
}

// A motion's translate on the UI thread, from its clock (FxSkia → Drawn's).
function useShift(plan: SkiaPlan, on: boolean) {
  const clock = useClock(plan.ms, on, LANE);
  // The worklet closes over the numbers only: the plan's texts stay on this thread.
  const at = useMemo(() => skiaAt(plan), [plan]);
  return useDerivedValue(() => {
    const p = insideAt(at, clock.value);
    return [{ translateX: p.x }, { translateY: p.y }];
  });
}
type Shift = ReturnType<typeof useShift>;

// One shift a motion inside its clip, however many the look has: each its own component, so that
// each holds its hooks the same way on every render.
function Shifts({
  plans,
  on,
  got,
  children,
}: {
  plans: readonly SkiaPlan[];
  on: boolean;
  got: readonly Shift[];
  children: (shifts: readonly Shift[]) => ReactNode;
}) {
  const [first, ...rest] = plans;
  if (!first) return children(got);
  return (
    <Shifted plan={first} rest={rest} on={on} got={got}>
      {children}
    </Shifted>
  );
}

function Shifted({
  plan,
  rest,
  on,
  got,
  children,
}: {
  plan: SkiaPlan;
  rest: readonly SkiaPlan[];
  on: boolean;
  got: readonly Shift[];
  children: (shifts: readonly Shift[]) => ReactNode;
}) {
  const shift = useShift(plan, on);
  return (
    <Shifts plans={rest} on={on} got={[...got, shift]}>
      {children}
    </Shifts>
  );
}

// A layer the canvas cannot draw: no avatar is drawn, and the scene says so.
function Skipped() {
  return (
    <Text variant="fine" tone="muted">
      {tr.design.capsuleMeasure.gridOneSkipped}
    </Text>
  );
}

// A canvas that throws while it is made says Skia did not load.
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? (
      <Text variant="fine" tone="muted">
        {tr.design.drawLab.skiaFailed}
      </Text>
    ) : (
      this.props.children
    );
  }
}
