import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { openDrawLab } from '@/lib/drawLab';
import { designPickerEnabled } from '@/theme/ThemeProvider';

// Ayarlar → Tasarım (test): the component preview and the v46 gallery. Preview builds and development only;
// production never renders it. Light and dark are chosen in Ayarlar → Görünüm in every build
// (AppearanceSetting).
export function DesignPicker() {
  if (!designPickerEnabled) return null;

  return (
    <View className="gap-2">
      <Text variant="heading" accessibilityRole="header">
        {tr.design.title}
      </Text>
      <Text variant="fine">{tr.design.hint}</Text>
      <View className="mt-2">
        <Button
          variant="neutral"
          testID="preview-open"
          label={tr.design.previewOpen}
          onPress={() => router.push('/design-preview')}
        />
      </View>
      <View>
        <Button
          variant="neutral"
          testID="draw-lab-open"
          label={tr.design.drawLab.open}
          onPress={() => openDrawLab(true)}
        />
      </View>
      <Text variant="fine">{tr.design.drawLab.hint}</Text>
    </View>
  );
}
