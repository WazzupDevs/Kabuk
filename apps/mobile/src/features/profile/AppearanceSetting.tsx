import { View } from 'react-native';

import { Card } from '@/components/Card';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { SCHEME_PREFERENCES } from '@/theme/registry';
import { THEME } from '@/theme/theme';
import { setSchemePreference, useSchemePreference } from '@/theme/ThemeProvider';

// Ayarlar → Görünüm (docs/SPEC_V4.md K-54; v46 §5): Sistem, Açık, Koyu on one line, Sistem by
// default, with a short note on what the choice does. Kept only on the phone; Sistem follows the
// phone's theme at once when it changes.
export function AppearanceSetting() {
  const scheme = useSchemePreference() ?? THEME.defaultScheme;

  return (
    // skall tuvali: the setting in a soft card, its title, the switch and the note.
    <Card tone="note">
      <View className="gap-2.5">
        <Text variant="heading" accessibilityRole="header">
          {tr.settings.appearance.title}
        </Text>
        <Segmented
          fill
          onSoft
          accessibilityLabel={tr.settings.appearance.title}
          value={scheme}
          onChange={(value) => setSchemePreference(value)}
          options={SCHEME_PREFERENCES.map((value) => ({
            value,
            label: tr.settings.appearance.options[value],
            testID: `appearance-${value}`,
          }))}
        />
        <Text variant="fine">{tr.settings.appearance.notes[scheme]}</Text>
      </View>
    </Card>
  );
}
