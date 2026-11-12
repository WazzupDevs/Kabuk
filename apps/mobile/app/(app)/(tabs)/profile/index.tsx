import type { Friend } from '@shared/api/friends.ts';
import { router } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
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
import { ProfileFace } from '@/features/profile/ProfileFace';
import { useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
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
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const P = PROFILE_PAGE;
const OWN = P.own;

// The own profile in two parts (docs/design/iskelet.md → 5.7; docs/SPEC_V4.md §4.W). The upper part:
// the cover (the person's own or the riso scene), the photo in its white ring, the name with the
// age (never the birth date, rule 11), the quiet bio, and side by side "Profili düzenle" and
// "N arkadaş". Under it the capsule's panel, 34 round with a handle: the anonymous identity's
// ticket and today's Set balonu (the capsule and the nick show on the own profile only, rule 4).
// Scrolled up, the panel rides over the upper part, which moves at -0.35, fades over 120–300 and
// shrinks to 0.92; the photo and the name fly into the bar, linear and one to one, arriving as the
// panel reaches the bar (316): one photo and one name on the screen. Let go between, the page
// settles at the nearer end. The settings never move.
export default function ProfileScreen() {
  const y = useScrollOffset();
  return (
    <ScrollScreen y={y}>
      <ProfilePage y={y} />
    </ScrollScreen>
  );
}

function ProfilePage({ y }: { y: ReturnType<typeof useScrollOffset> }) {
  const { c } = useKit();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const barSpace = useTabBarSpace();
  const own = useProfile();
  const publicId = own.data?.public_id;
  const view = useProfileView(publicId, true);
  const friends = useFriends();
  const loading = useLoaderHold(view.isPending);
  const [preview, setPreview] = useState(false);
  // The upper part's words and buttons: their foot, once laid out (not on a frame).
  const [wordsFoot, setWordsFoot] = useState(0);
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

  // The canvas (390 wide, PROFILE_PAGE) on this phone: heights moved by its status bar, widths from
  // the centre by its width; the bar's row where the kit puts it.
  const dy = insets.top - P.canvasStatus;
  const sx = width / P.canvasWidth;
  const atX = (x: number) => width / 2 + (x - P.canvasWidth / 2) * sx;
  const barFoot = insets.top + TOP_BAR_ROW;
  const barMid = insets.top + SPACING[2] + KIT.size.topBtn / 2;
  const coverHeight = P.cover + dy;
  const faceFlight: Flight = {
    arrive: OWN.arrive,
    speed: OWN.rise,
    from: { x: atX(P.faceAt.x), y: P.faceAt.y + dy },
    to: { x: atX(OWN.faceTo.x), y: barMid },
  };
  const nameFlight: Flight = {
    arrive: OWN.arrive,
    speed: OWN.rise,
    from: { x: atX(P.nameAt.x), y: P.nameAt.y + dy },
    to: { x: atX(OWN.nameTo.x), y: barMid },
  };
  // In the bar the name keeps clear of the small photo and of the settings button.
  const nameLeft = faceFlight.to.x + OWN.face / 2 + SPACING[2];
  const nameRight = width - KIT.size.side - KIT.size.topBtn - SPACING[2];
  const nameMax = Math.min(width - 2 * KIT.size.side, (nameRight - nameLeft) / OWN.nameScale);
  // The name's line as T draws it (at most 1.3 of the system's text size).
  const nameHeight = (KIT_TYPE.displaySm.lineHeight ?? 0) * Math.min(fontScale, MAX_TEXT_SCALE);
  const wordsTop = P.nameAt.y + dy + nameHeight / 2 + SPACING[1];
  // The panel reaches the bar's foot at 316 (lower when the words need it).
  const panelTop = Math.max(barFoot + OWN.arrive, wordsFoot + SPACING[4]);
  const arrival = panelTop - barFoot;

  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScreenStatusBar style={onBar && scheme === 'light' ? 'dark' : 'light'} />
      <ScrollBody
        y={y}
        snapToOffsets={[0, arrival]}
        snapToEnd={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <RiseLayer speed={OWN.rise} fade={OWN.riseFade} scaleTo={OWN.riseScale} height={panelTop}>
          <ProfileCoverArt
            url={data?.coverUrl ?? null}
            height={coverHeight}
            accessibilityLabel={tr.profile.cover}
          />
          {data ? (
            <>
              {/* The photo's place: the flying photo over the page draws it; this keeps its touch
                  (it opens large, the owner's call, 28 Ekim). */}
              <View
                style={{
                  position: 'absolute',
                  top: faceFlight.from.y - P.face / 2,
                  left: faceFlight.from.x - P.face / 2,
                }}
              >
                <Tap
                  testID="profile-photo"
                  accessibilityLabel={tr.profile.photoOpen}
                  disabled={!photoUrl}
                  onPress={() => setPreview(true)}
                >
                  <View style={{ width: P.face, height: P.face }} />
                </Tap>
              </View>
              <View
                onLayout={(e) =>
                  setWordsFoot(Math.ceil(e.nativeEvent.layout.y + e.nativeEvent.layout.height))
                }
                style={{
                  position: 'absolute',
                  top: wordsTop,
                  left: KIT.size.side,
                  right: KIT.size.side,
                  alignItems: 'center',
                  gap: SPACING[4],
                }}
              >
                {data.bio ? (
                  <T v="body" center>
                    {data.bio}
                  </T>
                ) : null}
                <View style={{ flexDirection: 'row', alignSelf: 'stretch', gap: SPACING[3] }}>
                  <Btn
                    variant="glassy"
                    bar={KIT.size.btnRow}
                    icon="edit"
                    label={hasName ? tr.profile.edit : tr.profile.addName}
                    onPress={() => router.push('/profile/edit')}
                    style={{ flex: 1, minWidth: 0 }}
                    block
                  />
                  <Btn
                    variant="glassy"
                    bar={KIT.size.btnRow}
                    testID="profile-friends"
                    accessibilityLabel={tr.profile.friendsCount(friendList.length)}
                    lead={friendList.length > 0 ? <FaceStack friends={friendList} /> : undefined}
                    label={tr.profile.friendsSub(friendList.length)}
                    onPress={() => router.push('/profile/friends')}
                    style={{ flex: 1, minWidth: 0 }}
                    block
                  />
                </View>
              </View>
            </>
          ) : null}
        </RiseLayer>
        <View
          style={{
            flexGrow: 1,
            minHeight: height - barFoot,
            backgroundColor: AURA[scheme].ground,
            borderTopLeftRadius: OWN.panelRadius,
            borderTopRightRadius: OWN.panelRadius,
            paddingHorizontal: KIT.size.side,
            paddingTop: SPACING[2],
            paddingBottom: barSpace ? insets.bottom + SCROLL_PAD : SPACING[8],
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: KIT.size.grabW,
              height: KIT.size.grabH,
              borderRadius: KIT.size.grabH,
              backgroundColor: c.grab,
            }}
          />
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
            <>
              {/* The list's head once the panel is under the bar: the ticket. */}
              {data.capsuleNick ? (
                <IdentityTicket
                  nick={data.capsuleNick}
                  look={data.capsuleLook ?? null}
                  refreshAt={data.nickRefreshAt ?? null}
                />
              ) : null}
              {data.photoHidden ? (
                <Glass pad="pad" style={{ marginTop: SPACING[4] }}>
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
          <FlyingFace
            flight={faceFlight}
            side={P.face}
            sideTo={OWN.face}
            ring={P.ring}
            ringTo={OWN.ring}
            ringColor={P.ringColor}
          >
            <ProfileFace side={P.face - 2 * P.ring} name={name} photoUrl={photoUrl} />
          </FlyingFace>
          <FlyingName
            flight={nameFlight}
            scaleTo={OWN.nameScale}
            left={nameLeft}
            right={nameRight}
            maxWidth={nameMax}
          >
            <T v="display" style={KIT_TYPE.displaySm} lines={1} fit accessibilityRole="header">
              {name}
            </T>
          </FlyingName>
        </>
      ) : null}

      {/* The settings at the top right; they stay while the page scrolls (the owner's report,
          2 Kasım, B2). */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + SPACING[2],
          right: KIT.size.side,
        }}
      >
        <Round
          glass="clear"
          icon="settings"
          side={KIT.size.topBtn}
          label={tr.settings.title}
          testID="profile-settings"
          onPress={() => router.push('/settings')}
        />
      </View>
    </View>
  );
}

// "N arkadaş"'s faces (iskelet.md → 2.4): 28 over each other, no ring but 2.5 of the button's
// ground round each and a light shadow.
function FaceStack({ friends }: { friends: readonly Friend[] }) {
  const { scheme } = useTheme();
  const gap = KIT.button[scheme].clear.solid;
  const side = OWN.stack + 2 * OWN.stackGap;
  return (
    <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
      {friends.slice(0, OWN.stackMax).map((f, i) => (
        <View
          key={f.publicId}
          style={{
            width: side,
            height: side,
            borderRadius: side / 2,
            padding: OWN.stackGap,
            backgroundColor: gap,
            boxShadow: OWN.stackShadow,
            marginLeft: i === 0 ? -OWN.stackGap : -KIT.size.stackOverlap,
          }}
        >
          <ProfileFace
            side={OWN.stack}
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
// T's largest text size against the system's (aura/kit → MAX_FONT_SCALE).
const MAX_TEXT_SCALE = 1.3;
