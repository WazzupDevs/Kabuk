import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import type { IconName } from './Button';
import { Text } from './Text';

type Option<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  testID?: string;
  // A dot after the label (the second accent): something unread behind this option (the merged
  // table's Masa Sohbeti, docs/SPEC_V3.md §23.F). `dotLabel` is what the reader hears for it.
  dot?: boolean;
  dotLabel?: string;
};

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  // Each option shows only its icon in a 44 × 44 segment; its label is what the reader hears.
  iconOnly?: boolean;
  // The track spans the width and the options share it (Mesajlar: Sohbet and İstekler).
  fill?: boolean;
};

// A pill switch on a quiet track, no outline (Keşfet list/map, the design picker).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  iconOnly,
  fill,
}: Props<T>) {
  const { colors, shape } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={fill ? 'flex-row self-stretch' : 'flex-row self-start'}
      style={{
        // skall tuvali (skall.css → `.seg`): the track, 3 px inset, 4 px between.
        padding: 3,
        gap: SPACING[1],
        borderRadius: shape.radius.pill,
        backgroundColor: colors.track,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            testID={o.testID}
            accessibilityState={{ selected: on }}
            accessibilityLabel={iconOnly ? o.label : undefined}
            onPress={() => {
              if (!on) haptic('selection');
              onChange(o.value);
            }}
            style={{
              flex: fill ? 1 : undefined,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING[1],
              minHeight: TOUCH.min,
              minWidth: iconOnly ? TOUCH.min : undefined,
              paddingHorizontal: iconOnly ? 0 : SPACING[3],
              borderRadius: shape.radius.pill,
              backgroundColor: on ? colors.surface : 'transparent',
              boxShadow: on ? shape.shadow.raised : undefined,
            }}
          >
            {o.icon ? (
              <Ionicons
                name={o.icon}
                size={iconOnly ? ICON.md : ICON.sm}
                color={on ? colors.text : colors.muted}
              />
            ) : null}
            {iconOnly ? null : (
              <Text variant="label" tone={on ? 'text' : 'muted'}>
                {o.label}
              </Text>
            )}
            {o.dot ? (
              <View
                testID={o.testID ? `${o.testID}-unread` : undefined}
                accessibilityLabel={o.dotLabel}
                style={{
                  width: SPACING[2],
                  height: SPACING[2],
                  borderRadius: shape.radius.pill,
                  backgroundColor: colors.violet,
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
