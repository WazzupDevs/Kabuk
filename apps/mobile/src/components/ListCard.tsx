import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// skall tuvali (skall.css → `.list`): rows in one card, a hairline between them inset to the text
// (78 from the left, 16 from the right). The rows are ListRow `inset`.
const DIVIDER_LEFT = SPACING[16] + SPACING[3] + SPACING[0.5];

export function ListCard({ children, testID }: { children: ReactNode; testID?: string }) {
  const { colors, shape } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.surface,
        borderWidth: shape.stroke.card,
        borderColor: colors.cardLine,
        borderRadius: shape.radius.lg,
        boxShadow: shape.shadow.card,
        paddingVertical: SPACING[1],
      }}
    >
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: DIVIDER_LEFT,
                right: SPACING[4],
                height: shape.stroke.hairline,
                backgroundColor: colors.divider,
              }}
            />
          ) : null}
          {row}
        </View>
      ))}
    </View>
  );
}
