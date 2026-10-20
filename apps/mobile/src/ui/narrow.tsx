import { createContext, type ReactNode, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

import { V46_NARROW_MAX_WIDTH } from '@/theme/parts.generated';

// The width src/ui lays out for: the window's, or a fixed one where a test screen draws v46's
// narrow look on a wider phone (the gallery's 320 view, the visual gate's `genislik`).
const WidthContext = createContext<number | null>(null);

export function WidthScope({ width, children }: { width: number; children: ReactNode }) {
  return <WidthContext.Provider value={width}>{children}</WidthContext.Provider>;
}

// Whether v46's `max-width` rules apply: at its breakpoint and below.
export function useNarrow(): boolean {
  const scoped = useContext(WidthContext);
  const { width } = useWindowDimensions();
  return (scoped ?? width) <= V46_NARROW_MAX_WIDTH;
}
