import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';
import { ICON, type PaletteKey } from '@/theme/tokens';

import type { IconName } from './Button';

// An Ionicons glyph in a palette colour, read where it is drawn: inside the featured card it takes
// the card's palette (Card `feature`), where a colour read by the screen would not show.
export function Icon({
  name,
  size = ICON.md,
  tone = 'text',
}: {
  name: IconName;
  size?: number;
  tone?: PaletteKey;
}) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[tone]} />;
}
