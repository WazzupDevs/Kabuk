import { memo, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import {
  type ChatWallKind,
  WALL_TILE,
  type WallpaperCanvas,
  wallpaperCanvas,
} from '@/theme/chatWallpaper';
import type { ColorScheme } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

// The chat walls, WhatsApp-like (the owner's call, 28 Ekim): each chat's line drawings
// (chatWalls.generated.ts: the DM's, the table's, the venue's) laid densely, eleven a row with a
// little turn each, on a see-through 300 dp tile in the chat's soft tint (light and dark), drawn
// once at 3× into assets/wall/ and laid edge to edge over the clouds, behind the messages. A picture per tile, not an SVG pattern over the whole screen: opening a
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

// `place`: where it lies in its parent (all of it by default). `shift`: how far below the screen's
// top it starts, so its tiles line up with the screen's: the chat lays one under the stream and
// strips of it above and below (the top bar, the system bars), and they meet without a seam (the
// owner's report, 29 Ekim: the wall stopped under the top bar).
export const ChatWallpaper = memo(function ChatWallpaper({
  kind = 'dm',
  place = StyleSheet.absoluteFill,
  shift = 0,
}: {
  kind?: ChatWallKind;
  // A strip gives its height: only the rows it shows are laid.
  place?: ViewStyle & { height?: number };
  shift?: number;
}) {
  const { scheme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [areaWidth, setAreaWidth] = useState<number | null>(null);
  const [canvas, setCanvas] = useState<WallpaperCanvas | null>(null);
  const next = areaWidth === null ? null : wallpaperCanvas(canvas, areaWidth, windowHeight);
  if (next !== canvas) setCanvas(next);
  const offset = Math.round(shift) % WALL_TILE;
  const cols = canvas ? Math.ceil(canvas.w / WALL_TILE) : 0;
  const tall = typeof place.height === 'number' ? place.height : (canvas?.h ?? 0);
  const rows = canvas ? Math.ceil((tall + offset) / WALL_TILE) : 0;
  const tile = TILES[kind][scheme];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[place, { overflow: 'hidden' }]}
      onLayout={(e) => {
        const width = Math.ceil(e.nativeEvent.layout.width);
        setAreaWidth((w) => (w === width ? w : width));
      }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} className="flex-row" style={r === 0 ? { marginTop: -offset } : undefined}>
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
