import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_EXPLORE, V46_EXPLORE_ICONS, V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { fieldBoxStyle } from './field';
import { transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

type Props = {
  // The chosen value, or the prompt while none is ("Seç").
  text: string;
  onPress: () => void;
  // "Gün": read by screen readers with the value.
  accessibilityLabel: string;
  // While its choices are open: drawn as v46's focused select (`.dob select:focus`).
  open?: boolean;
  testID?: string;
};

// A select (v46 `.dob select`: the birth date's day, month and year): a 56 high box with the chosen
// value; a press opens the choices (the screen draws them). Its arrow is v46's own down arrow (the
// city button's): v46 shows the browser's (docs/SPEC_V4.md §4.C), in the text's colour as it does.
export function SelectField({ text, onPress, accessibilityLabel, open = false, testID }: Props) {
  const { scheme } = useTheme();
  const f = V46_FORM[scheme].select;
  const arrow = V46_EXPLORE[scheme].city.button.chevron.size;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="combobox"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text }}
      accessibilityState={{ expanded: open }}
      testID={testID}
    >
      <Animated.View
        style={[
          fieldBoxStyle(f.box, open),
          { flexDirection: 'row', alignItems: 'center' },
          transitionStyle(f.box.transitions),
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[v46FontStyle(f.text.font), { color: f.text.color }]}>{text}</Text>
        </View>
        <V46Svg drawing={V46_EXPLORE_ICONS.down} size={arrow} color={f.text.color} />
      </Animated.View>
    </Pressable>
  );
}
