import type { GiftState } from '@shared/api/gifts.ts';
import type { GiftPack } from '@shared/gifts.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useProfile } from '@/features/account/useProfile';
import { profileViewKeys } from '@/features/profile/queries';
import { giftsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// Hediye paketleri (docs/SPEC_V4.md §4.U): the caller's packs, login count and accessories, one
// query for the Aktiviteler card, Paketler and Aksesuarlarım.
export const giftKeys = { state: ['gifts', 'state'] as const };

export function useGiftState() {
  return useQuery({ queryKey: giftKeys.state, queryFn: giftsApi.state, staleTime: 60_000 });
}

// The app opened with a session counts as a login (one a day, the server's count): on the signed-in
// group's start and each time the app comes back to the front. A failure is quiet; the next opening
// tries again.
export function useGiftLogin(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const login = () =>
      giftsApi.login().then(
        (state) => queryClient.setQueryData<GiftState>(giftKeys.state, state),
        () => undefined,
      );
    void login();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void login();
    });
    return () => sub.remove();
  }, [queryClient]);
}

export function useOpenPack() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (pack: GiftPack) => giftsApi.open(pack),
    onSuccess: (res) => queryClient.setQueryData<GiftState>(giftKeys.state, res.state),
  });
}

// Wears an owned accessory on the capsule (null takes it off); the own capsule look is read again.
export function useEquip() {
  const queryClient = useQueryClient();
  const publicId = useProfile().data?.public_id;
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (accessoryId: string | null) => giftsApi.equip(accessoryId),
    onSuccess: async (res) => {
      queryClient.setQueryData<GiftState>(giftKeys.state, (s) =>
        s ? { ...s, equipped: res.equipped } : s,
      );
      if (publicId)
        await queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
    },
  });
}
