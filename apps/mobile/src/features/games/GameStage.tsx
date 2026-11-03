import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { SPACING } from '@/theme/tokens';

// A timed game screen (CLAUDE.md → Ekran davranışı): the turn and clock on top, the prompt in the
// middle and the actions at the bottom are on screen together, without scrolling. Only the middle
// scrolls, and only when it is taller than the room left (a long card in large text).
export function StageFit({
  status,
  children,
  actions,
  testID,
}: {
  status?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  testID?: string;
}) {
  return (
    // Grows to the stage's height; never squeezed below its content (flex-1 would let the content
    // spill over its neighbours).
    <View style={{ flexGrow: 1, gap: SPACING[2.5] }} testID={testID}>
      {status}
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        // The cards' hard shadows need a little room inside the scroll's clip.
        style={{ marginHorizontal: -SPACING[1] }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: SPACING[2],
          padding: SPACING[1],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {actions ? <View style={{ gap: SPACING[2] }}>{actions}</View> : null}
    </View>
  );
}
