import { type Concept, type Intent } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

import { LobbyChoices } from './LobbyChoices';
import { roomKeys } from './queries';

type Props = {
  onClose: () => void;
  // The table is in the lobby: Mekan shows its card's new state.
  onOpened: () => void;
  roomId: string;
  venueId: string;
  // From Aktiviteler ("Bu oyunla lobiye aç", docs/SPEC_V3.md §18.3): that game's intent and tag.
  intent?: Intent | null;
  gameTag?: Concept | null;
};

// "Masanı lobiye aç" (v46 data-lsheet; docs/SPEC_V4.md §4.E): the owner's table goes into the
// venue's lobby with an optional intent and an optional game tag that only the lobby shows
// (none chosen: no tag). The person sits with the check-in's identity (§4.D), so there is no
// anonymous or profiled choice here. The sheet closes on Mekan, whose card then says "Lobide açık".
export function OpenLobbySheet({
  onClose,
  onOpened,
  roomId,
  venueId,
  intent: initialIntent,
  gameTag,
}: Props) {
  const queryClient = useQueryClient();
  const [intent, setIntent] = useState<Intent | null>(initialIntent ?? (gameTag ? 'game' : null));
  const [tag, setTag] = useState<Concept | null>(gameTag ?? null);

  const open = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () =>
      roomsApi.setVisibility(roomId, true, {
        ...(intent ? { intent } : {}),
        ...(tag ? { gameTag: tag } : {}),
      }),
    onSuccess: async () => {
      haptic('tableOpened');
      track('table_opened', { intent: intent ?? 'none', game_tag: tag ?? 'none' });
      void registerForPush();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.current }),
        queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
        queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) }),
      ]);
      onOpened();
      onClose();
    },
  });

  return (
    <Sheet
      visible
      onClose={onClose}
      title={tr.rooms.newTitle}
      footer={
        // "Lobiye aç" at the sheet's foot, whatever the chips' height (K4); "Vazgeç" small under it:
        // a press outside and a swipe down close the sheet as well (15.4).
        <View style={{ gap: KIT.size.rowGap }}>
          {open.isError ? (
            <T v="fine" color={KIT.danger} accessibilityLiveRegion="polite">
              {errorMessage(open.error)}
            </T>
          ) : null}
          <Btn
            block
            icon="list"
            testID="lobby-confirm"
            label={tr.venue.openLobby}
            onPress={() => open.mutate()}
            loading={open.isPending}
          />
          <Btn
            sm
            variant="glassy"
            label={tr.common.cancel}
            onPress={onClose}
            style={{ alignSelf: 'center' }}
          />
        </View>
      }
    >
      <View style={{ gap: KIT.size.sheetGap }}>
        <T v="fine">{tr.rooms.newHint}</T>
        <LobbyChoices intent={intent} tag={tag} onIntent={setIntent} onTag={setTag} />
      </View>
    </Sheet>
  );
}
