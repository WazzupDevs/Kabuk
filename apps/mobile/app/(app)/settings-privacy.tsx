import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { RowList, T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/features/settings/SettingsRow';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { PAGE_KANKI } from '@/theme/kankiMotion';

const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL;

// Gizlilik (skall tuvali, Gizlilik; Aura v71): the pages of who the account blocked and muted
// (no counts, karar 3), the capsule characters, what the anonymous name keeps, then the texts; a
// riso buddy in the corner.
export default function PrivacyScreen() {
  return (
    <Screen
      backdrop={<RisoKanki place={PAGE_KANKI.privacy} scale={1} />}
      top={<PageTop title={tr.settings.privacyTitle} />}
    >
      <View style={{ gap: KIT.size.rowGap }}>
        <RowList inset={KIT.size.lrIcon + KIT.size.liGap}>
          <SettingsRow
            icon="block"
            chevron
            testID="privacy-blocked"
            label={tr.settings.blocked}
            onPress={() => router.push('/settings-blocked')}
          />
          <SettingsRow
            icon="mute"
            chevron
            label={tr.settings.muted}
            onPress={() => router.push('/settings-muted')}
          />
          <SettingsRow
            icon="user"
            chevron
            label={tr.settings.capsules}
            onPress={() => router.push('/profile/capsules')}
          />
        </RowList>
        <T v="fine">{tr.settings.nickPrivacy}</T>
        <RowList inset={KIT.size.lrIcon + KIT.size.liGap}>
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.privacy}
            onPress={() =>
              privacyUrl
                ? void Linking.openURL(privacyUrl)
                : router.push({ pathname: '/legal/[doc]', params: { doc: 'kvkk' } })
            }
          />
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.kvkk}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'kvkk' } })}
          />
          <SettingsRow
            icon="doc"
            chevron
            label={tr.settings.terms}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}
          />
        </RowList>
      </View>
    </Screen>
  );
}
