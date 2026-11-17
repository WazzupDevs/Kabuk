import { Image } from 'expo-image';
import { View } from 'react-native';

import { T } from '@/aura/kit';
import { VENUE_DETAIL as D } from '@/theme/venueDetail';

const PICTURE: number = require('../../../assets/riso/venue-week-empty.webp');

// A venue page's empty week (yeni arayüz tuvali, MekanDetay `.bos`): the riso picture 150 wide, the
// title and one sentence under it, all centred; no card around it.
export function WeekEmpty({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ alignItems: 'center', gap: D.empty.gap }}>
      <Image
        testID="empty-riso-venue-week"
        source={PICTURE}
        accessible={false}
        contentFit="contain"
        style={{ width: D.empty.picture, height: D.empty.picture * D.empty.ratio }}
      />
      <T v="venueEmptyTitle" ink center>
        {title}
      </T>
      <T v="venueHint" center>
        {body}
      </T>
    </View>
  );
}
