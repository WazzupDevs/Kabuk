import { type ReactNode, useState } from 'react';
import { Text as RNText, TextInput, type TextInputProps, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { T, useKit } from '@/aura/kit';
import { Text } from '@/components/Text';
import { KIT } from '@/theme/auraKit';
import { EDIT_TYPE, PROFILE_EDIT } from '@/theme/profileEdit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

const F = PROFILE_EDIT.field;

// A field of Profili düzenle (ProfilDuzenle `.fl`, `.fi`, `.fh`): the label over it with its count at
// the right, the box (white; the ground's own dark; a 1 line, the text's colour and 2 once
// focused), the note under it. `multiline` is the bio's: at least 92 high, its words 14 from the
// top. `readOnly` is a still box without a fill (the birth date's), with `trail` (the lock) at its
// right. An error stands under the box in red.
export function ProfileField({
  label,
  counter,
  hint,
  error,
  multiline,
  readOnly,
  readOnlyValue,
  trail,
  first,
  testID,
  ...input
}: Omit<TextInputProps, 'style' | 'editable'> & {
  label: string;
  counter?: string;
  hint?: ReactNode;
  error?: string | null;
  readOnly?: boolean;
  // What the still box says where there is no value to hand (the birth date never reaches the phone).
  readOnlyValue?: string;
  trail?: ReactNode;
  // The first field has no extra space over its label.
  first?: boolean;
}) {
  const { scheme, colors } = useTheme();
  const { c } = useKit();
  const [focused, setFocused] = useState(false);
  const look = PROFILE_EDIT[scheme];
  const on = focused && !readOnly;
  return (
    <View style={{ marginTop: first ? 0 : F.top }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: F.gap,
          paddingHorizontal: F.labelIn,
          marginBottom: F.labelBottom,
        }}
      >
        <RNText style={[EDIT_TYPE.label, { color: c.ink, flexShrink: 1 }]}>{label}</RNText>
        {counter ? (
          <RNText style={[EDIT_TYPE.counter, { color: c.muted, fontVariant: ['tabular-nums'] }]}>
            {counter}
          </RNText>
        ) : null}
      </View>
      <View
        style={{
          minHeight: multiline ? F.tall : F.min,
          borderRadius: F.radius,
          borderWidth: on || error ? F.edgeOn : F.edge,
          borderColor: error ? KIT.danger : on ? c.ink : look.fieldEdge,
          backgroundColor: readOnly ? 'transparent' : look.fieldFill,
          // 2 line focused: the same words in the same place (the 1 line's room is 1 more inside).
          paddingHorizontal: on || error ? F.padX - (F.edgeOn - F.edge) : F.padX,
          paddingTop: multiline ? F.padTop : 0,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: F.gap,
        }}
      >
        <View style={{ flex: 1 }}>
          {readOnly ? (
            <RNText style={[EDIT_TYPE.value, { color: c.muted }]}>{readOnlyValue}</RNText>
          ) : (
            <TextInput
              {...input}
              testID={testID}
              multiline={multiline}
              onFocus={(e) => {
                setFocused(true);
                input.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                input.onBlur?.(e);
              }}
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholderTextColor={colors.placeholder}
              style={[
                EDIT_TYPE.value,
                { color: c.ink, paddingVertical: 0, minHeight: multiline ? F.tall - F.padTop : 0 },
              ]}
            />
          )}
        </View>
        {trail}
      </View>
      {error ? (
        <View style={{ marginTop: F.noteTop, paddingHorizontal: F.labelIn }}>
          <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        </View>
      ) : null}
      {hint ? (
        <View style={{ marginTop: F.noteTop, paddingHorizontal: F.labelIn }}>
          <T v="fine" color={c.muted}>
            {hint}
          </T>
        </View>
      ) : null}
    </View>
  );
}

// The lock at the right of the still birth date box (20, muted).
export function LockMark({ color }: { color: string }) {
  return <CapIcon name="lock" color={color} soft={1} size={ICON.md} />;
}
