import { Image, type ImageSourcePropType, View } from 'react-native';

import type { VenueType } from '@/lib/venueType';
import { VENUE_THUMB as t } from '@/theme/auraKit';

// A venue's icon: a rounded square with its type's picture in the aura look (scripts/art/art.ts;
// the owner's call, 29 Ekim): kafe a cup with steam, çay bahçesi a tea glass, yemek a plate with
// köfte, kampüs books under a cap. The map's pins are the same pictures cut round
// (components/Glyph → TYPE_PIN_IMAGES).
const PICTURE: Record<VenueType, ImageSourcePropType> = {
  kafe: require('../../assets/venue/kafe.webp'),
  cay: require('../../assets/venue/cay.webp'),
  yemek: require('../../assets/venue/yemek.webp'),
  kampus: require('../../assets/venue/kampus.webp'),
};

// `size`: a list row's (Keşfet's thin rows); the radius keeps its share of the side.
export function VenueThumb({ kind, size }: { kind: VenueType; size?: number }) {
  const w = size ?? t.size;
  const h = size ?? t.size;
  const radius = size ? (t.radius * size) / t.size : t.radius;
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
