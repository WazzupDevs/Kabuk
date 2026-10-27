import { useEffect, useState } from 'react';

// A screen's slide in (react-native-screens, about 350 ms): the heavy part of a screen is drawn
// after it, so the slide keeps its frames.
const SLIDE_MS = 360;

export function useAfterSlide(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), SLIDE_MS);
    return () => clearTimeout(timer);
  }, []);
  return ready;
}
