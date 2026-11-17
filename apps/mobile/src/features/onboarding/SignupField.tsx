import { forwardRef, useState } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { noteTyping } from '@/lib/haptics';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';
import { useTheme } from '@/theme/ThemeProvider';

import { ErrorLine } from './ErrorLine';
import { SIGNUP_FONT_SCALE, useSignupLook } from './look';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  // Fixed words before the number ("+90"), with the small tag over its left ("TR").
  prefix?: string;
  tag?: string;
  // Right-aligned inside the field ("4/24").
  counter?: string;
  error?: string | null;
  centered?: boolean;
};

// A sign-up field (KayitTelefon, KayitAd, KayitDogum `.fl`): the surface 56 high, 18 round, a 1 px
// inset line; focused, a 2 px line in the ink. The hint is drawn by the app, in the app's type:
// Android draws a field's own hint in the phone's system face.
export const SignupField = forwardRef<TextInput, Props>(function SignupField(
  { prefix, tag, counter, error, centered, placeholder, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const look = useSignupLook();
  const [focused, setFocused] = useState(false);
  const F = SIGNUP.field;
  const ring = error ? look.danger : focused ? look.lineOn : look.line;
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: F.gap,
          minHeight: F.height,
          paddingHorizontal: F.padX,
          borderRadius: F.radius,
          backgroundColor: look.field,
          boxShadow: `inset 0px 0px 0px ${focused || error ? F.lineOn : F.line}px ${ring}`,
        }}
      >
        {prefix ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingRight: F.prefixIn,
              borderRightWidth: 1,
              borderRightColor: look.divider,
              alignSelf: 'stretch',
            }}
          >
            {tag ? (
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[SIGNUP_TYPE.prefixSmall, { color: look.muted }]}
              >
                {tag}
              </Text>
            ) : null}
            <Text
              maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
              style={[SIGNUP_TYPE.prefix, { color: look.ink }]}
            >
              {prefix}
            </Text>
          </View>
        ) : null}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            ref={ref}
            {...rest}
            maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
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
            accessibilityHint={rest.accessibilityHint ?? placeholder}
            selectionColor={look.ink}
            cursorColor={look.ink}
            textAlignVertical="center"
            style={[
              SIGNUP_TYPE.fieldText,
              {
                color: look.ink,
                paddingVertical: 0,
                paddingHorizontal: 0,
                minHeight: F.height,
                textAlign: centered ? 'center' : undefined,
              },
            ]}
          />
          {placeholder && !rest.value ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
            >
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[
                  SIGNUP_TYPE.fieldText,
                  { color: colors.placeholder, textAlign: centered ? 'center' : undefined },
                ]}
              >
                {placeholder}
              </Text>
            </View>
          ) : null}
        </View>
        {counter ? (
          <Text
            maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
            style={[SIGNUP_TYPE.counter, { color: look.muted }]}
          >
            {counter}
          </Text>
        ) : null}
      </View>
      {error ? <ErrorLine text={error} /> : null}
    </View>
  );
});
