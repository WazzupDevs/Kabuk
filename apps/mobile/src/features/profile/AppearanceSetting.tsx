import { View } from 'react-native';

import { Seg, T } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { SCHEME_PREFERENCES } from '@/theme/registry';
import { KIT } from '@/theme/auraKit';
import { THEME } from '@/theme/theme';
import { setSchemePreference, useSchemePreference } from '@/theme/ThemeProvider';

// Ayarlar → Görünüm (docs/SPEC_V4.md K-54; v46 §5): Sistem, Açık, Koyu on one line, Sistem by
// default, with a short note on what the choice does. Kept only on the phone; Sistem follows the
// phone's theme at once when it changes.
export function AppearanceSetting() {
  const scheme = useSchemePreference() ?? THEME.defaultScheme;

  return (
    <View style={{ gap: KIT.size.rowGap }}>
      <T v="sec" accessibilityRole="header">
        {tr.settings.appearance.title}
      </T>
      <Seg
        accessibilityLabel={tr.settings.appearance.title}
        value={scheme}
        onChange={(value) => setSchemePreference(value)}
        options={SCHEME_PREFERENCES.map((value) => ({
          value,
          label: tr.settings.appearance.options[value],
          testID: `appearance-${value}`,
        }))}
      />
      <T v="fine">{tr.settings.appearance.notes[scheme]}</T>
    </View>
  );
}
