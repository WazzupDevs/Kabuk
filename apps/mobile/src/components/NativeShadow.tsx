import { requireNativeView } from 'expo';
import { type ComponentType, type ReactNode, useMemo } from 'react';
import { Platform, processColor, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { shadowList } from '@/theme/auraKit';
import { labOff } from '@/lib/drawLab';
import { parseShadows } from '@/lib/shadowCss';

// A box's soft outer shadow drawn by the app's own native view from a picture made once
// (modules/skall-glass → ShadowView; the owner's report, 29 Ekim: React Native's boxShadow blurs
// every shadow again on every frame, a large part of each frame). The same shadow, laid over the
// box as its first child; it draws outside the box and not inside it. Android only; elsewhere, and
// for what it does not draw (an inset edge), boxShadow.
type Spec = { x: number; y: number; blur: number; spread: number; color: number };
type NativeProps = {
  shadows: Spec[];
  radii: number[];
  pointerEvents: 'none';
  style: StyleProp<ViewStyle>;
};
const Native: ComponentType<NativeProps> | null =
  Platform.OS === 'android' ? requireNativeView<NativeProps>('SkallGlass', 'ShadowView') : null;

export type Radii = number | readonly [number, number, number, number];

// Laid over its box's padding box, which is inside the box's border: `border` (its width) takes it
// out to the box's outer edge, where the shadow starts.
export function NativeShadow({
  css,
  radius,
  border = 0,
}: {
  css: string;
  radius: Radii;
  border?: number;
}) {
  const shadows = useMemo(
    () =>
      (parseShadows(css) ?? []).map((s) => ({ ...s, color: Number(processColor(s.color) ?? 0) })),
    [css],
  );
  if (!Native || shadows.length === 0) return null;
  const radii = typeof radius === 'number' ? [radius, radius, radius, radius] : [...radius];
  return (
    <Native
      pointerEvents="none"
      style={
        border > 0
          ? { position: 'absolute', left: -border, top: -border, right: -border, bottom: -border }
          : StyleSheet.absoluteFill
      }
      shadows={shadows}
      radii={radii}
    />
  );
}

// A box's shadows split: `outer` (soft, blurred) natively where it can be, `inset` (a light top
// edge, cheap) and anything else as boxShadow. `child` is false where the box clips its children
// (overflow hidden): there the native shadow would be cut, and boxShadow stays. `border`: the box's
// border width.
export function shadowParts(
  outer: string | undefined,
  inset: string | undefined,
  radius: Radii,
  child = true,
  border = 0,
): { boxShadow: string | undefined; node: ReactNode } {
  // Çizim ölçümü (lib/drawLab.ts) turns the outer shadows off; the caller calls useLabOff('golge').
  if (labOff('golge')) return { boxShadow: inset || undefined, node: null };
  const native = !!Native && child && !!outer && parseShadows(outer) !== null;
  return native && outer
    ? {
        boxShadow: inset || undefined,
        node: <NativeShadow css={outer} radius={radius} border={border} />,
      }
    : { boxShadow: shadowList(outer, inset), node: null };
}
