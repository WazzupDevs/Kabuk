import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Chip, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import {
  DRAW_LAB,
  DRAW_STEPS,
  openDrawLab,
  startDrawLab,
  SWITCH_PARTS,
  toggleLabPart,
  useDrawLab,
} from '@/lib/drawLab';
import { type SwitchStats, switchStats } from '@/lib/frameStats';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

// Çizim ölçümü's small panel over every screen (lib/drawLab.ts), at the top so the frame bars at
// the bottom stay clear: Başlat runs the steps (each a few seconds, its name shown), Kapat hides it.
// Under them the tab switch's parts, each turned off by hand (Geçişte kapat), and each switch's
// frames (Geçiş ölçümü; docs/denetim/olcum-protokolu.md). Preview builds and development only.
export function DrawLabPanel() {
  const open = useDrawLab((s) => s.open);
  const step = useDrawLab((s) => s.step);
  const manual = useDrawLab((s) => s.manual);
  const insets = useSafeAreaInsets();
  const { c } = useKit();
  if (!DRAW_LAB || !open) return null;
  const at = step === null ? null : DRAW_STEPS[step];
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + KIT.size.btnGap,
        left: KIT.size.side,
        right: KIT.size.side,
        alignItems: 'center',
      }}
    >
      <View
        pointerEvents={at ? 'none' : 'auto'}
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: KIT.size.btnGap,
          paddingVertical: KIT.size.btnGap,
          paddingHorizontal: KIT.size.liPadX,
          borderRadius: KIT.size.glassRadiusSm,
          borderWidth: KIT.size.edge,
          borderColor: c.glassEdge,
          backgroundColor: c.sheetBase,
        }}
      >
        <FrameMeter />
        {at && step !== null ? (
          <T v="sec" ink>
            {tr.design.drawLab.step(step + 1, DRAW_STEPS.length, tr.design.drawLab.steps[at.key])}
          </T>
        ) : (
          <>
            <T v="sec" ink>
              {tr.design.drawLab.title}
            </T>
            <Btn sm label={tr.design.drawLab.start} onPress={startDrawLab} />
            <Btn
              sm
              variant="glassy"
              label={tr.design.drawLab.close}
              onPress={() => openDrawLab(false)}
            />
            <View style={{ width: '100%', alignItems: 'center' }}>
              <T v="fine" ink>
                {tr.design.drawLab.switchTitle}
              </T>
            </View>
            {SWITCH_PARTS.map((part) => (
              <Chip
                key={part}
                label={tr.design.drawLab.parts[part]}
                on={manual.includes(part)}
                onPress={() => toggleLabPart(part)}
              />
            ))}
            <SwitchMeter />
          </>
        )}
      </View>
    </View>
  );
}

// The last second's frames, counted where they are made (the owner's report, 29 Ekim: the app
// stutters everywhere): on the JS thread (React's work: a slow one here is the app's own code) and
// on the UI thread (Reanimated's frame callback: a slow one here is layout and drawing). Each shows
// how many frames came and the longest gap between two. Written once a second.
const METER_MS = 1000;

function FrameMeter() {
  const [js, setJs] = useState({ fps: 0, worst: 0 });
  const [ui, setUi] = useState({ fps: 0, worst: 0 });
  const uiFrames = useSharedValue(0);
  const uiWorst = useSharedValue(0);
  useFrameCallback((frame) => {
    'worklet';
    uiFrames.value += 1;
    const gap = frame.timeSincePreviousFrame ?? 0;
    if (gap > uiWorst.value) uiWorst.value = gap;
  });
  useEffect(() => {
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      frames += 1;
      worst = Math.max(worst, now - last);
      last = now;
      raf = requestAnimationFrame(tick);
    });
    const timer = setInterval(() => {
      setJs({ fps: frames, worst: Math.round(worst) });
      setUi({ fps: uiFrames.value, worst: Math.round(uiWorst.value) });
      frames = 0;
      worst = 0;
      uiFrames.value = 0;
      uiWorst.value = 0;
    }, METER_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [uiFrames, uiWorst]);
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <T v="fine" ink>
        {tr.design.drawLab.meterJs(js.fps, js.worst)}
      </T>
      <T v="fine" ink>
        {tr.design.drawLab.meterUi(ui.fps, ui.worst)}
      </T>
    </View>
  );
}

// Geçiş ölçümü: after each tab opening (TabScene → markTabSwitch), the frames of the switch's
// window (the arrival and the longest cascade) on the UI thread and on JS, each switch's p95, jank
// and missed frames (lib/frameStats.ts → switchStats), and the last ten switches' screen frames
// together. Reanimated's frame callback sees the UI thread's frames, not the GPU's: the protocol's
// numbers come from `dumpsys gfxinfo`, these are the quick look on the phone.
const SWITCH_WINDOW_MS = MOTION.dissolve.inMs + MOTION.stagger.max * MOTION.stagger.part;
const KEEP_SWITCHES = 10;
const pct = (rate: number) => Math.round(rate * 1000) / 10;

function SwitchMeter() {
  const switches = useDrawLab((s) => s.switches);
  const recording = useSharedValue(false);
  const uiGaps = useSharedValue<number[]>([]);
  const [last, setLast] = useState<{ ui: SwitchStats; js: SwitchStats } | null>(null);
  const [kept, setKept] = useState<number[][]>([]);
  useFrameCallback((frame) => {
    'worklet';
    const gap = frame.timeSincePreviousFrame;
    if (!recording.value || gap === null) return;
    uiGaps.modify((gaps) => {
      'worklet';
      gaps.push(gap);
      return gaps;
    });
  });
  useEffect(() => {
    if (switches === 0) return undefined;
    uiGaps.value = [];
    recording.value = true;
    const jsGaps: number[] = [];
    let at = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      jsGaps.push(now - at);
      at = now;
      raf = requestAnimationFrame(tick);
    });
    const timer = setTimeout(() => {
      recording.value = false;
      cancelAnimationFrame(raf);
      const ui = [...uiGaps.value];
      setLast({ ui: switchStats(ui), js: switchStats(jsGaps) });
      setKept((k) => [...k, ui].slice(-KEEP_SWITCHES));
    }, SWITCH_WINDOW_MS);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      recording.value = false;
    };
  }, [switches, recording, uiGaps]);
  const all = switchStats(kept.flat());
  const t = tr.design.drawLab;
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {last ? (
        <>
          <T v="fine" ink>
            {t.switchLast(t.threadUi, last.ui.p95Ms, pct(last.ui.jankRate), last.ui.missed)}
          </T>
          <T v="fine" ink>
            {t.switchLast(t.threadJs, last.js.p95Ms, pct(last.js.jankRate), last.js.missed)}
          </T>
          <T v="fine" ink>
            {t.switchAll(kept.length, all.p95Ms, pct(all.jankRate))}
          </T>
          <Btn
            sm
            variant="glassy"
            label={t.reset}
            onPress={() => {
              setKept([]);
              setLast(null);
            }}
          />
        </>
      ) : (
        <T v="fine" ink>
          {t.switchNone}
        </T>
      )}
    </View>
  );
}
