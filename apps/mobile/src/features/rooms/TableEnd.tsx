import { pairFriendState } from '@shared/tableEnd.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { openDm } from '@/features/friends/openDm';
import {
  friendKeys,
  type HistoryFriend,
  useHistoryFriends,
  useTableHistory,
} from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { NARROW_SCREEN } from '@/theme/tokens';

type Props = {
  roomId: string;
  // "Masa bitti", or "Masadan ayrıldın" for a participant who left.
  left: boolean;
  tableName: string;
  phones: number;
  // The names seen sitting at the table with their profile (Masadakiler).
  profiled: readonly string[];
  // This person sat anonymously: the note about the nick (K-68).
  anonymous: boolean;
  onClose: () => void;
};

type EndRecord = {
  id: string;
  other_alias: string;
  friend_action_at: string | null;
};

// Masa bitti (v46 "masa-bitti"; docs/SPEC_V4.md §4.E, K-56, K-64): the people this person sat with
// for at least 3 minutes, each with a quiet "Arkadaş ekle" (rule 5), anonymous ones too ("Anonim
// katıldı" under the name). A press shows "Eklendi"; pressing again takes it back (K-67). Both
// pressed: "Arkadaş oldunuz" and "Mesaj". No table length, no game count. Built from this person's
// own records (play_history); nothing about the others is read again (rule 4).
export function TableEnd({ roomId, left, tableName, phones, profiled, anonymous, onClose }: Props) {
  const records = useTableHistory(roomId, true);
  const friends = useHistoryFriends();

  return (
    <Screen>
      <ScreenHeader
        title={left ? tr.tableEnd.leftTitle : tr.tableEnd.title}
        subtitle={tr.tableEnd.subtitle(tableName, phones)}
      />
      <View className="mt-4 gap-2.5" testID="table-end">
        {records.isPending ? (
          <View className="items-center py-6">
            <Loader />
          </View>
        ) : records.isError ? (
          <EmptyState
            kind="error"
            body={errorMessage(records.error)}
            action={{ label: tr.common.retry, onPress: () => void records.refetch() }}
          />
        ) : (
          records.data.map((r) => (
            <EndRow
              key={r.id}
              record={r}
              profiled={profiled.includes(r.other_alias)}
              friend={friends.data?.get(r.id)}
            />
          ))
        )}
      </View>
      <Text variant="fine" className="mt-4">
        {tr.tableEnd.note}
      </Text>
      {anonymous ? (
        <Text variant="fine" className="mt-1.5">
          {tr.tableEnd.anonymousNote}
        </Text>
      ) : null}
      <View className="mt-auto pt-8">
        <Button size="lg" testID="table-end-close" label={tr.tableEnd.back} onPress={onClose} />
      </View>
    </Screen>
  );
}

function EndRow({
  record,
  profiled,
  friend,
}: {
  record: EndRecord;
  // Seen sitting at the table with the profile (Masadakiler).
  profiled: boolean;
  friend: HistoryFriend | undefined;
}) {
  const queryClient = useQueryClient();
  // Side by side the name and the button do not fit at 320 dp with the largest text: the button
  // goes to the line under it, to the right; the name never breaks.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const settle = () => queryClient.invalidateQueries({ queryKey: friendKeys.all });
  const add = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (historyId: string) => friendsApi.addFromRoom(historyId),
    onSuccess: () => track('friend_add_pressed', {}),
    onError: (err, historyId) => void askName(err, historyId),
    onSettled: settle,
  });
  const withdraw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (historyId: string) => friendsApi.withdrawAdd(historyId),
    onSettled: settle,
  });
  const run = useCallback((historyId: string) => add.mutate(historyId), [add]);
  const askName = useRetryAfterName(run);

  const state = pairFriendState(record, friend !== undefined);
  const who = (
    <View className="flex-row items-center gap-3">
      {profiled ? (
        <Avatar kind="profile" name={record.other_alias} size="lg" />
      ) : (
        <Avatar kind="default" size="lg" />
      )}
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong">{record.other_alias}</Text>
        {state === 'friends' ? (
          <Text variant="label" tone="success">
            {tr.tableEnd.friends}
          </Text>
        ) : !profiled ? (
          <Text variant="fine">{tr.tableEnd.anonymous}</Text>
        ) : null}
      </View>
    </View>
  );
  const busy = add.isPending || withdraw.isPending;
  const action =
    state === 'add' ? (
      <Button
        variant="neutral"
        size="sm"
        testID={`table-end-add-${record.other_alias}`}
        label={tr.tableEnd.addFriend}
        loading={busy}
        onPress={() => add.mutate(record.id)}
      />
    ) : state === 'pressed' ? (
      <Button
        variant="positive"
        size="sm"
        testID={`table-end-pressed-${record.other_alias}`}
        label={tr.tableEnd.added}
        loading={busy}
        onPress={() => withdraw.mutate(record.id)}
      />
    ) : state === 'friends' && friend?.threadId ? (
      <Button
        variant="neutral"
        size="sm"
        testID={`table-end-message-${record.other_alias}`}
        label={tr.tableEnd.message}
        onPress={() =>
          openDm({ threadId: friend.threadId ?? '', publicId: friend.publicId, name: friend.name })
        }
      />
    ) : null;
  const error = add.error ?? withdraw.error;

  return (
    <Card>
      {narrow ? (
        <View className="gap-2.5">
          {who}
          {action ? <View className="items-end">{action}</View> : null}
        </View>
      ) : (
        <View className="flex-row items-center gap-3">
          <View className="flex-1">{who}</View>
          {action}
        </View>
      )}
      {error ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(error)}
        </Text>
      ) : null}
    </Card>
  );
}
