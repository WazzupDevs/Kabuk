import type { ProfileView } from '@shared/api/profile.ts';
import type { Friend } from '@shared/api/friends.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Li, Round, RowList, Sec, T, Tag, useKit } from '@/aura/kit';
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
import { RingedFace } from '@/features/profile/ProfileFace';
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
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

const P = PROFILE_PAGE;
const O = P.other;

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
// 120–190, and the name comes into the bar beside the back button. "Arkadaşlıktan çıkar" is in the
// menu only, the DM's menu (5.5).
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
  const { c } = useKit();
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
  const onBar = useScrollPast((O.bar[0] + O.bar[1]) / 2);

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
  const faceTop = P.faceAt.y + dy - P.face / 2;
  const name = profile.displayName ?? tr.profile.noName;
  const threadId = friend?.threadId ?? null;
  const ground = AURA[scheme].ground;

  return (
    <View style={{ flex: 1, backgroundColor: ground }}>
      <AuraBackground />
      <ScreenStatusBar style={onBar && scheme === 'light' ? 'dark' : 'light'} />
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
          paddingHorizontal: KIT.size.side,
          paddingBottom: insets.bottom + SPACING[8],
          alignItems: 'center',
        }}
      >
        <ScrollFade fade={O.faceFade} shrink={O.faceShrink} scaleTo={O.faceScale}>
          {/* The photo opens large (the owner's call, 28 Ekim). */}
          <Tap
            testID="profile-photo-open"
            accessibilityLabel={tr.profile.photoOpen}
            disabled={!profile.photoUrl}
            onPress={() => setPreview(true)}
          >
            <RingedFace name={profile.displayName ?? ''} photoUrl={profile.photoUrl} />
          </Tap>
        </ScrollFade>
        <PhotoPreview url={profile.photoUrl} visible={preview} onClose={() => setPreview(false)} />
        <View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            gap: SPACING[1],
            marginTop: SPACING[3],
          }}
        >
          <T v="display" style={KIT_TYPE.displaySm} center accessibilityRole="header">
            {profile.displayName && profile.age !== null
              ? tr.profile.nameWithAge(profile.displayName, profile.age)
              : name}
          </T>
          {profile.bio ? (
            <T v="body" center>
              {profile.bio}
            </T>
          ) : null}
          {friend ? (
            <View style={{ marginTop: SPACING[2] }}>
              <Tag
                label={tr.profile.friendsStatus}
                colors={{ bg: c.friendPill, fg: c.friendPillInk }}
                lead={<CapIcon name="checkCircle" color={c.friendPillInk} size={ICON.sm} />}
              />
            </View>
          ) : null}
        </View>
        <View style={{ alignSelf: 'stretch', marginTop: SPACING[6], gap: SPACING[6] }}>
          {threadId && friend ? (
            // Prominent (iskelet.md → 2.1): the page's one main action.
            <Btn
              block
              icon="chat"
              label={tr.friends.messageShort}
              onPress={() =>
                openDm({ threadId, publicId: friend.publicId, name: friend.displayName })
              }
            />
          ) : null}
          {profile.badges.length > 0 ? (
            <View style={{ gap: SPACING[3] }}>
              <Sec title={tr.profile.badgesTitle} />
              <RowList inset={ICON.md + KIT.size.liGap}>
                {profile.badges.map((badge) => (
                  <Li key={badge} padY={KIT.size.lrPadY} minHeight={KIT.size.lrMin}>
                    <CapIcon name="star" color={c.ink} size={ICON.md} />
                    <View style={{ flex: 1 }}>
                      <T v="h3">{tr.profile.badges[badge]}</T>
                    </View>
                  </Li>
                ))}
              </RowList>
            </View>
          ) : null}
        </View>
      </ScrollBody>
      {/* The bar (3.1, `kapak`): its band from the screen's top edge, the back button and the
          menu never move; the name comes in beside the back button. */}
      <BarBand from={O.bar[0]} to={O.bar[1]} />
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: KIT.size.side,
          right: KIT.size.side,
          top: insets.top + SPACING[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[3],
        }}
      >
        <Round
          glass="clear"
          icon="back"
          side={KIT.size.topBtn}
          label={tr.common.back}
          testID="profile-back"
          onPress={() => router.back()}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <BarArrive from={O.bar[0]} to={O.bar[1]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
              <Av size="sm" name={name} photoUrl={profile.photoUrl} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="h3" lines={2} fit>
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
