import { useCallback, useRef } from 'react';

// A second press this soon after the first is the same press (audit UI-4: a quick double tap on a
// row opened its screen twice).
const SAME_PRESS_MS = 700;

export function useSinglePress(onPress: (() => void) | undefined): (() => void) | undefined {
  const last = useRef(0);
  const handler = useCallback(() => {
    const now = Date.now();
    if (now - last.current < SAME_PRESS_MS) return;
    last.current = now;
    onPress?.();
  }, [onPress]);
  return onPress ? handler : undefined;
}
