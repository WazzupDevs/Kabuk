import { useWindowDimensions } from 'react-native';

import { isNarrow } from './narrow';

// The screen's narrow state (src/lib/narrow.ts), again when the window or the text size changes.
export function useNarrow(): boolean {
  const { width, fontScale } = useWindowDimensions();
  return isNarrow(width, fontScale);
}
