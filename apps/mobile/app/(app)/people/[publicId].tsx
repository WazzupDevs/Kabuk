import type { ProfileView } from '@shared/api/profile.ts';
import type { Friend } from '@shared/api/friends.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { upperTr } from '@shared/trText.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Glass, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { MenuItem, openMenu } from '@/components/Menu';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Screen } from '@/components/Screen';
import { ScreenStatusBar } from '@/components/StatusScrim';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { openDm } from '@/features/friends/openDm';
import { refreshFriends, useFriends, useMutualFriends } from '@/features/friends/queries';
import { ProfileTopBar } from '@/features/profile/ProfileCard';
import { ProfileCoverArt } from '@/features/profile/ProfileCover';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import {
  BarBand,
  type Flight,
  FlyingFace,
  FlyingName,
  RiseLayer,
  ScrollBody,
  ScrollScreen,
  Tap,
  useScrollOffset,
  useScrollPast,
} from '@/motion';
import { TOP_BAR_ROW } from '@/motion/TopBar';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE, RADIUS_SCALE } from '@/theme/auraKit';
import { OWN_PROFILE } from '@/theme/ownProfile';
import { BADGE_LOOK, OTHER_PROFILE as O2, PERSON } from '@/theme/person';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

const P = PROFILE_PAGE;
const OWN = P.own;
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
  // A failed refresh keeps what was read (audit PRO-2).
  const failed =
    view.isError &&
    !view.data &&
    !(view.error instanceof ApiError && view.error.code === 'not_found');

  if (view.data) {
    return <PersonPage profile={view.data} friend={friend} fromDm={from === 'dm'} />;
  }
  return (
    <Screen
      refreshable
      top={<ProfileTopBar onBack={() => router.back()} />}
      footer={
        !view.isPending && !failed ? (
          <Btn block label={tr.profile.back} onPress={() => router.back()} />
        ) : undefined
      }
    >
      {view.isPending ? (
        <View className="flex-1">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : failed ? (
        <EmptyState
          kind="error"
          body={errorMessage(view.error)}
          error={view.error}
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

// The page itself, for the route and for the visual gate's sample (gorsel/personFixture.tsx).
export function PersonPage({
  profile,
  friend,
  fromDm = false,
}: {
  profile: ProfileView;
  friend: Friend | null;
  fromDm?: boolean;
}) {
  const y = useScrollOffset();
  return (
    <ScrollScreen y={y}>
      <CoverPage profile={profile} friend={friend} fromDm={fromDm} y={y} />
    </ScrollScreen>
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
  const { width, height, fontScale } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);
  // The bio's and the buttons' foot, once laid out (not on a frame).
  const [wordsFoot, setWordsFoot] = useState(0);
  const moreRef = useRef<View>(null);
  const [reporting, setReporting] = useState(false);
  // The DM's menu (iskelet.md → 3.5, 5.5): no "Vazgeç", Engelle red at the foot apart; in the app's
  // layer, not this screen's state (CLAUDE.md → Çizim bütçesi).
  const openOptions = () =>
    openMenu(
      moreRef.current,
      <>
        <MenuItem
          icon="report"
          label={tr.chat.report}
          testID="profile-report"
          onPress={() => {
            setReporting(true);
          }}
        />
        {friend ? (
          <MenuItem
            icon="person-remove-outline"
            label={tr.friends.removeFriend}
            testID="profile-remove"
            onPress={() => {
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
              setEnding('block');
            }}
          />
        ) : null}
      </>,
    );
  const [ending, setEnding] = useState<'remove' | 'block' | null>(null);
  // Only on a friend's profile (rule 4); nothing while it loads, fails or is empty.
  const mutual = useMutualFriends(publicId, !!friend).data;

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

  // The own profile's cover, photo and name, and how they move (the owner's call, 24 Kasım): the
  // canvas (390 wide, PROFILE_PAGE) on this phone, heights moved by its status bar, widths from the
  // centre by its width; the upper part rises at -0.35 and fades, the photo and the name fly into
  // the bar as the content under them reaches it.
  const dy = insets.top - P.canvasStatus;
  const sx = width / P.canvasWidth;
  const atX = (x: number) => width / 2 + (x - P.canvasWidth / 2) * sx;
  const barFoot = insets.top + TOP_BAR_ROW;
  const barMid = insets.top + SPACING[2] + KIT.size.topBtn / 2;
  const coverHeight = OWN.cover + dy;
  const faceFlight: Flight = {
    arrive: OWN.arrive,
    speed: OWN.rise,
    from: { x: atX(OWN.photoAt.x), y: OWN.photoAt.y + dy },
    to: { x: atX(OWN.faceTo.x), y: barMid },
  };
  const nameFlight: Flight = {
    arrive: OWN.arrive,
    speed: OWN.rise,
    from: { x: atX(OWN.nameAt.x), y: OWN.nameAt.y + dy },
    to: { x: atX(OWN.nameTo.x), y: barMid },
  };
  // In the bar the name keeps clear of the small photo and of the menu.
  const nameLeft = faceFlight.to.x + OWN.face / 2 + SPACING[2];
  const nameRight = width - B.bar.side - KIT.size.topBtn - SPACING[2];
  const nameMax = Math.min(width - 2 * O2.side, (nameRight - nameLeft) / OWN.nameScale);
  const line = KIT_TYPE.profileName.lineHeight ?? 0;
  const nameHeight = line * Math.min(fontScale, MAX_TEXT_SCALE);
  const wordsTop = OWN.nameAt.y + dy + (nameHeight - (line - OWN_PROFILE.nameLine)) / 2;
  // The content under the upper part reaches the bar's foot at 316 (lower when the words need it).
  const contentTop = Math.max(barFoot + OWN.arrive, wordsFoot + O2.contentGap);
  const arrival = contentTop - barFoot;
  const name = profile.displayName ?? tr.profile.noName;
  const fullName =
    profile.displayName && profile.age !== null
      ? tr.profile.nameWithAge(profile.displayName, profile.age)
      : name;
  const threadId = friend?.threadId ?? null;
  const ground = AURA[scheme].ground;
  const look = B[scheme];
  const tone = O2[scheme];
  const onBar = useScrollPast((OWN_PROFILE.band[0] + OWN_PROFILE.band[1]) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: ground }}>
      <AuraBackground />
      <ScreenStatusBar style={onBar && scheme === 'light' ? 'dark' : 'light'} />
      <ScrollBody
        y={y}
        snapToOffsets={[0, arrival]}
        snapToEnd={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + SPACING[8] }}
      >
        <RiseLayer
          speed={OWN.rise}
          fade={OWN.riseFade}
          scaleTo={OWN.riseScale}
          shrink={[0, arrival]}
          origin={OWN_PROFILE.riseOrigin}
          height={contentTop}
        >
          <ProfileCoverArt
            url={profile.coverUrl}
            height={coverHeight}
            accessibilityLabel={profile.coverUrl ? tr.profile.cover : undefined}
          />
          {/* The photo's place: the flying photo over the page draws it; this keeps its touch (it
              opens large, the owner's call, 28 Ekim). Alone: no capsule beside it on another
              person's profile (rule 4). */}
          <View
            style={{
              position: 'absolute',
              top: faceFlight.from.y - OWN.photo / 2,
              left: faceFlight.from.x - OWN.photo / 2,
            }}
          >
            <Tap
              testID="profile-photo-open"
              accessibilityLabel={tr.profile.photoOpen}
              disabled={!profile.photoUrl}
              onPress={() => setPreview(true)}
            >
              <View style={{ width: OWN.photo, height: OWN.photo }} />
            </Tap>
          </View>
          {/* tuval ProfilBaskasi `.bio`, `.acts`: the quiet bio 4 under the name; Mesaj and
              "Arkadaşsınız" side by side 20 under it, as wide as each other. */}
          <View
            onLayout={(e) =>
              setWordsFoot(Math.ceil(e.nativeEvent.layout.y + e.nativeEvent.layout.height))
            }
            style={{
              position: 'absolute',
              top: wordsTop,
              left: O2.side,
              right: O2.side,
              alignItems: 'center',
            }}
          >
            {profile.bio ? (
              <View style={{ alignSelf: 'stretch', marginTop: O2.bioTop }}>
                <T v="body" color={look.bio} center>
                  {profile.bio}
                </T>
              </View>
            ) : null}
            {friend ? (
              <View
                style={{
                  alignSelf: 'stretch',
                  flexDirection: 'row',
                  gap: O2.actsGap,
                  marginTop: O2.actsTop,
                }}
              >
                {threadId ? (
                  <View style={{ flex: 1 }}>
                    <Btn
                      block
                      icon="chat"
                      label={tr.friends.messageShort}
                      onPress={() =>
                        openDm({ threadId, publicId: friend.publicId, name: friend.displayName })
                      }
                    />
                  </View>
                ) : null}
                <View
                  accessible
                  accessibilityLabel={tr.profile.friendsStatus}
                  style={{
                    flex: 1,
                    height: KIT.size.btn,
                    borderRadius: KIT.size.btn / 2,
                    backgroundColor: tone.friendFill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: SPACING[2],
                    paddingHorizontal: SPACING[3],
                  }}
                >
                  <CapIcon name="checkCircle" color={tone.friendInk} size={ICON.md} />
                  <T v="btn" color={tone.friendInk}>
                    {tr.profile.friendsStatus}
                  </T>
                </View>
              </View>
            ) : null}
          </View>
        </RiseLayer>
        <PhotoPreview url={profile.photoUrl} visible={preview} onClose={() => setPreview(false)} />
        <View style={{ paddingHorizontal: O2.side, minHeight: height - barFoot }}>
          {friend && mutual && mutual.count > 0 ? <MutualCard mutual={mutual} /> : null}
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
                  const badgeTone = look.badge[BADGE_LOOK[badge].tone];
                  return (
                    <View
                      key={badge}
                      style={{
                        height: B.badge.height,
                        paddingLeft: B.badge.padLeft,
                        paddingRight: B.badge.padRight,
                        borderRadius: B.badge.height / 2,
                        backgroundColor: badgeTone.bg,
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
                          color={badgeTone.icon}
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
        </View>
      </ScrollBody>
      <BarBand from={OWN_PROFILE.band[0]} to={OWN_PROFILE.band[1]} />
      <FlyingFace
        flight={faceFlight}
        side={OWN.photo}
        sideTo={OWN.face}
        ring={P.ring}
        ringTo={OWN.ring}
        ringColor={P.ringColor}
      >
        <ProfileFace side={OWN.photo - 2 * P.ring} name={name} photoUrl={profile.photoUrl} />
      </FlyingFace>
      <FlyingName
        flight={nameFlight}
        scaleTo={OWN.nameScale}
        left={nameLeft}
        right={nameRight}
        maxWidth={nameMax}
        face={{ flight: faceFlight, side: OWN.photo, sideTo: OWN.face }}
      >
        <T v="profileName" lines={1} fit accessibilityRole="header">
          {fullName}
        </T>
      </FlyingName>
      {/* The back button and the menu never move (the owner's call, 2 Kasım). */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: B.bar.side,
          right: B.bar.side,
          top: insets.top + SPACING[2],
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Round
          glass="cover"
          icon="back"
          side={KIT.size.topBtn}
          iconSize={B.bar.back}
          label={tr.common.back}
          testID="profile-back"
          onPress={() => router.back()}
        />
        <View ref={moreRef} collapsable={false}>
          <Round
            glass="cover"
            icon="moreV"
            side={KIT.size.topBtn}
            iconSize={B.bar.more}
            label={tr.profile.more}
            testID="profile-more"
            onPress={openOptions}
          />
        </View>
      </View>
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={ending !== null}
        title={ending === 'block' ? tr.safety.blockNamedTitle(name) : tr.friends.removeFriend}
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

// tuval ProfilBaskasi `.mut`: the mutual friends on one glass row, 24 under the buttons: their faces
// over each other, "N ortak arkadaş" over their names, the chevron. Pressed, it opens the list under
// it: a face and a name a row, each opening that profile (only on a friend's profile, rule 4).
function MutualCard({
  mutual,
}: {
  mutual: {
    count: number;
    friends: { publicId: string; displayName: string | null; photoUrl: string | null }[];
  };
}) {
  const { scheme } = useTheme();
  const look = B[scheme];
  const { c } = useKit();
  const [open, setOpen] = useState(false);
  const names = mutual.friends.map((m) => m.displayName ?? tr.profile.noName);
  const faces = mutual.friends.slice(0, O2.mutual.faces);
  return (
    <Glass
      face={look.card}
      radius={RADIUS_SCALE[3]}
      style={{
        marginTop: O2.mutual.top,
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[3],
      }}
    >
      <Tap
        testID="profile-mutual"
        accessibilityLabel={tr.profile.mutualRow(mutual.count, tr.profile.mutualNames(names))}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3] }}>
          <View style={{ flexDirection: 'row' }}>
            {faces.map((m, i) => (
              <View
                key={m.publicId}
                style={{
                  marginLeft: i === 0 ? 0 : -O2.mutual.overlap,
                  borderRadius: 999,
                  borderWidth: O2.mutual.ring,
                  borderColor: AURA[scheme].ground,
                }}
              >
                <Av size="sm" name={m.displayName ?? tr.profile.noName} photoUrl={m.photoUrl} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="body" ink>
              {tr.profile.mutualCount(mutual.count)}
            </T>
            <T v="fine" color={c.muted}>
              {tr.profile.mutualNames(names)}
            </T>
          </View>
          <CapIcon name="chevron" color={c.muted} size={ICON.sm} />
        </View>
      </Tap>
      {open ? (
        <View style={{ marginTop: SPACING[3], gap: B.mutual.rowGap }}>
          {mutual.friends.map((m) => {
            const mutualName = m.displayName ?? tr.profile.noName;
            return (
              <Tap
                key={m.publicId}
                testID={`profile-mutual-${m.publicId}`}
                accessibilityLabel={tr.profile.mutualOpen(mutualName)}
                onPress={() =>
                  router.push({ pathname: '/people/[publicId]', params: { publicId: m.publicId } })
                }
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: B.mutual.faceGap }}>
                  <Av size="list" name={mutualName} photoUrl={m.photoUrl} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="body" ink>
                      {mutualName}
                    </T>
                  </View>
                </View>
              </Tap>
            );
          })}
        </View>
      ) : null}
    </Glass>
  );
}

// T's largest text size against the system's (aura/kit → MAX_FONT_SCALE).
const MAX_TEXT_SCALE = 1.3;
