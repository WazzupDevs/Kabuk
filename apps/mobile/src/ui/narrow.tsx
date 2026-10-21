import { createContext, type ReactNode, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

import { V46_NARROW_MAX_WIDTH } from '@/theme/parts.generated';

// The width src/ui lays out for: the window's, or a fixed one where a test screen draws v46's
// narrow look on a wider phone (the gallery's 320 view, the visual gate's `genislik`).
const WidthContext = createContext<number | null>(null);

export function WidthScope({ width, children }: { width: number; children: ReactNode }) {
  return <WidthContext.Provider value={width}>{children}</WidthContext.Provider>;
}

// The width a screen is laid out for (a part that grows with the screen: the tab bar).
export function useLayoutWidth(): number {
  const scoped = useContext(WidthContext);
  const { width } = useWindowDimensions();
  return scoped ?? width;
}

// Whether v46's `max-width` rules apply: at its breakpoint and below.
export function useNarrow(): boolean {
  return useLayoutWidth() <= V46_NARROW_MAX_WIDTH;
}
