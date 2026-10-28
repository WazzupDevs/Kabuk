import { TABLE_ICONS } from '@shared/tableIcons.ts';
import { Image, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { TABLE_ICON_IMAGES } from './tableIconImages';

// A table's icon (docs/SPEC_V4.md §4.E, K-45): v46's 256 px WebP, a square with rounded corners,
// the radius 28% of the side at every size. Sizes from v46's report (§1, "Masa simgeleri").
export const TABLE_ICON_SIZE = {
  // Açık masalar and Süren masalar.
  lobby: 48, // skall tuvali: `.thumb.s48`
  // The person's own table card on Mekan (larger since the owner's call, 27 Ekim).
  mine: 64,
  // Masa kur's name row (the pencil button) and the picker's grid.
  picker: 56,
  // A join request row.
  request: 40,
  // The table screen's top line and a row in Masadakiler.
  row: 36,
  // The table in the middle of its scene (docs/design/aura → Masa).
  stage: 104,
} as const;
export const TABLE_ICON_RADIUS_SHARE = 0.28;
// A scene at another table of the venue in Masa kur's picker (v46: .mk-g[aria-disabled]).
export const TABLE_ICON_TAKEN_OPACITY = 0.32;

type Size = keyof typeof TABLE_ICON_SIZE;

const NAMES = new Map(TABLE_ICONS.map((i) => [i.id, i.name]));

export function tableIconName(icon: string | null): string | undefined {
  return icon ? NAMES.get(icon) : undefined;
}

// `icon` null or unknown (a table from before 4.5, an icon taken out of the list): a plain tile.
// The icon tells nothing about anyone; the screen reader reads the scene's name.
export function TableIcon({ icon, size }: { icon: string | null; size: Size }) {
  const { colors } = useTheme();
  const side = TABLE_ICON_SIZE[size];
  const source = icon ? TABLE_ICON_IMAGES[icon] : undefined;
  const style = { width: side, height: side, borderRadius: side * TABLE_ICON_RADIUS_SHARE };
  if (!source) return <View style={[style, { backgroundColor: colors.surface2 }]} />;
  return (
    <Image
      // No fade-in: a photo drawn again does not blink (Android fades 300 ms by default).
      fadeDuration={0}
      source={source}
      style={style}
      accessibilityLabel={icon ? NAMES.get(icon) : undefined}
      accessibilityIgnoresInvertColors
    />
  );
}
