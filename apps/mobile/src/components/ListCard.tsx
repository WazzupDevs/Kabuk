import { Children, createContext, type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { usePressScale } from './motion';

// skall tuvali (skall.css → `.list`): rows in one card, a hairline between them inset to the text
// (78 from the left, 16 from the right). The rows are ListRow `inset`.

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
  const { scheme } = useTheme();
  const k = KIT[scheme];
  const pressScale = usePressScale();
  const [pressed, setPressed] = useState(false);
  const rows = Children.toArray(children).filter(Boolean);
  const single = rows.length === 1;
  return (
    <View
      testID={testID}
      style={[
        bare
          ? { marginHorizontal: -KIT.size.liPadX }
          : [
              // docs/design/aura (`.glass.list`): frosted, 28 round, a hairline between rows.
              gradientStyle(k.glass),
              {
                borderWidth: KIT.size.edge,
                borderColor: k.glassEdge,
                borderRadius: KIT.size.glassRadius,
                boxShadow: `${k.glassShadow}, ${KIT.glassInset}`,
                paddingVertical: KIT.size.listPadY,
              },
            ],
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
                  left: 0,
                  right: 0,
                  height: KIT.size.hair,
                  backgroundColor: k.hair,
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
