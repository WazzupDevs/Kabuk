import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useContext } from 'react';
import { Pressable, View } from 'react-native';

import { rowPress } from '@/theme/rowPress';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { CardPressContext } from './ListCard';
import { usePressScale } from './motion';
import { Text } from './Text';

type Props = {
  title: string;
  meta?: string;
  // Tags, a badge or a switch under or beside the title.
  below?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'link';
  // A card of its own (Keşfet venues, friends, room lists): a picture on the left, the name and one
  // line in the middle, a status chip on the right. Otherwise a row on a hairline (settings).
  card?: boolean;
  // A row inside a ListCard (skall.css → `.list .item`): 16 px sides, no line of its own.
  inset?: boolean;
  // No chevron on a pressable row without a trailing part (Mekan sohbeti).
  noChevron?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

// A list row: as a card, or on a hairline.
export function ListRow({
  title,
  meta,
  below,
  leading,
  trailing,
  onPress,
  accessibilityRole = 'button',
  card,
  inset,
  noChevron,
  accessibilityLabel,
  testID,
}: Props) {
  const theme = useTheme();
  const cardPress = useContext(CardPressContext);
  const { colors, shape } = theme;
  const pressScale = usePressScale();
  const content = (
    <>
      {leading}
      <View className={card || inset ? 'flex-1 gap-0.5' : 'flex-1 gap-1'}>
        {/* Wraps rather than ending in "…" ("Sakarya Üniversitesi"). */}
        <Text variant={card || inset ? 'heading' : 'bodyStrong'}>{title}</Text>
        {meta ? <Text variant="fine">{meta}</Text> : null}
        {below}
      </View>
      {trailing ? (
        // Centred beside the text (a tag aligns itself to the top of a row otherwise).
        <View className="justify-center">{trailing}</View>
      ) : onPress && !noChevron ? (
        <Ionicons name="chevron-forward" size={ICON.md} color={colors.muted} />
      ) : null}
    </>
  );
  const style = inset
    ? {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: SPACING[3] + SPACING[0.5],
        minHeight: TOUCH.large + SPACING[2],
        paddingVertical: SPACING[3],
        paddingHorizontal: SPACING[4],
      }
    : card
      ? {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: SPACING[3] + SPACING[0.5],
          minHeight: TOUCH.large + SPACING[2],
          paddingVertical: SPACING[3],
          paddingHorizontal: SPACING[4],
          borderRadius: shape.radius.lg,
          backgroundColor: colors.surface,
          borderWidth: shape.stroke.card,
          borderColor: colors.cardLine,
          boxShadow: shape.shadow.card,
        }
      : {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: SPACING[3] + SPACING[0.5],
          minHeight: TOUCH.large + SPACING[2],
          paddingVertical: SPACING[3],
          borderBottomWidth: shape.stroke.hairline,
          borderBottomColor: colors.divider,
        };
  if (!onPress)
    return (
      <View style={style} testID={testID}>
        {content}
      </View>
    );
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={inset && cardPress ? () => cardPress(true) : undefined}
      onPressOut={inset && cardPress ? () => cardPress(false) : undefined}
      testID={testID}
    >
      {({ pressed }) => (
        <View
          style={[
            style,
            card ? pressScale(pressed) : pressed && !inset ? { opacity: 0.7 } : null,
            inset ? rowPress(theme, pressed && !cardPress) : null,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}
