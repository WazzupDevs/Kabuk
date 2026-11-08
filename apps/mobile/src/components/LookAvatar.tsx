import { useMemo } from 'react';
import { View } from 'react-native';

import { stillSvg } from '@/theme/capsuleFx';
import { lookSvg } from '@/theme/capsuleLook';

import { readAhead } from './CachedSvg';
import { FxSvg } from './FxSvg';

// A look's avatar drawing, made once (the options of Kapsülünü süsle make the same ones again and
// again as the person moves between tabs).
const made = new Map<string, string>();
const KEEP = 600;
function avatarSvg(look: string): string {
  const hit = made.get(look);
  if (hit !== undefined) return hit;
  if (made.size >= KEEP) made.clear();
  const xml = lookSvg(look, 'av');
  made.set(look, xml);
  return xml;
}

// Reads a look's avatar ahead, still as a list shows it, so that it shows with nothing left to read.
export function readLookAhead(look: string): void {
  readAhead(stillSvg(avatarSvg(look)));
}

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
  const xml = useMemo(() => avatarSvg(look), [look]);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
    >
      <FxSvg xml={xml} width={size} height={size} />
    </View>
  );
}
