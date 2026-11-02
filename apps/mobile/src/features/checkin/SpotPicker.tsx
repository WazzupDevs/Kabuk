import { type ImageSourcePropType, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { T, Thumb, useKit } from '@/aura/kit';
import { PopIn } from '@/aura/PopIn';
import { shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { useTheme } from '@/theme/ThemeProvider';
import { TABLE_ICON_IMAGES } from '@/features/rooms/tableIconImages';
import { TABLE_ICONS } from '@shared/tableIcons.ts';

import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

import type { VenueSpot } from './spots';

type Props = {
  spots: readonly VenueSpot[];
  selectedId: string | null;
  onSelect: (spot: VenueSpot) => void;
};

// "Neredesin?" (U18, CheckInNokta): the venue's spots as soft rows (68 high, 22 round, 10 in
// before the picture and 16 after the round mark), a single choice; the chosen one's mark ringed
// in the accent with the tick popping in it. Shared by check-in and the spot change.
export function SpotPicker({ spots, selectedId, onSelect }: Props) {
  const { c } = useKit();
  const { colors } = useTheme();
  const shadow = shadowParts(
    useLabOff('golge'),
    c.raisedShadow || undefined,
    undefined,
    ROW_RADIUS,
    true,
    KIT.size.edge,
  );
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.checkin.spotTitle}
      style={{ gap: GAP }}
    >
      {spots.map((spot) => {
        const on = spot.id === selectedId;
        return (
          <Pressable
            key={spot.id}
            testID={`spot-${spot.ref}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={spot.name}
            onPress={() => onSelect(spot)}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: KIT.size.rowGap,
                height: ROW,
                paddingLeft: PAD_LEFT,
                paddingRight: KIT.size.liPadX,
                borderRadius: ROW_RADIUS,
                backgroundColor: c.raisedRound,
                borderWidth: KIT.size.edge,
                borderColor: on ? colors.accent : c.raisedEdge,
                boxShadow: shadow.boxShadow,
              }}
            >
              {shadow.node}
              <Thumb source={spotPicture(spot.ref)} size={THUMB} radius={THUMB_RADIUS} />
              <T v="h3" style={{ flex: 1 }}>
                {spot.name}
              </T>
              <View
                style={{
                  width: MARK,
                  height: MARK,
                  borderRadius: MARK / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: RING,
                  borderColor: on ? colors.accent : colors.border,
                }}
              >
                {on ? (
                  <PopIn rise={0}>
                    <CapIcon name="check" color={colors.accent} size={TICK} />
                  </PopIn>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const GAP = 8;
// U18: the spot's picture 48, 14 round.
const THUMB = 48;
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
const ROW = 68;
const ROW_RADIUS = 22;
const PAD_LEFT = 10;
// U18: the round mark 24, its ring 2.
const MARK = 24;
const RING = 2;
const TICK = 16;
