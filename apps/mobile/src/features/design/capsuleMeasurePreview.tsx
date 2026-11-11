import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useKit } from '@/aura/kit';
import { Button } from '@/components/Button';
import { FxMoves, FxSvg } from '@/components/FxSvg';
import { LookAvatar } from '@/components/LookAvatar';
import { useSkiaInside } from '@/components/skiaInside';
import { Text } from '@/components/Text';
import { CapsuleStage } from '@/features/capsule/CapsuleStage';
import { tr } from '@/i18n/tr';
import { DRAW_LAB } from '@/lib/drawLab';
import { type SwitchStats, switchStats } from '@/lib/frameStats';
import { KIT } from '@/theme/auraKit';
import { MEASURE_GRID } from '@/theme/capsuleCanvas';
import { lookPop } from '@/theme/capsuleLook';
import { skiaAccessories } from '@/theme/capsuleSkia';
import { useTheme } from '@/theme/ThemeProvider';

import { PreviewBlock } from './PreviewBlock';

// Bileşen önizleme → Kapsül ölçümü: the capsule's drawing cost on the owner's phone, the same
// scenes every time (adb `dumpsys gfxinfo` and `meminfo` read alongside). The scenes carry their own
// looks, so they never depend on what the account owns. Preview builds and development only: with
// DRAW_LAB off the set draws nothing. `skia`: the accessories that move inside a clip side by side,
// the pictures and Skia (docs/decisions/skia-build-plani.md → P6). The big capsule and the grid take
// Skia with Çizim ölçümü's `skia` switch (CapsuleStage, Grid). `gridOne`: the same grid on one Skia
// canvas, whatever the switch says (P9).
type Scene = 'bare' | 'winter' | 'rainbow' | 'grid' | 'gridOne' | 'skia';
const SCENES: readonly Scene[] = ['bare', 'winter', 'rainbow', 'grid', 'gridOne', 'skia'];
const sceneName = (s: Scene) =>
  s === 'skia' ? tr.design.drawLab.skiaGallery : tr.design.capsuleMeasure.scenes[s];

const LOOKS: Record<Exclude<Scene, 'grid' | 'gridOne' | 'skia'>, string> = {
  bare: 'c:pembe e:koyu',
  winter: 'c:pembe e:koyu x:kistakimi',
  rainbow: 'c:pembe e:koyu x:gokkusagiatki',
};
const GRID_LOOK = MEASURE_GRID.look;
const GRID_COLUMNS = MEASURE_GRID.columns;
const GRID_AVATAR = MEASURE_GRID.size;
const GRID_GAP = MEASURE_GRID.gap;
const GRID_DATA = Array.from({ length: MEASURE_GRID.count }, (_, i) => i);

const MEASURE_MS = 30000;
const TICK_MS = 1000;

type Result = { ui: SwitchStats; js: SwitchStats };
const pct = (rate: number) => Math.round(rate * 1000) / 10;

export function CapsuleMeasureSet() {
  const t = tr.design.capsuleMeasure;
  const [scene, setScene] = useState<Scene>('bare');
  const meter = useMeter();
  if (!DRAW_LAB) return null;

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {SCENES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === scene ? 'primary' : 'neutral'}
            label={sceneName(s)}
            testID={`capsule-measure-${s}`}
            disabled={meter.running}
            onPress={() => setScene(s)}
          />
        ))}
      </View>
      <Text variant="fine" tone="muted">
        {t.hint}
      </Text>
      <View className="gap-2" testID="capsule-measure-stats">
        <Button
          size="sm"
          label={meter.running ? t.measuring(meter.left) : t.measure}
          testID="capsule-measure-run"
          loading={meter.running}
          disabled={meter.running}
          onPress={meter.start}
        />
        <Text variant="bodyStrong" tabular>
          {meter.result
            ? t.result(
                meter.result.ui.p50Ms,
                meter.result.ui.p95Ms,
                pct(meter.result.ui.jankRate),
                meter.result.js.p95Ms,
              )
            : t.none}
        </Text>
      </View>
      <PreviewBlock title={sceneName(scene)}>
        {scene === 'grid' ? (
          <Grid />
        ) : scene === 'gridOne' ? (
          <GridOne />
        ) : scene === 'skia' ? (
          <Gallery />
        ) : (
          <Big look={LOOKS[scene]} />
        )}
      </PreviewBlock>
    </View>
  );
}

// The big capsule as Süsle draws it (profile/capsule.tsx): CapsuleStage in FxMoves.
function Big({ look }: { look: string }) {
  const { c } = useKit();
  const { scheme, colors } = useTheme();
  const stage = KIT.size.capsuleStage;
  return (
    <View style={{ alignItems: 'center' }}>
      <FxMoves>
        <CapsuleStage
          testID="capsule-measure-stage"
          look={look}
          feeling={null}
          play={null}
          beat={0}
          size={stage - KIT.size.capsuleRing * 2}
          ring={KIT.size.capsuleRing}
          ringColor={scheme === 'dark' ? c.glass : colors.surface}
          label={tr.design.capsuleMeasure.label}
          hint={null}
          onPress={noop}
        />
      </FxMoves>
    </View>
  );
}

function noop() {}

// The grid of T1 (twelve, the same size and places); with the `skia` switch each avatar draws its
// motion with Skia, a canvas each, as a real screen's avatars would. Skia is loaded once for all of
// them (useSkiaInside's one import) and the twelve share one plan, one mask and one content
// (components/FxSkia.tsx → planOf, svgOf).
function Grid() {
  const inside = useSkiaInside('lab');
  return (
    <FxMoves>
      <View
        testID="capsule-measure-grid"
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}
      >
        {GRID_DATA.map((i) => (
          <View
            key={i}
            style={{
              width: `${100 / GRID_COLUMNS}%`,
              alignItems: 'center',
              marginBottom: GRID_GAP,
            }}
          >
            <LookAvatar look={GRID_LOOK} size={GRID_AVATAR} inside={inside} />
          </View>
        ))}
      </View>
    </FxMoves>
  );
}

// The same grid on one Skia canvas (capsuleGridCanvas.tsx; P9). The drawing is read by a lazy
// import (components/skiaInside.ts's way), once, so that nothing of Skia is read before the scene
// opens; Skia whatever the panel's switch says.
type GridCanvasKit = { Grid: ComponentType };
// Kept in an object: a component given to useState would be called as its initial value.
type GridLoaded = GridCanvasKit | 'failed';
let gridLoaded: GridLoaded | null = null;
let gridLoading: Promise<GridLoaded> | null = null;

function loadGridCanvas(): Promise<GridLoaded> {
  gridLoading ??= import('./capsuleGridCanvas').then(
    (mod): GridLoaded => (mod.skiaReady() ? { Grid: mod.GridCanvas } : 'failed'),
    (): GridLoaded => 'failed',
  );
  return gridLoading.then((l) => {
    gridLoaded = l;
    return l;
  });
}

function GridOne() {
  const d = tr.design.drawLab;
  const [kit, setKit] = useState<GridLoaded | null>(gridLoaded);
  useEffect(() => {
    if (kit !== null) return undefined;
    let live = true;
    void loadGridCanvas().then((l) => {
      if (live) setKit(l);
    });
    return () => {
      live = false;
    };
  }, [kit]);
  if (kit === null || kit === 'failed') {
    return (
      <Text variant="fine" tone="muted">
        {kit === null ? d.skiaLoading : d.skiaFailed}
      </Text>
    );
  }
  return <kit.Grid />;
}

// Each accessory that moves inside a clip on Süsle's stage drawing (lookPop), its name over it: on
// the left the pictures in turn, on the right Skia, the same size. The list is the drawings' own
// (theme/capsuleSkia.ts → skiaAccessories). Skia loads whatever the switch says.
const SIDE = KIT.size.capsuleStage / 2;
const SIDE_HEIGHT = (SIDE * 57) / 60;
const NAMES = new Map(GIFT_CATALOG.accessories.map((a) => [a.id, a.name]));

function Gallery() {
  const inside = useSkiaInside('always');
  const ids = useMemo(() => skiaAccessories(), []);
  const d = tr.design.drawLab;
  return (
    <FxMoves>
      <View className="gap-4" testID="capsule-measure-skia">
        <Text variant="fine" tone="muted">
          {inside ? d.skiaSides : d.skiaLoading}
        </Text>
        {ids.map((id) => (
          <SideBySide key={id} id={id} inside={inside} />
        ))}
      </View>
    </FxMoves>
  );
}

function SideBySide({ id, inside }: { id: string; inside: ReturnType<typeof useSkiaInside> }) {
  const xml = useMemo(() => lookPop(`c:pembe e:koyu x:${id}`), [id]);
  return (
    <View className="gap-2">
      <Text variant="bodyStrong">{NAMES.get(id) ?? id}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <FxSvg xml={xml} width={SIDE} height={SIDE_HEIGHT} />
        {inside ? (
          <FxSvg xml={xml} width={SIDE} height={SIDE_HEIGHT} inside={inside} />
        ) : (
          <View style={{ width: SIDE, height: SIDE_HEIGHT }} />
        )}
      </View>
    </View>
  );
}

// 30 s of frame gaps, as the Geçiş ölçümü collects them (DrawLabPanel → SwitchMeter): the UI
// thread's through Reanimated's frame callback into a shared array, the JS thread's through
// requestAnimationFrame. The statistics are lib/frameStats.ts → switchStats.
function useMeter() {
  const uiGaps = useSharedValue<number[]>([]);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(MEASURE_MS / TICK_MS);
  const [result, setResult] = useState<Result | null>(null);
  // Off until a measurement runs: no frame loop of its own the rest of the time.
  const frames = useFrameCallback((frame) => {
    'worklet';
    const gap = frame.timeSincePreviousFrame;
    if (gap === null) return;
    uiGaps.modify((gaps) => {
      'worklet';
      gaps.push(gap);
      return gaps;
    });
  }, false);
  useEffect(() => {
    if (!running) return undefined;
    uiGaps.set([]);
    frames.setActive(true);
    const jsGaps: number[] = [];
    let at = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      jsGaps.push(now - at);
      at = now;
      raf = requestAnimationFrame(tick);
    });
    const started = at;
    const countdown = setInterval(
      () => setLeft(Math.max(0, Math.ceil((MEASURE_MS - (performance.now() - started)) / TICK_MS))),
      TICK_MS,
    );
    const done = setTimeout(() => {
      frames.setActive(false);
      cancelAnimationFrame(raf);
      setResult({ ui: switchStats([...uiGaps.get()]), js: switchStats(jsGaps) });
      setRunning(false);
    }, MEASURE_MS);
    return () => {
      clearTimeout(done);
      clearInterval(countdown);
      cancelAnimationFrame(raf);
      frames.setActive(false);
    };
  }, [running, frames, uiGaps]);
  const start = () => {
    if (!DRAW_LAB || running) return;
    setLeft(MEASURE_MS / TICK_MS);
    setResult(null);
    setRunning(true);
  };
  return { running, left, result, start };
}
