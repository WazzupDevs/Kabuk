import { Pressable, ScrollView, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { usePressScale } from './motion';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string; testID?: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  // Wrapping onto more lines (a sheet's choices) instead of one row that scrolls sideways.
  wrap?: boolean;
};

// The chip's height (v44: .cat, 36); its touch area grows to TOUCH.min.
const CHIP = SPACING[9];
const SLOP = (TOUCH.min - CHIP) / 2;

// Filter chips, one chosen (v44: .cats, .ci-chips): capsules as wide as their label, the chosen one
// in the accent (skall Chip: `selected`), the others raised with an outline.
export function Chips<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  wrap = false,
}: Props<T>) {
  const { colors, shape } = useTheme();
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
            className="items-center justify-center"
            style={[
              {
                minHeight: CHIP,
                paddingHorizontal: SPACING[3] + SPACING[0.5],
                borderRadius: shape.radius.pill,
                backgroundColor: on ? colors.accent : colors.raised,
                borderWidth: on ? 0 : shape.stroke.hairline * 1.5,
                borderColor: colors.border,
              },
              pressScale(pressed),
            ]}
          >
            <Text variant="label" tone={on ? 'onAccent' : 'text'}>
              {o.label}
            </Text>
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
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{ gap: SPACING[2], paddingVertical: SLOP }}
    >
      {chips}
    </ScrollView>
  );
}
