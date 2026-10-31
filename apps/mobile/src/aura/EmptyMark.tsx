import Svg, { Rect } from 'react-native-svg';

import { BRAND } from '@/theme/brand';
import { KIT } from '@/theme/auraKit';

// The empty state's sign (docs/design/aura → Aktiviteler: etkinlik yok, Mesajlar: istekler boş,
// Mekan): the full purple capsule and, behind it, the missing one as a dashed pink outline. Still.
export function EmptyMark() {
  const { width, height } = KIT.size.emptyMark;
  return (
    <Svg width={width} height={height} viewBox="0 0 32 48" accessible={false}>
      <Rect
        x={12}
        y={12}
        width={12}
        height={28}
        rx={6}
        fill="none"
        stroke={BRAND.pink}
        strokeWidth={1.3}
        strokeDasharray="2.4 2.4"
      />
      <Rect x={5} y={4} width={12} height={28} rx={6} fill={BRAND.purple} />
    </Svg>
  );
}
