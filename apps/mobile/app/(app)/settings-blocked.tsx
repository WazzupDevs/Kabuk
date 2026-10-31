import { View } from 'react-native';

import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { T } from '@/aura/kit';
import { BlockedList } from '@/features/chat/BlockedList';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

// Engellenenler (skall tuvali, Engellenenler, EngellenenlerBos).
export default function BlockedScreen() {
  return (
    <Screen list>
      <PageTop title={tr.settings.blocked} />
      <View style={{ gap: KIT.size.rowGap }}>
        <T v="note">{tr.settings.blockedNote}</T>
        <BlockedList />
      </View>
    </Screen>
  );
}
