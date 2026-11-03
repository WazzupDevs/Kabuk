import type { ProfileView } from '@shared/api/profile.ts';
import { type ReactNode, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { PROFILE_PHOTO_SIZES, ProfilePhoto } from '@/components/ProfilePhoto';
import { tr } from '@/i18n/tr';
import { Av, Round, T, useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { PhotoPreview } from '@/components/PhotoPreview';

import { LivePencil, LivingLook } from './LivingLook';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from '@/components/NativeShadow';

type Profile = Pick<ProfileView, 'photoUrl' | 'displayName' | 'age' | 'bio' | 'badges'>;

// A profile's head (v45: .phero), the own one and another person's: the photo in its ring, the name
// with the age in the quiet colour (never the birth date, rule 11) and the bio, centred; then the
// actions.
// The top of another person's profile and of a venue chat profile (aura v50, ProfilBaskasi): a
// round 48 back on the left, "Seçenekler" on the right once the profile is shown.
// U31: the bar 56, its buttons 44 round soft, "Seçenekler" moreV.
export function ProfileTopBar({ onBack, onMore }: { onBack: () => void; onMore?: () => void }) {
  return (
    <View
      style={{
        height: KIT.size.btnRow,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Round glassy icon="back" label={tr.common.back} onPress={onBack} testID="profile-back" />
      {onMore ? (
        <Round glassy icon="moreV" label={tr.profile.more} onPress={onMore} testID="profile-more" />
      ) : null}
    </View>
  );
}

// U31 (ProfilBaskasi `.kk`): a riso buddy looking out from behind the face's right, 64 wide, 92 from
// the face's left and 18 down, turned 14 degrees. Which buddy is drawn at random as the page opens
// (the owner's call, 2 Kasım, 17.2): never from the person, so it tells nothing about anyone (rule
// 4). The peeking pictures are 160x200, the standing buddies 320x420.
const PEEK = { left: 92, top: 18, width: 64, turn: '14deg' } as const;
const PEEK_BUDDIES: readonly { source: ImageSourcePropType; height: number }[] = [
  { source: require('../../../assets/riso/peek-1.webp'), height: 80 },
  { source: require('../../../assets/riso/peek-2.webp'), height: 80 },
  { source: require('../../../assets/riso/buddies/riso_b83534.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_7d5ef2.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_3c95b1.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_4957ac.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_1a80a9.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_6f419d.webp'), height: 84 },
  { source: require('../../../assets/riso/buddies/riso_f280a5.webp'), height: 84 },
];
const pickPeek = () =>
  PEEK_BUDDIES[Math.floor(Math.random() * PEEK_BUDDIES.length)] ?? PEEK_BUDDIES[0];

// Another person's profile (U31, ProfilBaskasi): no card; the face 120 at the left, 24 under the
// bar, a riso buddy behind it; the name display 20 under the face, the bio 4 under the name, the
// actions 24 under them.
function OtherHead({ profile, children }: { profile: Profile; children?: ReactNode }) {
  const [preview, setPreview] = useState(false);
  const [peek] = useState(pickPeek);
  const side = KIT.size.av.hero;
  return (
    <View>
      <View style={{ marginTop: SPACING[6], width: side, height: side }}>
        {peek ? (
          <Image
            source={peek.source}
            style={{
              position: 'absolute',
              left: PEEK.left,
              top: PEEK.top,
              width: PEEK.width,
              height: peek.height,
              transform: [{ rotate: PEEK.turn }],
            }}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {/* The photo opens large (the owner's call, 28 Ekim). */}
        <Pressable
          testID="profile-photo-open"
          accessibilityRole="button"
          accessibilityLabel={tr.profile.photoOpen}
          disabled={!profile.photoUrl}
          onPress={() => setPreview(true)}
        >
          <Av size="hero" name={profile.displayName ?? ''} photoUrl={profile.photoUrl} />
        </Pressable>
        <PhotoPreview url={profile.photoUrl} visible={preview} onClose={() => setPreview(false)} />
      </View>
      <T v="display" accessibilityRole="header" style={{ marginTop: SPACING[5] }}>
        {profile.displayName ?? tr.profile.noName}
        {profile.displayName && profile.age !== null ? tr.profile.ageAfterName(profile.age) : ''}
      </T>
      {profile.bio ? (
        <T v="body" style={{ marginTop: SPACING[1] }}>
          {profile.bio}
        </T>
      ) : null}
      {children ? <View style={{ marginTop: SPACING[6] }}>{children}</View> : null}
    </View>
  );
}

export function ProfileHead({
  profile,
  capsule,
  anonymous,
  onEditCapsule,
  children,
}: {
  profile: Profile;
  // The own profile only (K-49): the capsule beside the photo (skall tuvali, Profil, ProfilAnonim).
  capsule?: string | null;
  // The check-in's identity is anonymous: the capsule is what the table sees (ringed).
  anonymous?: boolean;
  onEditCapsule?: () => void;
  children?: ReactNode;
}) {
  if (!capsule) return <OtherHead profile={profile}>{children}</OtherHead>;
  return (
    <OwnHead
      profile={profile}
      capsule={capsule}
      anonymous={anonymous}
      onEditCapsule={onEditCapsule}
    >
      {children}
    </OwnHead>
  );
}

function OwnHead({
  profile,
  capsule,
  anonymous,
  onEditCapsule,
  children,
}: {
  profile: Profile;
  capsule: string;
  anonymous?: boolean;
  onEditCapsule?: () => void;
  children?: ReactNode;
}) {
  const { colors, shape } = useTheme();
  const { c } = useKit();
  // The capsule's edit badge's soft shadow natively (NativeShadow.tsx).
  const badgeShadow = boxShadowParts(
    useLabOff('golge'),
    shape.shadow.card,
    SPACING[9] / 2,
    true,
    SPACING[0.5] + SPACING[0.5] / 2,
  );
  const ring = (on: boolean) => ({
    padding: SPACING[0.5],
    borderRadius: shape.radius.pill,
    borderWidth: SPACING[0.5],
    borderColor: on ? colors.primary : 'transparent',
  });
  return (
    <View className="items-center gap-2">
      <View className="flex-row justify-center" style={{ gap: SPACING[4] }}>
        <View className="items-center gap-2">
          <View style={ring(!anonymous)}>
            <ProfilePhoto url={profile.photoUrl} name={profile.displayName} size="hero" />
          </View>
          <View className="items-center">
            <T v="fine" ink>
              {tr.profile.ownPhoto}
            </T>
            <T v="fine" color={anonymous ? c.muted : c.link}>
              {anonymous ? tr.profile.whenProfiled : tr.profile.ownPhotoNote}
            </T>
          </View>
        </View>
        <View className="items-center gap-2">
          <View style={ring(!!anonymous)}>
            <LivingLook
              look={capsule}
              size={PROFILE_PHOTO_SIZES.hero}
              accessibilityLabel={tr.profile.ownCapsule}
            />
            {onEditCapsule ? (
              <Pressable
                testID="capsule-edit"
                accessibilityRole="button"
                accessibilityLabel={tr.capsule.edit}
                onPress={onEditCapsule}
                hitSlop={SPACING[1.5]}
                className="absolute items-center justify-center"
                style={{
                  right: 0,
                  bottom: 0,
                  width: SPACING[9],
                  height: SPACING[9],
                  borderRadius: shape.radius.pill,
                  backgroundColor: colors.surface,
                  borderWidth: SPACING[0.5] + SPACING[0.5] / 2,
                  borderColor: colors.canvas,
                  boxShadow: badgeShadow.boxShadow,
                }}
              >
                {badgeShadow.node}
                <LivePencil />
              </Pressable>
            ) : null}
          </View>
          <View className="items-center">
            <T v="fine" ink>
              {tr.profile.ownCapsule}
            </T>
            <T v="fine" color={anonymous ? c.link : c.muted}>
              {anonymous ? tr.profile.ownPhotoNote : tr.profile.ownCapsuleNote}
            </T>
          </View>
        </View>
      </View>
      <View
        style={{
          alignSelf: 'stretch',
          gap: KIT.size.tagGap,
          paddingHorizontal: KIT.size.secPadX,
          marginTop: SPACING[1.5],
        }}
      >
        <T v="display" style={KIT_TYPE.displaySm} accessibilityRole="header">
          {profile.displayName ?? tr.profile.noName}
          {profile.displayName && profile.age !== null ? tr.profile.ageAfterName(profile.age) : ''}
        </T>
        {profile.bio ? <T v="body">{profile.bio}</T> : null}
      </View>
      {children ? <View className="mt-1.5 self-stretch">{children}</View> : null}
    </View>
  );
}
