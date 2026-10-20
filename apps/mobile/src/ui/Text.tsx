import type { ReactNode } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { V46_PALETTE, type V46ColorName, type V46TypeKey } from '@/theme/tokens.generated';
import { v46TypeStyle } from '@/theme/v46Type';

type Props = Omit<TextProps, 'style'> & {
  // One of v46's type styles (tokens.generated.ts → V46_TYPE): size, weight, line height, spacing.
  type: V46TypeKey;
  color?: V46ColorName;
  align?: 'left' | 'center' | 'right';
  // Equal-width digits (v46: `font-variant-numeric: tabular-nums`, e.g. `.vr b`).
  tabular?: boolean;
  children: ReactNode;
};

// Text as v46 sets it: a type style from the inventory and a colour from the palette, in the
// active scheme. The weight is the font file (v46Fonts.ts); the line height is always the number
// the browser draws, also where v46 writes `normal` (docs/decisions/v46-native-3a-yazi.md).
export function Text({ type, color = 'ink', align, tabular, children, ...rest }: Props) {
  const { scheme } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        v46TypeStyle(type),
        { color: V46_PALETTE[scheme][color] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
      ]}
    >
      {children}
    </RNText>
  );
}
