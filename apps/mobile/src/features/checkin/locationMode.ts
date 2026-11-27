import { useQuery } from '@tanstack/react-query';

import { callLocationMode } from '@/lib/api';

// Whether the server skips the location check (CHECKIN_SKIP_LOCATION, dev project only). On the
// pilot, or when the question fails, false: the app warns and the server refuses as before.
// `enabled` false (a venue checked in to without a position): the question is not asked.
export function useSkipLocation(enabled = true): boolean {
  const query = useQuery({
    queryKey: ['checkinLocationMode'],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => (await callLocationMode()).skipLocation,
  });
  return enabled && query.data === true;
}
