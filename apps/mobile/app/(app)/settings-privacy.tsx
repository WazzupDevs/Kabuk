import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { RowList, T } from '@/aura/kit';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { useBlocks } from '@/features/chat/BlockedList';
import { SettingsRow } from '@/features/settings/SettingsRow';
import { tr } from '@/i18n/tr';
import { venueChatApi } from '@/lib/api';
import { KIT } from '@/theme/auraKit';

const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL;

// Gizlilik (skall tuvali, Gizlilik): who the account blocked and muted, what the anonymous name
// keeps, the capsule characters, then the texts.
export default function PrivacyScreen() {
  const blocks = useBlocks();
  const mutes = useQuery({ queryKey: ['venueChatMutes'], queryFn: () => venueChatApi.mutes() });
  return (
    <Screen>
      <PageTop title={tr.settings.privacyTitle} />
      <View style={{ gap: KIT.size.rowGap }}>
        <RowList inset={KIT.size.icon + KIT.size.liGap}>
          <SettingsRow
            icon="block"
            chevron
            count={blocks.data?.length}
            testID="privacy-blocked"
            label={tr.settings.blocked}
            onPress={() => router.push('/settings-blocked')}
          />
          <SettingsRow
            icon="mute"
            chevron
            count={mutes.data?.mutes.length}
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
        <T v="note">{tr.settings.nickPrivacy}</T>
        <RowList inset={KIT.size.icon + KIT.size.liGap}>
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
