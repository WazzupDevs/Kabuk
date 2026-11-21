import { upperTr } from '@shared/trText.ts';
import type { ReactNode } from 'react';
import { Image, Pressable, Text as RNText, View, type ViewStyle } from 'react-native';

import { useLabOff } from '@/lib/drawLab';
import { usePhoto } from '@/lib/usePhoto';
import { avatarGround } from '@/aura/kit';
import { TABLE_AVATAR_INK, tableAvatarOf } from '@/theme/avatar';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { TABLE_AVATAR_IMAGES } from './Glyph';
import { Mark } from './Mark';
import { shadowParts } from './NativeShadow';
import { PhotoImage } from './PhotoImage';

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
  // A profile: the photo, or the display name's first letter (also when the photo cannot be loaded).
  // Tappable when it opens the profile card.
  | {
      kind: 'profile';
      name: string;
      photoUrl?: string | null;
      size?: Size;
      onPress?: () => void;
      accessibilityLabel?: string;
    };

// The initial's type at each size: the kit's face letters (theme/auraKit.ts → KIT_TYPE.av), so
// every face reads alike (the owner's call, 21 Kasım: "hepsi aynı olsun").
const LETTER = {
  xs: KIT_TYPE.av.xs,
  sm: KIT_TYPE.av.sm,
  md: KIT_TYPE.av.list,
  lg: KIT_TYPE.av.md,
  xl: KIT_TYPE.av.row,
  hero: KIT_TYPE.av.lg,
} as const satisfies Record<Size, unknown>;

// The face of a table or a person in chats, lists and cards: one look for every face (yeni arayüz
// tuvali ekran.css `.av`, the kit's Av): a ring in the surface's colour and a soft shadow (none in
// the dark), the same for a profile, an anonymous table and the empty face (21 Kasım). A profile
// without a photo shows its name's first letter on the name's flat colour.
export function Avatar(props: Props) {
  const { colors, scheme } = useTheme();
  const photo = usePhoto(props.kind === 'profile' ? props.photoUrl : null);
  const size = props.size ?? 'md';
  const side = AVATAR_SIZE[size];
  const shadowOff = useLabOff('golge');
  const shadow = shadowParts(shadowOff, KIT[scheme].faceShadow || undefined, undefined, side / 2);
  const ring =
    side < AVATAR_SIZE.sm
      ? KIT.size.avRingXs
      : side >= AVATAR_SIZE.hero
        ? KIT.size.avRingXl
        : KIT.size.avRing;

  let ground: ViewStyle;
  let inner: ReactNode;
  let label: string | undefined;
  if (props.kind === 'default') {
    ground = { backgroundColor: colors.surface2 };
    inner = <Mark size={Math.round(side * MARK_SHARE)} label={null} />;
    label = props.accessibilityLabel;
  } else if (props.kind === 'table') {
    const face = tableAvatarOf(props.alias);
    const icon = Math.round(side * ICON_SHARE);
    ground = { backgroundColor: face.color };
    inner = (
      <Image
        // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
        fadeDuration={0}
        source={TABLE_AVATAR_IMAGES[face.icon]}
        accessible={false}
        style={{ width: icon, height: icon, tintColor: TABLE_AVATAR_INK }}
        resizeMode="contain"
      />
    );
    label = props.alias;
  } else {
    ground = photo.url
      ? { backgroundColor: colors.surface2 }
      : gradientStyle(avatarGround(props.name, scheme));
    inner = photo.url ? (
      <PhotoImage url={photo.url} onError={photo.onError} style={{ width: side, height: side }} />
    ) : (
      // The disc does not grow with the text size, so its letter does not either; the name is
      // read from the label.
      <RNText maxFontSizeMultiplier={1} style={[LETTER[size], { color: KIT.white }]}>
        {upperTr(props.name.trim().charAt(0)) || '?'}
      </RNText>
    );
    label = props.accessibilityLabel ?? props.name;
  }

  // The face clips its picture, so its native shadow (NativeShadow.tsx) sits beside it in a box of
  // the same size; the same structure with or without it, so the photo never remounts.
  const face = (
    <View style={{ width: side, height: side }}>
      {shadow.node}
      <View
        style={[
          {
            width: side,
            height: side,
            borderRadius: side / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: ring,
            borderColor: KIT[scheme].faceRing,
            boxShadow: shadow.boxShadow,
          },
          ground,
        ]}
      >
        {inner}
      </View>
    </View>
  );
  if (props.kind !== 'profile' || !props.onPress) {
    return (
      <View accessible={!!label} accessibilityLabel={label}>
        {face}
      </View>
    );
  }
  // The avatar is small; the pressable area is at least 44.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={props.onPress}
      hitSlop={Math.max(0, (TOUCH.min - side) / 2)}
    >
      {face}
    </Pressable>
  );
}
