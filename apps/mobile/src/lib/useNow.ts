import { useEffect, useRef, useState } from 'react';

import { AFTER_ARRIVAL_MS, useTabActivity } from './tabActivity';

// The time now, read again every `intervalMs`. Each read renders the caller again, so a screen
// that needs the clock only now and then passes `active` (performance audit, 28 Ekim: Mekan's
// lobby drew its whole list once a second, all the time, for a countdown that runs only while a
// request waits). Stopped, it keeps the last time it read; started again, it reads at once.
// In a tab out of sight (lib/tabActivity.ts, B6) its reads are skipped; when the tab comes back it
// reads once after the tab's arrival, if it skipped one.
export function useNow(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  const stopped = useRef(!active);
  const tab = useTabActivity();
  useEffect(() => {
    if (!active) {
      stopped.current = true;
      return undefined;
    }
    const first = stopped.current ? setTimeout(() => setNow(Date.now()), 0) : undefined;
    stopped.current = false;
    let missed = false;
    let catchUp: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      if (tab && !tab.active()) {
        missed = true;
        return;
      }
      setNow(Date.now());
    }, intervalMs);
    const offResume = tab?.onResume(() => {
      if (!missed) return;
      missed = false;
      clearTimeout(catchUp);
      catchUp = setTimeout(() => setNow(Date.now()), AFTER_ARRIVAL_MS);
    });
    return () => {
      clearTimeout(first);
      clearTimeout(catchUp);
      clearInterval(timer);
      offResume?.();
    };
  }, [intervalMs, active, tab]);
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
