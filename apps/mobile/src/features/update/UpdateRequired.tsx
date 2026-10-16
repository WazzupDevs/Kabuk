import { Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { tr } from '@/i18n/tr';
import { appBuild, updateUrl } from '@/lib/appBuild';
import { SPACING } from '@/theme/tokens';

// Full screen, in place of everything else, once the server refuses this build.
export function UpdateRequired() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-3">
        <View className="items-center gap-3 py-8">
          <View className="mb-3">
            <Wordmark height={SPACING[8]} />
          </View>
          <Text variant="heading" align="center">
            {tr.update.title}
          </Text>
          <Text tone="muted" align="center">
            {tr.update.body}
          </Text>
        </View>
        <Button label={tr.update.action} onPress={() => void Linking.openURL(updateUrl())} />
        {appBuild ? (
          <Text variant="fine" align="center">
            {tr.update.build(appBuild)}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
