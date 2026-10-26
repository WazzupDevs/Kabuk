import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { colorVars, ThemeScope, useFeatureTheme, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { usePressScale } from './motion';
import { useQuiet } from './Quiet';

type Props = {
  children: ReactNode;
  // `card`: surface with a soft shadow. `feature`: the one featured card per screen, ink in the
  // light scheme; everything inside draws from its dark palette (src/theme/feature.ts), so text,
  // icons and buttons stay readable without being told. `note`: a quiet surface2 block (role hint,
  // pending request, notices).
  tone?: 'card' | 'feature' | 'note';
  // Content that runs to the card's edges (a colour block on top); the card clips it.
  flush?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string; // layout only (margins, gap, alignment)
  testID?: string;
};

// A card drawn from the theme's tokens: continuous corners, no outline, no hard shadow. On trust
// screens (`Quiet`) a hairline in the divider colour and no shadow.
export function Card({
  children,
  tone = 'card',
  flush,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: Props) {
  const { colors, shape } = useTheme();
  const featureTheme = useFeatureTheme();
  const quiet = useQuiet();
  const pressScale = usePressScale();

  const feature = tone === 'feature' && !quiet;
  const style: ViewStyle[] =
    tone === 'note'
      ? [
          {
            backgroundColor: colors.surface2,
            borderRadius: shape.radius.lg,
            padding: SPACING[4],
          },
        ]
      : [
          {
            backgroundColor: feature ? colors.feature : colors.surface,
            borderRadius: shape.radius.lg,
            padding: flush ? 0 : SPACING[4],
            overflow: flush ? 'hidden' : undefined,
            // skall tuvali (skall.css → `.card`): a 1 px card line and the soft card shadow.
            borderWidth: feature ? 0 : quiet ? shape.stroke.hairline : shape.stroke.card,
            borderColor: quiet ? colors.divider : colors.cardLine,
            boxShadow: quiet || feature ? undefined : shape.shadow.card,
          },
          feature ? (colorVars(featureTheme.colors) as ViewStyle) : {},
        ];
  const content = feature ? <ThemeScope theme={featureTheme}>{children}</ThemeScope> : children;

  if (onPress) {
    return (
      <View className={className}>
        <Pressable
          accessibilityRole="button"
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
        >
          {({ pressed }) => <View style={[...style, pressScale(pressed)]}>{content}</View>}
        </Pressable>
      </View>
    );
  }
  return (
    <View className={className} style={style} testID={testID}>
      {content}
    </View>
  );
}
