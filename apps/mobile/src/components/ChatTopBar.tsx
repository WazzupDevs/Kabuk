import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title: string;
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

// The compact top of a chat screen (canvas: Aşama 4 · Yenileme): back, avatar, the name on one
// line and one line under it, actions; a hairline under it.
export function ChatTopBar({
  title,
  subtitle,
  leading,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  actions,
}: Props) {
  const { colors, shape } = useTheme();
  const who = (
    <>
      {leading}
      <View className="flex-1">
        {/* Wraps rather than ending in "…" (CLAUDE.md → Ekran davranışı): a room's two table
            names, "12 Ekim'den beri arkadaşsınız". */}
        <Text variant="heading" accessibilityRole="header">
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
      className="flex-row items-center gap-1"
      style={{
        paddingLeft: onBack ? SPACING[1] : shape.screenPadding,
        paddingRight: SPACING[2],
        paddingVertical: SPACING[1.5],
        borderBottomWidth: shape.stroke.hairline,
        borderBottomColor: colors.divider,
        backgroundColor: colors.canvas,
      }}
    >
      {onBack ? (
        <IconButton
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
