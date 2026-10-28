import { forwardRef, useState } from 'react';
import { Text as RNText, TextInput, type TextInputProps, View } from 'react-native';

import { Glass, useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'value' | 'maxLength' | 'placeholderTextColor'> & {
  value: string;
  length: number;
  error?: string | null;
};

const BOX = 60;
const BOX_RADIUS = 16;

// The one-time code as one box per digit (canvas: Doğrulama kodu). A single invisible field lies
// over the boxes, so typing, pasting and SMS autofill work as in a plain field; the box that takes
// the next digit is drawn in the accent.
export const CodeInput = forwardRef<TextInput, Props>(function CodeInput(
  { value, length, error, ...rest },
  ref,
) {
  const { c, scheme } = useKit();
  const [focused, setFocused] = useState(false);
  const next = Math.min(value.length, length - 1);

  return (
    <View className="gap-2">
      {/* docs/design/aura → Kod: the six boxes on one glass card; the filled ones white, the next
          one ringed in the primary, the rest softer. */}
      <Glass style={{ padding: KIT.size.rowGap }}>
        <View className="flex-row" style={{ gap: SPACING[2] }}>
          {Array.from({ length }, (_, i) => {
            const active = focused && i === next;
            return (
              <View
                key={i}
                className="flex-1 items-center justify-center"
                style={{
                  height: BOX,
                  borderRadius: BOX_RADIUS,
                  backgroundColor:
                    i < value.length || active ? (scheme === 'dark' ? c.segOn : KIT.white) : c.day,
                  borderWidth: error ? 2 : 0,
                  borderColor: KIT.danger,
                  boxShadow: active
                    ? `0px 0px 0px 2px ${KIT.primary}, 0px 0px 0px 6px ${KIT.primaryRing}`
                    : undefined,
                }}
              >
                <RNText style={[KIT_TYPE.code, { color: c.ink }]}>{value[i] ?? ''}</RNText>
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
      </Glass>
      {error ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
