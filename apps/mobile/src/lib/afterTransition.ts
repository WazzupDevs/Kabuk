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

// After the slide the rest comes in steps of MORE_ROWS, each in its own frame (MORE_MS apart), so
// no single frame puts every row on the screen (the owner's video, 29 Ekim: a DM's remaining rows
// stalled it for a quarter second right after it slid in). Returns how many rows to draw;
// Infinity once all of them are (later rows, new or older, come at once).
const MORE_ROWS = 10;
const MORE_MS = 50;

export function useOpenRows(total: number): number {
  const settled = useAfterTransition();
  const [limit, setLimit] = useState(() => (settled ? Infinity : FIRST_ROWS));
  useEffect(() => {
    // Rows that load after the slide come in the same steps.
    if (!settled || limit === Infinity || total === 0) return undefined;
    const timer = setTimeout(
      () => setLimit((l) => (l >= total ? Infinity : l + MORE_ROWS)),
      limit >= total ? 0 : MORE_MS,
    );
    return () => clearTimeout(timer);
  }, [settled, limit, total]);
  return limit;
}

// A chat's newest rows (its end): `limit` of them (useOpenRows).
export function lastRows<T>(rows: readonly T[], limit: number): readonly T[] {
  return rows.length <= limit ? rows : rows.slice(-limit);
}

// A list's first rows (its top): `limit` of them (useOpenRows).
export function firstRows<T>(rows: readonly T[], limit: number): readonly T[] {
  return rows.length <= limit ? rows : rows.slice(0, limit);
}
