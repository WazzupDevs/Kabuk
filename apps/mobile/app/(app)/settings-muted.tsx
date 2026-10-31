import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Av, Btn, Li, RowList, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

const MUTES_KEY = ['venueChatMutes'] as const;

// Sessize alınanlar (skall tuvali, SessizeAlinanlar; docs/SPEC_V4.md §4.D): the venue chat
// identities the account muted, each with "Sesi aç". The muted person never learns of it.
export default function MutedScreen() {
  const queryClient = useQueryClient();
  const mutes = useQuery({ queryKey: MUTES_KEY, queryFn: () => venueChatApi.mutes() });
  const unmute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.unmute(id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: MUTES_KEY }),
  });
  const now = useNow(60000);
  const list = mutes.data?.mutes ?? [];
  return (
    <Screen list>
      <PageTop title={tr.settings.muted} />
      <View style={{ gap: KIT.size.rowGap }}>
        <T v="note">{tr.settings.mutedNote}</T>
        {mutes.isPending ? (
          <Loader />
        ) : mutes.isError ? (
          <EmptyState
            kind="error"
            body={errorMessage(mutes.error)}
            action={{ label: tr.common.retry, onPress: () => void mutes.refetch() }}
          />
        ) : list.length === 0 ? (
          <EmptyState kind="empty" body={tr.settings.mutedEmpty} />
        ) : (
          <RowList>
            {list.map((m) => (
              <Li key={m.id}>
                <Av size="row" name={m.label} />
                <View style={{ flex: 1 }}>
                  <T v="h3" ink>
                    {m.label}
                  </T>
                  <T v="fine">
                    {`${m.profiled ? tr.settings.mutedProfiled : tr.settings.mutedAnonymous} ${tr.common.separator} ${tr.common.ago(m.createdAt, now)}`}
                  </T>
                </View>
                <Btn
                  sm
                  variant="glassy"
                  label={tr.venueChat.unmute}
                  loading={unmute.isPending && unmute.variables === m.id}
                  disabled={unmute.isPending}
                  onPress={() => unmute.mutate(m.id)}
                />
              </Li>
            ))}
          </RowList>
        )}
      </View>
    </Screen>
  );
}
