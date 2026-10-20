import { useQuery } from '@tanstack/react-query';

import { friendKeys } from '@/features/friends/queries';
import { supabase } from '@/lib/supabase';

// As many as the play history reads (usePlayHistory), so every record it shows can find its game.
const RESULTS = 100;

// The caller's own game results (RLS: own rows only) for Aktiviteler → Geçmiş's chips
// (pure/activities.ts → historyResult). Nothing about the other side.
export function useGameResults() {
  return useQuery({
    queryKey: [...friendKeys.history, 'results'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_results')
        .select('room_id, concept, won, completed_at')
        .order('completed_at', { ascending: false })
        .limit(RESULTS);
      if (error) throw error;
      return data;
    },
  });
}
