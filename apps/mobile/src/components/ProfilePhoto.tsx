import { View } from 'react-native';

import { usePhoto } from '@/lib/usePhoto';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { PhotoImage } from './PhotoImage';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from './NativeShadow';

// Row avatar (48), the sign-up preview beside its buttons (72), the sign-up photo step and the edit
// screen (104), and the profile's head (116, v45: .pav), which sits in a ring on a soft shadow.
export const PROFILE_PHOTO_SIZES = {
  small: TOUCH.button,
  medium: TOUCH.large + SPACING[2],
  large: 104,
  hero: 116,
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
  const hero = size === 'hero';
  // The hero's soft shadow natively (NativeShadow.tsx), in a box around the photo it would clip
  // on; the same structure with or without it, so the photo never remounts.
  const shadowOff = useLabOff('golge');
  const shadow = boxShadowParts(shadowOff, hero ? shape.shadow.card : null, side / 2);
  const frame = {
    width: side,
    height: side,
    borderRadius: shape.radius.pill,
    borderWidth: hero ? SPACING[1] : shape.stroke.card,
    borderColor: hero ? colors.surface : colors.border,
    boxShadow: shadow.boxShadow,
  };

  if (photo.url) {
    return (
      <View style={{ width: side, height: side }}>
        {shadow.node}
        <PhotoImage
          url={photo.url}
          onError={photo.onError}
          style={[frame, { backgroundColor: colors.surface2 }]}
        />
      </View>
    );
  }
  const letters = name ? initials(name) : '';
  return (
    <View style={{ width: side, height: side }}>
      {shadow.node}
      <View
        className="items-center justify-center"
        style={[frame, { backgroundColor: letters ? colors.violet : colors.surface2 }]}
      >
        {letters ? (
          <Text variant={size === 'small' ? 'bodyStrong' : 'alias'} tone="onViolet">
            {letters}
          </Text>
        ) : (
          <AppIcon
            name="person"
            size={size === 'small' ? SPACING[6] : size === 'medium' ? SPACING[10] : SPACING[12]}
            color={colors.muted}
          />
        )}
      </View>
    </View>
  );
}
