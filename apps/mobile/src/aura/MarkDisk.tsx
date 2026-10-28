import { View } from 'react-native';

import { Mark } from '@/components/Mark';
import { AURA } from '@/theme/aura';

// The skall mark on a white disk, the middle of a venue's gathering (docs/design/aura → Keşfet).
export function MarkDisk({ size }: { size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: AURA.mark.light,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Mark size={size * MARK_SHARE} label={null} />
    </View>
  );
}

// How much of the disk the mark takes.
const MARK_SHARE = 0.56;
