import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListCard } from '@/components/ListCard';
import { ListRow } from '@/components/ListRow';
import { Loader } from '@/components/Loader';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { SPACING } from '@/theme/tokens';

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
    <Screen>
      <PageTop title={tr.settings.muted} />
      <View className="gap-3">
        <Text variant="fine">{tr.settings.mutedNote}</Text>
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
          <ListCard>
            {list.map((m) => (
              <ListRow
                key={m.id}
                inset
                leading={
                  m.profiled ? (
                    <Avatar kind="profile" name={m.label} size="xl" />
                  ) : (
                    <Avatar kind="default" size="xl" />
                  )
                }
                title={m.label}
                meta={`${m.profiled ? tr.settings.mutedProfiled : tr.settings.mutedAnonymous} ${tr.common.separator} ${tr.common.ago(m.createdAt, now)}`}
                trailing={
                  <View style={{ width: SPACING[16] + SPACING[10] + SPACING[1] }}>
                    <Button
                      size="sm"
                      tight
                      variant="neutral"
                      label={tr.venueChat.unmute}
                      loading={unmute.isPending && unmute.variables === m.id}
                      disabled={unmute.isPending}
                      onPress={() => unmute.mutate(m.id)}
                    />
                  </View>
                }
              />
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}
