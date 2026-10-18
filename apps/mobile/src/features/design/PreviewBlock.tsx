import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// A labelled block of the preview.
export function PreviewBlock({ title, children }: { title: string; children: ReactNode }) {
  const { colors, shape } = useTheme();
  return (
    <View
      className="gap-3"
      style={{
        padding: SPACING[3],
        borderRadius: shape.radius.lg,
        borderWidth: shape.stroke.hairline,
        borderColor: colors.divider,
      }}
    >
      <Text variant="overline" tone="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}
