import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';

import { Btn, T, useKit } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { signOutOfApp } from '@/features/auth/signOut';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { SPACING } from '@/theme/tokens';

// "Çıkış yap" asks first (the owner's report, 10 Kasım), in the confirm sheet of Hesabımı sil: the
// title, the note, the red action and "Vazgeç". Ayarlar and Hesap open the same sheet.
export function SignOutSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useKit();
  const signOut = useMutation({ meta: FEEL_ERROR, mutationFn: signOutOfApp });
  const close = () => {
    if (!signOut.isPending) onClose();
  };
  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={tr.settings.signOutConfirmTitle}
      footer={
        <View style={{ gap: SPACING[2.5] }}>
          <Btn
            block
            tall
            variant="danger"
            icon="logout"
            testID="sign-out-confirm"
            label={tr.settings.signOut}
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
          <Btn
            block
            tall
            variant="glassy"
            testID="sign-out-cancel"
            label={tr.common.cancel}
            disabled={signOut.isPending}
            onPress={close}
          />
        </View>
      }
    >
      <T v="fine">{tr.settings.signOutConfirmBody}</T>
      {signOut.isError ? (
        <T v="fine" color={c.warn}>
          {errorMessage(signOut.error)}
        </T>
      ) : null}
    </Sheet>
  );
}
