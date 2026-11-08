import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, Li, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { PhotoPreview } from '@/components/PhotoPreview';
import { useTabBarSpace } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { SetCard } from '@/features/gifts/SetCard';
import { IdentityTicket } from '@/features/profile/IdentityTicket';
import { ProfileCover } from '@/features/profile/ProfileCover';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PROFILE_COVER } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// The own profile (docs/SPEC_V4.md §4.W, "C · kapak ve bilet"): the cover at the top (the person's
// own or the riso scene), the photo over its foot, the name and age, the bio and "Profili düzenle";
// the anonymous identity on a ticket; the friends and today's Set balonu. The capsule and the nick
// show on the own profile only (rule 4). Scrolled, the cover goes and a thin bar stays at the top
// (the small photo, the name); the settings never move with the content.
export default function ProfileScreen() {
  const { c } = useKit();
  const { scheme, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);

  const hasName = !!own.data?.display_name;
  const friendList = friends.data ?? [];
  const [preview, setPreview] = useState(false);

  const coverHeight = insets.top + PROFILE_COVER.height;
  const barHeight = insets.top + KIT.size.bell + SPACING[2] * 2;
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const barShown = coverHeight - barHeight;
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [barShown - BAR_FADE, barShown],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const data = view.data;
  const name = data?.displayName
    ? data.age
      ? tr.profile.nameWithAge(data.displayName, data.age)
      : data.displayName
    : tr.profile.noName;
  const photoUrl = data && !data.photoHidden ? data.photoUrl : null;

  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: barSpace ? insets.bottom + SCROLL_PAD : SPACING[8],
        }}
      >
        <ProfileCover
          url={data?.coverUrl ?? null}
          height={coverHeight}
          accessibilityLabel={tr.profile.cover}
        />
        <View style={{ paddingHorizontal: shape.screenPadding }}>
          {view.isPending || loading ? (
            <View style={{ marginTop: SPACING[8] }}>
              <EmptyState kind="loading" body={tr.common.loading} />
            </View>
          ) : !data ? (
            <View style={{ marginTop: SPACING[8] }}>
              <EmptyState
                icon="cloud-offline-outline"
                body={errorMessage(view.error)}
                action={{
                  label: tr.common.retry,
                  onPress: () => void view.refetch(),
                  loading: view.isRefetching,
                }}
              />
            </View>
          ) : (
            <View>
              {/* The photo over the cover's foot; it opens large (the owner's call, 28 Ekim). */}
              <View style={{ alignItems: 'center', marginTop: -PROFILE_COVER.faceOverlap }}>
                <Pressable
                  testID="profile-photo"
                  accessibilityRole="button"
                  accessibilityLabel={tr.profile.photoOpen}
                  disabled={!photoUrl}
                  onPress={() => setPreview(true)}
                >
                  <Av size="big" name={data.displayName ?? tr.profile.noName} photoUrl={photoUrl} />
                </Pressable>
              </View>
              <PhotoPreview url={photoUrl} visible={preview} onClose={() => setPreview(false)} />
              <View
                style={{
                  alignItems: 'center',
                  gap: SPACING[1],
                  marginTop: PROFILE_COVER.nameTop,
                }}
              >
                <T v="display" style={KIT_TYPE.displaySm} center accessibilityRole="header">
                  {name}
                </T>
                {data.bio ? (
                  <T v="body" ink center>
                    {data.bio}
                  </T>
                ) : null}
                <View style={{ marginTop: SPACING[3] }}>
                  <Btn
                    variant="glassy"
                    label={hasName ? tr.profile.edit : tr.profile.addName}
                    onPress={() => router.push('/profile/edit')}
                  />
                </View>
              </View>

              {data.photoHidden ? (
                <Glass pad="pad" style={{ marginTop: SPACING[4] }}>
                  <T v="fine" ink>
                    {tr.profile.photoHidden}
                  </T>
                </Glass>
              ) : null}

              {data.capsuleNick ? (
                <IdentityTicket
                  nick={data.capsuleNick}
                  look={data.capsuleLook ?? null}
                  refreshAt={data.nickRefreshAt ?? null}
                />
              ) : null}

              <Glass sm style={{ marginTop: SPACING[4], overflow: 'hidden' }}>
                <Li
                  testID="profile-friends"
                  accessibilityLabel={tr.profile.friendsCount(friendList.length)}
                  onPress={() => router.push('/profile/friends')}
                  padY={ROW_PAD_Y}
                  padX={SPACING[4]}
                >
                  <View style={{ flex: 1, gap: SPACING[0.5], minHeight: ROW_INNER }}>
                    <T v="h3">{tr.profile.friends}</T>
                    <T v="fine">{tr.profile.friendsPeople(friendList.length)}</T>
                  </View>
                  <View
                    style={{ flexDirection: 'row' }}
                    importantForAccessibility="no-hide-descendants"
                  >
                    {friendList.slice(0, STACK).map((f, i) => (
                      <View key={f.publicId} style={{ marginLeft: i === 0 ? 0 : -SPACING[2] }}>
                        <Av
                          size="sm"
                          name={f.displayName ?? tr.profile.noName}
                          photoUrl={f.photoUrl}
                        />
                      </View>
                    ))}
                  </View>
                  <CapIcon name="chevron" color={c.muted} size={ICON.md} />
                </Li>
              </Glass>
              {/* Set balonu under Arkadaşlar (the owner's call, 8 Kasım). */}
              <SetCard />
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Once the cover is gone: the small photo and the name on the screen's ground. */}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: barHeight,
            paddingTop: insets.top,
            paddingLeft: shape.screenPadding,
            paddingRight: shape.screenPadding + KIT.size.bell + SPACING[2],
            flexDirection: 'row',
            alignItems: 'center',
            gap: PROFILE_COVER.barGap,
            backgroundColor: AURA[scheme].ground,
            borderBottomWidth: KIT.size.hair,
            borderBottomColor: c.hair,
          },
          barStyle,
        ]}
      >
        {data ? (
          <>
            <Av size="sm" name={data.displayName ?? tr.profile.noName} photoUrl={photoUrl} />
            <View style={{ flex: 1 }}>
              <T v="h3">{name}</T>
            </View>
          </>
        ) : null}
      </Animated.View>

      {/* The settings over the cover's top right; they stay while the page scrolls (the owner's
          report, 2 Kasım, B2). */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + SPACING[2],
          right: shape.screenPadding,
        }}
      >
        <Round
          glassy
          icon="settings"
          side={KIT.size.bell}
          label={tr.settings.title}
          testID="profile-settings"
          onPress={() => router.push('/settings')}
        />
      </View>
    </View>
  );
}

// U32: a row of the list 72 high, 14 above and under.
const ROW_PAD_Y = 14;
const ROW_INNER = 72 - 2 * ROW_PAD_Y;
const STACK = 3;
// Under the tabs the last row ends 90 over the safe area (Screen's SCROLL_PAD).
const SCROLL_PAD = 90;
// The bar fades in over the cover's last 24.
const BAR_FADE = 24;
