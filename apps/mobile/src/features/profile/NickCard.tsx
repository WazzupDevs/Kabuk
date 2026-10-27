import { useMutation, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { SPACING } from '@/theme/tokens';

import { profileViewKeys } from './queries';

const DAY_MS = 24 * 60 * 60 * 1000;

// The anonymous nick on the own profile (docs/SPEC_V4.md §4.D, K-9; skall tuvali ProfilNickYenile,
// ProfilNickBekle, ProfilNickYenilendi): the nick, what it is, and "Nick'i yenile" once in 30 days;
// while it waits the button is off and the days left are under it. Only on the own profile (K-49).
export function NickCard({
  nick,
  refreshAt,
  title,
}: {
  nick: string;
  refreshAt: string | null;
  // In Ayarlar (the owner's call, 27 Ekim): a soft card under its own title, like its neighbours.
  title?: string;
}) {
  const queryClient = useQueryClient();
  const now = useNow(60_000);
  const waitMs = refreshAt ? Date.parse(refreshAt) - now : 0;
  const waiting = waitMs > 0;
  const refresh = useMutation({
    meta: FEEL_ERROR,
    mutationFn: profileApi.refreshNick,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
  });
  return (
    <Card testID="nick-card" tone={title ? 'note' : 'card'}>
      <View style={{ gap: title ? SPACING[2.5] : SPACING[3] }}>
        <View className="gap-0.5">
          {title ? (
            <Text variant="caption" tone="muted" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          <Text variant="heading" testID="nick">
            {nick}
          </Text>
          <Text variant="fine">{waiting ? tr.profile.nickNoteWait : tr.profile.nickNote}</Text>
        </View>
        <Button
          variant="secondary"
          icon="refresh"
          testID="nick-refresh"
          label={tr.profile.nickRefresh}
          disabled={waiting}
          loading={refresh.isPending}
          onPress={() => refresh.mutate()}
        />
        {waiting ? (
          <Text variant="fine">{tr.profile.nickWait(Math.ceil(waitMs / DAY_MS))}</Text>
        ) : null}
        {refresh.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(refresh.error)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
