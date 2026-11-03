import { GENDERS, type Gender } from '@shared/gender.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { T } from '@/aura/kit';
import { Choice } from '@/components/Choice';
import { profileViewKeys } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

type Props = {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  disabled?: boolean;
  // Only the options: the sign-up step says the rest in its title and the line under it.
  bare?: boolean;
};

// "Cinsiyetin" (docs/SPEC_V3.md §23.D; canvas: Faz 3 · 23.2): three options and what the answer
// does. Shown to nobody, set once (rule 12).
export function GenderChoice({ value, onChange, disabled, bare = false }: Props) {
  return (
    <View className="gap-2">
      {bare ? null : (
        <T v="fine" ink>
          {tr.signup.genderLabel}
        </T>
      )}
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
      {bare ? null : <T v="fine">{tr.signup.genderHint}</T>}
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
