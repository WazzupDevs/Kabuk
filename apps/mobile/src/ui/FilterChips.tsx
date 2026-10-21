import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { haptic } from '@/lib/haptics';
import { V46_EXPLORE } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

export type FilterChip<K extends string> = { key: K; label: string; testID?: string };

type Props<K extends string> = {
  items: readonly FilterChip<K>[];
  value: K;
  onChange: (key: K) => void;
  pressedPreview?: K;
  // The group's name for a screen reader ("Mekan türü").
  accessibilityLabel?: string;
  // The row's own (its box without the margins: the visual gate crops to it).
  testID?: string;
};

// Keşfet's filter chips (v46 `.cats.vcats`, the inventory's suzgec-cipleri): a row of round chips
// that scrolls sideways from edge to edge of the screen (it reaches past the screen's side padding
// and pads itself back). The chip on is ink with white text, the others white with an edge; each
// takes a touch 4 dp past its top and bottom (`.cat::after`) and shrinks when pressed. A new choice
// is felt (haptics.ts → selection).
export function FilterChips<K extends string>({
  items,
  value,
  onChange,
  pressedPreview,
  accessibilityLabel,
  testID,
}: Props<K>) {
  const { scheme } = useTheme();
  const c = V46_EXPLORE[scheme].chips;
  return (
    <ScrollView
      testID={testID}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        marginTop: c.margin[0],
        marginRight: c.margin[1],
        marginBottom: c.margin[2],
        marginLeft: c.margin[3],
        flexGrow: 0,
      }}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: c.gap,
        paddingTop: c.padding[0],
        paddingRight: c.padding[1],
        paddingBottom: c.padding[2],
        paddingLeft: c.padding[3],
      }}
    >
      {items.map((item) => (
        <Chip
          key={item.key}
          item={item}
          on={item.key === value}
          pressedPreview={pressedPreview === item.key}
          onPress={() => {
            if (item.key === value) return;
            haptic('selection');
            onChange(item.key);
          }}
        />
      ))}
    </ScrollView>
  );
}

function Chip<K extends string>({
  item,
  on,
  pressedPreview,
  onPress,
}: {
  item: FilterChip<K>;
  on: boolean;
  pressedPreview: boolean;
  onPress: () => void;
}) {
  const { scheme } = useTheme();
  const chip = V46_EXPLORE[scheme].chips.chip;
  const look = on ? chip.on : chip.off;
  const [pressing, setPressing] = useState(false);
  const pressed = pressing || pressedPreview;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      testID={item.testID}
      hitSlop={chip.hitSlop}
      onPress={onPress}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: chip.gap,
        height: chip.height,
        paddingRight: chip.padding[1],
        paddingLeft: chip.padding[3],
        borderRadius: chip.radius,
        borderWidth: look.border.width,
        borderColor: look.border.color,
        backgroundColor: look.bg,
        transform: [{ scale: pressed ? chip.pressedScale : 1 }],
      }}
    >
      <Text style={[v46FontStyle(chip.font, chip.letterSpacing), { color: look.color }]}>
        {item.label}
      </Text>
    </Pressable>
  );
}
