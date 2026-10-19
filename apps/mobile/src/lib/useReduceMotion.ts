import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { create } from 'zustand';

// The system's "reduce motion" setting, kept up to date by one listener for the whole app.
// Animations jump to their end state when on. The listener answers a moment after the first frame;
// until then the setting as the app started (Reanimated reads it at once), so the first frame
// already knows (the first screen's words: docs/decisions/4.3-ilk-ekran-yazilari.md).
const useStore = create<{ reduce: boolean | null }>(() => ({ reduce: null }));
let listening = false;

function listen() {
  if (listening) return;
  listening = true;
  void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => useStore.setState({ reduce }));
  AccessibilityInfo.addEventListener('reduceMotionChanged', (reduce) =>
    useStore.setState({ reduce }),
  );
}

export function useReduceMotion(): boolean {
  listen();
  const atLaunch = useReducedMotion();
  return useStore((s) => s.reduce) ?? atLaunch;
}
