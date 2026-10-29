import { requireNativeView } from 'expo';
import type { ComponentType, ReactNode } from 'react';
import { Platform, type StyleProp, View, type ViewStyle } from 'react-native';

// A tab screen's blur dissolve drawn by the app's own native view (modules/skall-glass →
// DissolveView): each new `run` (not 0) blurs the screen by `blur` (dp, CSS's blur) and clears it
// over `durationMs` on `curve` (a cubic-bezier), small and on the GPU, every frame. Android 12 and
// later; elsewhere a plain view (no blur).
type Props = {
  run: number;
  blur: number;
  durationMs: number;
  curve: readonly [number, number, number, number];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};
type NativeProps = Omit<Props, 'curve'> & { curve: number[] };

const Native: ComponentType<NativeProps> | null =
  Platform.OS === 'android' ? requireNativeView<NativeProps>('SkallGlass', 'DissolveView') : null;

export function Dissolve({ run, blur, durationMs, curve, style, children }: Props) {
  return Native ? (
    <Native run={run} blur={blur} durationMs={durationMs} curve={[...curve]} style={style}>
      {children}
    </Native>
  ) : (
    <View style={style}>{children}</View>
  );
}
