import { forwardRef, useState } from 'react';
import { Text as RNText, TextInput, type TextInputProps, View } from 'react-native';

import { noteTyping } from '@/lib/haptics';
import { useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Icon } from './Icon';
import { Text } from './Text';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';

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
  // docs/design/aura → Profili düzenle: 56 high (tall: 108, 24 round), 22 inside, 17 type, the
  // label in .body and the hint at 14.
  large?: boolean;
};

// A text field. Its outline is the theme's border where that reads 3:1 against the surface, the
// secondary text colour otherwise; focus draws it in the accent.
export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    hint,
    error,
    prefix,
    counter,
    code,
    tall,
    box,
    centered,
    search,
    large,
    multiline,
    placeholder,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  // The phone number's divider.
  const PREFIX_LINE = 26;
  const { colors, shape } = theme;
  const [focused, setFocused] = useState(false);
  const k = useKit();
  const radius = large
    ? tall
      ? KIT.size.fieldLgTallRadius
      : KIT.size.fieldLg / 2
    : prefix
      ? KIT.size.glassRadius
      : tall
        ? shape.radius.lg
        : box
          ? shape.radius.md
          : KIT.size.field / 2;
  const edge = focused || error ? 2 : KIT.size.edge;
  // Focused, a hard ring (no blur, cheap) as boxShadow; otherwise the soft glass shadow natively
  // (NativeShadow.tsx).
  const shadowOff = useLabOff('golge');
  const ring = focused && !error;
  const shadow = shadowParts(
    shadowOff,
    ring ? undefined : k.c.glassShadow,
    undefined,
    radius,
    true,
    edge,
  );

  return (
    <View className="gap-2">
      {label ? (
        large ? (
          <RNText style={[KIT_TYPE.body, { color: k.c.muted }]}>{label}</RNText>
        ) : (
          <Text variant="label">{label}</Text>
        )
      ) : null}
      <View
        className="flex-row items-center"
        // docs/design/aura (Telefon, `.glass`): a frosted field, its edge white; focused the
        // primary with its soft ring, an error in red. The phone's field 72 high, 28 round.
        style={{
          ...(large ? { backgroundColor: k.c.fieldLg } : gradientStyle(k.c.glass)),
          minHeight: large
            ? tall
              ? KIT.size.fieldLgTall
              : KIT.size.fieldLg
            : prefix
              ? KIT.size.phoneField
              : KIT.size.field,
          borderRadius: radius,
          borderWidth: edge,
          borderColor: error ? KIT.danger : focused ? KIT.primary : k.c.glassEdge,
          paddingHorizontal: large
            ? KIT.size.fieldLgPadX
            : prefix
              ? KIT.size.padLg
              : KIT.size.fieldPadX,
          boxShadow: ring
            ? `0px 0px 0px ${KIT.size.dotRing}px ${KIT.primaryRing}`
            : shadow.boxShadow,
        }}
      >
        {shadow.node}
        {search ? (
          <View className="mr-2.5">
            <Icon name="search" tone="muted" />
          </View>
        ) : null}
        {prefix ? (
          <>
            <RNText style={[KIT_TYPE.h3, { color: k.c.muted }]}>{prefix}</RNText>
            <View
              style={{
                width: KIT.size.hair,
                height: PREFIX_LINE,
                marginHorizontal: KIT.size.pad - SPACING[1],
                backgroundColor: k.c.hair,
              }}
            />
          </>
        ) : null}
        <View style={{ flex: 1, justifyContent: 'center' }}>
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
            accessibilityHint={rest.accessibilityHint ?? placeholder}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={[
              large
                ? KIT_TYPE.field
                : prefix
                  ? KIT_TYPE.phone
                  : typeStyle(theme, code ? 'title' : 'body'),
              {
                color: k.c.ink,
                paddingVertical: large && tall ? KIT.size.fieldLgPadY : SPACING[3],
                paddingHorizontal: 0,
                minHeight: large ? undefined : tall ? TOUCH.large + SPACING[8] : undefined,
              },
              code ? { textAlign: 'center', letterSpacing: SPACING[2] } : null,
              centered ? { textAlign: 'center' } : null,
            ]}
          />
          {/* The hint is drawn by the app, in the app's type: Android draws a field's own hint
              in the phone's system face (the owner's report, 27 and 28 Ekim). */}
          {placeholder && !rest.value ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                paddingVertical: large && tall ? KIT.size.fieldLgPadY : SPACING[3],
                justifyContent: multiline ? 'flex-start' : 'center',
              }}
            >
              <RNText
                style={[
                  large
                    ? KIT_TYPE.field
                    : prefix
                      ? KIT_TYPE.phone
                      : typeStyle(theme, code ? 'title' : 'body'),
                  { color: colors.placeholder },
                  code || centered ? { textAlign: 'center' } : null,
                ]}
              >
                {placeholder}
              </RNText>
            </View>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {hint || counter ? (
        <View className="flex-row justify-between gap-3">
          {large ? (
            <>
              <RNText style={[KIT_TYPE.note, { color: k.c.muted, flex: 1 }]}>{hint ?? ''}</RNText>
              {counter ? (
                <RNText style={[KIT_TYPE.note, { color: k.c.muted }]}>{counter}</RNText>
              ) : null}
            </>
          ) : (
            <>
              <Text variant="fine" className="flex-1">
                {hint ?? ''}
              </Text>
              {counter ? <Text variant="fine">{counter}</Text> : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
});
