import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { V46_FORM } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';

import { fieldBoxStyle, fieldTextStyle } from './field';
import { transitionStyle } from './motion';

type Props = Omit<TextInputProps, 'style' | 'value' | 'maxLength' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  // "Doğrulama kodu": read by screen readers.
  accessibilityLabel: string;
  // Drawn as while typing, the next box in focus (the gallery's "yazarken").
  focusedPreview?: boolean;
};

// The sign-up's code (v46 `.otp`): one box per digit (six), as wide as each other with a gap
// between, each digit centred and as wide as the others. The box that takes the next digit has the
// purple edge and ring (`.otp input:focus`). One field lies unseen over the boxes, so typing,
// pasting and the SMS code filling itself in work as in a plain field. No touch while typing here
// (K-30): the last digit sends the code, and a wrong code is felt.
export const CodeField = forwardRef<TextInput, Props>(function CodeField(
  { value, onChangeText, accessibilityLabel, focusedPreview = false, onFocus, onBlur, ...rest },
  ref,
) {
  const { scheme } = useTheme();
  const f = V46_FORM[scheme].code;
  const [focused, setFocused] = useState(false);
  const next = Math.min(value.length, f.cells - 1);
  return (
    <View>
      <View
        style={{ flexDirection: 'row', gap: f.gap }}
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: f.cells }, (_, i) => (
          <Animated.View
            key={i}
            style={[
              fieldBoxStyle(f.cell, (focused || focusedPreview) && i === next),
              { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
              transitionStyle(f.cell.transitions),
            ]}
          >
            <Text style={fieldTextStyle(f.text)}>{value[i] ?? ''}</Text>
          </Animated.View>
        ))}
      </View>
      <TextInput
        ref={ref}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        {...rest}
        value={value}
        maxLength={f.cells}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, f.cells))}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        style={styles.unseen}
      />
    </View>
  );
});

// Over the boxes, all but invisible: a field at opacity 0 does not take a touch on Android (not a
// look of v46's: nothing of it shows).
const UNSEEN = 0.02;
const styles = StyleSheet.create({
  unseen: { ...StyleSheet.absoluteFill, opacity: UNSEEN },
});
