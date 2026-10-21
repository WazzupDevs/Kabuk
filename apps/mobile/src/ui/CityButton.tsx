import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { V46_EXPLORE, V46_EXPLORE_ICONS } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { V46Svg } from './V46Svg';

type Props = {
  // The city and district (`Sakarya · Tüm semtler`); null when there is no city to choose (one
  // city with venues, K-38): the count alone.
  label: string | null;
  // What a screen reader says for the button (`Şehir ve semt: …`); the label when not given.
  accessibilityLabel?: string;
  // The count beside it (`6 mekan · ada göre`, K-42).
  count: string;
  onPress: () => void;
  // The button's, the row's (the button and the count) and the count's.
  testID?: string;
  rowTestID?: string;
  countTestID?: string;
  pressedPreview?: boolean;
};

const MIN_FONT_SCALE = 0.5;

// Keşfet's city and district button and the count of venues beside it (v46 `.vloc`): a round
// button with a pin and an arrow down, the count at the row's other end; on a narrow screen the
// count goes below. Pressed, the button shrinks (`.va button:active`).
export function CityButton({
  label,
  accessibilityLabel,
  count,
  onPress,
  testID,
  rowTestID,
  countTestID,
  pressedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const c = V46_EXPLORE[scheme].city;
  const b = c.button;
  const [pressing, setPressing] = useState(false);
  const pressed = pressing || pressedPreview;
  return (
    <View
      testID={rowTestID}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: c.gap,
        rowGap: c.rowGap,
        marginTop: c.margin[0],
        marginRight: c.margin[1],
        marginBottom: c.margin[2],
        marginLeft: c.margin[3],
      }}
    >
      {label === null ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          testID={testID}
          onPress={onPress}
          onPressIn={() => setPressing(true)}
          onPressOut={() => setPressing(false)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: b.gap,
            minHeight: b.minHeight,
            paddingRight: b.padding[1],
            paddingLeft: b.padding[3],
            borderRadius: b.radius,
            borderWidth: b.border.width,
            borderColor: b.border.color,
            backgroundColor: b.bg,
            flexShrink: 1,
            transform: [{ scale: pressed ? b.pressedScale : 1 }],
          }}
        >
          <V46Svg drawing={V46_EXPLORE_ICONS.pin} size={b.pin.size} />
          {/* One line, like a button's label: only where it does not fit (a 320 dp screen, the
              largest text) it shrinks. */}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={MIN_FONT_SCALE}
            style={[
              v46FontStyle(b.label.font, b.label.letterSpacing),
              { color: b.label.color, flexShrink: 1 },
            ]}
          >
            {label}
          </Text>
          <V46Svg drawing={V46_EXPLORE_ICONS.down} size={b.chevron.size} color={b.chevron.color} />
        </Pressable>
      )}
      <Text
        testID={countTestID}
        style={[v46FontStyle(c.count.font, c.count.letterSpacing), { color: c.count.color }]}
      >
        {count}
      </Text>
    </View>
  );
}
