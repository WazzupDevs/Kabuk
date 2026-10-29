import { Pressable, ScrollView, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { usePressScale } from './motion';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string; testID?: string; count?: number };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  // Wrapping onto more lines (a sheet's choices) instead of one row that scrolls sideways.
  wrap?: boolean;
  // A scrolling row that reaches past the screen's side padding by this much (skall.css →
  // `.chips.scroller`).
  bleed?: number;
};

// The chip's height (v44: .cat, 36); its touch area grows to TOUCH.min.
const CHIP = KIT.size.chip;
const SLOP = (TOUCH.min - CHIP) / 2;

// Filter chips, one chosen (v44: .cats, .ci-chips): capsules as wide as their label, the chosen one
// in the accent (skall Chip: `selected`), the others raised with an outline.
export function Chips<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  wrap = false,
  bleed = 0,
}: Props<T>) {
  const { colors, shape, scheme } = useTheme();
  const k = KIT[scheme];
  const pressScale = usePressScale();
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable
        key={o.value}
        testID={o.testID}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        hitSlop={{ top: SLOP, bottom: SLOP }}
        onPress={() => {
          if (!on) haptic('selection');
          onChange(o.value);
        }}
      >
        {({ pressed }) => (
          <View
            className="flex-row items-center justify-center"
            style={[
              {
                minHeight: CHIP,
                paddingHorizontal: KIT.size.chipPadX,
                borderRadius: CHIP,
                // docs/design/aura (`.chip`): raised white with a white edge and a soft shadow; on,
                // ink.
                backgroundColor: on ? k.chipOn : k.raisedChip,
                borderWidth: KIT.size.edge,
                borderColor: on ? k.chipOn : k.raisedEdge,
                boxShadow: on ? undefined : k.chipShadow || undefined,
              },
              pressScale(pressed),
            ]}
          >
            <Text variant="label" tone={on ? 'surface' : 'text'}>
              {o.label}
            </Text>
            {o.count !== undefined ? (
              <View
                style={{
                  marginLeft: SPACING[1.5],
                  paddingHorizontal: SPACING[1.5] + 1,
                  paddingVertical: SPACING[0.5],
                  borderRadius: shape.radius.pill,
                  backgroundColor: on ? colors.surface : colors.surface2,
                }}
              >
                <Text variant="caption" tone="text">
                  {o.count}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    );
  });
  if (wrap) {
    return (
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
        className="flex-row flex-wrap gap-2"
      >
        {chips}
      </View>
    );
  }
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={bleed ? { marginHorizontal: -bleed } : undefined}
      contentContainerStyle={{ gap: SPACING[2], paddingVertical: SLOP, paddingHorizontal: bleed }}
    >
      {chips}
    </ScrollView>
  );
}
