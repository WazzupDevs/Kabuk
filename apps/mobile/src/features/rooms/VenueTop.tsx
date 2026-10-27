import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { BarIcon } from '@/components/BarIcon';
import { IconButton } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { usePressScale } from '@/components/motion';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
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
          <OwnPhoto />
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

// The own photo in a ring on a soft shadow (v45: .top .me); the initials without one.
function OwnPhoto() {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const photo = useOwnPhoto();
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
              // skall tuvali (Mekan): the round button's face, the photo inside it.
              borderRadius: shape.radius.pill,
              borderWidth: shape.stroke.hairline,
              borderColor: colors.divider,
              backgroundColor: colors.surface,
              overflow: 'hidden',
            },
            pressScale(pressed),
          ]}
        >
          {photo.name ? (
            <Avatar kind="profile" size="md" name={photo.name} photoUrl={photo.url} />
          ) : (
            <Avatar kind="default" size="md" />
          )}
        </View>
      )}
    </Pressable>
  );
}
