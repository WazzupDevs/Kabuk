import { Image, Pressable, View } from 'react-native';

import { usePhoto } from '@/lib/usePhoto';
import { initials, TABLE_AVATAR_INK, tableAvatarOf } from '@/theme/avatar';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { TABLE_AVATAR_IMAGES } from './Glyph';
import { Mark } from './Mark';
import { Text } from './Text';

// xs 20 (the friends' photos on the profile's "Arkadaşlar"), sm 32 (chat), md 40 (top bars), lg 48,
// xl 48 (list rows; skall tuvali `.av.s48`), hero 72 (the table card).
export const AVATAR_SIZE = {
  xs: SPACING[5],
  sm: SPACING[8],
  md: SPACING[10],
  lg: TOUCH.button,
  xl: SPACING[12],
  hero: SPACING[16] + SPACING[2],
} as const;

type Size = keyof typeof AVATAR_SIZE;

// The table icon's share of the disc; the mark's share of the default face.
const ICON_SHARE = 0.6;
const MARK_SHARE = 0.72;

type Props =
  // An anonymous table: a game-night icon on a coloured disc, picked from the alias, so every phone
  // shows a table with the same face (its own one too); a new name brings a new face. Never
  // tappable (no profile).
  | { kind: 'table'; alias: string; size?: Size }
  // No face yet, or nobody to show: the mark on a quiet disc.
  | { kind: 'default'; size?: Size; accessibilityLabel?: string }
  // A profile: the photo, or the display name's initials (also when the photo cannot be loaded).
  // Tappable when it opens the profile card.
  | {
      kind: 'profile';
      name: string;
      photoUrl?: string | null;
      size?: Size;
      onPress?: () => void;
      accessibilityLabel?: string;
    };

// The face of a table or a person in chats, lists and cards (the skall design system → Avatar).
export function Avatar(props: Props) {
  const { colors, shape } = useTheme();
  const photo = usePhoto(props.kind === 'profile' ? props.photoUrl : null);
  const side = AVATAR_SIZE[props.size ?? 'md'];
  const frame = {
    width: side,
    height: side,
    borderRadius: shape.radius.pill,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (props.kind === 'default') {
    return (
      <View
        accessible={!!props.accessibilityLabel}
        accessibilityLabel={props.accessibilityLabel}
        style={[frame, { backgroundColor: colors.surface2 }]}
      >
        <Mark size={Math.round(side * MARK_SHARE)} label={null} />
      </View>
    );
  }

  if (props.kind === 'table') {
    const face = tableAvatarOf(props.alias);
    const icon = Math.round(side * ICON_SHARE);
    return (
      <View
        accessible
        accessibilityLabel={props.alias}
        style={[frame, { backgroundColor: face.color }]}
      >
        <Image
          // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
          fadeDuration={0}
          source={TABLE_AVATAR_IMAGES[face.icon]}
          accessible={false}
          style={{ width: icon, height: icon, tintColor: TABLE_AVATAR_INK }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const inner = photo.url ? (
    <Image
      // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
      fadeDuration={0}
      source={{ uri: photo.url }}
      onError={photo.onError}
      accessibilityIgnoresInvertColors
      style={{ width: side, height: side }}
    />
  ) : (
    <Text
      // The heading weight (700), about 38 % of the disc.
      variant={
        side >= AVATAR_SIZE.hero
          ? 'title'
          : side >= AVATAR_SIZE.xl
            ? 'mark'
            : side >= AVATAR_SIZE.lg
              ? 'heading'
              : side >= AVATAR_SIZE.md
                ? 'gameName'
                : 'caption'
      }
      tone="onViolet"
      // The disc does not grow with the text size, so its letters do not either (two letters at
      // the largest size would spill out of the 20 dp disc); the name is read from the label.
      maxFontSizeMultiplier={1}
    >
      {initials(props.name)}
    </Text>
  );
  const face = (
    <View style={[frame, { backgroundColor: photo.url ? colors.surface2 : colors.violet }]}>
      {inner}
    </View>
  );
  if (!props.onPress) {
    return (
      <View accessible accessibilityLabel={props.accessibilityLabel ?? props.name}>
        {face}
      </View>
    );
  }
  // The avatar is small; the pressable area is at least 44.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? props.name}
      onPress={props.onPress}
      hitSlop={Math.max(0, (TOUCH.min - side) / 2)}
    >
      {face}
    </Pressable>
  );
}
