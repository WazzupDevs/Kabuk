import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Av, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { LookAvatar } from '@/components/LookAvatar';
import {
  Group,
  Lede,
  listArea,
  Note,
  NOTES,
  PERSON_HAIR,
  PersonButton,
  PersonRow,
  SettingsPage,
} from '@/features/settings/SettingsParts';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

const MUTES_KEY = ['venueChatMutes'] as const;

// Sessize alınanlar (yeni arayüz tuvali, SessizAlinanlar, SessizAlinanlarBos; docs/SPEC_V4.md
// §4.D): the venue chat identities the account muted, each with which it is ("Anonim adı",
// "Profilli") and "Sesi aç"; without any, the empty state in the page's middle. The muted person
// never learns of it. An anonymous one shows its capsule and nick
// (docs/decisions/aura-v71-eklenen.md, karar 1).
export default function MutedScreen() {
  const { c } = useKit();
  const queryClient = useQueryClient();
  const mutes = useQuery({ queryKey: MUTES_KEY, queryFn: () => venueChatApi.mutes() });
  const unmute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.unmute(id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: MUTES_KEY }),
  });
  const list = mutes.data?.mutes ?? [];
  return (
    <SettingsPage list title={tr.settings.muted}>
      <Lede>{tr.settings.mutedNote}</Lede>
      <View style={listArea(!mutes.isSuccess || list.length === 0)}>
        {mutes.isPending ? (
          <EmptyState kind="loading" body={tr.common.loading} />
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
            settings
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
                line={m.profiled ? tr.settings.mutedProfiled : tr.settings.mutedAnonymous}
                action={
                  <PersonButton
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
        {unmute.isError ? (
          <View style={NOTES}>
            <Note color={c.warn}>{errorMessage(unmute.error)}</Note>
          </View>
        ) : null}
      </View>
    </SettingsPage>
  );
}
