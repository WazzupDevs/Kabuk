import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useNarrow } from '@/lib/useNarrow';
import { SPACING } from '@/theme/tokens';

// Buttons side by side, and one under the other on a narrow screen (tuval DarSusle, OrtakKurallar
// C5: 320 dp or the largest text): a button's label stays on one line, so two do not share a row
// there; each takes the row's whole width. Give each `Btn` `block`.
export function ButtonRow({ children, testID }: { children: ReactNode; testID?: string }) {
  const narrow = useNarrow();
  const items = Children.toArray(children);
  return (
    <View
      testID={testID}
      style={{
        flexDirection: narrow ? 'column' : 'row',
        gap: SPACING[2],
        alignItems: 'stretch',
      }}
    >
      {items.map((child, i) => (
        <View key={i} style={narrow ? undefined : { flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
