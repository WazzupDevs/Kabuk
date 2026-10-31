import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Li, RowList, Seg, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { useProfile } from '@/features/account/useProfile';
import { patchProfile } from '@/features/account/patchProfile';
import { signOutOfApp } from '@/features/auth/signOut';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { DesignPicker } from '@/features/design/DesignPicker';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import { NickCard } from '@/features/profile/NickCard';
import { useProfileView } from '@/features/profile/queries';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { designPickerEnabled } from '@/theme/ThemeProvider';

type Participation = 'profile' | 'anonymous';

// Ayarlar (skall tuvali, ProfilAyarlar): a sheet over Profil with "Oyunlara katılım" (the identity
// each check-in starts with, §4.D), Görünüm, then the pages (Bildirim ayarları, Gizlilik, Hesap) and
// "Çıkış yap"; "Tamam" closes it.
export default function SettingsScreen() {
  return (
    <RouteSheet title={tr.settings.title} testID="settings" footer={<Done />}>
      <Body />
    </RouteSheet>
  );
}

// "Tamam" at the sheet's foot; the content above it scrolls.
function Done() {
  const close = useCloseSheet();
  return <Btn tall block variant="glassy" label={tr.settings.done} onPress={close} />;
}

function Body() {
  const { c } = useKit();
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
    onMutate: (next) => patchProfile(queryClient, { default_participation: next }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  const shown = value;
  const signOut = useMutation({ mutationFn: signOutOfApp });
  const open = (path: Parameters<typeof router.push>[0]) => router.push(path);

  return (
    <>
      <View style={{ gap: KIT.size.rowGap }}>
        <View>
          <T v="sec" accessibilityRole="header">
            {tr.settings.participation.title}
          </T>
          <T v="fine">{tr.settings.participation.sub}</T>
        </View>
        <Seg<Participation>
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
          <T v="fine" color={c.warn}>
            {tr.settings.participation.photoNeeded}
          </T>
        ) : identity ? (
          <T v="fine">
            {identity === 'profiled'
              ? tr.settings.participation.nowProfiled
              : tr.settings.participation.nowAnonymous}
          </T>
        ) : null}
        {participation.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(participation.error)}
          </T>
        ) : null}
      </View>
      {nick ? (
        <NickCard
          nick={nick}
          refreshAt={view.data?.nickRefreshAt ?? null}
          title={tr.settings.nickTitle}
        />
      ) : null}
      <AppearanceSetting />
      {designPickerEnabled ? <DesignPicker /> : null}
      <RowList inset={KIT.size.iconSm + KIT.size.liGap}>
        <Li
          testID="settings-notifications"
          onPress={() => open('/settings-notifications')}
          accessibilityLabel={tr.settings.notificationSettings}
        >
          <CapIcon name="bell" color={c.ink} size={KIT.size.iconSm} />
          <View style={{ flex: 1 }}>
            <T v="sec">{tr.settings.notificationSettings}</T>
          </View>
          <CapIcon name="forward" color={c.muted} size={KIT.size.iconSm} />
        </Li>
        <Li
          testID="settings-privacy"
          onPress={() => open('/settings-privacy')}
          accessibilityLabel={tr.settings.privacyTitle}
        >
          <CapIcon name="shield" color={c.ink} size={KIT.size.iconSm} />
          <View style={{ flex: 1 }}>
            <T v="sec">{tr.settings.privacyTitle}</T>
          </View>
          <CapIcon name="forward" color={c.muted} size={KIT.size.iconSm} />
        </Li>
        <Li
          testID="settings-account"
          onPress={() => open('/settings-account')}
          accessibilityLabel={tr.settings.accountTitle}
        >
          <CapIcon name="user" color={c.ink} size={KIT.size.iconSm} />
          <View style={{ flex: 1 }}>
            <T v="sec">{tr.settings.accountTitle}</T>
          </View>
          <CapIcon name="forward" color={c.muted} size={KIT.size.iconSm} />
        </Li>
        <Li
          testID="settings-sign-out"
          onPress={() => (signOut.isPending ? undefined : signOut.mutate())}
          accessibilityLabel={tr.settings.signOut}
        >
          <CapIcon name="logout" color={c.warn} size={KIT.size.iconSm} />
          <View style={{ flex: 1 }}>
            <T v="sec" color={c.warn}>
              {tr.settings.signOut}
            </T>
          </View>
          {signOut.isPending ? <Loader size={KIT.size.iconSm} delay={0} /> : null}
        </Li>
      </RowList>
    </>
  );
}
