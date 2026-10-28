import { Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

import type { VenueSpot } from './spots';

type Props = {
  spots: readonly VenueSpot[];
  selectedId: string | null;
  onSelect: (spot: VenueSpot) => void;
};

// "Neredesin?" (docs/design/aura → CheckIn): the venue's spots as glass rows, a single choice; the
// chosen row ringed in the primary with a filled round mark. Shared by check-in and the spot change.
export function SpotPicker({ spots, selectedId, onSelect }: Props) {
  const { c } = useKit();
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
            <Glass
              sm
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: KIT.size.rowGap,
                  paddingVertical: PAD_Y,
                  paddingHorizontal: KIT.size.rowGap,
                  minHeight: ROW,
                },
                on
                  ? {
                      borderColor: KIT.primary,
                      boxShadow: `0px 0px 0px ${KIT.size.dotRing}px ${KIT.primaryRing}`,
                    }
                  : null,
              ]}
            >
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
                  backgroundColor: on ? KIT.primary : undefined,
                  borderWidth: on ? 0 : RING,
                  borderColor: c.hair,
                }}
              >
                {on ? <CapIcon name="check" color={KIT.white} size={KIT.size.iconSm} /> : null}
              </View>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );
}

const GAP = 8;
const PAD_Y = 10;
const ROW = 64;
const MARK = 28;
const RING = 2;
