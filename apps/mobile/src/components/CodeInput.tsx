import { forwardRef, useState } from 'react';
import { Text as RNText, TextInput, type TextInputProps, View } from 'react-native';

import { ErrorLine } from '@/features/onboarding/ErrorLine';
import { SIGNUP_FONT_SCALE, useSignupLook } from '@/features/onboarding/look';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

type Props = Omit<TextInputProps, 'style' | 'value' | 'maxLength' | 'placeholderTextColor'> & {
  value: string;
  length: number;
  error?: string | null;
};

// The one-time code as one box per digit (yeni arayüz tuvali: KayitKod `.otp`): the surface 58 high,
// 16 round, a 1 px inset line; the box that takes the next digit is lined 2 px in the ink with its
// caret; a wrong code lines every box 2 px in the danger colour (KayitKodHatali) and says why under
// them. A single invisible field lies over the boxes, so typing, pasting and SMS autofill work as
// in a plain field.
export const CodeInput = forwardRef<TextInput, Props>(function CodeInput(
  { value, length, error, ...rest },
  ref,
) {
  const look = useSignupLook();
  const [focused, setFocused] = useState(false);
  const next = Math.min(value.length, length - 1);
  const C = SIGNUP.code;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: C.gap }}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === next && !error;
          const ring = error ? look.danger : active ? look.lineOn : look.line;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: C.height,
                borderRadius: C.radius,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: look.field,
                boxShadow: `inset 0px 0px 0px ${active || error ? SIGNUP.field.lineOn : SIGNUP.field.line}px ${ring}`,
              }}
            >
              {active && !value[i] ? (
                <View
                  style={{
                    width: C.caret.width,
                    height: C.caret.height,
                    backgroundColor: look.ink,
                  }}
                />
              ) : (
                <RNText
                  maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                  style={[SIGNUP_TYPE.code, { color: look.ink }]}
                >
                  {value[i] ?? ''}
                </RNText>
              )}
            </View>
          );
        })}
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
      {error ? <ErrorLine text={error} /> : null}
    </View>
  );
});
