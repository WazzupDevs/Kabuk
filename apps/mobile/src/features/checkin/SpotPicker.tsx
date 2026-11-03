import { type ImageSourcePropType, View } from 'react-native';

import { Thumb } from '@/aura/kit';
import { Choice } from '@/components/Choice';
import { TABLE_ICON_IMAGES } from '@/features/rooms/tableIconImages';
import { TABLE_ICONS } from '@shared/tableIcons.ts';

import { tr } from '@/i18n/tr';

import type { VenueSpot } from './spots';

type Props = {
  spots: readonly VenueSpot[];
  selectedId: string | null;
  onSelect: (spot: VenueSpot) => void;
};

// "Neredesin?" (MekanNoktaDegistir, v71; docs/decisions/aura-v71-eklenen.md, karar 2): the
// venue's spots as `.opt` rows (60 high, the picture 44 and 14 round, the radio after the name), a
// single choice. Shared by check-in and the spot change, which look the same.
export function SpotPicker({ spots, selectedId, onSelect }: Props) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.checkin.spotTitle}
      style={{ gap: GAP }}
    >
      {spots.map((spot) => (
        <Choice
          key={spot.id}
          testID={`spot-${spot.ref}`}
          label={spot.name}
          minHeight={ROW}
          picture={<Thumb source={spotPicture(spot.ref)} size={THUMB} radius={THUMB_RADIUS} />}
          selected={spot.id === selectedId}
          onPress={() => onSelect(spot)}
        />
      ))}
    </View>
  );
}

const GAP = 8;
// `.vi`: the spot's picture 44, 14 round.
const THUMB = 44;
const THUMB_RADIUS = 14;

// The spots with a riso picture of their own (Aura v65 §9.1: İç salon, Bahçe).
const RISO_SPOTS: Record<string, ImageSourcePropType> = {
  'ic-salon': require('../../../assets/riso/spot-ic-salon.webp'),
  bahce: require('../../../assets/riso/spot-bahce.webp'),
};

// A spot's picture (docs/design/aura → CheckIn): its riso picture, or until the others come (§9.2)
// one of the table pictures, always the same for a spot. It says nothing about who is there.
function spotPicture(ref: string) {
  const riso = RISO_SPOTS[ref];
  if (riso) return riso;
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = (h * 31 + ref.charCodeAt(i)) >>> 0;
  const icon = TABLE_ICONS[h % TABLE_ICONS.length];
  return icon ? TABLE_ICON_IMAGES[icon.id] : undefined;
}
const ROW = 60;
