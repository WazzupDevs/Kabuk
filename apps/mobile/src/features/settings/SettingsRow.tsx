import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Li, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { useSinglePress } from '@/lib/useSinglePress';
import { SETTINGS } from '@/theme/settings';

// A settings page's row (yeni arayüz tuvali `.sr`, as Ayarlar's own): a capsule icon in the words'
// colour, the label 600 16/20 and a chevron when it opens a page (56 at least, the icon 24 and 14
// to the words, the chevron 18); `negative` is written in the kit's warning colour. Lives in a
// `RowList` (its hairline from `SETTINGS.row.hairIn`).
export function SettingsRow({
  label,
  icon,
  onPress,
  negative,
  loading,
  chevron,
  testID,
}: {
  label: string;
  icon: CapIconName;
  onPress: () => void;
  negative?: boolean;
  loading?: boolean;
  chevron?: boolean;
  testID?: string;
}) {
  const { c } = useKit();
  const press = useSinglePress(onPress);
  const ink = negative ? c.warn : c.ink;
  const R = SETTINGS.row;
  return (
    <Li
      testID={testID}
      accessibilityLabel={label}
      onPress={loading ? undefined : press}
      padY={0}
      gap={R.gap}
      minHeight={R.height}
    >
      <CapIcon name={icon} color={ink} size={R.icon} />
      <View style={{ flex: 1 }}>
        <T v="settingsRow" color={ink}>
          {label}
        </T>
      </View>
      {loading ? <Loader kind="meet" size={R.icon} delay={0} label={null} /> : null}
      {!loading && chevron ? <CapIcon name="forward" color={c.muted} size={R.chevron} /> : null}
    </Li>
  );
}
