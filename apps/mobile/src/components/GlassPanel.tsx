import { Platform, StyleSheet, View } from 'react-native';

import { PANEL_GLASS } from '@/theme/glass';
import { useTheme } from '@/theme/ThemeProvider';
import { TAB_BAR_GLASS, blursBehind } from '@/ui/backdrop';
import { LiquidGlass } from '@/ui/LiquidGlass';

// The ground of a fixed part a list scrolls under (theme/glass.ts → PANEL_GLASS): the list behind
// blurred (a GlassTarget around it, `targetId`), under the screen's ground; where nothing blurs
// (below Android 12) the ground alone. A hairline on the side the list goes under.
export function GlassPanel({ targetId, edge }: { targetId: string; edge?: 'top' | 'bottom' }) {
  const { colors, shape } = useTheme();
  const glass = TAB_BAR_GLASS && blursBehind(Platform.OS, Platform.Version);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {glass ? (
        <LiquidGlass
          targetId={targetId}
          cornerRadius={0}
          ground={colors.canvas}
          blur={PANEL_GLASS.blur}
          saturation={1}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.canvas, opacity: glass ? PANEL_GLASS.tint : 1 },
        ]}
      />
      {edge ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            [edge]: 0,
            height: shape.stroke.hairline,
            backgroundColor: colors.cardLine,
          }}
        />
      ) : null}
    </View>
  );
}
