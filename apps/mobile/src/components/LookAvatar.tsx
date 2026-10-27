import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { lookSvg } from '@/theme/capsuleLook';

// The person's own capsule from its stored look (skall tuvali, Profil: "Kapsülün"), drawn by the
// v46 drawing library: the disc in the colour's ground with the capsule cut by it.
export function LookAvatar({
  look,
  size,
  accessibilityLabel,
}: {
  look: string;
  size: number;
  accessibilityLabel?: string;
}) {
  const xml = useMemo(() => lookSvg(look, 'av'), [look]);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}
