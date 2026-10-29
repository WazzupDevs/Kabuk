import type { Friend } from '@shared/api/friends.ts';
import { View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { openDm } from './openDm';

// A friend's profile (skall tuvali, ProfilBaskasi): "Arkadaşsınız" beside "Mesaj".
export function FriendActions({ friend }: { friend: Friend }) {
  const { colors, shape } = useTheme();
  const threadId = friend.threadId;
  return (
    <View className="flex-row" style={{ gap: SPACING[2] }}>
      <View
        className="flex-1 flex-row items-center justify-center"
        style={{
          gap: SPACING[1.5],
          minHeight: TOUCH.min,
          borderRadius: shape.radius.pill,
          backgroundColor: colors.surface2,
        }}
      >
        <AppIcon name="checkmark" size={ICON.sm} color={colors.onSuccessSoft} />
        <Text variant="label" color={colors.onSuccessSoft}>
          {tr.profile.friendsStatus}
        </Text>
      </View>
      {threadId ? (
        <View className="flex-1">
          <Button
            icon="chevron-forward"
            label={tr.friends.messageShort}
            onPress={() =>
              openDm({ threadId, publicId: friend.publicId, name: friend.displayName })
            }
          />
        </View>
      ) : null}
    </View>
  );
}
