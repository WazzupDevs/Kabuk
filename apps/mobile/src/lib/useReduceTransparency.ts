import { AccessibilityInfo } from 'react-native';
import { create } from 'zustand';

// The system's "reduce transparency" setting (docs/design/iskelet.md → 6.6), kept up to date by one
// listener for the whole app, as useReduceMotion. On, glass surfaces and glass buttons draw an
// opaque, toned fill instead of a translucent one and no frost. iOS only: Android has no such
// setting and answers false.
const useStore = create<{ reduce: boolean }>(() => ({ reduce: false }));
let listening = false;

function listen() {
  if (listening) return;
  listening = true;
  void AccessibilityInfo.isReduceTransparencyEnabled()
    .then((reduce) => useStore.setState({ reduce }))
    .catch(() => undefined);
  AccessibilityInfo.addEventListener('reduceTransparencyChanged', (reduce) =>
    useStore.setState({ reduce }),
  );
}

export function useReduceTransparency(): boolean {
  listen();
  return useStore((s) => s.reduce);
}
