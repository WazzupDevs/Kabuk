import { useMemo } from 'react';

import { useTheme } from '@/theme/ThemeProvider';

// Every stack's screens (the owner's report, 27 Ekim: white flashes and stutter between screens):
// the screen's ground is the canvas from the first frame, so a screen still drawing its content
// never shows white. A push slides in from the right as iOS does, on Android too, and every page
// goes back with a swipe from its edge (docs/design/iskelet.md → 4.4): the whole screen's swipe
// where the platform's stack has it (iOS); Android's stack has no swipe of its own, its back
// gesture and back button pop the page (a sheet or a menu open closes first, as before).
export function useStackOptions() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      ({
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'ios_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }) as const,
    [colors.canvas],
  );
}
