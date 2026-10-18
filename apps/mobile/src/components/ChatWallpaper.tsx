import { memo, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { type WallpaperCanvas, wallpaperCanvas, wallpaperSvg } from '@/theme/chatWallpaper';
import { useTheme } from '@/theme/ThemeProvider';

// The chat wallpaper (src/theme/chatWallpaper.ts) behind a chat's messages: one picture under
// everything, not touchable. ChatScroll scrolls the messages over it; the composer floats above
// (docs/SPEC_V4.md §4.C). It is drawn once at the area's width and the window's height and clipped
// to the area: the keyboard shortening the area does not redraw it, nor does a new message (memo).
// Only a new width or theme builds it again.
export const ChatWallpaper = memo(function ChatWallpaper() {
  const { scheme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [areaWidth, setAreaWidth] = useState<number | null>(null);
  const [canvas, setCanvas] = useState<WallpaperCanvas | null>(null);
  const next = areaWidth === null ? null : wallpaperCanvas(canvas, areaWidth, windowHeight);
  if (next !== canvas) setCanvas(next);
  const xml = useMemo(
    () => (canvas ? wallpaperSvg(scheme, canvas.w, canvas.h) : null),
    [scheme, canvas],
  );
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
      {xml && canvas ? <SvgXml xml={xml} width={canvas.w} height={canvas.h} /> : null}
    </View>
  );
});
