import { View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import type { IconName } from './Button';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { AppIcon } from './AppIcon';

type Props = {
  title: string;
  // Right after the title, quieter (Arkadaşlar's count; v45: .fpin h1 small).
  titleDetail?: string;
  eyebrow?: string;
  eyebrowIcon?: IconName;
  subtitle?: string;
  onBack?: () => void;
  action?: { icon: IconName; label: string; onPress: () => void };
  // Anything else on the title row (the Keşfet list/map switch).
  trailing?: React.ReactNode;
};

// Longer titles (a campus's full name) take the smaller title style; any title stays within two
// lines.
const LONG_TITLE = 22;

// The top of a screen: optional back button, eyebrow, the title (h1) with an action on the right,
// and a subtitle.
export function ScreenHeader({
  title,
  titleDetail,
  eyebrow,
  eyebrowIcon,
  subtitle,
  onBack,
  action,
  trailing,
}: Props) {
  const { colors } = useTheme();
  return (
    <View className="mb-2">
      {/* docs/design/aura (`.topbar`): the round glass back button, the title under it. */}
      {onBack ? (
        <View className="mb-3 self-start">
          <IconButton round icon="chevron-back" label={tr.common.back} onPress={onBack} />
        </View>
      ) : null}
      {eyebrow ? (
        <View className="mb-1.5 mt-1 flex-row items-center gap-1.5">
          {eyebrowIcon ? <AppIcon name={eyebrowIcon} size={ICON.sm} color={colors.muted} /> : null}
          <Text variant="eyebrow">{eyebrow}</Text>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between gap-3">
        <Text
          variant={title.length > LONG_TITLE ? 'title' : 'display'}
          accessibilityRole="header"
          className="flex-1"
        >
          {title}
          {/* The space in the title's size: a heading-size space reads as none after it. */}
          {titleDetail ? (
            <>
              {' '}
              <Text variant="heading" tone="muted">
                {titleDetail}
              </Text>
            </>
          ) : null}
        </Text>
        {trailing}
        {action ? (
          <IconButton round icon={action.icon} label={action.label} onPress={action.onPress} />
        ) : null}
      </View>
      {subtitle ? (
        <Text variant="subtitle" className="mt-1">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
