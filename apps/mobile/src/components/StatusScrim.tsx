import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from 'expo-router';

import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';

// The status bar's icons over a surface the theme does not know (audit M15-12): a picture drawn
// under the bar (a venue's scene, a game's end) or a sheet's scrim. A dark fade under the bar and
// light icons, so the clock reads on a light picture and on a dark scrim alike.
export function StatusScrim({
  opacity,
}: {
  // Fading with the sheet it belongs to; still without.
  opacity?: Animated.Value | Animated.AnimatedInterpolation<number>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.band,
        { height: insets.top + KIT.statusScrimBelow, opacity: opacity ?? 1 },
        gradientStyle(KIT.statusScrim),
      ]}
    />
  );
}

// The status bar's style while this screen is the one shown: a screen kept under another (a tab
// left open, a table under its chat) gives the bar back to the screen over it.
export function ScreenStatusBar({ style }: { style: StatusBarStyle }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} /> : null;
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, top: 0 },
});
