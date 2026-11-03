import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';

// skall tuvali (skall.css → `.list`): rows in one card, a hairline between them inset to the text
// (78 from the left, 16 from the right).

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
  const rows = Children.toArray(children).filter(Boolean);
  // The card's soft shadow natively (NativeShadow.tsx); its inset light edge as boxShadow.
  const shadowOff = useLabOff('golge');
  const shadow = bare
    ? null
    : shadowParts(
        shadowOff,
        k.glassShadow,
        k.glassInset,
        KIT.size.glassRadius,
        true,
        KIT.size.edge,
      );
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
                boxShadow: shadow?.boxShadow,
                paddingVertical: KIT.size.listPadY,
              },
            ],
      ]}
    >
      {shadow?.node}
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
    </View>
  );
}
