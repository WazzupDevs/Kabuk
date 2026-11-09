import { firstAdvanceDelay, nextAdvanceDelay } from '@shared/advanceClock.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { roomKeys } from '@/features/rooms/queries';

// The server's clock (@shared/advanceClock.ts): when the phase's time (`endsAt`) is up this phone
// asks the server to move it on (`advance`, idempotent; its failure is not felt), then again while
// the phase stays, each a little later at random so the table's phones do not ask together. A new
// step or time starts it over; no `endsAt` stops it.
export function useAdvanceClock(
  roomId: string,
  endsAt: string | null | undefined,
  step: unknown,
  advance: () => Promise<unknown>,
): void {
  const queryClient = useQueryClient();
  const ask = useRef(advance);
  useEffect(() => {
    ask.current = advance;
  });
  useEffect(() => {
    if (!endsAt) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const go = () => {
      void ask
        .current()
        .catch(() => undefined)
        .finally(() => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }));
      if (!stopped) timer = setTimeout(go, nextAdvanceDelay(Math.random()));
    };
    timer = setTimeout(go, firstAdvanceDelay(endsAt, Date.now(), Math.random()));
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [roomId, endsAt, step, queryClient]);
}
