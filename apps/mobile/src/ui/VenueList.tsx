import type { ReactNode } from 'react';
import { View } from 'react-native';

import { V46_EXPLORE } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

// Keşfet's list of venues (v46 `.card.vlist`): one card, padded above and below, its rows
// (VenueRow) edge to edge inside it.
export function VenueList({ children, testID }: { children: ReactNode; testID?: string }) {
  const { scheme } = useTheme();
  const l = V46_EXPLORE[scheme].list;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: l.card.bg,
        borderWidth: l.card.border.width,
        borderColor: l.card.border.color,
        borderRadius: l.card.radius,
        boxShadow: l.card.shadow,
        paddingTop: l.padding[0],
        paddingBottom: l.padding[2],
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
