import { Image } from 'expo-image';
import { View } from 'react-native';

import { Glass, T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';

const PICTURE = require('../../../assets/riso/empty-venues.webp');

// Keşfet's empty result (docs/design/iskelet.md → 3.4): a small card, the riso picture 104x72 at
// its left, the title and one sentence at its right; never half the screen.
export function EmptyCard({
  title,
  body,
  testID,
}: {
  title: string;
  body: string | null;
  testID?: string;
}) {
  const card = KIT.size.explore.card;
  const pic = KIT.size.explore.empty;
  return (
    <Glass
      testID={testID}
      radius={card.radius}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: card.gap,
        padding: card.pad,
        borderRadius: card.radius,
      }}
    >
      <Image
        source={PICTURE}
        accessible={false}
        contentFit="cover"
        style={{ width: pic.width, height: pic.height, borderRadius: pic.radius }}
      />
      <View style={{ flex: 1, minWidth: 0, gap: card.lineGap }}>
        <T v="h3">{title}</T>
        {body ? <T v="fine">{body}</T> : null}
      </View>
    </Glass>
  );
}
