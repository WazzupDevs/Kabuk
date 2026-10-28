import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

// A pushed screen opens light and fills in once it has slid in (the owner's video, 28 Ekim: a DM
// started sliding 0.3 s after the tap, drawing every message first). Until its slide ends a screen
// draws only what the first screenful needs; the rest comes right after. A stack's first screen
// does not slide in: it is whole at once.
export const FIRST_ROWS = 20;
// The slide's end, should the event not come (no animation, reduced motion).
const FALLBACK_MS = 600;

type TransitionEvents = {
  addListener: (event: 'transitionEnd', listener: () => void) => () => void;
};

export function useAfterTransition(): boolean {
  const navigation = useNavigation();
  const [settled, setSettled] = useState(() => (navigation.getState()?.index ?? 0) === 0);
  useEffect(() => {
    if (settled) return undefined;
    const off = (navigation as unknown as TransitionEvents).addListener('transitionEnd', () =>
      setSettled(true),
    );
    const timer = setTimeout(() => setSettled(true), FALLBACK_MS);
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [settled, navigation]);
  return settled;
}

// A chat's newest rows (its end) while the screen slides in; all of them after.
export function lastRows<T>(rows: readonly T[], settled: boolean): readonly T[] {
  return settled || rows.length <= FIRST_ROWS ? rows : rows.slice(-FIRST_ROWS);
}

// A list's first rows (its top) while the screen slides in; all of them after.
export function firstRows<T>(rows: readonly T[], settled: boolean): readonly T[] {
  return settled || rows.length <= FIRST_ROWS ? rows : rows.slice(0, FIRST_ROWS);
}
