import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title: string;
  // At most this many lines; a longer title shrinks to fit rather than ending in "…" (a room's
  // name at 320 dp). Unset: it wraps freely.
  titleLines?: number;
  subtitle?: string;
  // An avatar (or two) before the name.
  leading?: ReactNode;
  onBack?: () => void;
  // Tapping the avatar and the name: the other side's profile, where there is one.
  onPressTitle?: () => void;
  titleAccessibilityLabel?: string;
  // Text or icon buttons on the right.
  actions?: ReactNode;
};

// The compact top of a chat screen (v45: .dpin): a round back button, the avatar, the name and a
// line under it, actions; a hairline under it.
export function ChatTopBar({
  title,
  titleLines,
  subtitle,
  leading,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  actions,
}: Props) {
  const { colors } = useTheme();
  const who = (
    <>
      {leading}
      <View className="flex-1">
        {/* Wraps rather than ending in "…" (CLAUDE.md → Ekran davranışı): "12 Ekim'den beri
            arkadaşsınız". */}
        <Text
          variant="heading"
          accessibilityRole="header"
          numberOfLines={titleLines}
          adjustsFontSizeToFit={titleLines !== undefined}
          minimumFontScale={0.5}
        >
          {title}
        </Text>
        {subtitle ? <Text variant="fine">{subtitle}</Text> : null}
      </View>
    </>
  );
  // The avatar and the name sit straight in the bar's row. Inside another wrapper, flex-1 would
  // size them by the screen's height and squeeze them to the touch height: a two-line name then
  // spilled out of the bar.
  const whoStyle = { minHeight: TOUCH.min };
  const whoClass = 'flex-1 flex-row items-center gap-2.5';
  return (
    <View
      className="flex-row items-center gap-2.5"
      style={{
        // skall tuvali (skall.css → `.topbar.inner`): 68 high, no line under it.
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[3],
        minHeight: SPACING[16] + SPACING[1],
        backgroundColor: colors.canvas,
      }}
    >
      {onBack ? (
        <IconButton
          round
          icon="chevron-back"
          label={tr.common.back}
          onPress={onBack}
          testID="chat-back"
        />
      ) : null}
      {onPressTitle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={titleAccessibilityLabel}
          onPress={onPressTitle}
          className={whoClass}
          style={whoStyle}
        >
          {who}
        </Pressable>
      ) : (
        <View className={whoClass} style={whoStyle}>
          {who}
        </View>
      )}
      {actions}
    </View>
  );
}
