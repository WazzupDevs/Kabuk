import { requireNativeView } from 'expo';
import type { ComponentType, ReactNode } from 'react';
import { type ColorValue, Platform, type StyleProp, View, type ViewStyle } from 'react-native';

// The native side of skall's liquid glass (modules/skall-glass, Android): a screen a glass can see
// through (GlassTarget) and the glass itself (LiquidGlass), joined by an id.
type TargetProps = { targetId: string; style?: StyleProp<ViewStyle>; children?: ReactNode };
type GlassProps = {
  targetId: string;
  cornerRadius: number;
  ground: ColorValue;
  blurRadius: number;
  refraction: number;
  depth: number;
  dispersion: number;
  highlight: number;
  pointerEvents?: 'none';
  style?: StyleProp<ViewStyle>;
};

const android = Platform.OS === 'android';
const NativeTarget: ComponentType<TargetProps> | null = android
  ? requireNativeView<TargetProps>('SkallGlass', 'GlassTargetView')
  : null;
const NativeGlass: ComponentType<GlassProps> | null = android
  ? requireNativeView<GlassProps>('SkallGlass', 'LiquidGlassView')
  : null;

// A screen the glass may show; elsewhere (iOS) a plain view.
export function GlassTarget({ targetId, style, children }: TargetProps) {
  return NativeTarget ? (
    <NativeTarget targetId={targetId} style={style}>
      {children}
    </NativeTarget>
  ) : (
    <View style={style}>{children}</View>
  );
}

// The glass over its target; nothing where there is no native view.
export function LiquidGlass(props: GlassProps) {
  return NativeGlass ? <NativeGlass pointerEvents="none" {...props} /> : null;
}
