import { checkinIdentity } from '@shared/venueChat.ts';
import { useQuery } from '@tanstack/react-query';

import { useSessionStore } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

export const activeTableQueryKey = (userId: string | undefined) => ['activeTable', userId] as const;

// The user's check-in, if any (RLS: own rows only): the person at the venue, with the identity it
// shows (docs/SPEC_V4.md §4.D, §4.E). A check-in has no table, alias or headcount.
export function useActiveTable() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: activeTableQueryKey(userId),
    enabled: userId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_sessions')
        .select(
          'id, created_at, expires_at, venue_id, spot_id, identity_mode, identity_switches, venue:venues(name), spot:venue_spots(name)',
        )
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data && { ...data, identity: checkinIdentity(data) };
    },
  });
}
