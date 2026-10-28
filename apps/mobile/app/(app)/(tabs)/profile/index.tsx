import { router } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { CanvasBar } from '@/components/CanvasIcon';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { IconButton, SlidersGlyph } from '@/components/IconButton';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { FriendStack } from '@/features/profile/FriendStack';
import { ProfileHead } from '@/features/profile/ProfileCard';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, NARROW_SCREEN } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

// The own profile (docs/SPEC_V2.md §5; v45: .prof, self). The photo, the name and the bio change on
// the edit screen; settings open only from the round sliders button (top right), beside the bell
// (every tab root keeps it until step 4.7); its knobs slide as it opens. No badges (the owner's
// call, 27 Ekim); the nick is renewed in Ayarlar.
export default function ProfileScreen() {
  // The check-in's identity: the face the table sees is ringed (skall tuvali, ProfilAnonim).
  const anonymous = useActiveTable().data?.identity.mode === 'anonymous';
  const { colors } = useTheme();
  const [slide, setSlide] = useState(0);
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
    <Screen refreshable>
      <ScreenHeader
        title={tr.tabs.profile}
        trailing={
          <IconButton
            round
            icon="options-outline"
            glyph={<SlidersGlyph go={slide} />}
            label={tr.settings.title}
            onPress={() => {
              setSlide((n) => n + 1);
              router.push('/settings');
            }}
          />
        }
      />

      {view.isPending || loading ? (
        <View className="mt-16">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : !view.data ? (
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
          <ProfileHead
            profile={view.data}
            capsule={view.data.capsuleLook}
            anonymous={anonymous}
            onEditCapsule={() => router.push('/profile/capsule')}
          >
            {anonymous && view.data.capsuleNick ? (
              <Text variant="fine" align="center" className="mb-2">
                {tr.profile.seenAsLead} <Text variant="label">{view.data.capsuleNick}</Text>{' '}
                {tr.profile.seenAs}
              </Text>
            ) : null}
            {/* v45: .pbtns, two quiet capsules in v45's 14 px (the small size, so "Profili düzenle"
                fits half a row from 360 dp; "Düzenle" below); "Arkadaşlar" with the first friends'
                photos. */}
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Button
                  variant="secondary"
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
                  variant="secondary"
                  leading={<CanvasBar name={hasName ? 'edit' : 'add'} size={ICON.md} />}
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
                <AppIcon name="eye-off-outline" size={ICON.md} color={colors.text} />
                <Text variant="fine" tone="text" className="flex-1">
                  {tr.profile.photoHidden}
                </Text>
              </View>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
