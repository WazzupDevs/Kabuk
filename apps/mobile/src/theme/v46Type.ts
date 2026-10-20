import type { TextStyle } from 'react-native';

import { V46_TYPE, type V46TypeKey } from './tokens.generated';
import { familyFor } from './v46Fonts';

// A v46 type style as a React Native text style. The font file carries the weight, so no
// fontWeight is set (as typeStyle in ThemeProvider). The line height is always set, a CSS `normal`
// one as the browser's number (scripts/v46/fontMetrics.ts): Android's own is taller.
export function v46TypeStyle(key: V46TypeKey): TextStyle {
  const t = V46_TYPE[key];
  return {
    fontFamily: familyFor(t.weight),
    fontSize: t.size,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
  };
}
