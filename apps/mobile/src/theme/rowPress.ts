import type { AppTheme } from './ThemeProvider';
import { SPACING } from './tokens';

// A row inside a list card when pressed (skall.css → `.list .item:active`): the highlight sits 4 in
// from the card's sides, its corners following the card's, so it never shows as a square block
// running past the card's rounded edge. The row keeps its text where it was.
export const ROW_INSET = SPACING[1];

export function rowPress(
  theme: Pick<AppTheme, 'colors' | 'shape'>,
  pressed: boolean,
  padLeft: number = SPACING[4],
  padRight: number = SPACING[4],
) {
  return {
    marginHorizontal: ROW_INSET,
    paddingLeft: padLeft - ROW_INSET,
    paddingRight: padRight - ROW_INSET,
    borderRadius: theme.shape.radius.lg - ROW_INSET,
    backgroundColor: pressed ? theme.colors.surface2 : 'transparent',
  };
}
