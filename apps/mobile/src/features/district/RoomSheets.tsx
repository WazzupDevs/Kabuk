import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CHAT_MUTES_KEY } from '@/features/chat/ChatOptionsMenu';
import { putDistrictState } from '@/features/district/queries';
import { tr } from '@/i18n/tr';
import { districtApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm, type ConfirmOptions } from '@/lib/overlayStore';

// The semt room's "Sohbetten çık" (app/(app)/district/room.tsx; its ⋮ menu is
// features/chat/ChatOptionsMenu); apart from the route so that the visual gate draws it with its
// sample (ekran/semt/*).

// The venue chat's muted list (§4.V: one list for both chats).
export const DISTRICT_MUTES_KEY = CHAT_MUTES_KEY;

// "Sohbetten çık" (the owner's call, 8 Kasım; §4.V): asked once, in the centred dialog; closed, the
// room's state has no session and the screen goes to SemtBitti, where [Yeniden gir] starts 2 new
// hours with no question. It can be undone that way, so the dialog is plain. A thrown error leaves
// the dialog open with its error for another try. The visual gate draws the same options
// (`endSessionOptions`).
export function endSessionOptions(run: () => Promise<unknown>): ConfirmOptions {
  return {
    title: tr.district.end.title,
    note: tr.district.end.body,
    tone: 'plain',
    confirmLabel: tr.district.end.yes,
    cancelLabel: tr.common.cancel,
    testID: 'district-end-yes',
    onConfirm: async () => {
      await run();
    },
  };
}

export function useEndSession(): () => void {
  const queryClient = useQueryClient();
  const end = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => districtApi.leave(),
    onSuccess: (next) => putDistrictState(queryClient, next),
  });
  return () => {
    confirm(endSessionOptions(() => end.mutateAsync()));
  };
}
