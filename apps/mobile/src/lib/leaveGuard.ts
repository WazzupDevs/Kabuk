import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { create } from 'zustand';

// What asks before the open screen is left, while it has changes. Only the tab bar reads it: a press
// on the tab already open went back to its first screen and the changes went without a word (audit
// PRO-1); the back key and the header's back ask on their own.
export const useLeaveGuard = create<{ ask: (() => void) | null }>(() => ({ ask: null }));

// The screen's question while `dirty` and focused.
export function useAskBeforeLeaving(dirty: boolean, ask: () => void): void {
  useFocusEffect(
    useCallback(() => {
      if (!dirty) return undefined;
      useLeaveGuard.setState({ ask });
      return () => {
        if (useLeaveGuard.getState().ask === ask) useLeaveGuard.setState({ ask: null });
      };
    }, [dirty, ask]),
  );
}
