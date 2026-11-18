import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Av, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { safetyApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import {
  Group,
  listArea,
  Note,
  NOTES,
  PERSON_HAIR,
  PersonButton,
  PersonRow,
} from '@/features/settings/SettingsParts';

const blocksKey = ['blocks'] as const;

// The blocks the account made (RLS: own rows), newest first, by their own id; the blocked
// account's id never reaches the app (rule 4).
function useBlocks() {
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

// Engellenenler (yeni arayüz tuvali, Engellenenler, EngellenenlerBos): each block with "Engeli
// kaldır"; without any, the empty state centred in the page. `style`: the screen's part that grows
// (Screen → fills), so the empty state has the page's room.
export function BlockedList({ style }: { style: { flexGrow: number } }) {
  const { c } = useKit();
  const queryClient = useQueryClient();
  const blocks = useBlocks();
  const unblock = useMutation({
    meta: FEEL_ERROR,
    mutationFn: safetyApi.unblock,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: blocksKey }),
  });
  const now = useNow(60000);
  const rows = blocks.data ?? [];
  return (
    <View style={[style, listArea(!blocks.isSuccess || rows.length === 0)]}>
      {blocks.isPending ? (
        <EmptyState kind="loading" body={tr.common.loading} />
      ) : blocks.isError ? (
        <EmptyState
          kind="error"
          body={errorMessage(blocks.error)}
          error={blocks.error}
          action={{ label: tr.common.retry, onPress: () => void blocks.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          kind="empty"
          settings
          riso="blocked"
          title={tr.settings.blockedEmptyTitle}
          body={tr.settings.blockedEmptyBody}
        />
      ) : (
        <Group hairIn={PERSON_HAIR}>
          {rows.map((b) => (
            <PersonRow
              key={b.id}
              face={<Av size="md" name={b.blocked_alias} />}
              name={b.blocked_alias}
              // The board says "Profilli" or "Anonim adı" here; a block does not keep which, so
              // the day it was made.
              line={tr.common.ago(b.created_at, now)}
              action={
                <PersonButton
                  label={tr.safety.unblock}
                  onPress={() => unblock.mutate(b.id)}
                  loading={unblock.isPending && unblock.variables === b.id}
                  disabled={unblock.isPending}
                />
              }
            />
          ))}
        </Group>
      )}
      {unblock.isError ? (
        <View style={NOTES}>
          <Note color={c.warn}>{errorMessage(unblock.error)}</Note>
        </View>
      ) : null}
    </View>
  );
}
