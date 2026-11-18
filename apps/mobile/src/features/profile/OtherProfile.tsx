import type { ProfileView } from '@shared/api/profile.ts';
import { router } from 'expo-router';
import { Children, Fragment, isValidElement, type ReactNode, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Round, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { measureMenuAnchor, Menu } from '@/components/Menu';
import { PhotoPreview } from '@/components/PhotoPreview';
import { ScreenStatusBar } from '@/components/StatusScrim';
import { ProfileCoverArt } from '@/features/profile/ProfileCover';
import { ProfileFace, RingedFace } from '@/features/profile/ProfileFace';
import { tr } from '@/i18n/tr';
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
import { PERSON, PERSON_TYPE } from '@/theme/person';
import { PROFILE_PAGE } from '@/theme/profileCover';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// The menu's rows as the menu counts them (its hairlines come between its children): a fragment
// is one child, so its own children stand in its place.
function rows(node: ReactNode): ReactNode {
  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return Children.toArray(node.props.children);
  }
  return node;
}

const P = PROFILE_PAGE;
const O = P.other;
const B = PERSON;

export type OtherProfileData = Pick<
  ProfileView,
  'displayName' | 'age' | 'bio' | 'photoUrl' | 'coverUrl'
>;

// Another person's profile as the boards draw it (ProfilBaskasi, MekanProfil; docs/design/iskelet.md
// → 3.1, 5.6): the cover (riso paper without one) at half the scroll, fading into the ground; the
// photo in its ring of the ground's colour over its foot, the name with the age, the quiet bio, the
// buttons the caller gives (`actions`: a friend's "Mesaj" and "Arkadaşsınız", a stranger's "Arkadaşlık
// isteği gönder"), what comes under them (`extras`). Scrolled, the photo shrinks to 0.75 over 60–180
// and fades over 120–190, the name fades over 200–240, the band comes in over 190–230 and the small
// face with the name into the bar's middle over 230–260. The back button and the ⋮ never move; the
// ⋮ opens the caller's menu (`menu`) grown from it, or is not there without one. No capsule and no
// nick on another person's profile (rule 4).
export function OtherProfile({
  profile,
  actions,
  extras,
  menu,
  onBack,
  menuAnchorTestID,
}: {
  profile: OtherProfileData;
  actions?: ReactNode;
  extras?: ReactNode;
  menu?: (close: () => void) => ReactNode;
  onBack?: () => void;
  menuAnchorTestID?: string;
}) {
  const y = useScrollOffset();
  return (
    <ScrollScreen y={y}>
      <OtherPage
        y={y}
        profile={profile}
        actions={actions}
        extras={extras}
        menu={menu}
        onBack={onBack}
        menuAnchorTestID={menuAnchorTestID}
      />
    </ScrollScreen>
  );
}

function OtherPage({
  y,
  profile,
  actions,
  extras,
  menu,
  onBack,
  menuAnchorTestID,
}: {
  y: ReturnType<typeof useScrollOffset>;
  profile: OtherProfileData;
  actions?: ReactNode;
  extras?: ReactNode;
  menu?: (close: () => void) => ReactNode;
  onBack?: () => void;
  menuAnchorTestID?: string;
}) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const insets = useSafeAreaInsets();
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState(false);
  const moreRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const openMenu = () =>
    measureMenuAnchor(moreRef.current, (at) => {
      setAnchor(at);
      setOpen(true);
    });
  // The status bar's icons: light over the cover, the scheme's once the band is in (5.2).
  const onBar = useScrollPast((O.band[0] + O.band[1]) / 2);

  // The canvas's heights moved by this phone's status bar (PROFILE_PAGE).
  const dy = insets.top - P.canvasStatus;
  const coverHeight = P.cover + dy;
  const faceTop = B.faceTop + dy;
  const name = profile.displayName ?? tr.profile.noName;
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
              ringColor={ground}
            />
          </Tap>
        </ScrollFade>
        <PhotoPreview url={profile.photoUrl} visible={preview} onClose={() => setPreview(false)} />
        <View style={{ alignSelf: 'stretch', marginTop: B.nameTop }}>
          <ScrollFade fade={B.nameFade} shrink={B.nameFade} scaleTo={1}>
            <T v="body" ink center style={PERSON_TYPE.name} accessibilityRole="header">
              {profile.displayName && profile.age !== null
                ? tr.profile.nameWithAge(profile.displayName, profile.age)
                : name}
            </T>
          </ScrollFade>
        </View>
        {profile.bio ? (
          <View style={{ alignSelf: 'stretch', marginTop: B.bioTop }}>
            <T v="body" color={c.muted} center>
              {profile.bio}
            </T>
          </View>
        ) : null}
        {actions ? (
          <View
            style={{
              alignSelf: 'stretch',
              marginTop: B.actsTop,
              flexDirection: 'row',
              gap: B.actsGap,
            }}
          >
            {actions}
          </View>
        ) : null}
        {extras}
      </ScrollBody>
      {/* The bar (3.1, `kapak`): its band from the screen's top edge, the back button and the menu
          never move; the small face and the name come in between them, centred. */}
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
          glass="cover"
          icon="back"
          side={KIT.size.topBtn}
          iconSize={B.bar.back}
          label={tr.common.back}
          testID="profile-back"
          onPress={onBack ?? (() => router.back())}
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
        {menu ? (
          <View ref={moreRef} collapsable={false}>
            <Round
              glass="cover"
              icon="moreV"
              side={KIT.size.topBtn}
              iconSize={B.bar.more}
              label={tr.profile.more}
              testID={menuAnchorTestID ?? 'profile-more'}
              onPress={openMenu}
            />
          </View>
        ) : null}
      </View>
      {menu && anchor ? (
        <Menu anchor={anchor} visible={open} onClose={() => setOpen(false)}>
          {rows(menu(() => setOpen(false)))}
        </Menu>
      ) : null}
    </View>
  );
}

// YukleniyorProfil (87): the paper where the cover will be, the back button over it and the loader
// in the page's lower middle (470 on the board); the photo, the name and the buttons wait.
export function OtherProfileLoading({ onBack }: { onBack?: () => void }) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const ground = AURA[scheme].ground;
  const dy = insets.top - P.canvasStatus;
  return (
    <View style={{ flex: 1, backgroundColor: ground }}>
      <AuraBackground />
      <ScreenStatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
        <ProfileCoverArt url={null} height={P.cover + dy} paper />
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: B.bar.side,
          top: insets.top + SPACING[2],
        }}
      >
        <Round
          glass="cover"
          icon="back"
          side={KIT.size.topBtn}
          iconSize={B.bar.back}
          label={tr.common.back}
          testID="profile-back"
          onPress={onBack ?? (() => router.back())}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: B.loaderAt + dy - KIT.size.stateLoader / 2,
          alignItems: 'center',
        }}
      >
        <Loader />
      </View>
    </View>
  );
}
