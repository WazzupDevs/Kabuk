import { forwardRef, useState } from 'react';
import { Text, TextInput, type TextInputProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { noteTyping } from '@/lib/haptics';
import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { fieldBoxStyle, fieldTextStyle } from './field';
import { transitionStyle } from './motion';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'onChangeText' | 'value'> & {
  // The country code before the number ("+90").
  prefix: string;
  value: string;
  onChangeText: (text: string) => void;
  // "Telefon numarası": read by screen readers.
  accessibilityLabel: string;
  // Drawn as while typing (the gallery's "yazarken").
  focusedPreview?: boolean;
};

// The sign-up's phone field (v46 `.sup-phone`): one 60 high box, the country code and then the
// number, its digits each as wide (`tabular-nums`). While typing the whole box takes the purple
// edge and ring (`:focus-within`), at once, as in v46. A keystroke holds the phone's touches
// (haptics.ts → noteTyping).
export const PhoneField = forwardRef<TextInput, Props>(function PhoneField(
  { prefix, value, onChangeText, focusedPreview = false, onFocus, onBlur, ...rest },
  ref,
) {
  const { scheme } = useTheme();
  const f = V46_FORM[scheme].phone;
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View
      style={[
        fieldBoxStyle(f.box, focused || focusedPreview),
        { flexDirection: 'row', alignItems: 'center', gap: f.gap },
        transitionStyle(f.box.transitions),
      ]}
    >
      <Text
        style={[v46FontStyle(f.prefix.font, f.prefix.letterSpacing), { color: f.prefix.color }]}
        importantForAccessibility="no"
      >
        {prefix}
      </Text>
      <TextInput
        ref={ref}
        keyboardType="phone-pad"
        autoComplete="tel-national"
        textContentType="telephoneNumber"
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
        placeholderTextColor={f.text.placeholderColor}
        cursorColor={f.text.caret}
        style={[fieldTextStyle(f.text), { flex: 1, minWidth: 0, alignSelf: 'stretch' }]}
      />
    </Animated.View>
  );
});
