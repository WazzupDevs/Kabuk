import { GENDERS, type Gender } from '@shared/gender.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Choice } from '@/components/Choice';
import { Text } from '@/components/Text';
import { profileViewKeys } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

type Props = {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  disabled?: boolean;
};

// "Cinsiyetin" (docs/SPEC_V3.md §23.D; canvas: Faz 3 · 23.2): three options and what the answer
// does. Shown to nobody, set once (rule 12).
export function GenderChoice({ value, onChange, disabled }: Props) {
  return (
    <View className="gap-2">
      <Text variant="label">{tr.signup.genderLabel}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={tr.signup.genderLabel}
        className="gap-2"
      >
        {GENDERS.map((gender) => (
          <Choice
            key={gender}
            testID={`gender-${gender}`}
            label={tr.signup.genders[gender]}
            selected={value === gender}
            disabled={disabled}
            onPress={() => onChange(gender)}
          />
        ))}
      </View>
      <Text variant="fine">{tr.signup.genderHint}</Text>
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
