import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Menu, MenuItem } from '@/components/Menu';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useProfile } from '@/features/account/useProfile';
import { useSessionStore } from '@/features/auth/session';
import { useProfileView } from '@/features/profile/queries';
import { unregisterPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { SPACING } from '@/theme/tokens';

const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL;

// "+905321234501" → "+90 5•• ••• •• 01": the country, the first digit and the last two.
function maskPhone(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 12) return '';
  return `+${digits.slice(0, 2)} ${digits[2]}•• ••• •• ${digits.slice(-2)}`;
}

// Hesap (skall tuvali, Hesap, HesapSil): the phone number, masked; what cannot be changed here;
// İletişim, Çıkış yap and Hesabımı sil (asks first, says what goes and when the backups follow).
export default function AccountScreen() {
  const phone = useSessionStore((s) => s.session?.user.phone);
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const birthDate = view.data?.birthDate ?? null;
  const [deleting, setDeleting] = useState(false);
  const signOut = useMutation({
    mutationFn: async () => {
      await unregisterPush();
      await supabase.auth.signOut();
      queryClient.clear();
    },
  });
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      await callAccount({ action: 'delete' });
      // The server session is gone: only the local state is cleared.
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
    },
  });
  return (
    <Screen>
      <PageTop title={tr.settings.accountTitle} />
      <View className="gap-3">
        <Card>
          <View className="gap-3">
            <View className="gap-0.5">
              <Text variant="fine">{tr.settings.phoneLabel}</Text>
              <Text variant="heading" tabular>
                {maskPhone(phone)}
              </Text>
            </View>
            {birthDate ? (
              <View className="gap-0.5">
                <Text variant="fine">{tr.settings.birthDate}</Text>
                <Text variant="heading" tabular>
                  {tr.settings.birthDateValue(birthDate)}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
        <Text variant="fine">{tr.settings.fixedNote}</Text>
        <Menu>
          {contactEmail ? (
            <MenuItem
              icon="chatbubble-outline"
              chevron
              label={tr.settings.contact}
              onPress={() => void Linking.openURL(`mailto:${contactEmail}`)}
            />
          ) : null}
          <MenuItem
            icon="log-out-outline"
            label={tr.settings.signOut}
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
          <MenuItem
            negative
            icon="trash-outline"
            testID="account-delete"
            label={tr.settings.deleteAccount}
            onPress={() => setDeleting(true)}
          />
        </Menu>
        <View className="items-center gap-2" style={{ marginTop: SPACING[6] }}>
          <Wordmark height={SPACING[5]} />
          <Text variant="fine" align="center">
            {tr.settings.version(Constants.expoConfig?.version ?? '')}
          </Text>
          <Text variant="fine" align="center">
            {tr.settings.osm}
          </Text>
        </View>
      </View>
      <Sheet
        visible={deleting}
        onClose={() => setDeleting(false)}
        title={tr.settings.deleteConfirmTitle}
      >
        <Text variant="fine">{tr.settings.deleteBody}</Text>
        <Text variant="fine">{tr.settings.deleteBackups}</Text>
        {remove.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(remove.error)}
          </Text>
        ) : null}
        <Button
          size="lg"
          variant="danger"
          icon="trash-outline"
          testID="account-delete-confirm"
          label={tr.settings.deleteAccount}
          loading={remove.isPending}
          onPress={() => remove.mutate()}
        />
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.cancel}
          onPress={() => setDeleting(false)}
        />
      </Sheet>
    </Screen>
  );
}
