import type { AppTheme } from './ThemeProvider';
import { OPACITY, SPACING } from './tokens';

// A row inside a list card when pressed: its content dims, like a menu row (Menu.tsx), and nothing
// is painted behind it: a highlight block never matched the card's rounded edge (the owner's
// report, 27 Ekim). A card of one row presses as a whole (ListCard: it scales like a button,
// skall.css → `.btn.pressed`). The row keeps its text where it was.
export const ROW_INSET = 0;

export function rowPress(
  _theme: Pick<AppTheme, 'colors' | 'shape'>,
  pressed: boolean,
  padLeft: number = SPACING[4],
  padRight: number = SPACING[4],
) {
  return {
    paddingLeft: padLeft,
    paddingRight: padRight,
    opacity: pressed ? OPACITY.pressed : 1,
  };
}
