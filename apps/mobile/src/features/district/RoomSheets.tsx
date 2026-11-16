import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { putDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { districtApi, venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm, type ConfirmOptions } from '@/lib/overlayStore';
import { SPACING } from '@/theme/tokens';

// The semt room's sheets (app/(app)/district/room.tsx): its options (⋯) and "Oturumu kapat"; apart
// from the route so that the visual gate draws them with its sample (ekran/semt/*).

// The venue chat's muted list (§4.V: one list for both chats).
export const DISTRICT_MUTES_KEY = ['venueChatMutes'] as const;

export function OptionsSheet({
  visible,
  onClose,
  onChanged,
  onEnd,
}: {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
  // "Oturumu kapat": this sheet closes and the asking one opens (one sheet at a time).
  onEnd: () => void;
}) {
  const queryClient = useQueryClient();
  const mutes = useQuery({
    queryKey: DISTRICT_MUTES_KEY,
    queryFn: () => venueChatApi.mutes(),
    enabled: visible,
  });
  const unmute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.unmute(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISTRICT_MUTES_KEY });
      onChanged();
    },
  });
  const list = mutes.data?.mutes ?? [];
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.district.room.options}>
      <View style={{ gap: SPACING[1.5] }}>
        <T v="fine" ink>
          {tr.venueChat.mutedTitle}
        </T>
        {mutes.isPending ? (
          <Loader />
        ) : mutes.isError ? (
          <EmptyState
            kind="error"
            compact
            body={errorMessage(mutes.error)}
            action={{ label: tr.common.retry, onPress: () => void mutes.refetch() }}
          />
        ) : list.length === 0 ? (
          <T v="fine">{tr.venueChat.mutedNone}</T>
        ) : (
          <Menu>
            {list.map((m) => (
              <MenuItem
                key={m.id}
                label={m.label}
                note={tr.venueChat.unmute}
                icon={m.profiled ? 'person-outline' : 'happy-outline'}
                loading={unmute.isPending && unmute.variables === m.id}
                onPress={() => unmute.mutate(m.id)}
              />
            ))}
          </Menu>
        )}
      </View>
      <Menu>
        <MenuItem
          negative
          icon="log-out-outline"
          label={tr.district.end.action}
          testID="district-end"
          onPress={onEnd}
        />
      </Menu>
      <Btn block variant="glassy" label={tr.venueChat.done} onPress={onClose} />
    </Sheet>
  );
}

// "Oturumu kapat" (the owner's call, 8 Kasım; §4.V): asked once, in the centred dialog; closed, the
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
