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

// `size`: a list row's (Keşfet's thin rows); the radius keeps v46's share of the side.
export function VenueThumb({ kind, size }: { kind: V46ThumbKind; size?: number }) {
  const { scheme } = useTheme();
  const t = V46_EXPLORE[scheme].row.thumb;
  const w = size ?? t.size[0];
  const h = size ?? t.size[1];
  const radius = size ? (t.radius * size) / t.size[0] : t.radius;
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden' }}>
      <Image
        source={PICTURE[kind]}
        fadeDuration={0}
        accessible={false}
        style={{ width: w, height: h }}
      />
    </View>
  );
}
