import { useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { noteTyping } from '@/lib/haptics';
import { V46_EXPLORE, V46_EXPLORE_ICONS } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  // "Mekan ara": shown while empty, and read by screen readers.
  placeholder: string;
  testID?: string;
  // Drawn as while typing (the gallery's and the visual gate's "yazarken").
  focusedPreview?: boolean;
};

// Keşfet's search (v46 `.dsearch`): a round field with a magnifier. While typing its edge turns
// purple and a soft ring grows around it (`:focus-within`), both easing 200 ms. The keyboard's
// action key searches. A keystroke holds the phone's touches (haptics.ts → noteTyping), as in
// every field.
export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
  focusedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const s = V46_EXPLORE[scheme].search;
  const [focused, setFocused] = useState(false);
  const look = focused || focusedPreview ? s.focus : s.idle;
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.gap,
          marginTop: s.marginTop,
          height: s.height,
          paddingRight: s.padding[1],
          paddingLeft: s.padding[3],
          borderRadius: s.radius,
          backgroundColor: s.bg,
          borderWidth: look.border.width,
          borderColor: look.border.color,
          boxShadow: look.shadow ?? undefined,
        },
        transitionStyle(s.transitions),
      ]}
    >
      <V46Svg drawing={V46_EXPLORE_ICONS.search} size={s.icon.size} color={s.icon.color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            noteTyping();
            onChangeText(text);
          }}
          placeholder={placeholder}
          placeholderTextColor={s.field.placeholderColor}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          testID={testID}
          style={[
            v46FontStyle(s.field.font, s.field.letterSpacing),
            { height: s.field.height, padding: 0, color: s.field.color },
          ]}
        />
      </View>
    </Animated.View>
  );
}
