import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'value' | 'maxLength' | 'placeholderTextColor'> & {
  value: string;
  length: number;
  error?: string | null;
};

// The one-time code as one box per digit (canvas: Doğrulama kodu). A single invisible field lies
// over the boxes, so typing, pasting and SMS autofill work as in a plain field; the box that takes
// the next digit is drawn in the accent.
export const CodeInput = forwardRef<TextInput, Props>(function CodeInput(
  { value, length, error, ...rest },
  ref,
) {
  const { colors, shape } = useTheme();
  const [focused, setFocused] = useState(false);
  // skall tuvali (skall.css → `.otp`): 56 high, 16 px corners, 1 px control; the next box 2 px
  // primary with the soft ring; an error 2 px danger.
  const outline = colors.control;
  const next = Math.min(value.length, length - 1);

  return (
    <View className="gap-2">
      <View>
        <View className="flex-row" style={{ gap: SPACING[2] }}>
          {Array.from({ length }, (_, i) => {
            const active = focused && i === next;
            return (
              <View
                key={i}
                className="flex-1 items-center justify-center"
                style={{
                  height: TOUCH.tab,
                  borderRadius: shape.radius.md,
                  borderWidth: error || active ? 2 : shape.stroke.control,
                  borderColor: error ? colors.danger : active ? colors.primary : outline,
                  backgroundColor: colors.surface,
                  boxShadow: active ? shape.shadow.focus : undefined,
                }}
              >
                <Text variant="title">{value[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
        {/* No noteTyping here (K-30): the last digit sends the code, and a wrong code is felt. */}
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          maxLength={length}
          caretHidden
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.02 }}
        />
      </View>
      {error ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
