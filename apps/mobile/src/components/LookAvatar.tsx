import { useMemo } from 'react';
import { View } from 'react-native';

import { lookSvg } from '@/theme/capsuleLook';
import { CachedSvg } from './CachedSvg';

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
      <CachedSvg xml={xml} width={size} height={size} />
    </View>
  );
}
