import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useKit } from '@/aura/kit';
import { Button } from '@/components/Button';
import { FxMoves } from '@/components/FxSvg';
import { LookAvatar } from '@/components/LookAvatar';
import { Text } from '@/components/Text';
import { CapsuleStage } from '@/features/capsule/CapsuleStage';
import { tr } from '@/i18n/tr';
import { DRAW_LAB } from '@/lib/drawLab';
import { type SwitchStats, switchStats } from '@/lib/frameStats';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

// Bileşen önizleme → Kapsül ölçümü: the capsule's drawing cost on the owner's phone, the same
// scenes every time (adb `dumpsys gfxinfo` and `meminfo` read alongside). The scenes carry their own
// looks, so they never depend on what the account owns. Preview builds and development only: with
// DRAW_LAB off the set draws nothing.
type Scene = 'bare' | 'winter' | 'rainbow' | 'grid';
const SCENES: readonly Scene[] = ['bare', 'winter', 'rainbow', 'grid'];

const LOOKS: Record<Exclude<Scene, 'grid'>, string> = {
  bare: 'c:pembe e:koyu',
  winter: 'c:pembe e:koyu x:kistakimi',
  rainbow: 'c:pembe e:koyu x:gokkusagiatki',
};
const GRID_LOOK = 'c:pembe e:koyu x:kistakimi';
const GRID_COLUMNS = 4;
// The most a table seats (MAX_TABLE_PHONES), all on the screen at once. With 48, four times that,
// the scene died of a memory error on the first measurement (T0, 10 Kasım).
const GRID_COUNT = 12;
const GRID_AVATAR = SPACING[14];
const GRID_GAP = SPACING[2];
const GRID_DATA = Array.from({ length: GRID_COUNT }, (_, i) => i);

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
            label={t.scenes[s]}
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
      <PreviewBlock title={t.scenes[scene]}>
        {scene === 'grid' ? <Grid /> : <Big look={LOOKS[scene]} />}
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

function Grid() {
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
            <LookAvatar look={GRID_LOOK} size={GRID_AVATAR} />
          </View>
        ))}
      </View>
    </FxMoves>
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
