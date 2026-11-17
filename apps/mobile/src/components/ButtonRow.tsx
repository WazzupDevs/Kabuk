import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useNarrow } from '@/lib/useNarrow';
import { SPACING } from '@/theme/tokens';

// Buttons side by side, and one under the other on a narrow screen (tuval DarSusle, OrtakKurallar
// C5: 320 dp or the largest text): a button's label stays on one line, so two do not share a row
// there; each takes the row's whole width. Give each `Btn` `block`.
// `hug`: side by side each is as wide as its words, centred, and shrinks when short of room (a
// screen whose buttons were never equal halves, e.g. Benim's two); the stacked form is the same.
export function ButtonRow({
  children,
  testID,
  hug,
  gap = SPACING[2],
}: {
  children: ReactNode;
  testID?: string;
  hug?: boolean;
  gap?: number;
}) {
  const narrow = useNarrow();
  const items = Children.toArray(children);
  return (
    <View
      testID={testID}
      style={{
        flexDirection: narrow ? 'column' : 'row',
        gap,
        alignItems: 'stretch',
        justifyContent: hug && !narrow ? 'center' : undefined,
      }}
    >
      {items.map((child, i) => (
        <View
          key={i}
          style={narrow ? undefined : hug ? { flexShrink: 1, minWidth: 0 } : { flex: 1 }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
