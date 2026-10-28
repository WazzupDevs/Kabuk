import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// Whether the screen is seen: focused, with the app in the foreground. `onSeen` runs each time it
// becomes so (the first focus included); the returned check tells whether it is now. A DM marks
// what arrives read only while it is seen (audit CHAT-2: a DM left open behind the home screen
// read everything that came in).
export function useSeen(onSeen: () => void): () => boolean {
  const seen = useRef(false);
  const latest = useRef(onSeen);
  useEffect(() => {
    latest.current = onSeen;
  });
  useFocusEffect(
    useCallback(() => {
      const update = (state: string) => {
        const now = state === 'active';
        if (now && !seen.current) latest.current();
        seen.current = now;
      };
      update(AppState.currentState);
      const sub = AppState.addEventListener('change', update);
      return () => {
        sub.remove();
        seen.current = false;
      };
    }, []),
  );
  return useCallback(() => seen.current, []);
}
