import { useMutation } from '@tanstack/react-query';

import { signOutOfApp } from '@/features/auth/signOut';
import { tr } from '@/i18n/tr';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm } from '@/lib/overlayStore';

// "Çıkış yap" asks first (the owner's report, 10 Kasım), in the centred confirmation (yeni arayüz
// tuvali, AyarlarCikis; Ortak kurallar C1 counts it among what cannot be undone: the red action).
// Ayarlar and Hesap open the same one. A failed try leaves it open and it says why itself.
export function useSignOutConfirm(): { ask: () => void } {
  const signOut = useMutation({ meta: FEEL_ERROR, mutationFn: signOutOfApp });
  const ask = () => {
    signOut.reset();
    confirm({
      title: tr.settings.signOutConfirmTitle,
      note: tr.settings.signOutConfirmBody,
      tone: 'danger',
      confirmLabel: tr.settings.signOut,
      confirmIcon: 'logout',
      cancelLabel: tr.common.cancel,
      testID: 'sign-out-confirm',
      settings: true,
      onConfirm: async () => {
        await signOut.mutateAsync();
      },
    });
  };
  return { ask };
}
