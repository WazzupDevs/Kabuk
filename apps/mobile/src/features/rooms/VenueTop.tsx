import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { LookAvatar } from '@/components/LookAvatar';
import { Banner } from '@/components/Banner';
import { BarIcon } from '@/components/BarIcon';
import { IconButton } from '@/components/IconButton';
import { LiveDot } from '@/components/LiveDot';
import { Loader } from '@/components/Loader';
import { usePressScale } from '@/components/motion';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { AnonSwitch } from '@/ui/AnonSwitch';

// The wordmark at the head of the row (docs/design/aura → Mekan: the mark and "skall").
const LOGO_HEIGHT = 30;
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;
// Longer venue names (a campus's full name) take the smaller title style, as ScreenHeader does.
const LONG_NAME = 22;

// The venue's name under the bar, "Mekandasın" with a live dot beside it (docs/design/aura →
// Mekan); longer names (a campus's full name) in the heading style.
export function VenueName({ name }: { name: string }) {
  return (
    <View className="flex-row items-center justify-between" style={{ gap: SPACING[3] }}>
      <Text
        variant={name.length > LONG_NAME ? 'heading' : 'title'}
        accessibilityRole="header"
        testID="venue-name"
        className="shrink"
      >
        {name}
      </Text>
      <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
        <LiveDot tone="success" periodMs={HERE_BEAT_MS} size={SPACING[2]} />
        <Text variant="fine" tone="text">
          {tr.venue.here}
        </Text>
      </View>
    </View>
  );
}

// The live dot's beat beside "Mekandasın".
const HERE_BEAT_MS = 1600;

// The venue screen's bar, fixed at the top while the page scrolls (the owner's call, 27 Ekim): the
// skall wordmark at its head (docs/design/aura → Mekan); on the right the anonymous switch, the own
// photo, which opens Profil, and "Mekandan ayrıl", a round button with the red bars' cross.
export function VenueTop({
  onLeave,
  leaving,
  identity,
  atTable,
}: {
  onLeave: () => void;
  leaving: boolean;
  // The check-in's identity (docs/SPEC_V4.md §4.D): the switch beside the photo.
  identity: { mode: 'anonymous' | 'profiled'; switchUsed: boolean };
  atTable: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [usedNote, setUsedNote] = useState(false);
  useEffect(() => {
    if (!usedNote) return undefined;
    const timer = setTimeout(() => setUsedNote(false), USED_NOTE_MS);
    return () => clearTimeout(timer);
  }, [usedNote]);
  const anonymous = identity.mode === 'anonymous';
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between" style={{ minHeight: TOUCH.min }}>
        <View pointerEvents="none" accessible={false}>
          <Wordmark height={LOGO_HEIGHT} />
        </View>
        <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
          <AnonSwitch
            testID="identity-switch"
            value={anonymous}
            used={identity.switchUsed}
            accessibilityLabel={anonymous ? tr.identity.switchOn : tr.identity.switchOff}
            onPress={() => setAsking(true)}
            onUsedPress={() => setUsedNote(true)}
          />
          <OwnPhoto anonymous={anonymous} />
          <IconButton
            round
            icon="close"
            testID="venue-leave"
            label={tr.venue.leave}
            onPress={onLeave}
            disabled={leaving}
            glyph={
              leaving ? (
                <Loader kind="meet" size={ICON.md} delay={0} label={null} />
              ) : (
                <BarIcon kind="cross" size={ICON.md} />
              )
            }
          />
        </View>
      </View>
      <IdentitySheet
        visible={asking}
        onClose={() => setAsking(false)}
        toAnonymous={!anonymous}
        atTable={atTable}
      />
      {usedNote ? <Banner tone="info" testID="identity-used" body={tr.identity.used} /> : null}
    </View>
  );
}

// The face this check-in shows (the owner's call, 27 Ekim): the capsule while anonymous, the photo
// while profiled; a switch turns one into the other (the old face shrinks and fades, the new one
// grows in with a little overshoot; at once with reduce motion).
const SWAP_MS = 280;

function OwnPhoto({ anonymous }: { anonymous: boolean }) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const reduce = useReduceMotion();
  const [shown] = useState(() => new Animated.Value(anonymous ? 1 : 0));
  useEffect(() => {
    const anim = Animated.timing(shown, {
      toValue: anonymous ? 1 : 0,
      duration: reduce ? 0 : SWAP_MS,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [anonymous, reduce, shown]);
  const face = (on: Animated.AnimatedInterpolation<number>) => ({
    position: 'absolute' as const,
    opacity: on.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ scale: on.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  });
  const capsuleOn = shown.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const photoOn = shown.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr.venue.openProfile}
      testID="venue-profile"
      onPress={() => router.navigate('/profile')}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              width: TOUCH.min,
              height: TOUCH.min,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: shape.radius.pill,
              borderWidth: shape.stroke.hairline,
              borderColor: colors.divider,
              backgroundColor: colors.surface,
              overflow: 'hidden',
            },
            pressScale(pressed),
          ]}
        >
          <Animated.View style={face(photoOn)}>
            {photo.name ? (
              <Avatar kind="profile" size="md" name={photo.name} photoUrl={photo.url} />
            ) : (
              <Avatar kind="default" size="md" />
            )}
          </Animated.View>
          <Animated.View
            style={face(capsuleOn)}
            testID={anonymous ? 'venue-face-capsule' : undefined}
          >
            {look ? (
              <LookAvatar look={look} size={AVATAR_SIZE.md} />
            ) : (
              <Avatar kind="default" size="md" />
            )}
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}
