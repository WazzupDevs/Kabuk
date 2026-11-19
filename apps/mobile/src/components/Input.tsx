import { forwardRef, useState } from 'react';
import { Text as RNText, TextInput, type TextInputProps, View } from 'react-native';

import { noteTyping } from '@/lib/haptics';
import { useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PROFILE_EDIT } from '@/theme/profileEdit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label?: string;
  hint?: string;
  error?: string | null;
  // At the label's right, over the field ("12/160").
  counter?: string;
  // A multi-line field that starts several lines high (the bio).
  tall?: boolean;
};

// A text field on a card, one look (the owner's call, 19 Kasım, docs/decisions/temel.md: the old
// `box`, `large`, `boxed`, `big`, `code`, `prefix` and `search` looks had no screen left; the search
// capsule is aura/GlassSearch, the code CodeInput). Tuval Duzenle (Profili düzenle): the surface
// with a 1.5 edge, 16 round and 16 inside, no shadow; one line exactly the field's height (44). Its
// label (13/700, muted) with the count at its right over it, its note under it, both 4 in
// (theme/profileEdit.ts). Focused, the primary edge and the green ring 3 px at 18 % (iskelet.md →
// 5.8); an error in red.
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, hint, error, counter, tall, multiline, placeholder, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const k = useKit();
  const E = PROFILE_EDIT;
  const look = E[k.scheme];
  const edge = focused || error ? 2 : E.field.edge;
  const type = multiline ? KIT_TYPE.boxFieldMulti : KIT_TYPE.boxField;
  // One line: no room over and under, so the field is exactly its height.
  const padY = !multiline && !tall ? 0 : tall ? E.field.padY : SPACING[3];
  const ring = focused && !error;

  return (
    <View className="gap-2">
      {label ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: SPACING[3],
            paddingHorizontal: E.field.labelIn,
          }}
        >
          <RNText style={[KIT_TYPE.sectionHead, { color: k.c.muted, flexShrink: 1 }]}>
            {label}
          </RNText>
          {counter ? (
            <RNText
              style={[KIT_TYPE.sectionHead, { color: k.c.muted, fontVariant: ['tabular-nums'] }]}
            >
              {counter}
            </RNText>
          ) : null}
        </View>
      ) : null}
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: look.fieldFill,
          minHeight: tall ? E.field.tall : KIT.size.field,
          borderRadius: E.field.radius,
          borderWidth: edge,
          borderColor: error ? KIT.danger : focused ? KIT.primary : look.fieldEdge,
          paddingHorizontal: E.field.padX,
          boxShadow: ring ? `0px 0px 0px ${KIT.size.focusHalo}px ${KIT.primaryHalo}` : undefined,
        }}
      >
        {/* Many lines start at the top left, not in the middle of the box (12.4). */}
        <View
          style={
            multiline
              ? { flex: 1, alignSelf: 'stretch', justifyContent: 'flex-start' }
              : { flex: 1, justifyContent: 'center' }
          }
        >
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
              type,
              { color: k.c.ink, paddingVertical: padY, paddingHorizontal: 0 },
              multiline ? { flexGrow: 1 } : null,
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
                paddingVertical: padY,
                justifyContent: multiline ? 'flex-start' : 'center',
              }}
            >
              <RNText style={[type, { color: colors.placeholder }]}>{placeholder}</RNText>
            </View>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {hint ? (
        <RNText
          style={[KIT_TYPE.boxNote, { color: look.note, paddingHorizontal: E.field.labelIn }]}
        >
          {hint}
        </RNText>
      ) : null}
    </View>
  );
});
