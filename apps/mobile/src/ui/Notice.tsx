import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

// The warning box (v46 `.sup-warn`: the photo step's note when there is no photo): amber ground,
// rounded, its text in the box's own brown.
export function Notice({ children, testID }: { children: ReactNode; testID?: string }) {
  const { scheme } = useTheme();
  const n = V46_FORM[scheme].notice;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: n.bg,
        borderRadius: n.radius,
        paddingTop: n.padding[0],
        paddingRight: n.padding[1],
        paddingBottom: n.padding[2],
        paddingLeft: n.padding[3],
      }}
    >
      <Text style={[v46FontStyle(n.text.font, n.text.letterSpacing), { color: n.text.color }]}>
        {children}
      </Text>
    </View>
  );
}
