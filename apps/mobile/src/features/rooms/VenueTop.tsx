import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { LookAvatar } from '@/components/LookAvatar';
import { Banner } from '@/components/Banner';
import { BarIcon } from '@/components/BarIcon';
import { IconButton } from '@/components/IconButton';
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

// The wordmark in the middle of the row (v45: .va .logo svg, 22 px high).
const LOGO_HEIGHT = 22;
// The note that the one change is spent stays this long.
const USED_NOTE_MS = 2600;
// Longer venue names (a campus's full name) take the smaller title style, as ScreenHeader does.
const LONG_NAME = 22;

// The venue screen's top (v45: .top): "Mekandan ayrıl" on the left, a round button with the red
// bars' cross; the wordmark in the middle; the own photo on the right, which opens Profil. The
// anonymous switch beside the photo comes with step 4.4. Under the row the venue's name.
export function VenueTop({
  venueName,
  onLeave,
  leaving,
  identity,
  atTable,
}: {
  venueName: string;
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
        </View>
      </View>
      <IdentitySheet
        visible={asking}
        onClose={() => setAsking(false)}
        toAnonymous={!anonymous}
        atTable={atTable}
      />
      {usedNote ? <Banner tone="info" testID="identity-used" body={tr.identity.used} /> : null}
      <Text
        variant={venueName.length > LONG_NAME ? 'title' : 'display'}
        accessibilityRole="header"
        testID="venue-name"
      >
        {venueName}
      </Text>
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
