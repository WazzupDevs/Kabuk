import { View } from 'react-native';

import { Seg, useKit } from '@/aura/kit';
import { Eyebrow, Note, NOTES, segBoard } from '@/features/settings/SettingsParts';
import { tr } from '@/i18n/tr';
import { SCHEME_PREFERENCES } from '@/theme/registry';
import { THEME } from '@/theme/theme';
import { setSchemePreference, useSchemePreference } from '@/theme/ThemeProvider';

// Ayarlar → Görünüm (docs/SPEC_V4.md K-54; v46 §5): Sistem, Açık, Koyu on one line, Sistem by
// default, with a short note on what the choice does. Kept only on the phone; Sistem follows the
// phone's theme at once when it changes. Drawn as the board's (tuval Ayarlar): the eyebrow, the
// sunk seg; the board has no note under it, the app keeps its one.
export function AppearanceSetting() {
  const { scheme: now } = useKit();
  const scheme = useSchemePreference() ?? THEME.defaultScheme;

  return (
    <View>
      <Eyebrow label={tr.settings.appearance.title} />
      <Seg
        accessibilityLabel={tr.settings.appearance.title}
        value={scheme}
        onChange={(value) => setSchemePreference(value)}
        board={segBoard(now)}
        options={SCHEME_PREFERENCES.map((value) => ({
          value,
          label: tr.settings.appearance.options[value],
          testID: `appearance-${value}`,
        }))}
      />
      <View style={NOTES}>
        <Note>{tr.settings.appearance.notes[scheme]}</Note>
      </View>
    </View>
  );
}
