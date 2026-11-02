import { useMutation, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Btn, Glass, T } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
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
  // U33 (Ayarlar `.card`): the sheet's card, 16 inside; a fine label, the nick h3, a fine note; the
  // button 12 under them and 8 over the days left. Waiting, the button is off (U10).
  return (
    <Glass sm testID="nick-card" style={{ padding: SPACING[4], gap: SPACING[0.5] }}>
      {title ? (
        <T v="fine" accessibilityRole="header">
          {title}
        </T>
      ) : null}
      <T v="h3" testID="nick" style={{ marginVertical: SPACING[0.5] }}>
        {nick}
      </T>
      <T v="fine">{waiting ? tr.profile.nickNoteWait : tr.profile.nickNote}</T>
      <View style={{ marginTop: SPACING[3], marginBottom: SPACING[2] }}>
        <Btn
          block
          variant="glassy"
          icon="refresh"
          testID="nick-refresh"
          label={tr.profile.nickRefresh}
          disabled={waiting}
          loading={refresh.isPending}
          onPress={() => refresh.mutate()}
        />
      </View>
      {waiting ? <T v="fine">{tr.profile.nickWait(Math.ceil(waitMs / DAY_MS))}</T> : null}
      {refresh.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(refresh.error)}
        </T>
      ) : null}
    </Glass>
  );
}
