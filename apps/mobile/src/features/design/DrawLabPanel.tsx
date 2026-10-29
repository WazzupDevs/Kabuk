import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { DRAW_LAB, DRAW_STEPS, openDrawLab, startDrawLab, useDrawLab } from '@/lib/drawLab';
import { KIT } from '@/theme/auraKit';

// Çizim ölçümü's small panel over every screen (lib/drawLab.ts), at the top so the frame bars at
// the bottom stay clear: Başlat runs the steps (each a few seconds, its name shown), Kapat hides it.
// Preview builds and development only.
export function DrawLabPanel() {
  const open = useDrawLab((s) => s.open);
  const step = useDrawLab((s) => s.step);
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
