import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { KANKI_SHADOW, type KankiId, type KankiPlace } from '@/theme/kankiMotion';
import { useTheme } from '@/theme/ThemeProvider';

// The riso buddies (assets/riso/buddies, 320x420).
const OPEN: Record<KankiId, ImageSourcePropType> = {
  b83534: require('../../assets/riso/buddies/riso_b83534.webp'),
  '7d5ef2': require('../../assets/riso/buddies/riso_7d5ef2.webp'),
  '3c95b1': require('../../assets/riso/buddies/riso_3c95b1.webp'),
  '4957ac': require('../../assets/riso/buddies/riso_4957ac.webp'),
  '1a80a9': require('../../assets/riso/buddies/riso_1a80a9.webp'),
  '6f419d': require('../../assets/riso/buddies/riso_6f419d.webp'),
  f280a5: require('../../assets/riso/buddies/riso_f280a5.webp'),
  af811f: require('../../assets/riso/buddies/riso_af811f.webp'),
  '9c96bd': require('../../assets/riso/buddies/riso_9c96bd.webp'),
  c189a4: require('../../assets/riso/buddies/riso_c189a4.webp'),
  d2fbb5: require('../../assets/riso/buddies/riso_d2fbb5.webp'),
  '1e1bef': require('../../assets/riso/buddies/riso_1e1bef.webp'),
  'peek-1': require('../../assets/riso/peek-1.webp'),
  'peek-2': require('../../assets/riso/peek-2.webp'),
};

// Where a buddy stands, scaled from the board's 350 wide frame to the scene's width.
function placeStyle(p: KankiPlace, k: number) {
  return {
    position: 'absolute' as const,
    width: p.width * k,
    height: p.height * k,
    ...(p.left !== undefined ? { left: p.left * k } : null),
    ...(p.right !== undefined ? { right: p.right * k } : null),
    ...(p.bottom !== undefined ? { bottom: p.bottom * k } : null),
    ...(p.top !== undefined ? { top: p.top * k } : null),
  };
}

// One riso buddy (`.stand`): its still picture over a soft shadow at its feet. `shadow: false` for
// one that looks over a field (`.peek`, no shadow on the board).
export function RisoKanki({
  place,
  scale,
  shadow = true,
  children,
}: {
  place: KankiPlace;
  scale: number;
  shadow?: boolean;
  children?: ReactNode;
}) {
  const { scheme } = useTheme();
  const box = placeStyle(place, scale);
  return (
    <View pointerEvents="none" style={box}>
      {shadow ? (
        <View
          style={{
            position: 'absolute',
            left: `${((1 - KANKI_SHADOW.width) / 2) * 100}%`,
            width: `${KANKI_SHADOW.width * 100}%`,
            bottom: `${KANKI_SHADOW.bottom * 100}%`,
            height: `${KANKI_SHADOW.height * 100}%`,
            borderRadius: box.width,
            backgroundColor: scheme === 'dark' ? KANKI_SHADOW.colorDark : KANKI_SHADOW.color,
            filter: [{ blur: KANKI_SHADOW.blur }],
          }}
        />
      ) : null}
      <Image source={OPEN[place.id]} style={StyleSheet.absoluteFill} contentFit="contain" />
      {children}
    </View>
  );
}
