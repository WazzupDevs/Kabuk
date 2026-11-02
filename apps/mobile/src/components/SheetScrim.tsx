import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import { Animated, Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useKit } from '@/aura/kit';
import { SCRIM_GLASS } from '@/theme/glass';

type NativeProps = { blur: number; style?: StyleProp<ViewStyle> };

// The screen behind a sheet, blurred once as the sheet opens (modules/skall-glass →
// BackdropBlurView, Telegram Android's way behind its dialogs): a Modal is a window of its own and
// the glass cannot look through to the screen under it. Android 12 and later; elsewhere the scrim's
// colour alone.
const Native: ComponentType<NativeProps> | null =
  Platform.OS === 'android'
    ? requireNativeView<NativeProps>('SkallGlass', 'BackdropBlurView')
    : null;

type Props = { opacity: Animated.Value | Animated.AnimatedInterpolation<number> };

// U8: the scrim (`.scrim`), the blurred screen under its colour, both fading in with the sheet.
export function SheetScrim({ opacity }: Props) {
  const k = useKit();
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {Native ? <Native blur={SCRIM_GLASS.blur} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: k.c.scrim }]} />
    </Animated.View>
  );
}
