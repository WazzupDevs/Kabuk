import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chips } from '@/components/Chips';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { roomKeys } from './queries';

type IntentChoice = Intent | 'none';
type TagChoice = Concept | 'none';

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
// ("Fark etmez": none). The person sits with the check-in's identity (§4.D), so there is no
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
  const [intent, setIntent] = useState<Intent | null>(initialIntent ?? null);
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
    <Sheet visible onClose={onClose} title={tr.rooms.newTitle}>
      <Text variant="fine">{tr.rooms.newHint}</Text>
      {/* skall tuvali (MasaLobiyeAc): both choices in one soft card, as chips. */}
      <Card tone="note">
        <View className="gap-2">
          <Text variant="label">{tr.rooms.intentLabel}</Text>
          <Chips<IntentChoice>
            wrap
            accessibilityLabel={tr.rooms.intentLabel}
            value={intent ?? 'none'}
            onChange={(v) => setIntent(v === 'none' ? null : v)}
            options={[
              { value: 'none', label: tr.rooms.intentNone, testID: 'intent-none' },
              ...INTENTS.map((i) => ({ value: i, label: tr.intents[i], testID: `intent-${i}` })),
            ]}
          />
          {intent ? <Text variant="fine">{tr.rooms.intentHint[intent]}</Text> : null}
          <Text variant="label" className="mt-2">
            {tr.rooms.gameTagLabel}
          </Text>
          <Chips<TagChoice>
            wrap
            accessibilityLabel={tr.rooms.gameTagLabel}
            value={tag ?? 'none'}
            onChange={(v) => setTag(v === 'none' ? null : v)}
            options={[
              { value: 'none', label: tr.rooms.gameTagNone, testID: 'game-tag-none' },
              ...CONCEPTS.map((c) => ({
                value: c,
                label: tr.concepts[c],
                testID: `game-tag-${c}`,
              })),
            ]}
          />
          <Text variant="fine">{tr.rooms.gameTagHint}</Text>
        </View>
      </Card>
      {open.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(open.error)}
        </Text>
      ) : null}
      <View className="gap-2.5">
        <Button
          size="lg"
          testID="lobby-confirm"
          label={tr.venue.openLobby}
          onPress={() => open.mutate()}
          loading={open.isPending}
        />
        <Button size="lg" variant="neutral" label={tr.common.cancel} onPress={onClose} />
      </View>
    </Sheet>
  );
}
