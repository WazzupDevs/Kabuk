import { View } from 'react-native';

import { Round } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

// The top of another person's profile where it has no page to show (not visible, or a failed read):
// a round back button on the left. The profile itself is `OtherProfile` (the cover page of
// ProfilBaskasi, MekanProfil); no head, no buddy peeking behind the photo any more.
export function ProfileTopBar({ onBack, onMore }: { onBack: () => void; onMore?: () => void }) {
  return (
    <View
      style={{
        height: KIT.size.btnRow,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Round glassy icon="back" label={tr.common.back} onPress={onBack} testID="profile-back" />
      {onMore ? (
        <Round glassy icon="moreV" label={tr.profile.more} onPress={onMore} testID="profile-more" />
      ) : null}
    </View>
  );
}
