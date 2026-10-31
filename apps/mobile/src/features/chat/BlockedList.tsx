import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Av, Btn, Li, RowList, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { safetyApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const blocksKey = ['blocks'] as const;

// The blocks the account made (RLS: own rows), newest first, by their own id; the blocked
// account's id never reaches the app (rule 4).
export function useBlocks() {
  return useQuery({
    queryKey: blocksKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('id, blocked_alias, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Engellenenler (skall tuvali, Engellenenler, EngellenenlerBos): each block with "Engeli kaldır".
export function BlockedList() {
  const queryClient = useQueryClient();
  const blocks = useBlocks();
  const unblock = useMutation({
    mutationFn: safetyApi.unblock,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: blocksKey }),
  });
  const now = useNow(60000);
  if (blocks.isPending) return <Loader />;
  if (blocks.isError) {
    return (
      <EmptyState
        kind="error"
        body={errorMessage(blocks.error)}
        action={{ label: tr.common.retry, onPress: () => void blocks.refetch() }}
      />
    );
  }
  if (blocks.data.length === 0) {
    return <EmptyState kind="empty" body={tr.safety.blockedEmpty} />;
  }
  return (
    <RowList>
      {blocks.data.map((b) => (
        <Li key={b.id}>
          <Av size="row" name={b.blocked_alias} />
          <View style={{ flex: 1 }}>
            <T v="h3" ink>
              {b.blocked_alias}
            </T>
            <T v="fine">{tr.common.ago(b.created_at, now)}</T>
          </View>
          <Btn
            sm
            variant="glassy"
            label={tr.safety.unblock}
            onPress={() => unblock.mutate(b.id)}
            loading={unblock.isPending && unblock.variables === b.id}
            disabled={unblock.isPending}
          />
        </Li>
      ))}
    </RowList>
  );
}
