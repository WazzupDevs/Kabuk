import { StyleSheet, View } from 'react-native';

import { BUTTON_GLASS } from '@/theme/glass';
import { V46_TAB_BAR } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { GradientFill } from './GradientFill';

// A button's glass (theme/glass.ts → BUTTON_GLASS), laid under its content: `clear` the tab bar's
// glass over the button's own fill (`fill`, drawn here at the glass's share), `tinted` a gloss over
// the button's colour (the button keeps its fill). `radius` the button's corners.
export function GlassFace({
  kind,
  fill,
  radius,
}: {
  kind: 'clear' | 'tinted';
  fill?: string;
  radius: number;
}) {
  const { scheme } = useTheme();
  const t = V46_TAB_BAR[scheme];
  if (kind === 'clear') {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {fill ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius, backgroundColor: fill, opacity: BUTTON_GLASS.clearFill },
            ]}
          />
        ) : null}
        <GradientFill css={t.gradient} radius={radius} />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: t.border.width,
              borderColor: t.border.color,
              boxShadow: t.shadow.inset ?? undefined,
            },
          ]}
        />
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <GradientFill css={BUTTON_GLASS.gloss[scheme]} radius={radius} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: t.border.width,
            borderColor: BUTTON_GLASS.edge[scheme],
            boxShadow: BUTTON_GLASS.inner[scheme],
          },
        ]}
      />
    </View>
  );
}
