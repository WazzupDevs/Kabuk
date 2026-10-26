import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking, View } from 'react-native';

import { Card } from '@/components/Card';
import { Menu, MenuItem } from '@/components/Menu';
import { SectionTitle } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { BlockedList } from '@/features/chat/BlockedList';
import { DesignPicker } from '@/features/design/DesignPicker';
import { designPickerEnabled } from '@/theme/ThemeProvider';
import { AppearanceSetting } from '@/features/profile/AppearanceSetting';
import { ProfileSettings } from '@/features/profile/ProfileSettings';
import { useProfileView } from '@/features/profile/queries';
import { useProfile } from '@/features/account/useProfile';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';
import { unregisterPush } from '@/features/push/push';
import { callAccount } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// Hosted texts and contact come from the environment (store listings need both); without a
// privacy URL the in-app draft texts are shown.
const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL;
const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL;

async function signOutLocally() {
  // After deletion the server session no longer exists, so only local state is cleared.
  await supabase.auth.signOut({ scope: 'local' });
  queryClient.clear();
}

export default function SettingsScreen() {
  // The own birth date comes only from profile/get (the column is closed to the client).
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const birthDate = view.data?.birthDate ?? null;
  const signOut = useMutation({
    mutationFn: async () => {
      await unregisterPush();
      await supabase.auth.signOut();
      queryClient.clear();
    },
  });
  const deleteAccount = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      await callAccount({ action: 'delete' });
      await signOutLocally();
    },
  });

  function confirmDelete() {
    Alert.alert(tr.settings.deleteConfirmTitle, tr.settings.deleteConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      {
        text: tr.settings.deleteConfirm,
        style: 'destructive',
        onPress: () => deleteAccount.mutate(),
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader title={tr.settings.title} onBack={() => router.back()} />
      <View className="mt-4">
        <AppearanceSetting />
      </View>
      {designPickerEnabled ? (
        <View className="mb-4 mt-8">
          <DesignPicker />
        </View>
      ) : null}
      {birthDate ? (
        <View className="mt-4 gap-3">
          <SectionTitle title={tr.settings.accountSection} />
          <Card>
            <View className="gap-0.5">
              <Text variant="label" tone="muted">
                {tr.settings.birthDate}
              </Text>
              <Text variant="heading">{tr.settings.birthDateValue(birthDate)}</Text>
            </View>
          </Card>
          <Text variant="fine">{tr.settings.birthDateHint}</Text>
        </View>
      ) : null}
      <View className="mt-4">
        <ProfileSettings />
      </View>
      <View className="mt-8">
        <BlockedList />
      </View>
      <View className="mt-8 gap-3">
        <SectionTitle title={tr.settings.legalSection} />
        <Menu>
          <MenuItem
            icon="shield-checkmark-outline"
            label={tr.settings.privacy}
            onPress={() =>
              privacyUrl
                ? void Linking.openURL(privacyUrl)
                : router.push({ pathname: '/legal/[doc]', params: { doc: 'kvkk' } })
            }
          />
          <MenuItem
            icon="document-text-outline"
            label={tr.settings.terms}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}
          />
          {contactEmail ? (
            <MenuItem
              icon="mail-outline"
              label={tr.settings.contact}
              onPress={() => void Linking.openURL(`mailto:${contactEmail}`)}
            />
          ) : null}
        </Menu>
      </View>
      <View className="mt-auto gap-3 pt-8">
        {deleteAccount.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(deleteAccount.error)}
          </Text>
        ) : null}
        {/* skall tuvali (Hesap): sign-out and deletion as menu rows, deletion red. */}
        <Menu>
          <MenuItem
            icon="log-out-outline"
            testID="settings-sign-out"
            label={tr.settings.signOut}
            onPress={() => signOut.mutate()}
            loading={signOut.isPending}
          />
          <MenuItem
            negative
            icon="trash-outline"
            label={tr.settings.deleteAccount}
            onPress={confirmDelete}
            loading={deleteAccount.isPending}
          />
        </Menu>
        <View className="items-center gap-2">
          <Wordmark height={SPACING[5]} />
          <Text variant="fine" align="center">
            {tr.settings.version(Constants.expoConfig?.version ?? '')}
          </Text>
        </View>
        <Text variant="fine" align="center">
          {tr.settings.osm}
        </Text>
      </View>
    </Screen>
  );
}
