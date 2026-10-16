import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const revealDecisionKey = (roomId: string) => ['revealDecision', roomId] as const;

// This phone's own "Tanışalım mı?" answer, the only one it can read (docs/SPEC_V3.md §22.F): null
// before it answers. Read by the prompt and by the venue's table card (`roomId` null: not read).
export function useRevealDecision(roomId: string | null) {
  return useQuery({
    queryKey: revealDecisionKey(roomId ?? ''),
    enabled: roomId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reveal_decisions')
        .select('wants_meet')
        .eq('room_id', roomId ?? '')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
