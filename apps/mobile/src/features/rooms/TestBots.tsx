import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TestBotsResponse } from '@shared/api/rooms.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { View } from 'react-native';

import { Btn, Glass, T } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

import { roomKeys } from './queries';

const MANY = 4;

// Test bots (the owner's call, 29 Ekim): on the dev project the owner seats bots that play by
// themselves, to try a game with one phone. The pilot's server has none, and nothing shows.
export function TestBots({ roomId, phones }: { roomId: string; phones: number }) {
  const queryClient = useQueryClient();
  // Again when the table's count changes (a bot sat down or left).
  const key = ['testBots', roomId, phones] as const;
  const status = useQuery({
    queryKey: key,
    queryFn: () => roomsApi.testBots(roomId),
    staleTime: Infinity,
  });
  const done = (data: TestBotsResponse) => {
    queryClient.setQueryData(key, data);
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
  };
  const add = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (count: number) => roomsApi.addBots(roomId, count),
    onSuccess: done,
  });
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.removeBots(roomId),
    onSuccess: done,
  });
  if (!status.data?.available) return null;
  const seated = status.data.seated;
  const busy = add.isPending || remove.isPending;
  const error = add.error ?? remove.error;
  return (
    <Glass pad="pad" testID="table-test-bots" style={{ gap: KIT.size.rowGap }}>
      <T v="h3">{tr.testBots.title}</T>
      <T v="fine">{seated > 0 ? tr.testBots.seated(seated) : tr.testBots.body}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.rowGap }}>
        <Btn
          sm
          testID="table-test-bots-one"
          label={tr.testBots.addOne}
          loading={add.isPending && add.variables === 1}
          disabled={busy || phones >= MAX_TABLE_PHONES}
          onPress={() => add.mutate(1)}
        />
        <Btn
          sm
          testID="table-test-bots-many"
          label={tr.testBots.addFour}
          loading={add.isPending && add.variables === MANY}
          disabled={busy || phones + MANY > MAX_TABLE_PHONES}
          onPress={() => add.mutate(MANY)}
        />
        {seated > 0 ? (
          <Btn
            sm
            variant="glassy"
            testID="table-test-bots-remove"
            label={tr.testBots.remove}
            loading={remove.isPending}
            disabled={busy}
            onPress={() => remove.mutate()}
          />
        ) : null}
      </View>
      {error ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(error)}
        </T>
      ) : null}
    </Glass>
  );
}
