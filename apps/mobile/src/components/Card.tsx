import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { colorVars, ThemeScope, useFeatureTheme, useTheme } from '@/theme/ThemeProvider';
import { KIT, shadowList } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
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
  const { colors, scheme } = useTheme();
  const featureTheme = useFeatureTheme();
  const quiet = useQuiet();
  const pressScale = usePressScale();

  const feature = tone === 'feature' && !quiet;
  const k = KIT[scheme];
  // docs/design/aura (`.glass`, `.glass.sm`): a card is frosted glass, 28 round, 18 inside; a note
  // the smaller, softer glass. The featured card keeps its dark palette.
  const style: ViewStyle[] =
    tone === 'note'
      ? [
          {
            backgroundColor: k.raised,
            borderRadius: KIT.size.glassRadiusSm,
            borderWidth: KIT.size.edge,
            borderColor: k.raisedEdge,
            padding: KIT.size.pad - SPACING[1],
          },
        ]
      : [
          feature ? { backgroundColor: colors.feature } : gradientStyle(k.glass),
          {
            borderRadius: KIT.size.glassRadius,
            padding: flush ? 0 : KIT.size.pad,
            overflow: flush ? 'hidden' : undefined,
            borderWidth: feature ? 0 : KIT.size.edge,
            borderColor: k.glassEdge,
            boxShadow: quiet || feature ? undefined : shadowList(k.glassShadow, k.glassInset),
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
