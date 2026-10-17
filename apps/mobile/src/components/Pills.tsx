import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { usePressScale } from './motion';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string; testID?: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  // Each pill as wide as its label, wrapping onto more lines (canvas: Masanı lobiye aç → Oyun):
  // for more options than fit a row.
  wrap?: boolean;
};

// A row of pills, one chosen (canvas: Oda kur → Niyetin): the chosen one filled with the accent,
// the others raised with an outline. Short labels only.
export function Pills<T extends string>({ options, value, onChange, wrap = false }: Props<T>) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <View
      accessibilityRole="radiogroup"
      className={wrap ? 'flex-row flex-wrap gap-2' : 'flex-row gap-2'}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={o.testID}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) haptic('selection');
              onChange(o.value);
            }}
            className={wrap ? undefined : 'flex-1'}
          >
            {({ pressed }) => (
              <View
                className="items-center justify-center"
                style={[
                  {
                    minHeight: TOUCH.button,
                    paddingHorizontal: wrap ? SPACING[4] : SPACING[2],
                    borderRadius: shape.radius.pill,
                    backgroundColor: on ? colors.accent : colors.raised,
                    borderWidth: on ? 0 : shape.stroke.hairline * 1.5,
                    borderColor: colors.border,
                  },
                  pressScale(pressed),
                ]}
              >
                <Text
                  variant="button"
                  color={on ? colors.onAccent : colors.text}
                  numberOfLines={1}
                  adjustsFontSizeToFit={!wrap}
                  minimumFontScale={0.5}
                >
                  {o.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
