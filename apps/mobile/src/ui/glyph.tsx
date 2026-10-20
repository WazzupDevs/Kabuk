import type { V46ButtonIcon } from '@/theme/parts.generated';

import { BarGlyph } from './BarGlyph';
import { V46Svg } from './V46Svg';

// A button's icon as v46 draws it there: a bar icon at rest with its fills, or the measured drawing.
export function ButtonGlyph({ icon }: { icon: V46ButtonIcon }) {
  return 'bar' in icon ? (
    <BarGlyph kind={icon.bar} fills={icon.fills} size={icon.size} />
  ) : (
    <V46Svg drawing={icon.drawing} size={icon.size} />
  );
}
