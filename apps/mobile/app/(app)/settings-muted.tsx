import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Av, Btn } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import {
  Group,
  Lede,
  PERSON_HAIR,
  PersonRow,
  SettingsPage,
} from '@/features/settings/SettingsParts';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { View } from 'react-native';

const MUTES_KEY = ['venueChatMutes'] as const;

// Sessize alınanlar (yeni arayüz tuvali, SessizAlinanlar, SessizAlinanlarBos; docs/SPEC_V4.md §4.D): the venue chat
// identities the account muted, each with "Sesi aç". The muted person never learns of it. An
// anonymous one shows its capsule and nick (docs/decisions/aura-v71-eklenen.md, karar 1).
export default function MutedScreen() {
  const queryClient = useQueryClient();
  const mutes = useQuery({ queryKey: MUTES_KEY, queryFn: () => venueChatApi.mutes() });
  const unmute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.unmute(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MUTES_KEY });
      // Opened from a chat's ⋮ menu: the chat under it shows the person's messages again.
      void queryClient.invalidateQueries({ queryKey: ['venueChat'] });
      void queryClient.invalidateQueries({ queryKey: ['district', 'chat'] });
    },
  });
  const now = useNow(60000);
  const list = mutes.data?.mutes ?? [];
  return (
    <SettingsPage list title={tr.settings.muted}>
      <Lede>{tr.settings.mutedNote}</Lede>
      <View style={{ marginTop: SPACING[3] }}>
        {mutes.isPending ? (
          <Loader />
        ) : mutes.isError ? (
          <EmptyState
            kind="error"
            body={errorMessage(mutes.error)}
            error={mutes.error}
            action={{ label: tr.common.retry, onPress: () => void mutes.refetch() }}
          />
        ) : list.length === 0 ? (
          <EmptyState
            kind="empty"
            riso="muted"
            title={tr.settings.mutedEmptyTitle}
            body={tr.settings.mutedEmptyBody}
          />
        ) : (
          <Group hairIn={PERSON_HAIR}>
            {list.map((m) => (
              <PersonRow
                key={m.id}
                face={
                  m.look ? (
                    <LookAvatar look={m.look} size={KIT.size.av.md} />
                  ) : (
                    <Av size="md" name={m.label} />
                  )
                }
                name={m.label}
                line={`${m.profiled ? tr.settings.mutedProfiled : tr.settings.mutedAnonymous} ${tr.common.separator} ${tr.common.ago(m.createdAt, now)}`}
                action={
                  <Btn
                    sm
                    variant="glassy"
                    label={tr.venueChat.unmute}
                    loading={unmute.isPending && unmute.variables === m.id}
                    disabled={unmute.isPending}
                    onPress={() => unmute.mutate(m.id)}
                  />
                }
              />
            ))}
          </Group>
        )}
      </View>
    </SettingsPage>
  );
}
