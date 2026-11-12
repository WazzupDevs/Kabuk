import type { ProfileView } from '@shared/api/profile.ts';
import type { Friend } from '@shared/api/friends.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { upperTr } from '@shared/trText.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, Round, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Screen } from '@/components/Screen';
import { ScreenStatusBar } from '@/components/StatusScrim';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { refreshFriends, useFriends } from '@/features/friends/queries';
import { ProfileTopBar } from '@/features/profile/ProfileCard';
import { ProfileCoverArt } from '@/features/profile/ProfileCover';
import { ProfileFace, RingedFace } from '@/features/profile/ProfileFace';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import {
  BarArrive,
  BarBand,
  Cover,
  type MenuAnchor,
  ScrollBody,
  ScrollFade,
  ScrollScreen,
  Tap,
  useScrollOffset,
  useScrollPast,
} from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { BADGE_LOOK, PERSON } from '@/theme/person';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const P = PROFILE_PAGE;
const O = P.other;
const B = PERSON;

// Another account's profile: only while the viewer may see it (a friend, or the other table of
// the current room). Anything else, including a room that just ended, reads as "not visible"
// (`not_found`, the same for a removed friend and a block: rule 5); a failed load (no connection)
// says so and offers "Tekrar dene". No capsule and no nick here, a friend's included (rule 4).
export default function PersonScreen() {
  // `from: 'dm'`: opened from the DM with this person (CHAT-6).
  const { publicId, from } = useLocalSearchParams<{ publicId: string; from?: string }>();
  const view = useProfileView(publicId);
  const friends = useFriends();
  const friend = friends.data?.find((f) => f.publicId === publicId) ?? null;
  const y = useScrollOffset();
  // A failed refresh keeps what was read (audit PRO-2).
  const failed =
    view.isError &&
    !view.data &&
    !(view.error instanceof ApiError && view.error.code === 'not_found');

  if (view.data) {
    return (
      <ScrollScreen y={y}>
        <CoverPage profile={view.data} friend={friend} fromDm={from === 'dm'} y={y} />
      </ScrollScreen>
    );
  }
  return (
    <Screen
      refreshable
      top={<ProfileTopBar onBack={() => router.back()} />}
      footer={
        !view.isPending && !failed ? (
          <Btn block bar={KIT.size.btnRow} label={tr.profile.back} onPress={() => router.back()} />
        ) : undefined
      }
    >
      {view.isPending ? (
        <View className="mt-16 items-center">
          <Loader />
        </View>
      ) : failed ? (
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
        <EmptyState icon="eye-off-outline" body={tr.profile.notVisible} />
      )}
    </Screen>
  );
}

// The `kapak` page (docs/design/iskelet.md → 3.1, 5.6), the own profile's layout: the cover (riso
// paper without one) at half the scroll; the photo in its white ring over the cover's foot, the
// name, the quiet bio, "Arkadaşsınız" for a friend; one main button, "Mesaj"; the badges in a
// grouped card, none without them. Scrolled, the photo shrinks to 0.75 over 60–180 and fades over
// 120–190, the name fades over 200–240, the band comes in over 190–230 and the small face with the
// name into the bar's middle over 230–260 (tuval Profil; its measures theme/person.ts).
// "Arkadaşlıktan çıkar" is in the menu only, the DM's menu (5.5).
function CoverPage({
  profile,
  friend,
  fromDm,
  y,
}: {
  profile: ProfileView;
  friend: Friend | null;
  fromDm: boolean;
  y: ReturnType<typeof useScrollOffset>;
}) {
  const publicId = profile.publicId;
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);
  const [menu, setMenu] = useState(false);
  const moreRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const openMenu = () =>
    measureMenuAnchor(moreRef.current, (at) => {
      setAnchor(at);
      setMenu(true);
    });
  const [reporting, setReporting] = useState(false);
  const [ending, setEnding] = useState<'remove' | 'block' | null>(null);
  // The status bar's icons: light over the cover, the scheme's once the band is in (5.2).
  const onBar = useScrollPast((O.band[0] + O.band[1]) / 2);

  const end = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ kind, reason }: { kind: 'remove' | 'block'; reason?: ReportReason }) =>
      kind === 'remove'
        ? friendsApi.remove(publicId, reason)
        : safetyApi.blockFriend(publicId, reason),
    onSuccess: (_data, { kind, reason }) => {
      if (kind === 'block') track('block_created', {});
      if (reason) track('report_submitted', {});
      setEnding(null);
      void refreshFriends(queryClient, 'friendship');
      // The DM behind this profile is gone with the friendship: back to Mesajlar, not to it.
      if (fromDm) router.dismissTo('/messages');
      else router.back();
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportProfile(publicId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });

  // The canvas's heights moved by this phone's status bar (PROFILE_PAGE).
  const dy = insets.top - P.canvasStatus;
  const coverHeight = P.cover + dy;
  const faceTop = B.faceTop + dy;
  const name = profile.displayName ?? tr.profile.noName;
  const threadId = friend?.threadId ?? null;
  const ground = AURA[scheme].ground;
  const look = B[scheme];
  // Over the paper (no cover) the light scheme's icons are dark from the start.
  const darkIcons = scheme === 'light' && (onBar || !profile.coverUrl);

  return (
    <View style={{ flex: 1, backgroundColor: ground }}>
      <AuraBackground />
      <ScreenStatusBar style={darkIcons ? 'dark' : 'light'} />
      <Cover height={coverHeight} speed={O.speed}>
        <ProfileCoverArt
          url={profile.coverUrl}
          height={coverHeight}
          paper
          accessibilityLabel={profile.coverUrl ? tr.profile.cover : undefined}
        />
      </Cover>
      <ScrollBody
        y={y}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: faceTop,
          paddingHorizontal: B.side,
          paddingBottom: insets.bottom + SPACING[8],
          alignItems: 'center',
        }}
      >
        <ScrollFade
          fade={O.faceFade}
          shrink={O.faceShrink}
          scaleTo={O.faceScale}
          origin={B.faceOrigin}
        >
          {/* The photo opens large (the owner's call, 28 Ekim). Alone: no capsule beside it on
              another person's profile (rule 4). */}
          <Tap
            testID="profile-photo-open"
            accessibilityLabel={tr.profile.photoOpen}
            disabled={!profile.photoUrl}
            onPress={() => setPreview(true)}
          >
            <RingedFace
              name={profile.displayName ?? ''}
              photoUrl={profile.photoUrl}
              side={B.face}
            />
          </Tap>
        </ScrollFade>
        <PhotoPreview url={profile.photoUrl} visible={preview} onClose={() => setPreview(false)} />
        <View style={{ alignSelf: 'stretch', marginTop: B.nameTop }}>
          <ScrollFade fade={B.nameFade} shrink={B.nameFade} scaleTo={1}>
            <T v="profileName" center accessibilityRole="header">
              {profile.displayName && profile.age !== null
                ? tr.profile.nameWithAge(profile.displayName, profile.age)
                : name}
            </T>
          </ScrollFade>
        </View>
        {profile.bio ? (
          <View style={{ alignSelf: 'stretch', marginTop: B.bioTop }}>
            <T v="body" color={look.bio} center>
              {profile.bio}
            </T>
          </View>
        ) : null}
        {friend ? (
          <View
            style={{
              marginTop: B.friendTop,
              height: B.friend.height,
              paddingLeft: B.friend.padLeft,
              paddingRight: B.friend.padRight,
              borderRadius: B.friend.height / 2,
              backgroundColor: look.friend.bg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: B.friend.gap,
            }}
          >
            <CapIcon name="check" color={look.friend.fg} soft={1} size={B.friend.icon} />
            <T v="friendTag" color={look.friend.fg}>
              {tr.profile.friendsStatus}
            </T>
          </View>
        ) : null}
        {threadId && friend ? (
          // Prominent (iskelet.md → 2.1): the page's one main action, at most 300 wide.
          <Btn
            block
            icon="chat"
            label={tr.friends.messageShort}
            look={{ type: 'profileBtn', gap: B.message.gap, icon: B.message.icon }}
            style={{
              alignSelf: 'center',
              width: '100%',
              maxWidth: B.message.maxWidth,
              marginTop: B.messageTop,
            }}
            onPress={() =>
              openDm({ threadId, publicId: friend.publicId, name: friend.displayName })
            }
          />
        ) : null}
        {profile.badges.length > 0 ? (
          <View style={{ alignSelf: 'stretch', marginTop: B.badgesTop }}>
            <View style={{ marginLeft: B.eyebrow.in, marginBottom: B.eyebrow.bottom }}>
              <T v="sheetEyebrow" color={look.eyebrow} accessibilityRole="header">
                {upperTr(tr.profile.badgesTitle)}
              </T>
            </View>
            <Glass
              face={look.card}
              radius={B.badgeCard.radius}
              style={{
                padding: B.badgeCard.pad,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: B.badgeCard.gap,
              }}
            >
              {profile.badges.map((badge) => {
                const tone = look.badge[BADGE_LOOK[badge].tone];
                return (
                  <View
                    key={badge}
                    style={{
                      height: B.badge.height,
                      paddingLeft: B.badge.padLeft,
                      paddingRight: B.badge.padRight,
                      borderRadius: B.badge.height / 2,
                      backgroundColor: tone.bg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: B.badge.gap,
                    }}
                  >
                    <View
                      style={{
                        width: B.badge.disc,
                        height: B.badge.disc,
                        borderRadius: B.badge.disc / 2,
                        backgroundColor: look.badgeDisc,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CapIcon
                        name={BADGE_LOOK[badge].icon}
                        color={tone.icon}
                        soft={1}
                        size={B.badge.icon}
                      />
                    </View>
                    <T v="badgeChip" ink>
                      {tr.profile.badges[badge]}
                    </T>
                  </View>
                );
              })}
            </Glass>
          </View>
        ) : null}
      </ScrollBody>
      {/* The bar (3.1, `kapak`): its band from the screen's top edge, the back button and the
          menu never move; the small face and the name come in between them, centred. */}
      <BarBand from={O.band[0]} to={O.band[1]} />
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: B.bar.side,
          right: B.bar.side,
          top: insets.top + SPACING[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: B.bar.gap,
        }}
      >
        <Round
          glass="clear"
          icon="back"
          side={KIT.size.topBtn}
          iconSize={B.bar.back}
          label={tr.common.back}
          testID="profile-back"
          onPress={() => router.back()}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <BarArrive from={O.bar[0]} to={O.bar[1]} rise={B.bar.rise}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: B.bar.faceGap,
              }}
            >
              <View
                style={{
                  width: B.bar.face,
                  height: B.bar.face,
                  borderRadius: B.bar.face / 2,
                  boxShadow: look.barFaceShadow || undefined,
                }}
              >
                <ProfileFace side={B.bar.face} name={name} photoUrl={profile.photoUrl} />
              </View>
              <View style={{ flexShrink: 1, minWidth: 0 }}>
                <T v="personBar" lines={2} fit>
                  {name}
                </T>
              </View>
            </View>
          </BarArrive>
        </View>
        <View ref={moreRef} collapsable={false}>
          <Round
            glass="clear"
            icon="moreV"
            side={KIT.size.topBtn}
            iconSize={B.bar.more}
            label={tr.profile.more}
            testID="profile-more"
            onPress={openMenu}
          />
        </View>
      </View>
      {anchor ? (
        // The DM's menu (iskelet.md → 3.5, 5.5): no "Vazgeç", Engelle red at the foot apart.
        <Menu anchor={anchor} visible={menu} onClose={() => setMenu(false)}>
          <MenuItem
            icon="report"
            label={tr.chat.report}
            testID="profile-report"
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
          {friend ? (
            <MenuItem
              icon="person-remove-outline"
              label={tr.friends.removeFriend}
              testID="profile-remove"
              onPress={() => {
                setMenu(false);
                setEnding('remove');
              }}
            />
          ) : null}
          {friend ? (
            <MenuItem
              negative
              icon="ban-outline"
              label={tr.friends.block}
              testID="profile-block"
              onPress={() => {
                setMenu(false);
                setEnding('block');
              }}
            />
          ) : null}
        </Menu>
      ) : null}
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={ending !== null}
        title={ending === 'block' ? tr.safety.blockConfirmTitle : tr.friends.removeFriend}
        hint={ending === 'block' ? tr.friends.blockHint : tr.friends.removeHint}
        confirmLabel={ending === 'block' ? tr.friends.blockConfirm : tr.friends.removeConfirm}
        confirmIcon={ending === 'block' ? 'block' : undefined}
        // iskelet.md → 3.5: the person's picture over the sentence.
        picture={<Av size="lg" name={name} photoUrl={profile.photoUrl} />}
        pending={end.isPending}
        error={end.error}
        onConfirm={(reason) => ending && end.mutate({ kind: ending, reason })}
        onClose={() => setEnding(null)}
      />
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
    </View>
  );
}
