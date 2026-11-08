import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { Foot, WarnRow } from '@/features/district/parts';
import { putDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { districtApi, venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
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

// "Oturumu kapat" (the owner's call, 8 Kasım; §4.V): asked once; closed, the room's state has no
// session and the screen goes to SemtBitti, where [Yeniden gir] starts 2 new hours with no question.
// Out of the sheet (a tap outside, back) is "Vazgeç".
export function EndSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const end = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => districtApi.leave(),
    onSuccess: (next) => putDistrictState(queryClient, next),
  });
  return (
    <Sheet
      visible={visible}
      onClose={() => {
        if (!end.isPending) onClose();
      }}
      title={tr.district.end.title}
      footer={
        <Foot>
          {end.isError ? <WarnRow tone="danger" text={errorMessage(end.error)} /> : null}
          <Btn
            block
            variant="danger"
            label={tr.district.end.yes}
            testID="district-end-yes"
            loading={end.isPending}
            onPress={() => !end.isPending && end.mutate()}
          />
          <Btn
            block
            variant="glassy"
            label={tr.common.cancel}
            disabled={end.isPending}
            onPress={onClose}
          />
        </Foot>
      }
    >
      <T v="body">{tr.district.end.body}</T>
    </Sheet>
  );
}
