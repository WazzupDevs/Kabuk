import { View } from 'react-native';

import { AURA } from '@/theme/aura';

// A table's headcount as small capsules in the mark's colours (docs/design/aura → `.pips`): the
// same for everyone, no face and no name (rule 4). At most AURA.pips.max drawn.
export function Pips({ count }: { count: number }) {
  const p = AURA.pips;
  const n = Math.max(0, Math.min(count, p.max));
  return (
    <View accessible={false} className="flex-row items-center" style={{ gap: p.gap }}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={{
            width: p.w,
            height: p.h,
            borderRadius: p.w / 2,
            backgroundColor: p.colors[i % p.colors.length],
          }}
        />
      ))}
    </View>
  );
}
