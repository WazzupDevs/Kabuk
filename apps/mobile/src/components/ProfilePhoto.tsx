import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';

import { usePhoto } from '@/lib/usePhoto';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';

// Row avatar (48), the sign-up preview beside its buttons (72) and profile head (104, the mockup's
// size). The sign-up photo step's empty circle takes the large size too.
export const PROFILE_PHOTO_SIZES = {
  small: TOUCH.button,
  medium: TOUCH.large + SPACING[2],
  large: 104,
} as const;
const SIZES = PROFILE_PHOTO_SIZES;

type Props = { url: string | null; name?: string | null; size?: keyof typeof SIZES };

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

// The profile photo, or the initials on the violet when there is none or it cannot be loaded.
export function ProfilePhoto({ url, name, size = 'large' }: Props) {
  const { colors, shape } = useTheme();
  const photo = usePhoto(url);
  const side = SIZES[size];
  const frame = {
    width: side,
    height: side,
    borderRadius: shape.radius.pill,
    borderWidth: shape.stroke.card,
    borderColor: colors.border,
  };

  if (photo.url) {
    return (
      <Image
        source={{ uri: photo.url }}
        onError={photo.onError}
        accessibilityIgnoresInvertColors
        style={[frame, { backgroundColor: colors.surface2 }]}
      />
    );
  }
  const letters = name ? initials(name) : '';
  return (
    <View
      className="items-center justify-center"
      style={[frame, { backgroundColor: letters ? colors.violet : colors.surface2 }]}
    >
      {letters ? (
        <Text variant={size === 'small' ? 'bodyStrong' : 'alias'} tone="onViolet">
          {letters}
        </Text>
      ) : (
        <Ionicons
          name="person"
          size={size === 'small' ? SPACING[6] : size === 'medium' ? SPACING[10] : SPACING[12]}
          color={colors.muted}
        />
      )}
    </View>
  );
}
