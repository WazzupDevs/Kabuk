import { LEGAL_ENTITY } from '@shared/legalEntity.ts';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Linking, View } from 'react-native';

import { T } from '@/aura/kit';
import { Wordmark } from '@/components/Wordmark';
import { useProfile } from '@/features/account/useProfile';
import { useSessionStore } from '@/features/auth/session';
import {
  Group,
  InfoRow,
  Note,
  NOTES,
  SettingsPage,
  SettingsPageRow,
} from '@/features/settings/SettingsParts';
import { useSignOutConfirm } from '@/features/settings/signOutConfirm';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { SETTINGS } from '@/theme/settings';

// The address in the legal texts (legalEntity.ts) unless the build names another: the row is always
// there (App Store 1.2 and Google Play want a way to reach the developer in the app).
const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() || LEGAL_ENTITY.contactEmail;

// "+905321234501" → "+90 5•• ••• •• 01": the country, the first digit and the last two.
function maskPhone(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 12) return '';
  return `+${digits.slice(0, 2)} ${digits[2]}•• ••• •• ${digits.slice(-2)}`;
}

// Hesap (yeni arayüz tuvali, AyarHesap, AyarHesapSil): the phone number, masked, and the birth date,
// locked; what cannot be changed here; İletişim; Çıkış yap and Hesabımı sil in the soft red (asks
// first, says what goes); the wordmark, the version and the map data's credit at the foot.
const F = SETTINGS.foot;
// A blank that keeps a line's height (not words: nothing to translate).
const NBSP = ' ';

export default function AccountScreen() {
  const phone = useSessionStore((s) => s.session?.user.phone);
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const birthDate = view.data?.birthDate ?? null;
  const signOut = useSignOutConfirm();
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      await callAccount({ action: 'delete' });
      // The server session is gone: only the local state is cleared.
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
    },
  });
  // Hesabımı sil asks first in the centred confirmation (yeni arayüz tuvali, AyarHesapSil): the
  // soft red disc, what goes, the red action. A failed try leaves it open with its error.
  const askDelete = () => {
    remove.reset();
    confirm({
      title: tr.settings.deleteConfirmTitle,
      note: tr.settings.deleteBody,
      tone: 'danger',
      confirmLabel: tr.settings.deleteAccount,
      confirmIcon: 'trash',
      cancelLabel: tr.common.cancel,
      testID: 'account-delete-confirm',
      icon: 'trash',
      settings: true,
      onConfirm: async () => {
        await remove.mutateAsync();
      },
    });
  };
  return (
    <SettingsPage title={tr.settings.accountTitle}>
      <View>
        <Group>
          <InfoRow icon="phone" label={tr.settings.phoneLabel} value={maskPhone(phone)} />
          {/* Always there (the board); its value once the profile is read, the row's height kept. */}
          <InfoRow
            icon="calendar"
            label={tr.settings.birthDate}
            value={birthDate ? tr.settings.birthDateValue(birthDate) : NBSP}
          />

        </Group>
        <View style={NOTES}>
          <Note>{tr.settings.fixedNote}</Note>
        </View>
        <View style={{ marginTop: SETTINGS.groupTop }}>
          <SettingsPageRow
            icon="chat"
            label={tr.settings.contact}
            onPress={() => void Linking.openURL(`mailto:${contactEmail}`)}
          />
        </View>
        {/* In the soft red, as in Ayarlar (the owner's report, 10 Kasım). */}
        <View style={{ marginTop: SETTINGS.groupTop }}>
          <Group>
            <SettingsPageRow
              danger
              icon="logout"
              testID="account-sign-out"
              label={tr.settings.signOut}
              onPress={signOut.ask}
            />
            <SettingsPageRow
              danger
              icon="trash"
              testID="account-delete"
              label={tr.settings.deleteAccount}
              onPress={askDelete}
            />
          </Group>
        </View>
        <View style={{ alignItems: 'center', gap: F.gap, marginTop: F.top }}>
          <Wordmark height={F.mark} />
          <T v="settingsFoot" center>
            {tr.settings.version(Constants.expoConfig?.version ?? '')}
          </T>
          <T v="settingsFoot" center>
            {tr.settings.osm}
          </T>
        </View>
      </View>
    </SettingsPage>
  );
}
