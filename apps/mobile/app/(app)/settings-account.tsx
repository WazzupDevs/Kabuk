import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Btn, Glass, RowList, T, useKit } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Wordmark } from '@/components/Wordmark';
import { useProfile } from '@/features/account/useProfile';
import { useSessionStore } from '@/features/auth/session';
import { signOutOfApp } from '@/features/auth/signOut';
import { SettingsRow } from '@/features/settings/SettingsRow';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { KIT } from '@/theme/auraKit';
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
  const { c } = useKit();
  const phone = useSessionStore((s) => s.session?.user.phone);
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const birthDate = view.data?.birthDate ?? null;
  const [deleting, setDeleting] = useState(false);
  const signOut = useMutation({ mutationFn: signOutOfApp });
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
      <View style={{ gap: KIT.size.rowGap }}>
        <Glass pad="pad" style={{ gap: KIT.size.rowGap }}>
          <View>
            <T v="fine">{tr.settings.phoneLabel}</T>
            <T v="h3" ink>
              {maskPhone(phone)}
            </T>
          </View>
          {birthDate ? (
            <View>
              <T v="fine">{tr.settings.birthDate}</T>
              <T v="h3" ink>
                {tr.settings.birthDateValue(birthDate)}
              </T>
            </View>
          ) : null}
        </Glass>
        <T v="note">{tr.settings.fixedNote}</T>
        <RowList inset={KIT.size.icon + KIT.size.liGap}>
          {contactEmail ? (
            <SettingsRow
              icon="chat"
              chevron
              label={tr.settings.contact}
              onPress={() => void Linking.openURL(`mailto:${contactEmail}`)}
            />
          ) : null}
          <SettingsRow
            icon="logout"
            label={tr.settings.signOut}
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
          <SettingsRow
            negative
            icon="trash"
            testID="account-delete"
            label={tr.settings.deleteAccount}
            onPress={() => setDeleting(true)}
          />
        </RowList>
        <View style={{ alignItems: 'center', gap: SPACING[2], marginTop: SPACING[6] }}>
          <Wordmark height={SPACING[5]} />
          <T v="fine" center>
            {tr.settings.version(Constants.expoConfig?.version ?? '')}
          </T>
          <T v="fine" center>
            {tr.settings.osm}
          </T>
        </View>
      </View>
      <Sheet
        visible={deleting}
        onClose={() => setDeleting(false)}
        title={tr.settings.deleteConfirmTitle}
        footer={
          <View style={{ gap: KIT.size.rowGap }}>
            <Btn
              block
              tall
              variant="danger"
              icon="trash"
              testID="account-delete-confirm"
              label={tr.settings.deleteAccount}
              loading={remove.isPending}
              onPress={() => remove.mutate()}
            />
            <Btn
              block
              tall
              variant="glassy"
              label={tr.common.cancel}
              onPress={() => setDeleting(false)}
            />
          </View>
        }
      >
        <T v="note">{tr.settings.deleteBody}</T>
        <T v="note">{tr.settings.deleteBackups}</T>
        {remove.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(remove.error)}
          </T>
        ) : null}
      </Sheet>
    </Screen>
  );
}
