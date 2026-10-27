import type { ProfileView } from '@shared/api/profile.ts';
import { BADGES, type BadgeId } from '@shared/badges.ts';
import type { ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { LookAvatar } from '@/components/LookAvatar';
import { PROFILE_PHOTO_SIZES, ProfilePhoto } from '@/components/ProfilePhoto';
import { Mark } from '@/components/Mark';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { usePhoto } from '@/lib/usePhoto';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { ICON, SPACING } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';
import { PhotoImage } from '@/components/PhotoImage';

type Profile = Pick<ProfileView, 'photoUrl' | 'displayName' | 'age' | 'bio' | 'badges'>;

// The photo area of another person's card.
const HERO_HEIGHT = SPACING[16] * 4;
const BADGE = SPACING[16];
const BADGE_GLYPH = SPACING[8];
const LOCK = SPACING[5];

function nameLine(profile: Profile): string {
  return profile.displayName
    ? profile.age !== null
      ? tr.profile.nameWithAge(profile.displayName, profile.age)
      : profile.displayName
    : tr.profile.noName;
}

// A profile's head (v45: .phero), the own one and another person's: the photo in its ring, the name
// with the age in the quiet colour (never the birth date, rule 11) and the bio, centred; then the
// actions.
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
  const { colors, shape } = useTheme();
  const ring = (on: boolean) => ({
    padding: SPACING[0.5],
    borderRadius: shape.radius.pill,
    borderWidth: SPACING[0.5],
    borderColor: on ? colors.primary : 'transparent',
  });
  return (
    <View className="items-center gap-2">
      {capsule ? (
        <View className="flex-row justify-center" style={{ gap: SPACING[4] }}>
          <View className="items-center gap-2">
            <View style={ring(!anonymous)}>
              <ProfilePhoto url={profile.photoUrl} name={profile.displayName} size="hero" />
            </View>
            <View className="items-center">
              <Text variant="label">{tr.profile.ownPhoto}</Text>
              <Text variant="fine" tone={anonymous ? 'muted' : 'accent'}>
                {anonymous ? tr.profile.whenProfiled : tr.profile.ownPhotoNote}
              </Text>
            </View>
          </View>
          <View className="items-center gap-2">
            <View style={ring(!!anonymous)}>
              <LookAvatar
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
                    backgroundColor: colors.primary,
                    borderWidth: SPACING[0.5] + SPACING[0.5] / 2,
                    borderColor: colors.canvas,
                  }}
                >
                  <AppIcon name="pencil" size={ICON.sm} color={colors.onPrimary} />
                </Pressable>
              ) : null}
            </View>
            <View className="items-center">
              <Text variant="label">{tr.profile.ownCapsule}</Text>
              <Text variant="fine" tone={anonymous ? 'accent' : 'muted'}>
                {anonymous ? tr.profile.ownPhotoNote : tr.profile.ownCapsuleNote}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <ProfilePhoto url={profile.photoUrl} name={profile.displayName} size="hero" />
      )}
      <Text variant="title" align="center" accessibilityRole="header" className="mt-1">
        {profile.displayName ?? tr.profile.noName}
        {profile.displayName && profile.age !== null ? (
          <Text variant="title" tone="muted">
            {tr.profile.ageAfterName(profile.age)}
          </Text>
        ) : null}
      </Text>
      {profile.bio ? (
        <Text variant="subtitle" align="center">
          {profile.bio}
        </Text>
      ) : null}
      {children ? <View className="mt-1.5 self-stretch">{children}</View> : null}
    </View>
  );
}

// The venue chat sender's card (ChatProfileView, which has no public_id; its v45 look comes with
// step 4.4): the photo across the top (or the initials on the violet), then the name with the age
// and the bio.
export function ProfileHero({ profile, overlay }: { profile: Profile; overlay?: ReactNode }) {
  const { colors, shape } = useTheme();
  // The initials also when the photo cannot be loaded.
  const photo = usePhoto(profile.photoUrl);
  const letters = (profile.displayName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
  return (
    <View className="gap-4">
      <View
        className="items-center justify-center overflow-hidden"
        style={{
          height: HERO_HEIGHT,
          marginHorizontal: -shape.screenPadding,
          marginTop: -SPACING[3],
          backgroundColor: photo.url || !letters ? colors.surface2 : colors.violet,
        }}
      >
        {photo.url ? (
          <PhotoImage
            url={photo.url}
            onError={photo.onError}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        ) : letters ? (
          <Text variant="score" tone="onViolet">
            {letters}
          </Text>
        ) : (
          <Mark size={SPACING[16] + SPACING[8]} label={null} />
        )}
        {overlay ? (
          <View style={{ position: 'absolute', top: SPACING[3], left: SPACING[3] }}>{overlay}</View>
        ) : null}
      </View>
      <View className="gap-1">
        <Text variant="alias" accessibilityRole="header">
          {nameLine(profile)}
        </Text>
        {profile.bio ? <Text tone="muted">{profile.bio}</Text> : null}
      </View>
    </View>
  );
}

// Each badge's icon (scripts/icon/glyphs.ts → BADGE_GLYPHS) and colour (canvas: Rozetler).
const BADGE_LOOK: Record<
  BadgeId,
  { icon: ImageSourcePropType; tone: readonly [keyof Palette, keyof Palette] }
> = {
  first_game: {
    icon: require('../../../assets/glyph/badge-first_game.png'),
    tone: ['buzz', 'onBuzz'],
  },
  ten_games: {
    icon: require('../../../assets/glyph/badge-ten_games.png'),
    tone: ['calm', 'onCalm'],
  },
  voice_tabu_five_wins: {
    icon: require('../../../assets/glyph/badge-voice_tabu_five_wins.png'),
    tone: ['lively', 'onLively'],
  },
  five_tables: {
    icon: require('../../../assets/glyph/badge-five_tables.png'),
    tone: ['violet', 'onViolet'],
  },
};
const LOCK_ICON: ImageSourcePropType = require('../../../assets/glyph/lock.png');

// One badge: its icon on its own colour when earned; a quiet disc, a faint icon and a lock when not.
export function BadgeIcon({ badge, earned }: { badge: BadgeId; earned: boolean }) {
  const { colors, shape } = useTheme();
  const look = BADGE_LOOK[badge];
  const [bg, fg] = earned
    ? [colors[look.tone[0]], colors[look.tone[1]]]
    : [colors.surface2, colors.muted];
  return (
    <View
      className="items-center justify-center"
      style={{ width: BADGE, height: BADGE, borderRadius: shape.radius.pill, backgroundColor: bg }}
    >
      <Image
        // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
        fadeDuration={0}
        source={look.icon}
        accessible={false}
        style={{
          width: BADGE_GLYPH,
          height: BADGE_GLYPH,
          tintColor: fg,
          opacity: earned ? 1 : 0.6,
        }}
      />
      {earned ? null : (
        <View
          className="absolute items-center justify-center"
          style={{
            right: 0,
            bottom: 0,
            width: LOCK + SPACING[1],
            height: LOCK + SPACING[1],
            borderRadius: shape.radius.pill,
            backgroundColor: colors.surface,
          }}
        >
          <Image
            // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
            fadeDuration={0}
            source={LOCK_ICON}
            accessible={false}
            style={{
              width: LOCK - SPACING[1.5],
              height: LOCK - SPACING[1.5],
              tintColor: colors.muted,
            }}
          />
        </View>
      )}
    </View>
  );
}

// Badges as round tiles. `all`: the own profile shows every badge, the locked ones quiet; another
// person's card shows only what they earned, or the mark and "Oynadıkça rozet kazanırsın".
export function Badges({ badges, all = false }: { badges: readonly BadgeId[]; all?: boolean }) {
  if (badges.length === 0 && !all) {
    return (
      <Card>
        <View className="flex-row items-center gap-3">
          <Mark size={SPACING[11]} label={null} />
          <Text className="flex-1">{tr.profile.noBadges}</Text>
        </View>
      </Card>
    );
  }
  const shown = all ? BADGES.map((b) => b.id) : badges;
  return (
    <View className="flex-row flex-wrap gap-y-4">
      {shown.map((badge) => {
        const earned = badges.includes(badge);
        return (
          <View
            key={badge}
            className="items-center gap-2"
            style={{ width: '25%' }}
            accessible
            accessibilityLabel={
              earned ? tr.profile.badges[badge] : tr.profile.badgeLocked(tr.profile.badges[badge])
            }
          >
            <BadgeIcon badge={badge} earned={earned} />
            <Text variant="label" tone={earned ? 'text' : 'muted'} align="center">
              {tr.profile.badges[badge]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
