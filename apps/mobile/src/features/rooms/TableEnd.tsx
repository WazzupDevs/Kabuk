import { pairFriendState } from '@shared/tableEnd.ts';
import { TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Av, Btn, GlassList, Li, T } from '@/aura/kit';
import { Gathering, SceneGround } from '@/aura/Scene';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
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
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { TABLE_ICON_IMAGES } from './tableIconImages';

type Props = {
  roomId: string;
  left: boolean;
  tableName: string;
  phones: number;
  profiled: readonly string[];
  anonymous: boolean;
  onClose: () => void;
};

type EndRecord = {
  id: string;
  other_alias: string;
  friend_action_at: string | null;
};

// Masa bitti (docs/SPEC_V3.md §23.3; docs/design/aura → MasaBitti): a celebration scene under the
// status bar (the table's picture, buddies, confetti), "Masa bitti" and the line, then everyone who
// sat 3 minutes with the person in a glass list with "Arkadaş ekle", "Eklendi" or "Mesaj", the
// notes and "Mekana dön". A one-sided press is silent (rule 5).
export function TableEnd({ roomId, left, tableName, phones, profiled, anonymous, onClose }: Props) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const records = useTableHistory(roomId, true);
  const friends = useHistoryFriends();
  const [width, setWidth] = useState(0);
  // The table is called by its picture (K-76): its name leads back to it.
  const icon = TABLE_ICONS.find((i) => tableName.startsWith(i.name))?.id;
  const picture = icon ? TABLE_ICON_IMAGES[icon] : undefined;
  const g = AURA.gatherings.end;
  const faces = (records.data ?? [])
    .map((r) => r.other_alias)
    .filter((name) => profiled.includes(name))
    .slice(0, 2);
  const k = width > 0 ? width / g.frame : 1;

  return (
    <View testID="table-end" style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + SPACING[6] }}
        showsVerticalScrollIndicator={false}
      >
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{
            height: g.height * k + insets.top,
            borderBottomLeftRadius: KIT.stage.radius,
            borderBottomRightRadius: KIT.stage.radius,
            overflow: 'hidden',
          }}
        >
          <SceneGround top={0} bottom={KIT.stage.radius} />
          {width > 0
            ? AURA.confetti.map(([x, y, turn, color], i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x * k,
                    top: insets.top + y * k,
                    width: CONFETTI_W,
                    height: CONFETTI_H,
                    borderRadius: CONFETTI_W / 2,
                    backgroundColor: color,
                    transform: [{ rotate: `${turn}deg` }],
                  }}
                />
              ))
            : null}
          {/* Two of the people who sat with their profile, at the table's sides (MasaBitti). */}
          {width > 0
            ? faces.map((name, i) => (
                <View
                  key={name}
                  style={{
                    position: 'absolute',
                    bottom: FACE_BOTTOM * k,
                    [i === 0 ? 'left' : 'right']: FACE_SIDE * k,
                  }}
                >
                  <Av size="lg" name={name} />
                </View>
              ))
            : null}
          {width > 0 ? (
            <Gathering
              kind="end"
              width={width}
              center={
                picture ? (
                  <Image
                    source={picture}
                    fadeDuration={0}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : null
              }
            />
          ) : null}
        </View>

        <View
          style={{
            flexGrow: 1,
            paddingHorizontal: KIT.size.side,
            paddingTop: GAP,
            gap: GAP,
          }}
        >
          <View style={{ alignItems: 'center', gap: KIT.size.tagGap }}>
            <T v="display" center accessibilityRole="header">
              {left ? tr.tableEnd.leftTitle : tr.tableEnd.title}
            </T>
            <T v="body" center>
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
              action={{ label: tr.common.retry, onPress: () => void records.refetch() }}
            />
          ) : records.data.length > 0 ? (
            <GlassList>
              {records.data.map((r) => (
                <EndRow
                  key={r.id}
                  record={r}
                  profiled={profiled.includes(r.other_alias)}
                  friend={friends.data?.get(r.id)}
                />
              ))}
            </GlassList>
          ) : null}
          <T v="fine" center>
            {tr.tableEnd.note}
          </T>
          {anonymous ? (
            <T v="fine" center>
              {tr.tableEnd.anonymousNote}
            </T>
          ) : null}
          <View style={{ flexGrow: 1 }} />
          <Btn block testID="table-end-close" label={tr.tableEnd.back} onPress={onClose} />
        </View>
      </ScrollView>
    </View>
  );
}

const GAP = 14;
const FACE_BOTTOM = 150;
const FACE_SIDE = 48;
const CONFETTI_W = 8;
const CONFETTI_H = 18;

// One person of the table: the face, the name and how things stand, the action at the right.
function EndRow({
  record,
  profiled,
  friend,
}: {
  record: EndRecord;
  profiled: boolean;
  friend: HistoryFriend | undefined;
}) {
  const queryClient = useQueryClient();
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
  const busy = add.isPending || withdraw.isPending;
  const action =
    state === 'add' ? (
      <Btn
        sm
        icon="plus"
        testID={`table-end-add-${record.other_alias}`}
        label={tr.tableEnd.addFriend}
        loading={busy}
        onPress={() => add.mutate(record.id)}
      />
    ) : state === 'pressed' ? (
      <Btn
        sm
        variant="glassy"
        icon="check"
        tint={KIT.success}
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

  return (
    <View>
      <Li>
        <Av name={record.other_alias} />
        <View style={{ flex: 1 }}>
          <T v="h3">{record.other_alias}</T>
          {state === 'friends' ? (
            <T v="fine" color={KIT.success}>
              {tr.tableEnd.friends}
            </T>
          ) : !profiled ? (
            <T v="fine">{tr.tableEnd.anonymous}</T>
          ) : null}
        </View>
        {action}
      </Li>
      {error ? (
        <View style={{ paddingHorizontal: KIT.size.liPadX, paddingBottom: KIT.size.liPadY }}>
          <T v="fine" color={KIT.danger}>
            {errorMessage(error)}
          </T>
        </View>
      ) : null}
    </View>
  );
}
