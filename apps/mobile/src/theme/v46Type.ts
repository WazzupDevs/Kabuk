import type { TextStyle } from 'react-native';

import type { V46Font } from './parts.generated';
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

// A font measured on a component's part (parts.generated.ts), set the same way.
export function v46FontStyle(f: V46Font, letterSpacing = 0): TextStyle {
  return {
    fontFamily: familyFor(f.weight),
    fontSize: f.size,
    lineHeight: f.lineHeight,
    letterSpacing,
  };
}
