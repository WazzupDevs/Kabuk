import { pairFriendState } from '@shared/tableEnd.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ListCard } from '@/components/ListCard';
import { Mark } from '@/components/Mark';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
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
import { useTheme } from '@/theme/ThemeProvider';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

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

// skall.css → `.act`.
const ACTION_SLOT = SPACING[16] + SPACING[10] + SPACING[1];

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
  const { colors, shape } = useTheme();
  const records = useTableHistory(roomId, true);
  const friends = useHistoryFriends();

  return (
    <Screen>
      {/* On the header, which always has content: with no record (nobody sat 3 minutes) the
          list below is empty and has no size. */}
      {/* skall tuvali (MasaBitti): the mark on a soft square, the title and the line, centred. */}
      <View testID="table-end" className="items-center gap-2 pt-8">
        <View
          className="items-center justify-center"
          style={{
            width: SPACING[16] + SPACING[6],
            height: SPACING[16] + SPACING[6],
            borderRadius: shape.radius.xl,
            backgroundColor: colors.surface2,
            marginBottom: SPACING[2],
          }}
        >
          <Mark size={SPACING[12]} label={null} />
        </View>
        <Text variant="display" align="center" accessibilityRole="header">
          {left ? tr.tableEnd.leftTitle : tr.tableEnd.title}
        </Text>
        <Text variant="fine" align="center">
          {tr.tableEnd.subtitle(tableName, phones)}
        </Text>
      </View>
      <View className="mt-4">
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
        ) : records.data.length > 0 ? (
          <ListCard>
            {records.data.map((r) => (
              <EndRow
                key={r.id}
                record={r}
                profiled={profiled.includes(r.other_alias)}
                friend={friends.data?.get(r.id)}
              />
            ))}
          </ListCard>
        ) : null}
      </View>
      <Text variant="fine" align="center" className="mt-4">
        {tr.tableEnd.note}
      </Text>
      {anonymous ? (
        <Text variant="fine" align="center" className="mt-1.5">
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
    <View className="flex-row items-center" style={{ gap: SPACING[3] + SPACING[0.5] }}>
      {profiled ? (
        <Avatar kind="profile" name={record.other_alias} size="xl" />
      ) : (
        <Avatar kind="default" size="xl" />
      )}
      <View className="flex-1 gap-0.5">
        <Text variant="heading">{record.other_alias}</Text>
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
        variant="positive"
        size="sm"
        tight
        testID={`table-end-add-${record.other_alias}`}
        label={tr.tableEnd.addFriend}
        loading={busy}
        onPress={() => add.mutate(record.id)}
      />
    ) : state === 'pressed' ? (
      <Button
        variant="neutral"
        size="sm"
        tight
        testID={`table-end-pressed-${record.other_alias}`}
        label={tr.tableEnd.added}
        loading={busy}
        onPress={() => withdraw.mutate(record.id)}
      />
    ) : state === 'friends' && friend?.threadId ? (
      <Button
        size="sm"
        tight
        testID={`table-end-message-${record.other_alias}`}
        label={tr.tableEnd.message}
        onPress={() =>
          openDm({ threadId: friend.threadId ?? '', publicId: friend.publicId, name: friend.name })
        }
      />
    ) : null;
  const error = add.error ?? withdraw.error;

  return (
    // skall tuvali (MasaBitti): a row of the list card, the action in the 108 wide slot.
    <View
      style={{
        minHeight: SPACING[16] + SPACING[2],
        paddingVertical: SPACING[3],
        paddingHorizontal: SPACING[4],
        justifyContent: 'center',
      }}
    >
      {narrow ? (
        <View className="gap-2.5">
          {who}
          {action ? (
            <View className="items-end">
              <View style={{ width: ACTION_SLOT }}>{action}</View>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-row items-center" style={{ gap: SPACING[3] + SPACING[0.5] }}>
          <View className="flex-1">{who}</View>
          {action ? <View style={{ width: ACTION_SLOT }}>{action}</View> : null}
        </View>
      )}
      {error ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(error)}
        </Text>
      ) : null}
    </View>
  );
}
