import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { noteTyping } from '@/lib/haptics';
import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { fieldBoxStyle, fieldTextStyle } from './field';
import { transitionStyle } from './motion';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'onChangeText' | 'value'> & {
  value: string;
  onChangeText: (text: string) => void;
  // "Biyografi": read by screen readers.
  accessibilityLabel: string;
  // Drawn as while typing (the gallery's "yazarken").
  focusedPreview?: boolean;
};

// The many-line field (v46 `.ebio textarea`: the bio): as high as v46 draws it, its text scrolling
// inside. While typing its edge turns purple and a soft ring grows around it (`:focus`), both
// easing 200 ms. A keystroke holds the phone's touches (haptics.ts → noteTyping).
export const TextArea = forwardRef<TextInput, Props>(function TextArea(
  { value, onChangeText, focusedPreview = false, onFocus, onBlur, ...rest },
  ref,
) {
  const { scheme } = useTheme();
  const f = V46_FORM[scheme].textArea;
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View
      style={[fieldBoxStyle(f, focused || focusedPreview), transitionStyle(f.transitions)]}
    >
      <TextInput
        ref={ref}
        {...rest}
        multiline
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
        placeholderTextColor={f.text.placeholderColor}
        cursorColor={f.text.caret}
        textAlignVertical="top"
        style={[fieldTextStyle(f.text), { flex: 1 }]}
      />
    </Animated.View>
  );
});
