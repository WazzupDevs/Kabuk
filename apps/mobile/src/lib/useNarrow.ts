import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

import { isNarrow } from './narrow';

// The visual gate lays a state out narrower than the window (states.json → genislik, GateState):
// it says how wide, so the narrow rule reads the frame and not the phone. Null in the app.
export const FrameWidth = createContext<number | null>(null);

// The screen's narrow state (src/lib/narrow.ts), again when the window or the text size changes.
export function useNarrow(): boolean {
  const { width, fontScale } = useWindowDimensions();
  const frame = useContext(FrameWidth);
  return isNarrow(frame ?? width, fontScale);
}
