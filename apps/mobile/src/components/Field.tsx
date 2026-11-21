import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
} from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, Round, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { noteTyping } from '@/lib/haptics';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import type { ExploreFace } from '@/theme/explore';
import { PROFILE_EDIT } from '@/theme/profileEdit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// The one text field (the owner's call, 19 Kasım, docs/decisions/temel.md → Alan; one component,
// 21 Kasım). Every field a screen draws is one of three:
// - `Field`: a form field on its card (Profili düzenle), one line or many, with its label, count,
//   note and error.
// - `SearchField`: the search capsule (Keşfet, Mesajlar, Arkadaşlar, Tüm aksesuarlar), its icon and
//   its clear button.
// - `BareField`: the words only, with no box (a post being written).
// All three type in the kit's text and draw their hint themselves, in the app's face: Android
// draws a field's own hint in the phone's system face (the owner's report, 27 and 28 Ekim). The
// chat's writing field (Composer), the code's boxes (CodeInput) and the games' and the sign-up's
// own fields are drawn by their own boards.

type Base = Omit<TextInputProps, 'style' | 'placeholderTextColor'>;

// The input and its hint, laid over each other: what every field below draws inside its box.
const FieldText = forwardRef<TextInput, Base & { type: TextStyle; padY?: number; grow?: boolean }>(
  function FieldText({ type, padY = 0, grow, multiline, placeholder, ...rest }, ref) {
    const { colors } = useTheme();
    const { c } = useKit();
    return (
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
          accessibilityLabel={rest.accessibilityLabel ?? placeholder}
          // A screen in its own colour picks its own (Mekan akışı's pink).
          selectionColor={rest.selectionColor ?? colors.accent}
          cursorColor={rest.cursorColor ?? rest.selectionColor ?? colors.accent}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            type,
            {
              color: c.ink,
              paddingVertical: padY,
              paddingHorizontal: 0,
              includeFontPadding: false,
            },
            grow ? { flexGrow: 1 } : null,
          ]}
        />
        {placeholder && !rest.value ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { paddingVertical: padY, justifyContent: multiline ? 'flex-start' : 'center' },
            ]}
          >
            <RNText
              style={[type, { color: colors.placeholder }]}
              numberOfLines={multiline ? undefined : 1}
            >
              {placeholder}
            </RNText>
          </View>
        ) : null}
      </View>
    );
  },
);

type FieldProps = Base & {
  label?: string;
  hint?: string;
  error?: string | null;
  // At the label's right, over the field ("12/160").
  counter?: string;
  // A multi-line field that starts several lines high (the bio).
  tall?: boolean;
};

// A form field on a card. Tuval Duzenle (Profili düzenle): the surface with a 1.5 edge, 16 round and
// 16 inside, no shadow; one line exactly the field's height (44). Its label (13/700, muted) with the
// count at its right over it, its note under it, both 4 in (theme/profileEdit.ts). Focused, the
// primary edge and the green ring 3 px at 18 % (iskelet.md → 5.8); an error in red.
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, error, counter, tall, multiline, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const k = useKit();
  const E = PROFILE_EDIT;
  const look = E[k.scheme];
  const edge = focused || error ? 2 : E.field.edge;
  // One line: no room over and under, so the field is exactly its height.
  const padY = !multiline && !tall ? 0 : tall ? E.field.padY : SPACING[3];

  return (
    <View style={{ gap: SPACING[2] }}>
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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: look.fieldFill,
          minHeight: tall ? E.field.tall : KIT.size.field,
          borderRadius: E.field.radius,
          borderWidth: edge,
          borderColor: error ? KIT.danger : focused ? KIT.primary : look.fieldEdge,
          paddingHorizontal: E.field.padX,
          boxShadow:
            focused && !error
              ? `0px 0px 0px ${KIT.size.focusHalo}px ${KIT.primaryHalo}`
              : undefined,
        }}
      >
        <FieldText
          ref={ref}
          {...rest}
          multiline={multiline}
          type={multiline ? KIT_TYPE.boxFieldMulti : KIT_TYPE.boxField}
          padY={padY}
          grow={multiline}
          accessibilityHint={rest.accessibilityHint ?? rest.placeholder}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
      </View>
      {error ? (
        <RNText
          accessibilityLiveRegion="polite"
          style={[KIT_TYPE.boxNote, { color: KIT.danger, paddingHorizontal: E.field.labelIn }]}
        >
          {error}
        </RNText>
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

// The search capsule (iskelet.md → 5.1; Mesajlar's search in 5.4: "Keşfet'tekinin aynısı"): the
// search icon, the field and, while something is typed, the clear button, on one frosted capsule
// 44 high, 20 in at the sides. `face` gives it a solid fill instead of the frost (Keşfet, over its
// buddies and its map).
export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
  autoFocus,
  face,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
  // The keyboard opens with it (a search page: Tüm aksesuarlar's).
  autoFocus?: boolean;
  face?: ExploreFace;
}) {
  const { c } = useKit();
  const S = KIT.size;
  const h = S.field;
  return (
    <Glass
      frost={!face}
      face={face}
      radius={h / 2}
      style={{
        height: h,
        borderRadius: h / 2,
        paddingLeft: S.fieldPadX,
        paddingRight: value ? S.explore.switchPad : S.fieldPadX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[2],
      }}
    >
      <CapIcon name="search" color={c.muted} size={S.explore.icon} />
      <FieldText
        testID={testID}
        autoFocus={autoFocus}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        type={KIT_TYPE.body}
      />
      {value ? (
        <Round
          glassy={false}
          side={S.btnSm}
          icon="close"
          iconSize={ICON.md}
          color={c.muted}
          label={tr.common.clearSearch}
          testID={testID ? `${testID}-clear` : undefined}
          onPress={() => onChangeText('')}
        />
      ) : null}
    </Glass>
  );
}

// The words only, with no box: a post being written (Mekan akışı's Yaz). Many lines, from the top.
export const BareField = forwardRef<TextInput, Base & { minHeight?: number }>(function BareField(
  { minHeight, ...rest },
  ref,
) {
  return (
    <View style={{ minHeight }}>
      <FieldText ref={ref} {...rest} multiline type={KIT_TYPE.body} grow />
    </View>
  );
});
