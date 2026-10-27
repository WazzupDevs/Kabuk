import { useMemo } from 'react';

import { useTheme } from '@/theme/ThemeProvider';

// Every stack's screens (the owner's report, 27 Ekim: white flashes and stutter between screens):
// the screen's ground is the canvas from the first frame, so a screen still drawing its content
// never shows white, and a push slides in from the right on the native side.
export function useStackOptions() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      ({
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }) as const,
    [colors.canvas],
  );
}
