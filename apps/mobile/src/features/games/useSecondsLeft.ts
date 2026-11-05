import { useEffect, useState } from 'react';

// The whole seconds left, again at each second's turn.
export function useSecondsLeft(endsAt: number): number {
  const read = () => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const [left, setLeft] = useState(read);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(now);
      if (now > 0) timer = setTimeout(tick, ((endsAt - Date.now()) % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, [endsAt]);
  return left;
}
