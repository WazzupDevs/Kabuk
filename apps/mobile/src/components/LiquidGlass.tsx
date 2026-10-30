import { requireNativeView } from 'expo';
import type { ComponentType, ReactNode } from 'react';
import {
  type ColorValue,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { TAB_BAR_GLASS, TAB_GLASS, blursBehind } from '@/theme/glass';

// The native side of skall's glass (modules/skall-glass, Android; frosted since 0.9.0, the owner's
// call, 29 Ekim): a screen a glass can see through (GlassTarget) and the glass itself
// (LiquidGlass), joined by an id.
type TargetProps = {
  targetId?: string;
  // A screen's backdrop (its ground and still pictures, never a button): the frosted buttons drawn
  // after it look through it without an id (Frost).
  backdrop?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};
type GlassProps = {
  targetId?: string;
  // Through the nearest backdrop drawn before it instead of a target by id.
  backdrop?: boolean;
  cornerRadius: number;
  ground: ColorValue;
  // The blur's deviation (CSS's blur length) in dp and the colours' strength (CSS's saturate).
  blur: number;
  saturation: number;
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
export function GlassTarget({ targetId, backdrop, style, children }: TargetProps) {
  return NativeTarget ? (
    <NativeTarget targetId={targetId} backdrop={backdrop} style={style}>
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

// Whether a clear button is frosted here: where the native glass blurs (Android 12 and later).
// Elsewhere it keeps its own fill alone.
export const FROSTED =
  NativeGlass !== null && TAB_BAR_GLASS && blursBehind(Platform.OS, Platform.Version);

// A clear button's frost (the owner's call, 30 Ekim: every clear button frosted): the screen's
// backdrop behind it blurred as the tab bar's glass is (theme/glass.ts → TAB_GLASS), cut to its
// round, and the button's own fill over it (the button itself then has no fill).
// Behind its content, filling it.
export function Frost({
  radius,
  ground,
  fill,
}: {
  radius: number;
  ground: ColorValue;
  fill?: ColorValue;
}) {
  if (!FROSTED || !NativeGlass) return null;
  return (
    <>
      <NativeGlass
        pointerEvents="none"
        backdrop
        cornerRadius={radius}
        ground={ground}
        blur={TAB_GLASS.blur}
        saturation={TAB_GLASS.saturation}
        style={StyleSheet.absoluteFill}
      />
      {fill ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: fill }]}
        />
      ) : null}
    </>
  );
}
