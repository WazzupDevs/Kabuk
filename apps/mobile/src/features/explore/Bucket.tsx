import { View } from 'react-native';

import { PulseDot, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { VENUE_DETAIL } from '@/theme/venueDetail';

import type { CityVenue } from './useExploreVenues';

// A venue's liveliness as a dotted pill (5.1; tuval Kesfet: 24 high, 12/700): "Sessiz" in the soft
// green with a still dot, the livelier ones in pink with the beating dot. `tall`: on a venue's page
// (tuval Detay: 26 high, 12.5/700).
export function Bucket({ bucket, tall }: { bucket: CityVenue['bucket']; tall?: boolean }) {
  const { tags, scheme } = useKit();
  const calm = bucket === 'calm';
  const b = tall ? VENUE_DETAIL.bucket : EXPLORE.bucket;
  const tone = calm ? EXPLORE[scheme].calm : { bg: tags.pink.bg, fg: tags.pink.fg, dot: KIT.pink };
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: b.gap,
        minHeight: b.height,
        paddingLeft: b.padLeft,
        paddingRight: b.padRight,
        borderRadius: b.height / 2,
        backgroundColor: tone.bg,
      }}
    >
      {calm ? (
        <View
          style={{
            width: b.dot,
            height: b.dot,
            borderRadius: b.dot / 2,
            backgroundColor: tone.dot,
          }}
        />
      ) : (
        <PulseDot color={tone.dot} ring={KIT.pinkRing} size={b.dot} />
      )}
      <T v={tall ? 'detailPill' : 'bucket'} color={tone.fg}>
        {tr.explore.buckets[bucket]}
      </T>
    </View>
  );
}
