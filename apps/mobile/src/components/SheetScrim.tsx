import { Animated, StyleSheet } from 'react-native';

import { useLabScrimGlass } from '@/lib/drawLab';
import { useReduceTransparency } from '@/lib/useReduceTransparency';
import { KIT } from '@/theme/auraKit';
import { SCRIM_GLASS } from '@/theme/glass';
import { useTheme } from '@/theme/ThemeProvider';

import { BackdropBlur, HAS_BACKDROP } from './LiquidGlass';

type Props = {
  opacity: Animated.Value | Animated.AnimatedInterpolation<number> | number;
  // The long-press menu's scrim (Menu → hold, MessagePop): lighter, over a still copy of the screen
  // blurred at SCRIM_GLASS when Çizim ölçümü's switch turns it on.
  hold?: boolean;
};

// The scrim under a sheet, a dialog and a held menu (yeni arayüz tuvali: SikayetEt, Masadakiler,
// MesajlarUzunBas; ortak-temel-plan.md A.8): flat, the ink at 42 % (black at 70 % in the dark), no
// blur. The long-press menu's is lighter (30 % / 62 %); its blurred still copy (the screen copied
// once as it opens, LiquidGlass → BackdropBlur) is off unless the lab's `scrimGlass` is on
// (docs/decisions/scrim-glass.md), and never below Android 12 or with reduce transparency.
export function SheetScrim({ opacity, hold }: Props) {
  const { scheme } = useTheme();
  const layer = KIT.layer[scheme];
  const glassOn = useLabScrimGlass();
  const solid = useReduceTransparency();
  const blur = !!hold && glassOn && HAS_BACKDROP && !solid;
  return (
    <>
      {blur ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
          <BackdropBlur blur={SCRIM_GLASS.blur} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity, backgroundColor: hold ? layer.holdScrim : layer.scrim },
        ]}
      />
    </>
  );
}
