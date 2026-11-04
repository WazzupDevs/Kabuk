import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

// The screen stays on while a game runs at the table (docs/SPEC_V3.md §19.2a, "Ekranı açık
// tutma"; the owner's call, 4 Kasım): whether this phone shows the game or went back to the table.
// A phone without the native module does nothing.
const TAG = 'skall-game';

export function useGameAwake(on: boolean): void {
  useEffect(() => {
    if (!on) return;
    activateKeepAwakeAsync(TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(TAG).catch(() => undefined);
    };
  }, [on]);
}
