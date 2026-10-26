import { Chips } from '@/components/Chips';
import { tr } from '@/i18n/tr';

import type { VenueSpot } from './spots';

type Props = {
  spots: readonly VenueSpot[];
  selectedId: string | null;
  onSelect: (spot: VenueSpot) => void;
};

// "Neredesin?": the venue's spots as a single choice (skall tuvali, MekanNoktaDegistir: chips).
// Shared by check-in and the spot change.
export function SpotPicker({ spots, selectedId, onSelect }: Props) {
  const NONE = '';
  return (
    <Chips
      wrap
      accessibilityLabel={tr.checkin.spotTitle}
      value={selectedId ?? NONE}
      onChange={(id) => {
        const spot = spots.find((s) => s.id === id);
        if (spot) onSelect(spot);
      }}
      options={spots.map((spot) => ({
        value: spot.id,
        label: spot.name,
        testID: `spot-${spot.ref}`,
      }))}
    />
  );
}
