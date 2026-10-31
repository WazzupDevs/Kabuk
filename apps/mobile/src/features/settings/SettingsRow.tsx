import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Li, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { useSinglePress } from '@/lib/useSinglePress';
import { KIT } from '@/theme/auraKit';

// A settings page's row (aura v51, Ayarlar): a capsule icon, the label, a count and a chevron when
// it opens a page; `negative` is written in the kit's warning colour. Lives in a `RowList`.
export function SettingsRow({
  label,
  icon,
  onPress,
  negative,
  loading,
  chevron,
  count,
  testID,
}: {
  label: string;
  icon: CapIconName;
  onPress: () => void;
  negative?: boolean;
  loading?: boolean;
  chevron?: boolean;
  count?: number;
  testID?: string;
}) {
  const { c } = useKit();
  const press = useSinglePress(onPress);
  const ink = negative ? c.warn : c.ink;
  return (
    <Li testID={testID} accessibilityLabel={label} onPress={loading ? undefined : press}>
      <CapIcon name={icon} color={negative ? c.warn : c.muted} />
      <View style={{ flex: 1 }}>
        <T v="h3" color={ink}>
          {label}
        </T>
      </View>
      {loading ? <Loader kind="meet" size={KIT.size.icon} delay={0} label={null} /> : null}
      {!loading && count !== undefined ? <T v="fine">{String(count)}</T> : null}
      {!loading && chevron ? (
        <CapIcon name="forward" color={c.muted} size={KIT.size.iconSm} />
      ) : null}
    </Li>
  );
}
