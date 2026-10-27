import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { noteTyping } from '@/lib/haptics';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label?: string;
  hint?: string;
  error?: string | null;
  // Fixed text before the field ("+90").
  prefix?: string;
  // Right-aligned under the field ("12/160").
  counter?: string;
  // The one-time code: large, centered, spaced digits.
  code?: boolean;
  // A multi-line field that starts several lines high (the bio).
  tall?: boolean;
  // skall.css → `.field.box`: 16 px corners instead of the capsule.
  box?: boolean;
  // Short fields centred in their box (the birth date's day, month and year).
  centered?: boolean;
  // A search field (v44: .dsearch): a capsule with the magnifier before the text.
  search?: boolean;
};

// A text field. Its outline is the theme's border where that reads 3:1 against the surface, the
// secondary text colour otherwise; focus draws it in the accent.
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, hint, error, prefix, counter, code, tall, box, centered, search, multiline, ...rest },
  ref,
) {
  const theme = useTheme();
  const { colors, shape } = theme;
  const [focused, setFocused] = useState(false);
  // skall tuvali (skall.css → "Alan"): the control outline; focused 2 px primary with the soft
  // ring; an error 2 px danger.
  const outline = colors.control;

  return (
    <View className="gap-2">
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        className="flex-row items-center"
        style={{
          minHeight: SPACING[12] + SPACING[1],
          borderRadius: tall ? shape.radius.lg : box ? shape.radius.md : shape.radius.pill,
          borderWidth: focused || error ? 2 : shape.stroke.control,
          borderColor: error ? colors.danger : focused ? colors.primary : outline,
          backgroundColor: colors.surface,
          paddingHorizontal: SPACING[4] + SPACING[0.5],
          boxShadow: focused && !error ? shape.shadow.focus : undefined,
        }}
      >
        {search ? (
          <View className="mr-2.5">
            <Icon name="search" tone="muted" />
          </View>
        ) : null}
        {prefix ? (
          <Text tone="muted" className="mr-2">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          // No touch while the person types (K-30).
          onChangeText={(text) => {
            noteTyping();
            rest.onChangeText?.(text);
          }}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            typeStyle(theme, code ? 'title' : 'body'),
            {
              flex: 1,
              color: colors.text,
              paddingVertical: SPACING[3],
              minHeight: tall ? TOUCH.large + SPACING[8] : undefined,
            },
            code ? { textAlign: 'center', letterSpacing: SPACING[2] } : null,
            centered ? { textAlign: 'center' } : null,
          ]}
        />
      </View>
      {error ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {hint || counter ? (
        <View className="flex-row justify-between gap-3">
          <Text variant="fine" className="flex-1">
            {hint ?? ''}
          </Text>
          {counter ? <Text variant="fine">{counter}</Text> : null}
        </View>
      ) : null}
    </View>
  );
});
