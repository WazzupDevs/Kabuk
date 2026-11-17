import { View } from 'react-native';

import { BlockedList } from '@/features/chat/BlockedList';
import { Lede, SettingsPage } from '@/features/settings/SettingsParts';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// Engellenenler (yeni arayüz tuvali, Engellenenler, EngellenenlerBos): its line, then each block with
// "Engeli kaldır" on the ground.
export default function BlockedScreen() {
  return (
    <SettingsPage list title={tr.settings.blocked}>
      <Lede>{tr.settings.blockedNote}</Lede>
      <View style={{ marginTop: SPACING[3] }}>
        <BlockedList />
      </View>
    </SettingsPage>
  );
}
