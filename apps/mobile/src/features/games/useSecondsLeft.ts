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

// Whether the time is up (the same moment `useSecondsLeft` reaches 0): it changes once, so a
// screen that only asks this is not drawn again every second
// (docs/perf/akicilik-denetimi.md → A-25).
export function useTimeUp(endsAt: number): boolean {
  const [passed, setPassed] = useState<number | null>(() => (Date.now() >= endsAt ? endsAt : null));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const ms = endsAt - Date.now();
      if (ms <= 0) setPassed(endsAt);
      else timer = setTimeout(tick, ms + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, [endsAt]);
  return passed === endsAt;
}
