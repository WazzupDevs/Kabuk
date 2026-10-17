import { pairFriendState } from '@shared/tableEnd.ts';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
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
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, NARROW_SCREEN } from '@/theme/tokens';

import type { EndPerson } from './tableEnd';

type Props = {
  roomId: string;
  // The other side's leader as last seen: "X masasıyla oynadınız."
  otherAlias: string;
  people: readonly EndPerson[];
  onClose: () => void;
};

// The table's end (docs/SPEC_V3.md §23.G; canvas: Faz 3 · 23.3 → Masa bitti): no window, no
// ceremony. The other side's phones this one sat with, each with its own "Arkadaş ekle" on this
// phone's record with it; a pair that sat together for less than 3 minutes has no record and no
// button. Built from what the phone saw at the table; nothing about the others is read again
// (rule 4). "Kapat" goes back to the venue.
export function TableEnd({ roomId, otherAlias, people, onClose }: Props) {
  const records = useTableHistory(roomId, true);
  const friends = useHistoryFriends();

  return (
    <Screen>
      <ScreenHeader title={tr.tableEnd.title} subtitle={tr.tableEnd.subtitle(otherAlias)} />
      <View className="mt-4 gap-2.5" testID="table-end">
        <Text variant="overline" tone="muted">
          {tr.tableEnd.otherSide}
        </Text>
        {records.isPending ? (
          <View className="items-center py-6">
            <Loader />
          </View>
        ) : records.isError ? (
          <Card className="gap-3">
            <Text variant="bodyStrong">{errorMessage(records.error)}</Text>
            <Button
              variant="neutral"
              icon="refresh-outline"
              label={tr.common.retry}
              onPress={() => void records.refetch()}
              loading={records.isRefetching}
            />
          </Card>
        ) : (
          people.map((p) => {
            const record = records.data.find((r) => r.other_alias === p.alias);
            const friend = record ? friends.data?.get(record.id) : undefined;
            return <EndRow key={p.sessionId} person={p} record={record} friend={friend} />;
          })
        )}
      </View>
      <Text className="mt-4">{tr.tableEnd.body}</Text>
      <Text variant="fine" className="mt-1.5">
        {tr.tableEnd.later}
      </Text>
      <View className="mt-auto pt-8">
        <Button size="lg" testID="table-end-close" label={tr.common.close} onPress={onClose} />
      </View>
    </Screen>
  );
}

function EndRow({
  person,
  record,
  friend,
}: {
  person: EndPerson;
  record: { id: string; friend_action_at: string | null } | undefined;
  friend: HistoryFriend | undefined;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  // Side by side the name and the button do not fit at 320 dp with the largest text.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  const add = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (historyId: string) => friendsApi.addFromRoom(historyId),
    onSuccess: () => track('friend_add_pressed', {}),
    onError: (err, historyId) => void askName(err, historyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
  const run = useCallback((historyId: string) => add.mutate(historyId), [add]);
  const askName = useRetryAfterName(run);

  const state = pairFriendState(
    record && add.isSuccess ? { friend_action_at: record.friend_action_at ?? 'now' } : record,
    friend !== undefined,
  );
  const name = person.name
    ? person.age !== null
      ? tr.profile.nameWithAge(person.name, person.age)
      : person.name
    : person.alias;
  const who = (
    <View className="flex-row items-center gap-3">
      {person.name ? (
        <Avatar kind="profile" name={person.name} photoUrl={person.photoUrl} size="lg" />
      ) : (
        <Avatar kind="table" alias={person.alias} size="lg" />
      )}
      <Text variant="bodyStrong" className="flex-1">
        {name}
      </Text>
    </View>
  );
  const action =
    state === 'add' && record ? (
      <Button
        variant="neutral"
        size="sm"
        testID={`table-end-add-${person.alias}`}
        label={tr.tableEnd.addFriend}
        loading={add.isPending}
        onPress={() => add.mutate(record.id)}
      />
    ) : state === 'pressed' ? (
      <View className="flex-row items-center gap-1.5" testID={`table-end-pressed-${person.alias}`}>
        <Ionicons name="checkmark" size={ICON.sm} color={colors.muted} />
        <Text variant="label" tone="muted">
          {tr.tableEnd.pressed}
        </Text>
      </View>
    ) : state === 'friends' && friend?.threadId ? (
      <Button
        variant="neutral"
        size="sm"
        testID={`table-end-message-${person.alias}`}
        label={tr.tableEnd.message}
        onPress={() =>
          openDm({
            threadId: friend.threadId ?? '',
            publicId: friend.publicId,
            name: friend.name,
          })
        }
      />
    ) : null;
  const hint =
    state === 'pressed' ? (
      <Text variant="fine">{tr.tableEnd.pressedHint}</Text>
    ) : state === 'friends' ? (
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="checkmark-circle" size={ICON.sm} color={colors.success} />
        <Text variant="label" tone="success">
          {tr.tableEnd.friends}
        </Text>
      </View>
    ) : state === 'short' ? (
      <Text variant="fine">{tr.tableEnd.short}</Text>
    ) : null;

  return (
    <Card>
      {narrow ? (
        <View className="gap-2.5">
          {who}
          {action ? <View className="items-start">{action}</View> : null}
          {hint}
        </View>
      ) : (
        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">{who}</View>
            {action}
          </View>
          {hint}
        </View>
      )}
      {add.isError ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(add.error)}
        </Text>
      ) : null}
    </Card>
  );
}
