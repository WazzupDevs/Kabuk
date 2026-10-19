import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

// A step's button opens the next step once: a quick second tap before the new screen is up would
// open it twice (CLAUDE.md → Ekran davranışı). The button shows it is on its way; coming back to
// the step frees it again.
export function useGoOnce(): { go: (open: () => void) => void; going: boolean } {
  const leaving = useRef(false);
  const [going, setGoing] = useState(false);
  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
      setGoing(false);
    }, []),
  );
  const go = useCallback((open: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    setGoing(true);
    open();
  }, []);
  return { go, going };
}
