import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useProfile } from '@/features/account/useProfile';

import { profileViewKeys, useProfileView } from './queries';

// The caller's own photo, as others would see it. "Profilimle" needs one (docs/SPEC_V3.md §22.G,
// decision 8): a hidden photo counts as none. Until profile/get answers, `known` is false and the
// choice stays open; the server checks again and answers photo_required. With it, what the game
// flow's profile preview shows (name, age) and the own gender that decides whether it shows one
// (§23.D): undefined until profile/get answers, null for an account from before the gender step.
export function useOwnPhoto() {
  const queryClient = useQueryClient();
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all }),
    [queryClient],
  );
  const photoUrl = view.data?.photoHidden ? null : (view.data?.photoUrl ?? null);
  return {
    known: view.isSuccess,
    has: photoUrl !== null,
    url: photoUrl,
    name: view.data?.displayName ?? own.data?.display_name ?? '',
    age: view.data?.age ?? null,
    gender: view.isSuccess ? (view.data.gender ?? null) : undefined,
    refresh,
  };
}
