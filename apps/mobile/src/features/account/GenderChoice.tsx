import { GENDERS, type Gender } from '@shared/gender.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';

import { SIGNUP_FONT_SCALE, useSignupLook } from '@/features/onboarding/look';
import { profileViewKeys } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

type Props = {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  disabled?: boolean;
};

// "Cinsiyetin" (docs/SPEC_V3.md §23.D; yeni arayüz tuvali, KayitCinsiyet `.cr.big`): three rows on
// the ground with a hairline between them, each a 24 radio, the option and what it means for the
// tables. Shown to nobody, set once (rule 12).
export function GenderChoice({ value, onChange, disabled }: Props) {
  const look = useSignupLook();
  const R = SIGNUP.row;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.signup.genderLabel}
      style={{ marginTop: SIGNUP.row.listTop - SIGNUP.titleGap }}
    >
      {GENDERS.map((gender, i) => {
        const selected = value === gender;
        return (
          <Pressable
            key={gender}
            testID={`gender-${gender}`}
            accessibilityRole="radio"
            accessibilityLabel={tr.signup.genders[gender]}
            accessibilityState={{ selected, disabled: !!disabled }}
            disabled={disabled}
            onPress={() => {
              if (!selected) haptic('selection');
              onChange(gender);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: R.gap,
              minHeight: R.big,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {i > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: R.hairIn,
                  right: 0,
                  borderTopWidth: 1,
                  borderTopColor: look.hair,
                }}
              />
            ) : null}
            <View
              style={{
                width: R.mark,
                height: R.mark,
                borderRadius: R.mark / 2,
                boxShadow: `inset 0px 0px 0px ${selected ? R.radioOn : 2}px ${
                  selected ? look.markOn : look.markLine
                }`,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[SIGNUP_TYPE.rowTitle, { color: look.ink }]}
              >
                {tr.signup.genders[gender]}
              </Text>
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[SIGNUP_TYPE.rowNote, { color: look.muted, marginTop: 2 }]}
              >
                {tr.signup.genderNotes[gender]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// The one-time answer of an account from before the gender step: written only while it is empty.
// The profile row (has_gender, the onboarding gate) and the own profile view (the gender itself, for
// the game flow's sheets) are read again.
export function useSetGender(onSaved?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (gender: Gender) => callAccount({ action: 'set-gender', gender }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
      ]);
      onSaved?.();
    },
  });
}
