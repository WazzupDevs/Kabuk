import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BarIcon } from '@/components/BarIcon';
import { IconButton } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { usePressScale } from '@/components/motion';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, TOUCH } from '@/theme/tokens';

// The wordmark in the middle of the row (v45: .va .logo svg, 22 px high).
const LOGO_HEIGHT = 22;
// Longer venue names (a campus's full name) take the smaller title style, as ScreenHeader does.
const LONG_NAME = 22;

// The venue screen's top (v45: .top): "Mekandan ayrıl" on the left, a round button with the red
// bars' cross; the wordmark in the middle; the own photo on the right, which opens Profil. The
// anonymous switch beside the photo comes with step 4.4. Under the row the venue's name.
export function VenueTop({
  venueName,
  onLeave,
  leaving,
}: {
  venueName: string;
  onLeave: () => void;
  leaving: boolean;
}) {
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
        <OwnPhoto />
      </View>
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
