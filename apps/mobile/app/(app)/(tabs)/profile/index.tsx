import { Ionicons } from '@expo/vector-icons';
import { BADGES } from '@shared/badges.ts';
import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { IconButton, SlidersGlyph } from '@/components/IconButton';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { NotificationsBell } from '@/features/notifications/Bell';
import { FriendStack } from '@/features/profile/FriendStack';
import { Badges, ProfileHead } from '@/features/profile/ProfileCard';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, NARROW_SCREEN } from '@/theme/tokens';

// The own profile (docs/SPEC_V2.md §5; v45: .prof, self). The photo, the name and the bio change on
// the edit screen; settings open only from the round sliders button (top right), beside the bell
// (every tab root keeps it until step 4.7). The badges stay under the head (today's data; v45 has
// none on the profile).
export default function ProfileScreen() {
  const { colors } = useTheme();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);
  // Half a row is too narrow for "Profili düzenle" under 360 dp (times the font scale): "Düzenle",
  // the full name still read out.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);

  const hasName = !!own.data?.display_name;
  const friendCount = friends.data?.length;
  const someFriends = friends.data && friends.data.length > 0 ? friends.data : null;

  return (
    <Screen>
      <ScreenHeader
        title={tr.tabs.profile}
        trailing={
          <View className="flex-row items-center gap-2">
            <NotificationsBell />
            <IconButton
              round
              icon="options-outline"
              glyph={<SlidersGlyph />}
              label={tr.settings.title}
              onPress={() => router.push('/profile/settings')}
            />
          </View>
        }
      />

      {view.isPending || loading ? (
        <View className="mt-16">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : view.isError || !view.data ? (
        <EmptyState
          icon="cloud-offline-outline"
          body={errorMessage(view.error)}
          action={{
            label: tr.common.retry,
            onPress: () => void view.refetch(),
            loading: view.isRefetching,
          }}
        />
      ) : (
        <View className="mt-2 gap-4">
          <ProfileHead profile={view.data}>
            {/* v45: .pbtns, two quiet capsules in v45's 14 px (the small size, so "Profili düzenle"
                fits half a row from 360 dp; "Düzenle" below); "Arkadaşlar" with the first friends'
                photos. */}
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Button
                  variant="neutral"
                  size="sm"
                  icon="people-outline"
                  leading={someFriends ? <FriendStack friends={someFriends} /> : undefined}
                  label={tr.profile.friends}
                  testID="profile-friends"
                  accessibilityLabel={
                    friendCount !== undefined ? tr.profile.friendsCount(friendCount) : undefined
                  }
                  onPress={() => router.push('/profile/friends')}
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="neutral"
                  size="sm"
                  icon={hasName ? 'create-outline' : 'add'}
                  label={
                    hasName ? (narrow ? tr.profile.editShort : tr.profile.edit) : tr.profile.addName
                  }
                  accessibilityLabel={hasName ? tr.profile.edit : undefined}
                  onPress={() => router.push('/profile/edit')}
                />
              </View>
            </View>
          </ProfileHead>
          {view.data.photoHidden ? (
            <Card tone="note">
              <View className="flex-row items-start gap-2">
                <Ionicons name="eye-off-outline" size={ICON.md} color={colors.text} />
                <Text variant="fine" tone="text" className="flex-1">
                  {tr.profile.photoHidden}
                </Text>
              </View>
            </Card>
          ) : null}
          <View className="mt-2 flex-row items-baseline justify-between">
            <Text variant="heading" accessibilityRole="header">
              {tr.profile.badgesTitle}
            </Text>
            <Text variant="fine">
              {tr.profile.badgeCount(view.data.badges.length, BADGES.length)}
            </Text>
          </View>
          <Badges badges={view.data.badges} all />
        </View>
      )}
    </Screen>
  );
}
