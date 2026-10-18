import type { Gender } from '@shared/gender.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useOnboardingStore } from '@/features/onboarding/store';
import { ApiError, callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { queryClient as rootQueryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// Sign-up = profile (docs/SPEC_V3.md §3): the consents from "Başlamadan önce", the name and the
// birth date kept on the phone, and the gender (§23.D) go in one call. Under 18 the server deletes
// the account in that call; the phone signs out and the first screen says why (rule 11). Then the
// photo step, the last one.
export function useCompleteSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (gender: Gender | null) => {
      const { consented, name, birthDate } = useOnboardingStore.getState();
      if (!consented) throw new Error('The consents come first.');
      return callAccount({
        action: 'complete-onboarding',
        termsVersion: consented.terms,
        kvkkVersion: consented.kvkk,
        displayName: name,
        ...(birthDate ? { birthDate } : {}),
        ...(gender ? { gender } : {}),
      });
    },
    onSuccess: async (_data, gender) => {
      // Keep the onboarding screens for the photo step before the gate opens; its note depends on
      // the answer (§23.D). The name and the birth date stay until the photo step ends: the steps
      // still on screen would send a phone without them back to the name step.
      useOnboardingStore.setState({ extrasPending: true, gender });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.replace('/extras');
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.code === 'under_age') {
        // The account no longer exists: clear the session on the phone only.
        useOnboardingStore.setState({ underAge: true, name: '', birthDate: null, consented: null });
        await supabase.auth.signOut({ scope: 'local' });
        rootQueryClient.clear();
      }
    },
  });
}

// The error a sign-up step shows: none for under 18, where the first screen says it.
export function signupError(err: unknown): boolean {
  return !(err instanceof ApiError && err.code === 'under_age');
}
