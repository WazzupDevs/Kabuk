import { memo } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import type { ChatWallKind, WallpaperCanvas } from '@/theme/chatWallpaper';
import type { ColorScheme } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

// The chat walls as Telegram Android draws its chat backgrounds (the owner's call, 30 Ekim): one
// picture from the top of the screen to its foot, a soft four-colour gradient with skall's quiet
// pattern over it (scripts/art/walls.ts), each chat its own (DM, Masa, Mekan; light and dark). One
// image for the whole screen: a tile laid edge to edge left seams where its edges fell between
// pixels. It stays where it is while the messages scroll over it and the keyboard comes and goes.
const WALLS: Record<ChatWallKind, Record<ColorScheme, ImageSourcePropType>> = {
  dm: {
    light: require('../../assets/wall/dm-light.webp'),
    dark: require('../../assets/wall/dm-dark.webp'),
  },
  masa: {
    light: require('../../assets/wall/masa-light.webp'),
    dark: require('../../assets/wall/masa-dark.webp'),
  },
  mekan: {
    light: require('../../assets/wall/mekan-light.webp'),
    dark: require('../../assets/wall/mekan-dark.webp'),
  },
};

// The picture over the chat's whole area (`canvas`: its width and the tallest height it has had,
// so the keyboard never scales it), from the area's top.
export const ChatWallpaper = memo(function ChatWallpaper({
  kind,
  canvas,
}: {
  kind: ChatWallKind;
  canvas: WallpaperCanvas;
}) {
  const { scheme } = useTheme();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <Image
        source={WALLS[kind][scheme]}
        fadeDuration={0}
        resizeMode="cover"
        accessible={false}
        style={{ position: 'absolute', left: 0, top: 0, width: canvas.w, height: canvas.h }}
      />
    </View>
  );
});

// How many steps a band's soft edge takes; each a strip of the picture a little fainter.
const FADE_STEPS = 8;

// A strip of the same picture over what scrolls under the system bars (the status bar's words, the
// navigation bar's buttons), lined up with the one behind; `fade` more of it fades out below
// (`down`) or above (`up`) it. `top` and `height` on the chat's area.
export function WallBand({
  kind,
  canvas,
  top,
  height,
  fade,
  direction,
}: {
  kind: ChatWallKind;
  canvas: WallpaperCanvas;
  top: number;
  height: number;
  fade: number;
  direction: 'down' | 'up';
}) {
  const { scheme } = useTheme();
  const strip = fade / FADE_STEPS;
  const slices = [
    { top, height, opacity: 1 },
    ...Array.from({ length: FADE_STEPS }, (_, i) => ({
      top: direction === 'down' ? top + height + i * strip : top - (i + 1) * strip,
      height: strip,
      opacity: 1 - (i + 1) / (FADE_STEPS + 1),
    })),
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {slices.map((s, i) =>
        s.height > 0 ? (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: s.top,
              height: s.height,
              overflow: 'hidden',
              opacity: s.opacity,
            }}
          >
            <Image
              source={WALLS[kind][scheme]}
              fadeDuration={0}
              resizeMode="cover"
              accessible={false}
              style={{
                position: 'absolute',
                left: 0,
                top: -s.top,
                width: canvas.w,
                height: canvas.h,
              }}
            />
          </View>
        ) : null,
      )}
    </View>
  );
}
