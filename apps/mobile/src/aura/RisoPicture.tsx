import { Image, type ImageSourcePropType, View } from 'react-native';

import { boxShadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { KIT } from '@/theme/auraKit';

import { useKit } from './kit';

// A ready riso picture (Aura v65 §9.1, U12: packed, never drawn by the app) at its board's size and
// corner; `shadow` the board's (an empty state's --shadow-card, a small one's --shadow-raised).
export function RisoPicture({
  source,
  width,
  height,
  radius,
  shadow = 'card',
}: {
  source: ImageSourcePropType;
  width: number;
  height: number;
  radius: number;
  shadow?: 'card' | 'raised' | 'none';
}) {
  const { c } = useKit();
  // The dark scheme draws no shadow (its card shadow is empty).
  const value =
    shadow === 'none' || !c.cardShadow ? '' : shadow === 'card' ? c.cardShadow : KIT.thumbShadow;
  const parts = boxShadowParts(useLabOff('golge'), value || undefined, radius);
  return (
    <View style={{ width, height, borderRadius: radius, boxShadow: parts.boxShadow }}>
      {parts.node}
      <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
        <Image
          source={source}
          fadeDuration={0}
          accessible={false}
          resizeMode="cover"
          style={{ width, height }}
        />
      </View>
    </View>
  );
}
