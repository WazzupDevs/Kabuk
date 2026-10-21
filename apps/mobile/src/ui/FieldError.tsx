import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

// A field's error line (v46 `.sup-err`, by its own rule: docs/SPEC_V4.md §4.C): read out when it
// appears.
export function FieldError({ children, testID }: { children: ReactNode; testID?: string }) {
  const { scheme } = useTheme();
  const e = V46_FORM[scheme].error;
  return (
    <Text
      accessibilityLiveRegion="polite"
      testID={testID}
      style={[v46FontStyle(e.font, e.letterSpacing), { color: e.color }]}
    >
      {children}
    </Text>
  );
}
