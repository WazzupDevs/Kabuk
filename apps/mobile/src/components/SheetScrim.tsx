import { Animated, StyleSheet } from 'react-native';

import { useKit } from '@/aura/kit';
import { SCRIM_GLASS } from '@/theme/glass';

import { BackdropBlur, GlassTarget, HAS_BACKDROP } from './LiquidGlass';

type Props = {
  opacity: Animated.Value | Animated.AnimatedInterpolation<number>;
  // The sheet's card is on the live glass (iskelet.md → 2.2): the blurred screen is the backdrop
  // its glass looks through (LiquidGlass `backdrop`), copied once as the sheet opens, so nothing
  // the sheet scrolls blurs again; the scrim's colour lies outside it.
  glass?: boolean;
};

// U8: the scrim (`.scrim`), the screen behind blurred once as the sheet opens (Telegram Android's
// way behind its dialogs; LiquidGlass → BackdropBlur) under its colour, both fading in with the
// sheet. Two layers straight in the sheet's root, so its glass finds the backdrop drawn before it.
// Below Android 12 the scrim's colour alone.
export function SheetScrim({ opacity, glass }: Props) {
  const k = useKit();
  return (
    <>
      {HAS_BACKDROP ? (
        <GlassTarget backdrop enabled={!!glass} style={StyleSheet.absoluteFill}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
            <BackdropBlur blur={SCRIM_GLASS.blur} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </GlassTarget>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity, backgroundColor: k.c.scrim }]}
      />
    </>
  );
}
