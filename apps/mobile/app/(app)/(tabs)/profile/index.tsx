import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  scrollTo,
  useAnimatedRef,
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
// show on the own profile only (rule 4). Scrolled up, the photo shrinks and glides into a thin bar
// at the top with the name beside it; scrolled back, both glide down the same way (the owner's
// call, 8 Kasım). Let go part way, the page settles at the nearer end. The settings never move.
export default function ProfileScreen() {
  const { c } = useKit();
  const { scheme, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId, true);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);

  const hasName = !!own.data?.display_name;
  const friendList = friends.data ?? [];
  const [preview, setPreview] = useState(false);

  const { width } = useWindowDimensions();
  const coverHeight = insets.top + PROFILE_COVER.ownHeight;
  const barHeight = insets.top + KIT.size.bell + SPACING[2] * 2;
  const glide = coverHeight - barHeight + PROFILE_COVER.glideExtra;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const nameW = useSharedValue(0);
  const nameH = useSharedValue(0);
  // Let go between the ends, the page settles at the nearer one.
  const settle = (y: number) => {
    'worklet';
    if (y > 0 && y < glide) scrollTo(scrollRef, 0, y < glide / 2 ? 0 : glide, true);
  };
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
    onEndDrag: (e) => {
      if (Math.abs(e.velocity?.y ?? 0) < SETTLE_VELOCITY) settle(e.contentOffset.y);
    },
    onMomentumEnd: (e) => settle(e.contentOffset.y),
  });
  const progress = (y: number) => {
    'worklet';
    return EASE(interpolate(y, [0, glide], [0, 1], Extrapolation.CLAMP));
  };
  const barMid = insets.top + (barHeight - insets.top) / 2;
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [glide * PROFILE_COVER.barFadeFrom, glide],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  // The photo: from the cover's foot (112, centred) to the bar's left (32).
  const faceStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const e = progress(y);
    const k = 1 + (FACE_SMALL / FACE_BIG - 1) * e;
    const cx = width / 2 + (shape.screenPadding + FACE_SMALL / 2 - width / 2) * e;
    const cy = coverHeight - Math.max(y, 0) * (1 - e) + (barMid - coverHeight) * e;
    return {
      transform: [
        { translateX: cx - FACE_BIG / 2 },
        { translateY: cy - FACE_BIG / 2 },
        { scale: k },
      ],
    };
  });
  // The name: from under the photo (centred, display) to beside the small photo (h3).
  const nameStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const e = progress(y);
    const k = 1 + (NAME_SCALE - 1) * e;
    const w = nameW.value;
    const h = nameH.value;
    const x0 = width / 2 - w / 2;
    const y0 =
      coverHeight + PROFILE_COVER.faceOverlap + PROFILE_COVER.nameTop - Math.max(y, 0) * (1 - e);
    // Scaled about its centre: its left edge lands beside the small photo.
    const x1 = shape.screenPadding + FACE_SMALL + PROFILE_COVER.barGap - (w * (1 - k)) / 2;
    const y1 = barMid - h / 2;
    return {
      opacity: w > 0 ? 1 : 0,
      transform: [
        { translateX: x0 + (x1 - x0) * e },
        { translateY: y0 + (y1 - y0) * e },
        { scale: k },
      ],
    };
  });

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
        ref={scrollRef}
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
                  {/* The gliding copy over the page draws the photo; this one keeps its place
                      and its touch. */}
                  <View style={{ width: FACE_BIG, height: FACE_BIG }} />
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
                <T
                  v="display"
                  style={[KIT_TYPE.displaySm, { opacity: 0 }]}
                  lines={1}
                  fit
                  center
                  accessibilityRole="header"
                >
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
      ></Animated.View>

      {/* The photo and the name, gliding between the cover's foot and the bar. */}
      {data && !(view.isPending || loading) ? (
        <>
          <Animated.View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            style={[{ position: 'absolute', left: 0, top: 0 }, faceStyle]}
          >
            <Av size="big" name={data.displayName ?? tr.profile.noName} photoUrl={photoUrl} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            onLayout={(e) => {
              nameW.value = e.nativeEvent.layout.width;
              nameH.value = e.nativeEvent.layout.height;
            }}
            style={[
              { position: 'absolute', left: 0, top: 0, maxWidth: width - 2 * shape.screenPadding },
              nameStyle,
            ]}
          >
            <T v="display" style={KIT_TYPE.displaySm} lines={1} fit>
              {name}
            </T>
          </Animated.View>
        </>
      ) : null}

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
const FACE_BIG = KIT.size.av.big;
const FACE_SMALL = PROFILE_COVER.barFace;
const NAME_SCALE = (KIT_TYPE.h3.fontSize ?? 16) / (KIT_TYPE.displaySm.fontSize ?? 34);
// Slower than this when the finger lifts, no fling follows: the page settles at once.
const SETTLE_VELOCITY = 0.05;
const EASE = Easing.inOut(Easing.quad);
