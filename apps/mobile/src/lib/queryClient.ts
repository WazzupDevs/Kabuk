import { focusManager, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { noteFailure, noteSuccess } from './connection';
import { haptic, stoppedTyping } from './haptics';
import { feelingMutationCache } from './mutationHaptics';

declare module '@tanstack/react-query' {
  interface Register {
    // `feelError`: a failed press is felt (hapticMoments.ts → FEEL_ERROR).
    mutationMeta: { feelError?: boolean };
  }
}

export const QUERY_STALE_MS = 20_000;

const mutationCache = feelingMutationCache(haptic, stoppedTyping);
// Every answer and every request that could not go tell the connection banner (lib/connection.ts).
mutationCache.subscribe((event) => {
  if (event.type !== 'updated') return;
  if (event.action.type === 'error') noteFailure(event.action.error);
  if (event.action.type === 'success') noteSuccess();
});

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: noteFailure, onSuccess: noteSuccess }),
  mutationCache,
  // A read stays fresh for a while: coming back to the foreground or online, mounting a screen
  // again, re-reads only what is older than this. Realtime and presses invalidate (which ignores
  // staleTime); the table, the check-in and the inbox ask for 'always' on focus themselves.
  defaultOptions: { queries: { staleTime: QUERY_STALE_MS } },
});

// React Native has no window focus: without this, queries never refetch when the app comes back to
// the foreground, and a Realtime event missed in the background (Realtime never replays) leaves
// a screen stale until the app restarts.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (state) =>
    setFocused(state === 'active'),
  );
  return () => subscription.remove();
});
