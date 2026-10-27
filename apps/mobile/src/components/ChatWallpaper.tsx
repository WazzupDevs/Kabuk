import { memo, useState } from 'react';
import { Image, type ImageSourcePropType, useWindowDimensions, View } from 'react-native';

import {
  type ChatWallKind,
  WALL_TILE,
  type WallpaperCanvas,
  wallpaperCanvas,
} from '@/theme/chatWallpaper';
import type { ColorScheme } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

// The chat walls (skall tuvali: Dm, MasaSohbeti, MekanSohbeti): each wall's 300 dp tile (its ground
// and its lines, chatWalls.generated.ts) drawn once at 3× into assets/wall/ and laid edge to edge
// behind the messages. A picture per tile, not an SVG pattern over the whole screen: opening a
// chat no longer reads and draws the pattern each time (the owner's report, 27 Ekim: the app felt
// heavy). The size follows wallpaperCanvas: the keyboard only shortens the area.
const TILES: Record<ChatWallKind, Record<ColorScheme, ImageSourcePropType>> = {
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

export const ChatWallpaper = memo(function ChatWallpaper({ kind = 'dm' }: { kind?: ChatWallKind }) {
  const { scheme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [areaWidth, setAreaWidth] = useState<number | null>(null);
  const [canvas, setCanvas] = useState<WallpaperCanvas | null>(null);
  const next = areaWidth === null ? null : wallpaperCanvas(canvas, areaWidth, windowHeight);
  if (next !== canvas) setCanvas(next);
  const cols = canvas ? Math.ceil(canvas.w / WALL_TILE) : 0;
  const rows = canvas ? Math.ceil(canvas.h / WALL_TILE) : 0;
  const tile = TILES[kind][scheme];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden"
      onLayout={(e) => {
        const width = Math.ceil(e.nativeEvent.layout.width);
        setAreaWidth((w) => (w === width ? w : width));
      }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} className="flex-row">
          {Array.from({ length: cols }, (__, c) => (
            <Image
              key={c}
              source={tile}
              fadeDuration={0}
              accessible={false}
              style={{ width: WALL_TILE, height: WALL_TILE }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});
