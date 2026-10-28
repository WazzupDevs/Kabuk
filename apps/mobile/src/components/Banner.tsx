import type { ReactNode } from 'react';
import { View } from 'react-native';

import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';

// skall tuvali (skall.css → "Uyarı şeridi"): information, warning, error and success are one strip,
// a soft fill, its icon and its ink; a label over a note.
export type BannerTone = 'warn' | 'danger' | 'info' | 'positive';

const ICONS = {
  warn: 'warning',
  danger: 'alert-circle',
  info: 'information-circle',
  positive: 'checkmark-circle',
} as const;

export function Banner({
  tone = 'warn',
  title,
  body,
  children,
  testID,
}: {
  tone?: BannerTone;
  title?: string;
  body?: string;
  children?: ReactNode;
  testID?: string;
}) {
  const { colors, scheme } = useTheme();
  const [bg, fg, note] =
    tone === 'danger'
      ? [colors.dangerSoft, colors.onDangerSoft, colors.onDangerSoft]
      : tone === 'positive'
        ? [colors.successSoft, colors.onSuccessSoft, colors.onSuccessSoft]
        : tone === 'info'
          ? [colors.surface2, colors.text, colors.muted]
          : [colors.warnSoft, colors.onWarnSoft, colors.onWarnSoft];
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      className="flex-row items-start"
      // docs/design/aura: a note is a soft capsule-cornered card (20 round); the plain one glass.
      style={[
        tone === 'info' ? gradientStyle(KIT[scheme].glass) : { backgroundColor: bg },
        {
          gap: SPACING[3],
          paddingVertical: SPACING[3],
          paddingHorizontal: SPACING[3] + SPACING[0.5],
          borderRadius: KIT.size.glassRadiusSm,
          borderWidth: tone === 'info' ? KIT.size.edge : 0,
          borderColor: KIT[scheme].glassEdge,
        },
      ]}
    >
      <AppIcon name={ICONS[tone]} size={ICON.md} color={fg} />
      <View className="flex-1" style={{ gap: SPACING[0.5] }}>
        {title ? (
          <Text variant="label" color={fg}>
            {title}
          </Text>
        ) : null}
        {body ? (
          <Text variant="fine" color={note}>
            {body}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}
