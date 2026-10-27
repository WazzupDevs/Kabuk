import { Children, createContext, type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { usePressScale } from './motion';

// skall tuvali (skall.css → `.list`): rows in one card, a hairline between them inset to the text
// (78 from the left, 16 from the right). The rows are ListRow `inset`.
const DIVIDER_LEFT = SPACING[16] + SPACING[3] + SPACING[0.5];

// A card of one row presses as a whole: its row tells it (ListRow `inset`), and the card scales
// like a button (skall.css → `.btn.pressed`) instead of the row painting a block inside it.
export const CardPressContext = createContext<((pressed: boolean) => void) | null>(null);

// `bare`: the rows on the screen's ground, no card (the owner's call, 27 Ekim: Arkadaşlar and
// Mesajlar), their content in line with the screen's edge; the hairlines stay.
export function ListCard({
  children,
  testID,
  bare = false,
}: {
  children: ReactNode;
  testID?: string;
  bare?: boolean;
}) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const [pressed, setPressed] = useState(false);
  const rows = Children.toArray(children).filter(Boolean);
  const single = rows.length === 1;
  return (
    <View
      testID={testID}
      style={[
        bare
          ? { marginHorizontal: -SPACING[4] }
          : {
              backgroundColor: colors.surface,
              borderWidth: shape.stroke.card,
              borderColor: colors.cardLine,
              borderRadius: shape.radius.lg,
              boxShadow: shape.shadow.card,
              paddingVertical: SPACING[1],
            },
        single ? pressScale(pressed) : null,
      ]}
    >
      <CardPressContext.Provider value={single ? setPressed : null}>
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
      </CardPressContext.Provider>
    </View>
  );
}
