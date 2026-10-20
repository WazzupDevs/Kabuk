import { useQuery } from '@tanstack/react-query';

import { useSessionStore } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

export const activeTableQueryKey = (userId: string | undefined) => ['activeTable', userId] as const;

// The user's check-in, if any (RLS: own rows only). From step 4.5 a check-in has no alias or
// headcount (docs/SPEC_V4.md §4.E); today's screens read them until the app's 4.5b, so they get
// stand-ins here.
export function useActiveTable() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: activeTableQueryKey(userId),
    enabled: userId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_sessions')
        .select(
          'id, alias, alias_rerolls, headcount, created_at, expires_at, venue_id, spot_id, venue:venues(name), spot:venue_spots(name)',
        )
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data && { ...data, alias: data.alias ?? '', headcount: data.headcount ?? 1 };
    },
  });
}
