import { focusManager, MutationCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { haptic } from './haptics';

// A failed action is felt (hareket.md: "İşlem başarısız"); its screen shows the error.
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: () => haptic('failed') }),
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
