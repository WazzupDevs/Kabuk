import { Image, type ImageSourcePropType, View } from 'react-native';

import { boxShadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import type { VenueType } from '@/lib/venueType';
import { VENUE_THUMB as t } from '@/theme/auraKit';

// A venue's icon: a rounded square with its type's riso picture (Aura v65 §9.1: kafe, restoran,
// kampüs, çay bahçesi). The map's pins are the same pictures cut round in a white ring
// (components/Glyph → TYPE_PIN_IMAGES).
const PICTURE: Record<VenueType, ImageSourcePropType> = {
  kafe: require('../../assets/riso/venue-kafe.webp'),
  cay: require('../../assets/riso/venue-cay.webp'),
  yemek: require('../../assets/riso/venue-yemek.webp'),
  kampus: require('../../assets/riso/venue-kampus.webp'),
};

// `size`: a list row's (Keşfet's thin rows); the radius keeps its share of the side.
export function VenueThumb({ kind, size }: { kind: VenueType; size?: number }) {
  const w = size ?? t.size;
  const h = size ?? t.size;
  const radius = size ? (t.radius * size) / t.size : t.radius;
  const shadow = boxShadowParts(useLabOff('golge'), t.shadow, radius);
  return (
    <View style={{ width: w, height: h, borderRadius: radius, boxShadow: shadow.boxShadow }}>
      {shadow.node}
      <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden' }}>
        <Image
          source={PICTURE[kind]}
          fadeDuration={0}
          accessible={false}
          style={{ width: w, height: h }}
        />
      </View>
    </View>
  );
}
