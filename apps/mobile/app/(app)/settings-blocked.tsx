import { BlockedList } from '@/features/chat/BlockedList';
import { Lede, SettingsPage } from '@/features/settings/SettingsParts';
import { tr } from '@/i18n/tr';

// Engellenenler (yeni arayüz tuvali, Engellenenler, EngellenenlerBos): its line, then each block with
// "Engeli kaldır" on the ground; without any, the empty state in the page's middle.
export default function BlockedScreen() {
  return (
    <SettingsPage list title={tr.settings.blocked}>
      <Lede>{tr.settings.blockedNote}</Lede>
      <BlockedList style={{ flexGrow: 1 }} />
    </SettingsPage>
  );
}
