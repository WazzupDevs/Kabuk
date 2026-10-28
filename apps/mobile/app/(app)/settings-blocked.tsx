import { View } from 'react-native';

import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { BlockedList } from '@/features/chat/BlockedList';
import { tr } from '@/i18n/tr';

// Engellenenler (skall tuvali, Engellenenler, EngellenenlerBos).
export default function BlockedScreen() {
  return (
    <Screen list>
      <PageTop title={tr.settings.blocked} />
      <View className="gap-3">
        <Text variant="fine">{tr.settings.blockedNote}</Text>
        <BlockedList />
      </View>
    </Screen>
  );
}
