import { Image, View } from 'react-native';

import { TABLE_ICON_IMAGES } from '@/features/rooms/tableIconImages';
import { V46_EXPLORE, type V46ThumbKind } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

// A venue's icon: a rounded square with its type's picture, from the table pictures in the app's
// own drawing style (the owner's call, 28 Ekim: the drawings were plain and alike), one for each
// type: kafe the espresso machine, çay bahçesi the teapot, yemek the canteen tray, kampüs the clock
// tower. The map's pins are the same pictures cut round (components/Glyph → TYPE_PIN_IMAGES).
const PICTURE: Record<V46ThumbKind, string> = {
  kafe: 'kafe-espresso',
  cay: 'kafe-demlik',
  yemek: 'kampus-kantin',
  kampus: 'kampus-saatkulesi',
};

export function VenueThumb({ kind }: { kind: V46ThumbKind }) {
  const { scheme } = useTheme();
  const t = V46_EXPLORE[scheme].row.thumb;
  return (
    <View
      style={{ width: t.size[0], height: t.size[1], borderRadius: t.radius, overflow: 'hidden' }}
    >
      <Image
        source={TABLE_ICON_IMAGES[PICTURE[kind]]}
        fadeDuration={0}
        accessible={false}
        style={{ width: t.size[0], height: t.size[1] }}
      />
    </View>
  );
}
