import type { TextStyle } from 'react-native';

import { V46_TYPE, type V46TypeKey } from './tokens.generated';
import { familyFor } from './v46Fonts';

// A v46 type style as a React Native text style. The font file carries the weight, so no
// fontWeight is set (as typeStyle in ThemeProvider); a CSS `normal` line height stays the font's own.
export function v46TypeStyle(key: V46TypeKey): TextStyle {
  const t = V46_TYPE[key];
  return {
    fontFamily: familyFor(t.weight),
    fontSize: t.size,
    ...(t.lineHeight === null ? {} : { lineHeight: t.lineHeight }),
    letterSpacing: t.letterSpacing,
  };
}
