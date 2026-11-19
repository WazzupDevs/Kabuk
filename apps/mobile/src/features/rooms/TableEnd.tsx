import { pairFriendState } from '@shared/tableEnd.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Av, Btn, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { boxShadowParts } from '@/components/NativeShadow';
import { Screen } from '@/components/Screen';
import { openDm } from '@/features/friends/openDm';
import {
  refreshFriends,
  type HistoryFriend,
  useHistoryFriends,
  useTableHistory,
} from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { useLabOff } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { TABLE_SETUP } from '@/theme/tableSetup';

import { TABLE_CARD_WIDE, TABLE_ICON_IMAGES } from './tableIconImages';

type Props = {
  roomId: string;
  left: boolean;
  // The owner took the person off ("Masadan çıkar", K-88): "Masadan çıkarıldın".
  removed?: boolean;
  tableName: string;
  phones: number;
  // The table's picture as last seen (tableEndStore).
  icon: string | null;
  profiled: readonly string[];
  anonymous: boolean;
  onClose: () => void;
};

type EndRecord = {
  id: string;
  other_alias: string;
  friend_action_at: string | null;
};

const E = TABLE_SETUP.end;

// Masa bitti (docs/SPEC_V3.md §23.3; yeni arayüz tuvali: MasaBitti 64, MasaCikarildin 132): the
// table's picture under an empty bar, "Masa bitti" (or "Masadan ayrıldın", "Masadan çıkarıldın")
// and the table's line, then everyone who sat 3 minutes with the person in plain rows with "Ekle",
// "Eklendi" or "Mesaj", and "Mekana dön" fixed at the foot. A one-sided press is silent (rule 5).
export function TableEnd({
  roomId,
  left,
  removed,
  tableName,
  phones,
  icon,
  profiled,
  anonymous,
  onClose,
}: Props) {
  const { c, scheme } = useKit();
  const records = useTableHistory(roomId, true);
  const friends = useHistoryFriends();
  const picture = icon ? (TABLE_CARD_WIDE[icon] ?? TABLE_ICON_IMAGES[icon]) : undefined;
  const shadow = boxShadowParts(useLabOff('golge'), c.cardShadow || undefined, E.heroRadius);

  return (
    <View testID="table-end" style={{ flex: 1 }}>
      <Screen
        padTop={E.bar}
        footer={<Btn block testID="table-end-close" label={tr.tableEnd.back} onPress={onClose} />}
      >
        <View>
          <View
            style={{
              height: E.hero,
              borderRadius: E.heroRadius,
              backgroundColor: c.infoRow,
              boxShadow: shadow.boxShadow,
            }}
          >
            {shadow.node}
            {picture ? (
              <Image
                source={picture}
                contentFit="cover"
                accessibilityIgnoresInvertColors
                style={[StyleSheet.absoluteFill, { borderRadius: E.heroRadius }]}
              />
            ) : null}
          </View>
          <View style={{ marginTop: E.titleTop, alignItems: 'center', gap: E.lineTop }}>
            <T v="endTitle" center accessibilityRole="header">
              {removed
                ? tr.tableEnd.removedTitle
                : left
                  ? tr.tableEnd.leftTitle
                  : tr.tableEnd.title}
            </T>
            <T v="endLine" center color={c.muted}>
              {tr.tableEnd.subtitle(tableName, phones)}
            </T>
          </View>
          {records.isPending ? (
            <View className="items-center py-6">
              <Loader />
            </View>
          ) : records.isError ? (
            <EmptyState
              kind="error"
              body={errorMessage(records.error)}
              error={records.error}
              action={{ label: tr.common.retry, onPress: () => void records.refetch() }}
            />
          ) : records.data.length > 0 ? (
            <View>
              <View
                style={{
                  marginTop: E.secTop,
                  marginBottom: E.secBottom,
                  marginHorizontal: E.secIn,
                }}
              >
                <T v="eyebrow">{tr.tableEnd.people}</T>
              </View>
              {records.data.map((r, i) => (
                <View
                  key={r.id}
                  style={
                    i > 0 ? { borderTopWidth: KIT.size.hair, borderTopColor: c.hair } : undefined
                  }
                >
                  <EndRow
                    record={r}
                    profiled={profiled.includes(r.other_alias)}
                    friend={friends.data?.get(r.id)}
                    success={E.success[scheme]}
                  />
                </View>
              ))}
            </View>
          ) : null}
          {anonymous ? (
            <View style={{ marginTop: E.secTop }}>
              <T v="fine" center>
                {tr.tableEnd.anonymousNote}
              </T>
            </View>
          ) : null}
        </View>
      </Screen>
    </View>
  );
}

// One person of the table: the face, the name and how things stand, the action at the right.
function EndRow({
  record,
  profiled,
  friend,
  success,
}: {
  record: EndRecord;
  profiled: boolean;
  friend: HistoryFriend | undefined;
  success: string;
}) {
  const queryClient = useQueryClient();
  const settle = () => refreshFriends(queryClient, 'pressed');
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
  const busy = add.isPending || withdraw.isPending;
  const action =
    state === 'add' ? (
      <Btn
        sm
        icon="plus"
        testID={`table-end-add-${record.other_alias}`}
        label={tr.tableEnd.add}
        accessibilityLabel={tr.tableEnd.addFriend}
        loading={busy}
        onPress={() => add.mutate(record.id)}
      />
    ) : state === 'pressed' ? (
      <Btn
        sm
        variant="glassy"
        icon="check"
        testID={`table-end-pressed-${record.other_alias}`}
        label={tr.tableEnd.added}
        loading={busy}
        onPress={() => withdraw.mutate(record.id)}
      />
    ) : state === 'friends' && friend?.threadId ? (
      <Btn
        sm
        variant="glassy"
        icon="chat"
        testID={`table-end-message-${record.other_alias}`}
        label={tr.tableEnd.message}
        onPress={() =>
          openDm({ threadId: friend.threadId ?? '', publicId: friend.publicId, name: friend.name })
        }
      />
    ) : null;
  const error = add.error ?? withdraw.error;

  const line =
    state === 'friends'
      ? tr.tableEnd.friendsNow
      : state === 'pressed'
        ? tr.tableEnd.waiting
        : !profiled
          ? tr.tableEnd.anonymous
          : null;

  return (
    <View>
      <View
        style={{
          minHeight: E.rowMin,
          flexDirection: 'row',
          alignItems: 'center',
          gap: E.rowGap,
        }}
      >
        <Av size="md" name={record.other_alias} />
        <View style={{ flex: 1, gap: E.nameGap }}>
          <T v="kesfetName">{record.other_alias}</T>
          {line ? (
            <T v="fine" color={state === 'friends' ? success : undefined}>
              {line}
            </T>
          ) : null}
        </View>
        {action}
      </View>
      {error ? (
        <View style={{ paddingBottom: KIT.size.liPadY }}>
          <T v="fine" color={KIT.danger}>
            {errorMessage(error)}
          </T>
        </View>
      ) : null}
    </View>
  );
}
