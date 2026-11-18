import type { Friend } from '@shared/api/friends.ts';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { PhotoPreview } from '@/components/PhotoPreview';
import { ScreenStatusBar } from '@/components/StatusScrim';
import { useTabBarSpace } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { useFriends } from '@/features/friends/queries';
import { SetCard } from '@/features/gifts/SetCard';
import { IdentityTicket } from '@/features/profile/IdentityTicket';
import { ProfileCoverArt } from '@/features/profile/ProfileCover';
import { ProfileFace, RingedFace } from '@/features/profile/ProfileFace';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNarrow } from '@/lib/useNarrow';
import {
  BarArrive,
  BarBand,
  ScrollBody,
  ScrollScreen,
  Tap,
  useScrollOffset,
  useScrollPast,
} from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { OWN_PROFILE, OWN_TYPE } from '@/theme/ownProfile';
import { PROFILE_PAGE, TICKET } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const P = PROFILE_PAGE;
const OWN = P.own;
const B = OWN_PROFILE;

// The own profile (docs/SPEC_V4.md §4.W; the yeni arayüz tuvali's ProfilBen, ProfilBenKaydir,
// DarProfilim): one flow. The cover (the person's own or the riso scene), the photo over its foot,
// the name with the age (never the birth date, rule 11), the quiet bio, "Profili düzenle" and "N
// arkadaş" side by side (stacked at 320 dp or the largest text), then the anonymous identity's
// ticket and today's Set balonu (the capsule and the nick show on the own profile only, rule 4).
// Scrolled, the band comes in over 256–316 and the small photo with the name into the bar's left over
// 296–330; the settings never move.
export function OwnProfile({ gateScroll }: { gateScroll?: number } = {}) {
  const y = useScrollOffset();
  return (
    <ScrollScreen y={y}>
      <ProfilePage y={y} gateScroll={gateScroll} />
    </ScrollScreen>
  );
}

function ProfilePage({
  y,
  gateScroll,
}: {
  y: ReturnType<typeof useScrollOffset>;
  // The visual gate's scrolled state (ProfilBenKaydir): the room under the page to scroll this far
  // (the board is 320 down with nothing under it; the gate's flow drags). Never set in the app.
  gateScroll?: number;
}) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const narrow = useNarrow();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId, true);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);
  const [preview, setPreview] = useState(false);
  const coverOff = useLabOff('kapak');
  const ticketOff = useLabOff('bilet');
  // The status bar's icons: light over the cover, the scheme's once the band is in.
  const onBar = useScrollPast((OWN.band[0] + OWN.band[1]) / 2);

  const hasName = !!own.data?.display_name;
  const friendList = friends.data ?? [];
  const data = view.isPending || loading ? undefined : view.data;
  const name = data?.displayName
    ? data.age
      ? tr.profile.nameWithAge(data.displayName, data.age)
      : data.displayName
    : tr.profile.noName;
  const photoUrl = data && !data.photoHidden ? data.photoUrl : null;
  const ground = AURA[scheme].ground;
  const faceGround = scheme === 'dark' ? B.dark.faceGround : B.light.faceGround;

  // The canvas's heights moved by this phone's status bar (PROFILE_PAGE).
  const dy = insets.top - P.canvasStatus;
  const coverHeight = (narrow ? B.cover.narrow : OWN.cover) + dy;

  return (
    <View style={{ flex: 1, backgroundColor: ground }}>
      <AuraBackground />
      <ScreenStatusBar style={onBar && scheme === 'light' ? 'dark' : 'light'} />
      <ScrollBody y={y} contentContainerStyle={{ flexGrow: 1 }}>
        {coverOff ? (
          <View style={{ height: coverHeight }} />
        ) : (
          <ProfileCoverArt
            url={data?.coverUrl ?? null}
            height={coverHeight}
            own
            accessibilityLabel={tr.profile.cover}
          />
        )}
        <View
          style={{
            marginTop: -OWN.photoOver,
            paddingHorizontal: B.side,
            paddingBottom: (barSpace ? insets.bottom + SCROLL_PAD : SPACING[8]) + (gateScroll ?? 0),
          }}
        >
          {data ? (
            <View style={{ alignItems: 'center' }}>
              {/* The photo opens large (the owner's call, 28 Ekim). */}
              <Tap
                testID="profile-photo"
                accessibilityLabel={tr.profile.photoOpen}
                disabled={!photoUrl}
                onPress={() => setPreview(true)}
              >
                <RingedFace
                  name={data.displayName ?? ''}
                  photoUrl={photoUrl}
                  side={OWN.photo}
                  ringColor={ground}
                  ground={faceGround}
                />
              </Tap>
              <View style={{ alignSelf: 'stretch', marginTop: B.nameTop }}>
                <T v="body" ink center style={OWN_TYPE.name} accessibilityRole="header">
                  {name}
                </T>
              </View>
              {data.bio ? (
                <View style={{ alignSelf: 'stretch', marginTop: B.bioTop }}>
                  <T v="body" color={c.muted} center>
                    {data.bio}
                  </T>
                </View>
              ) : null}
              <View
                style={{
                  alignSelf: 'stretch',
                  marginTop: B.buttonsTop,
                  flexDirection: narrow ? 'column' : 'row',
                  gap: narrow ? B.buttonsGapNarrow : B.buttonsGap,
                }}
              >
                <Btn
                  block
                  variant="glassy"
                  bar={narrow ? B.buttonNarrow : KIT.size.btn}
                  icon="edit"
                  testID="profile-edit"
                  label={hasName ? tr.profile.edit : tr.profile.addName}
                  look={{
                    type: 'holdRow',
                    padLeft: B.edit.pad,
                    padRight: B.edit.pad,
                    icon: B.edit.icon,
                  }}
                  style={narrow ? undefined : { flex: 1, minWidth: 0 }}
                  onPress={() => router.push('/profile/edit')}
                />
                <FriendsCard friends={friendList} narrow={narrow} />
              </View>
            </View>
          ) : null}
          {view.isPending || loading ? (
            <View style={{ flex: 1 }}>
              <EmptyState kind="loading" body={tr.common.loading} />
            </View>
          ) : !data ? (
            <View style={{ marginTop: SPACING[8] }}>
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
            </View>
          ) : (
            <>
              {data.capsuleNick ? (
                ticketOff ? (
                  <View style={{ minHeight: TICKET.height, marginTop: B.sectionTop }} />
                ) : (
                  <IdentityTicket
                    nick={data.capsuleNick}
                    look={data.capsuleLook ?? null}
                    refreshAt={data.nickRefreshAt ?? null}
                  />
                )
              ) : null}
              {data.photoHidden ? (
                <Glass pad="pad" style={{ marginTop: B.sectionTop }}>
                  <T v="fine" ink>
                    {tr.profile.photoHidden}
                  </T>
                </Glass>
              ) : null}
              <SetCard />
            </>
          )}
        </View>
      </ScrollBody>

      <BarBand from={OWN.band[0]} to={OWN.band[1]} />
      {data ? (
        <>
          <PhotoPreview url={photoUrl} visible={preview} onClose={() => setPreview(false)} />
          {/* ProfilBenKaydir `.sbr`: the small photo and the name at the bar's left once the page
              has scrolled; the settings stay where they are. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: OWN.barSide,
              right: B.side + KIT.size.topBtn + OWN.barGap,
              top: insets.top + SPACING[2],
              height: KIT.size.topBtn,
              justifyContent: 'center',
            }}
          >
            <BarArrive from={OWN.bar[0]} to={OWN.bar[1]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: OWN.barGap }}>
                <ProfileFace
                  side={OWN.barFace}
                  name={name}
                  photoUrl={photoUrl}
                  ground={faceGround}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="venueBarName" ink lines={1} fit style={OWN_TYPE.bar}>
                    {name}
                  </T>
                </View>
              </View>
            </BarArrive>
          </View>
        </>
      ) : null}

      {/* The settings at the top right; they stay while the page scrolls (the owner's report,
          2 Kasım, B2). */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + SPACING[2],
          right: B.side - SPACING[1],
        }}
      >
        <Round
          glass="cover"
          icon="settings"
          side={KIT.size.topBtn}
          iconSize={B.settingsIcon}
          label={tr.settings.title}
          testID="profile-settings"
          onPress={() => router.push('/settings')}
        />
      </View>
    </View>
  );
}

// "N arkadaş" (ProfilBen `.fr`): a glass card as high as the buttons beside it, the first two
// friends' faces over each other (32, a 2 ring of the card's ground), the words and an arrow; the
// whole card opens Arkadaşlar. Stacked (320 dp) it is full width.
function FriendsCard({ friends, narrow }: { friends: readonly Friend[]; narrow: boolean }) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const F = B.friends;
  const faces = friends.slice(0, OWN.stackMax);
  const side = OWN.stack;
  return (
    <View style={narrow ? undefined : { flex: 1, minWidth: 0 }}>
      <Tap
        testID="profile-friends"
        accessibilityRole="button"
        accessibilityLabel={tr.profile.friendsCount(friends.length)}
        onPress={() => router.push('/profile/friends')}
        style={{ width: '100%' }}
      >
        <Glass
          face={B[scheme].card}
          radius={KIT.size.btn / 2}
          style={{
            width: '100%',
            minHeight: narrow ? B.buttonNarrow : KIT.size.btn,
            flexDirection: 'row',
            alignItems: 'center',
            gap: F.gap,
            paddingLeft: faces.length > 0 ? F.padLeft : F.padLeftBare,
            paddingRight: F.padRight,
          }}
        >
          {faces.length > 0 ? <FaceStack faces={faces} side={side} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="btnSm" ink fit lines={1}>
              {tr.profile.friendsSub(friends.length)}
            </T>
          </View>
          <CapIcon name="chevron" color={c.muted} soft={1} size={F.chevron} />
        </Glass>
      </Tap>
    </View>
  );
}

// Overlap: each face 10 over the one before it.
function FaceStack({ faces, side }: { faces: readonly Friend[]; side: number }) {
  const { scheme } = useTheme();
  const ring = B[scheme].stackRing;
  return (
    <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
      {faces.map((f, i) => (
        <View
          key={f.publicId}
          style={{
            width: side,
            height: side,
            borderRadius: side / 2,
            borderWidth: OWN.stackGap,
            borderColor: ring,
            marginLeft: i === 0 ? 0 : OWN.stackStep - side,
            overflow: 'hidden',
          }}
        >
          <ProfileFace
            side={side - 2 * OWN.stackGap}
            name={f.displayName ?? tr.profile.noName}
            photoUrl={f.photoUrl}
          />
        </View>
      ))}
    </View>
  );
}

// Under the tabs the last row ends 90 over the safe area (Screen's SCROLL_PAD).
const SCROLL_PAD = 90;
