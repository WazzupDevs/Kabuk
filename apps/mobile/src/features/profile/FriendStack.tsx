import type { Friend } from '@shared/api/friends.ts';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// How many friends' photos the profile's "Arkadaşlar" shows (v45: .pf-mini, the first two).
const SHOWN = 2;

// The first friends' photos on the profile's "Arkadaşlar", overlapping, each in a ring of the
// button's fill. The button says the count to screen readers; the photos are not read.
export function FriendStack({ friends }: { friends: readonly Friend[] }) {
  const { colors, shape } = useTheme();
  return (
    <View className="flex-row" importantForAccessibility="no-hide-descendants">
      {friends.slice(0, SHOWN).map((f, i) => (
        <View
          key={f.publicId}
          style={{
            marginLeft: i === 0 ? 0 : -SPACING[2],
            borderWidth: SPACING[0.5],
            borderColor: colors.raised,
            borderRadius: shape.radius.pill,
          }}
        >
          <Avatar
            kind="profile"
            size="xs"
            name={f.displayName ?? tr.profile.noName}
            photoUrl={f.photoUrl}
          />
        </View>
      ))}
    </View>
  );
}
