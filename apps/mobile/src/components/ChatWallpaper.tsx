import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { wallpaperSvg } from '@/theme/chatWallpaper';
import { useTheme } from '@/theme/ThemeProvider';

// The chat wallpaper (src/theme/chatWallpaper.ts) behind a chat's messages: one picture, drawn once
// for the area it fills, under everything and not touchable. ChatScroll scrolls the messages over
// it; the composer floats above (docs/SPEC_V4.md §4.C).
export function ChatWallpaper() {
  const { scheme } = useTheme();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const xml = useMemo(() => (size ? wallpaperSvg(scheme, size.w, size.h) : null), [scheme, size]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        const w = Math.ceil(width);
        const h = Math.ceil(height);
        setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
      }}
    >
      {xml && size ? <SvgXml xml={xml} width={size.w} height={size.h} /> : null}
    </View>
  );
}
