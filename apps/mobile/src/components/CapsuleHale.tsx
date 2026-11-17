import { memo } from 'react';
import Svg, { Circle } from 'react-native-svg';

import { CAPSULE_HALE } from '@/theme/capsuleEdit';

// The purple hale behind the capsule (theme/capsuleEdit.ts → CAPSULE_HALE): drawn once, still.
export const CapsuleHale = memo(function CapsuleHale({ side }: { side: number }) {
  const h = CAPSULE_HALE;
  const r = side / 2;
  return (
    <Svg width={side} height={side} importantForAccessibility="no-hide-descendants">
      <Circle cx={r} cy={r} r={r} fill={h.color} fillOpacity={h.fill} />
      {h.rings.map((ring) => (
        <Circle
          key={ring.at}
          cx={r}
          cy={r}
          r={r * ring.at}
          fill="none"
          stroke={h.color}
          strokeOpacity={ring.opacity}
          strokeWidth={ring.width}
        />
      ))}
    </Svg>
  );
});
