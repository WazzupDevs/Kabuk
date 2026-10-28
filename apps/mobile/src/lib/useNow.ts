import { useEffect, useRef, useState } from 'react';

// The time now, read again every `intervalMs`. Each read renders the caller again, so a screen
// that needs the clock only now and then passes `active` (performance audit, 28 Ekim: Mekan's
// lobby drew its whole list once a second, all the time, for a countdown that runs only while a
// request waits). Stopped, it keeps the last time it read; started again, it reads at once.
export function useNow(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  const stopped = useRef(!active);
  useEffect(() => {
    if (!active) {
      stopped.current = true;
      return undefined;
    }
    const first = stopped.current ? setTimeout(() => setNow(Date.now()), 0) : undefined;
    stopped.current = false;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs, active]);
  return now;
}

// The time now while a deadline (ISO) is ahead, read every `intervalMs`; once it has passed, the
// deadline itself and no more reads. Nothing to wait for (null): no reads. For the 60 second
// windows of a join request, on both sides.
export function useNowUntil(until: string | null, intervalMs: number): number {
  const [ended, setEnded] = useState<string | null>(null);
  const passed = until !== null && ended === until;
  const now = useNow(intervalMs, until !== null && !passed);
  useEffect(() => {
    if (until === null) return undefined;
    const timer = setTimeout(() => setEnded(until), Math.max(0, Date.parse(until) - Date.now()));
    return () => clearTimeout(timer);
  }, [until]);
  return passed ? Date.parse(until) : now;
}
