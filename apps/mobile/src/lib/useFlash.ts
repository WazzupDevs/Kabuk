import { useEffect, useState } from 'react';

// A short note that goes by itself (a mute, a delete): flash(text) shows it for `ms`.
export function useFlash(ms = 2600): [string | null, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (text === null) return undefined;
    const timer = setTimeout(() => setText(null), ms);
    return () => clearTimeout(timer);
  }, [text, ms]);
  return [text, setText];
}
