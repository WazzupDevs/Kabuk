import type { GiftState } from '@shared/api/gifts.ts';
import type { GiftPack } from '@shared/gifts.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useProfile } from '@/features/account/useProfile';
import { profileViewKeys } from '@/features/profile/queries';
import { giftsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { createOrder } from '@/lib/lru';

// Hediye paketleri (docs/SPEC_V4.md §4.U): the caller's packs, login count and accessories, one
// query for the Aktiviteler card, Paketler and Kapsülünü süsle.
export const giftKeys = { state: ['gifts', 'state'] as const };

export function useGiftState() {
  return useQuery({ queryKey: giftKeys.state, queryFn: giftsApi.state, staleTime: 60_000 });
}

// The app opened with a session counts as a login (one a day, the server's count): on the signed-in
// group's start and each time the app comes back to the front. A failure is quiet; the next opening
// tries again.
//
// A login answer that comes after a later login or after a pack opening / wearing (which gave a
// newer state) is dropped, so a slow old answer never overwrites the newer state.
const stateOrder = createOrder();

export function useGiftLogin(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const login = () => {
      const n = stateOrder.next();
      return giftsApi.login().then(
        (state) => {
          if (stateOrder.isLatest(n)) queryClient.setQueryData<GiftState>(giftKeys.state, state);
        },
        () => undefined,
      );
    };
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
    onSuccess: (res) => {
      stateOrder.next();
      queryClient.setQueryData<GiftState>(giftKeys.state, res.state);
    },
  });
}

// Wears an owned accessory on the capsule (null takes it off); the own capsule look is read again.
export function useEquip() {
  const queryClient = useQueryClient();
  const publicId = useProfile().data?.public_id;
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (accessoryId: string | null) => giftsApi.equip(accessoryId),
    onSuccess: (res) => {
      stateOrder.next();
      queryClient.setQueryData<GiftState>(giftKeys.state, (s) =>
        s ? { ...s, worn: res.worn, equipped: res.equipped } : s,
      );
      // The button ends with the answer; the re-read runs on its own.
      if (publicId)
        void queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
    },
  });
}
