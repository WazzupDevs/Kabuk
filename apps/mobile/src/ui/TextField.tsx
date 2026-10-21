import { forwardRef, useState } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { noteTyping } from '@/lib/haptics';
import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { fieldBoxStyle, fieldTextStyle } from './field';
import { transitionStyle } from './motion';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'onChangeText' | 'value'> & {
  // "Görünen ad": above the box, and read by screen readers.
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  // Drawn as while typing (the gallery's "yazarken").
  focusedPreview?: boolean;
};

// The sign-up's text field (v46 `.sup-field`): its label above a 56 high box. While typing its edge
// turns purple and a ring grows around it (`:focus`), at once, as in v46. A keystroke holds the
// phone's touches (haptics.ts → noteTyping), as in every field.
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, value, onChangeText, focusedPreview = false, onFocus, onBlur, ...rest },
  ref,
) {
  const { scheme } = useTheme();
  const f = V46_FORM[scheme].textField;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: f.gap }}>
      <Text
        style={[v46FontStyle(f.label.font, f.label.letterSpacing), { color: f.label.color }]}
        importantForAccessibility="no"
      >
        {label}
      </Text>
      <Animated.View
        style={[
          fieldBoxStyle(f.box, focused || focusedPreview),
          { justifyContent: 'center' },
          transitionStyle(f.box.transitions),
        ]}
      >
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          onChangeText={(text) => {
            noteTyping();
            onChangeText(text);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          placeholderTextColor={f.text.placeholderColor}
          cursorColor={f.text.caret}
          style={[fieldTextStyle(f.text), { flex: 1 }]}
        />
      </Animated.View>
    </View>
  );
});
