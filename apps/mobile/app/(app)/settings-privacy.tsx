import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Menu, MenuItem } from '@/components/Menu';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useBlocks } from '@/features/chat/BlockedList';
import { tr } from '@/i18n/tr';
import { venueChatApi } from '@/lib/api';

const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL;

// Gizlilik (skall tuvali, Gizlilik): who the account blocked and muted, what the anonymous name
// keeps, the capsule characters, then the texts.
export default function PrivacyScreen() {
  const blocks = useBlocks();
  const mutes = useQuery({ queryKey: ['venueChatMutes'], queryFn: () => venueChatApi.mutes() });
  return (
    <Screen>
      <PageTop title={tr.settings.privacyTitle} />
      <View className="gap-3">
        <Menu>
          <MenuItem
            icon="ban-outline"
            chevron
            count={blocks.data?.length}
            testID="privacy-blocked"
            label={tr.settings.blocked}
            onPress={() => router.push('/settings-blocked')}
          />
          <MenuItem
            icon="volume-mute-outline"
            chevron
            count={mutes.data?.mutes.length}
            label={tr.settings.muted}
            onPress={() => router.push('/settings-muted')}
          />
          <MenuItem
            icon="happy-outline"
            chevron
            label={tr.settings.capsules}
            onPress={() => router.push('/profile/capsules')}
          />
        </Menu>
        <Text variant="fine">{tr.settings.nickPrivacy}</Text>
        <Menu>
          <MenuItem
            icon="document-text-outline"
            chevron
            label={tr.settings.privacy}
            onPress={() =>
              privacyUrl
                ? void Linking.openURL(privacyUrl)
                : router.push({ pathname: '/legal/[doc]', params: { doc: 'kvkk' } })
            }
          />
          <MenuItem
            icon="document-text-outline"
            chevron
            label={tr.settings.kvkk}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'kvkk' } })}
          />
          <MenuItem
            icon="document-text-outline"
            chevron
            label={tr.settings.terms}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}
          />
        </Menu>
      </View>
    </Screen>
  );
}
