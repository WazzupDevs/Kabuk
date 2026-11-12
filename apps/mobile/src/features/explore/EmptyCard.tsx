import { Image } from 'expo-image';
import { View } from 'react-native';

import { Glass, T, useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';

const PICTURE: number = require('../../../assets/riso/empty-venues.webp');
const EMPTY_LINE_GAP = 4;

// The small empty card (docs/design/iskelet.md → 3.4; Keşfet's empty result, a venue page's
// events): the riso picture 104x72 at its left, the title and one sentence at its right; never half
// the screen. `picture`: a riso of its own (a bundled asset), Keşfet's venues by default.
export function EmptyCard({
  title,
  body,
  picture = PICTURE,
  testID,
  pictureTestID,
}: {
  title: string;
  body: string | null;
  picture?: number;
  testID?: string;
  // The picture's own id (E2E K14: `empty-riso-<ad>`, as EmptyState's).
  pictureTestID?: string;
}) {
  const card = KIT.size.explore.card;
  const pic = KIT.size.explore.empty;
  const { c, scheme } = useKit();
  return (
    // The venue cards' face (tuval Kesfet `.card`, iskelet.md → 2.2).
    <Glass
      face={EXPLORE[scheme].card}
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
        testID={pictureTestID}
        source={picture}
        accessible={false}
        contentFit="cover"
        style={{ width: pic.width, height: pic.height, borderRadius: pic.radius }}
      />
      {/* tuval Detay, Aktivite: the title 15.5/700, its sentence 13/500 at 1.4, 4 apart. */}
      <View style={{ flex: 1, minWidth: 0, gap: EMPTY_LINE_GAP }}>
        <T v="emptyTitle">{title}</T>
        {body ? (
          <T v="emptyNote" color={c.muted}>
            {body}
          </T>
        ) : null}
      </View>
    </Glass>
  );
}
