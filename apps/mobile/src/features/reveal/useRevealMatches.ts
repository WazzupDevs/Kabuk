import type { RevealMatch } from '@shared/api/reveal.ts';
import { BROADCAST, sessionChannel } from '@shared/rooms.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useBroadcast } from '@/features/rooms/useBroadcast';
import { revealApi } from '@/lib/api';

export const revealKeys = { matches: (roomId: string) => ['revealMatches', roomId] as const };

// While the window runs and no answer has said who is left, a missed broadcast shows within this.
const POLL_MS = 10_000;

// This phone's matches (docs/SPEC_V3.md §22.F): read when the window opens, on each reveal_match
// broadcast on its own session channel (a new match, no data) and again once the window ends. A
// match's profile comes only in the answers inside the window, so the first one seen is kept.
export function useRevealMatches(roomId: string, sessionId: string) {
  const queryClient = useQueryClient();
  const refetch = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: revealKeys.matches(roomId) }),
    [queryClient, roomId],
  );
  useBroadcast(sessionChannel(sessionId), BROADCAST.revealMatch, refetch);
  const query = useQuery({
    queryKey: revealKeys.matches(roomId),
    queryFn: () => revealApi.matches(roomId),
    refetchInterval: (q) => (q.state.data?.unmatched != null ? false : POLL_MS),
  });

  // Adjusted while rendering: a profile once seen stays for the screen's life.
  const [profiles, setProfiles] = useState<Readonly<Record<string, RevealMatch['profile']>>>({});
  const fresh = (query.data?.matches ?? []).filter((m) => m.profile && !profiles[m.sessionId]);
  if (fresh.length > 0) {
    setProfiles((p) => ({
      ...p,
      ...Object.fromEntries(fresh.map((m) => [m.sessionId, m.profile])),
    }));
  }
  const matches = (query.data?.matches ?? []).map((m) => ({
    ...m,
    profile: m.profile ?? profiles[m.sessionId] ?? null,
  }));
  return {
    color: query.data?.color ?? null,
    matches,
    // Null until reveal_ends_at: the window's end is the only time the rest is told (rule 5).
    unmatched: query.data?.unmatched ?? null,
    // A phone that was not in the window (not_in_room) has nothing to show either.
    settled: query.isSuccess || query.isError,
    refetch,
  };
}
