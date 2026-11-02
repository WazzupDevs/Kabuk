import { View } from 'react-native';

import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { BlockedList } from '@/features/chat/BlockedList';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { PAGE_KANKI } from '@/theme/kankiMotion';

// Engellenenler (skall tuvali, Engellenenler, EngellenenlerBos).
export default function BlockedScreen() {
  return (
    <Screen
      list
      backdrop={<RisoKanki place={PAGE_KANKI.blocked} scale={1} />}
      top={<PageTop title={tr.settings.blocked} />}
    >
      <View style={{ gap: KIT.size.rowGap }}>
        <T v="fine">{tr.settings.blockedNote}</T>
        <BlockedList />
      </View>
    </Screen>
  );
}
