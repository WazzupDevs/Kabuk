import { Image, type ImageSourcePropType, View } from 'react-native';

import { V46_EXPLORE, type V46ThumbKind } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

// A venue's icon: a rounded square with its type's picture in the aura look (scripts/art/art.ts;
// the owner's call, 29 Ekim): kafe a cup with steam, çay bahçesi a tea glass, yemek a plate with
// köfte, kampüs books under a cap. The map's pins are the same pictures cut round
// (components/Glyph → TYPE_PIN_IMAGES).
const PICTURE: Record<V46ThumbKind, ImageSourcePropType> = {
  kafe: require('../../assets/venue/kafe.webp'),
  cay: require('../../assets/venue/cay.webp'),
  yemek: require('../../assets/venue/yemek.webp'),
  kampus: require('../../assets/venue/kampus.webp'),
};

export function VenueThumb({ kind }: { kind: V46ThumbKind }) {
  const { scheme } = useTheme();
  const t = V46_EXPLORE[scheme].row.thumb;
  return (
    <View
      style={{ width: t.size[0], height: t.size[1], borderRadius: t.radius, overflow: 'hidden' }}
    >
      <Image
        source={PICTURE[kind]}
        fadeDuration={0}
        accessible={false}
        style={{ width: t.size[0], height: t.size[1] }}
      />
    </View>
  );
}
