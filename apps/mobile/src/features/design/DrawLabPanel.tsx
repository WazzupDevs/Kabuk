import { View } from 'react-native';
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
