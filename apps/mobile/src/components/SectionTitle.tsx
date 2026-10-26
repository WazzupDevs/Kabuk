import { View } from 'react-native';

import { Text } from './Text';

// skall tuvali (skall.css → "Bölüm başlığı"): a section's 16 px title, a count or note on its right.
export function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <View className="flex-row items-baseline justify-between px-0.5 pt-3">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {aside ? <Text variant="fine">{aside}</Text> : null}
    </View>
  );
}
