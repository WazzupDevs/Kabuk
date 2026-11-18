import { View } from 'react-native';

import { T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import type { VenueSpot } from './spots';

type Props = {
  spots: readonly VenueSpot[];
  selectedId: string | null;
  onSelect: (spot: VenueSpot) => void;
};

// "Neredesin?" (yeni arayüz tuvali, CheckInNokta `.rr`): the venue's spots as flat radio rows, 52
// high, the 24 radio first, a hairline between the rows from 36; a single choice. Shared by
// check-in and the spot change, which look the same.
export function SpotPicker({ spots, selectedId, onSelect }: Props) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const look = KIT[scheme];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={tr.checkin.spotTitle}>
      {spots.map((spot, i) => {
        const selected = spot.id === selectedId;
        return (
          <Tap
            key={spot.id}
            testID={`spot-${spot.ref}`}
            accessibilityRole="radio"
            accessibilityLabel={spot.name}
            accessibilityState={{ selected }}
            sink={false}
            feel={selected ? undefined : 'selection'}
            onPress={() => onSelect(spot)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[3],
              minHeight: ROW,
            }}
          >
            {i > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: KIT.size.checkBox + SPACING[3],
                  right: 0,
                  borderTopWidth: KIT.size.hair,
                  borderTopColor: c.hair,
                }}
              />
            ) : null}
            <View
              style={{
                width: KIT.size.checkBox,
                height: KIT.size.checkBox,
                borderRadius: KIT.size.checkBox / 2,
                boxShadow: `inset 0px 0px 0px ${selected ? KIT.size.radioOn : KIT.size.markLine}px ${
                  selected ? look.markOn : look.markLine
                }`,
              }}
            />
            <View style={{ flex: 1 }}>
              <T v="h3">{spot.name}</T>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const ROW = 52;
