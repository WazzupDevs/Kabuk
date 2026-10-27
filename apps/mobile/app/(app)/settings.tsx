import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Menu, MenuItem } from '@/components/Menu';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { DesignPicker } from '@/features/design/DesignPicker';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import { NickCard } from '@/features/profile/NickCard';
import { useProfileView } from '@/features/profile/queries';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { unregisterPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { queryClient as appQueryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { designPickerEnabled } from '@/theme/ThemeProvider';

type Participation = 'profile' | 'anonymous';

// Ayarlar (skall tuvali, ProfilAyarlar): a sheet over Profil with "Oyunlara katılım" (the identity
// each check-in starts with, §4.D), Görünüm, then the pages (Bildirim ayarları, Gizlilik, Hesap) and
// "Çıkış yap"; "Tamam" closes it.
export default function SettingsScreen() {
  return (
    <RouteSheet title={tr.settings.title} testID="settings">
      <Body />
    </RouteSheet>
  );
}

function Body() {
  const close = useCloseSheet();
  const queryClient = useQueryClient();
  const own = useProfile();
  const photo = useOwnPhoto();
  const identity = useActiveTable().data?.identity.mode;
  // The anonymous nick, renewed here (the owner's call, 27 Ekim: moved from the profile).
  const view = useProfileView(own.data?.public_id);
  const nick = view.data?.capsuleNick ?? null;
  const value: Participation =
    own.data?.default_participation === 'profile' ? 'profile' : 'anonymous';
  const participation = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (next: Participation) => profileApi.update({ defaultParticipation: next }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  const shown = participation.isPending ? participation.variables : value;
  const signOut = useMutation({
    mutationFn: async () => {
      await unregisterPush();
      await supabase.auth.signOut();
      appQueryClient.clear();
    },
  });
  const open = (path: Parameters<typeof router.push>[0]) => router.push(path);

  return (
    <>
      <Card tone="note">
        <View className="gap-2.5">
          <View>
            <Text variant="heading" accessibilityRole="header">
              {tr.settings.participation.title}
            </Text>
            <Text variant="fine">{tr.settings.participation.sub}</Text>
          </View>
          <Segmented<Participation>
            fill
            onSoft
            accessibilityLabel={tr.settings.participation.title}
            value={shown}
            onChange={(next) => next !== value && participation.mutate(next)}
            options={[
              {
                value: 'profile',
                label: tr.settings.participation.profile,
                testID: 'participation-profile',
              },
              {
                value: 'anonymous',
                label: tr.settings.participation.anonymous,
                testID: 'participation-anonymous',
              },
            ]}
          />
          {shown === 'profile' && photo.known && !photo.has ? (
            <Text variant="fine" tone="danger">
              {tr.settings.participation.photoNeeded}
            </Text>
          ) : identity ? (
            <Text variant="fine">
              {identity === 'profiled'
                ? tr.settings.participation.nowProfiled
                : tr.settings.participation.nowAnonymous}
            </Text>
          ) : null}
          {participation.isError ? (
            <Text variant="fine" tone="danger">
              {errorMessage(participation.error)}
            </Text>
          ) : null}
        </View>
      </Card>
      {nick ? (
        <NickCard
          nick={nick}
          refreshAt={view.data?.nickRefreshAt ?? null}
          title={tr.settings.nickTitle}
        />
      ) : null}
      <AppearanceSetting />
      {designPickerEnabled ? <DesignPicker /> : null}
      <Menu>
        <MenuItem
          icon="notifications-outline"
          chevron
          testID="settings-notifications"
          label={tr.settings.notificationSettings}
          onPress={() => open('/settings-notifications')}
        />
        <MenuItem
          icon="shield-outline"
          chevron
          testID="settings-privacy"
          label={tr.settings.privacyTitle}
          onPress={() => open('/settings-privacy')}
        />
        <MenuItem
          icon="person-outline"
          chevron
          testID="settings-account"
          label={tr.settings.accountTitle}
          onPress={() => open('/settings-account')}
        />
        <MenuItem
          negative
          icon="log-out-outline"
          testID="settings-sign-out"
          label={tr.settings.signOut}
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </Menu>
      <Button size="lg" variant="neutral" label={tr.settings.done} onPress={close} />
    </>
  );
}
