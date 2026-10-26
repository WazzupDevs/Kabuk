import { isTableGame } from '@shared/gameFrame.ts';
import { GAME_CATEGORIES, TABLE_GAMES } from '@shared/tableGames.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatScreen } from '@/components/ChatScreen';
import { Loader } from '@/components/Loader';
import { Chips } from '@/components/Chips';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { RoomComposer, RoomMessages, useRoomChat } from '@/features/chat/ChatPanel';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { PosterCard, PosterGrid } from '@/features/rooms/PosterCard';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { InviteSheet } from '@/features/rooms/InviteSheet';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { roomKeys, useRoom, useTablePeople } from '@/features/rooms/queries';
import { PeopleSheet } from '@/features/rooms/RoomPeople';
import { TableEnd } from '@/features/rooms/TableEnd';
import { useTableEndStore } from '@/features/rooms/tableEnd';
import { TableIcon } from '@/features/rooms/TableIcon';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING, TOUCH } from '@/theme/tokens';

type Category = 'all' | (typeof GAME_CATEGORIES)[number]['id'];

// The table (v46 "masa"; docs/SPEC_V4.md §4.E, §4.F): the top line (back, the table's icon and name
// with "N kişi", which open Masadakiler; the owner's "Bitir", a participant's "Ayrıl"), the owner's
// bar ("Lobiye aç" or "Lobiden çek", "Davet et"), then Oyun Seç and Masa Sohbeti. Until a game's
// step (4.6) every poster is "Yakında". The table's end is Masa bitti; a participant who leaves sees
// "Masadan ayrıldın".
export default function TableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shape } = useTheme();
  const queryClient = useQueryClient();
  const checkIn = useActiveTable();
  const room = useRoom(id);
  const chat = useRoomChat(id);
  const open = !!room.data && room.data.status !== 'closed';
  const people = useTablePeople(id, open);
  const profiles = useRoomMemberProfiles(
    id,
    (people.data ?? []).map((p) => p.sessionId).join(','),
  ).data;
  const [tab, setTab] = useState<'games' | 'chat'>('games');
  const [category, setCategory] = useState<Category>('all');
  const [sheet, setSheet] = useState<'people' | 'end' | 'leave' | 'lobby' | 'invite' | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);

  const remember = useTableEndStore((s) => s.remember);
  const markLeft = useTableEndStore((s) => s.markLeft);
  const forget = useTableEndStore((s) => s.forget);
  const seen = useTableEndStore((s) => s.tables[id]);
  const name = room.data?.name;
  const phones = room.data?.phones;
  const profiledKey = (people.data ?? [])
    .filter((p) => p.profiled)
    .map((p) => p.alias)
    .join('\n');
  useEffect(() => {
    if (open && name && phones)
      remember(id, name, phones, profiledKey ? profiledKey.split('\n') : []);
  }, [open, id, name, phones, profiledKey, remember]);

  const settle = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(id) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(id) });
  };
  // "Masayı bitir": the owner's, for everyone.
  const end = useMutation({ meta: FEEL_ERROR, mutationFn: roomsApi.end, onSettled: settle });
  // "Masadan ayrıl": the table goes on for the others; an owner hands it to the earliest (K-13).
  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leave(id),
    onSuccess: () => markLeft(id),
    onSettled: settle,
  });
  const withdraw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.setVisibility(id, false),
    onSettled: settle,
  });

  if (room.isPending || checkIn.isPending) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }

  const sessionId = checkIn.data?.id;
  const r = room.data;
  const backToVenue = () => {
    forget(id);
    router.replace('/venue');
  };
  // Closed, or no longer readable (the person left or was taken off): Masa bitti from what this
  // person last saw, or Mekan when it never sat here.
  const seated = !!people.data?.some((p) => p.sessionId === sessionId);
  if (!sessionId || !r || r.status === 'closed' || (people.isSuccess && !seated)) {
    if (seen) {
      return (
        <TableEnd
          roomId={id}
          left={seen.left}
          tableName={seen.name}
          phones={seen.phones}
          profiled={seen.profiled}
          anonymous={checkIn.data?.identity.mode === 'anonymous'}
          onClose={backToVenue}
        />
      );
    }
    if (!r && room.isFetching) {
      return (
        <Screen>
          <View className="mt-16 items-center">
            <Loader />
          </View>
        </Screen>
      );
    }
    return <Redirect href="/venue" />;
  }

  const owner = r.owner_session_id === sessionId;
  const inLobby = r.visibility === 'open';
  const games = TABLE_GAMES.filter(
    (g) => category === 'all' || (g.categories as readonly string[]).includes(category),
  );
  const messages = chat.messages.data ?? [];
  const newestOut = chat.outbox[chat.outbox.length - 1];
  const newestIn = messages.at(-1);
  const newest = {
    key: newestOut?.localId ?? newestIn?.id,
    mine: newestOut ? true : newestIn?.session_id === sessionId,
  };

  const top = (
    <View className="gap-3 pb-2" testID="table-top">
      <View className="flex-row items-center gap-3">
        <IconButton
          round
          icon="chevron-back"
          label={tr.table.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/venue'))}
        />
        <Pressable
          testID="table-who"
          accessibilityRole="button"
          accessibilityLabel={tr.table.whoLabel(r.phones)}
          onPress={() => setSheet('people')}
          className="flex-1 flex-row items-center gap-2.5"
          style={{ minHeight: TOUCH.min }}
        >
          <TableIcon icon={r.icon} size="row" />
          <View className="flex-1">
            <Text variant="heading" testID="table-title">
              {r.name ?? ''}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                style={{
                  width: SPACING[2],
                  height: SPACING[2],
                  borderRadius: shape.radius.pill,
                  backgroundColor: colors.success,
                }}
              />
              <Text variant="fine">{tr.venue.people(r.phones)}</Text>
            </View>
          </View>
        </Pressable>
        <Button
          variant="danger"
          size="sm"
          testID={owner ? 'table-end-open' : 'table-leave-open'}
          label={owner ? tr.table.end : tr.table.leave}
          icon={narrow ? 'exit-outline' : undefined}
          iconOnly={narrow}
          onPress={() => setSheet(owner ? 'end' : 'leave')}
        />
      </View>
      {owner ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            {inLobby ? (
              <Button
                tight
                size="sm"
                variant="secondary"
                testID="table-withdraw"
                label={tr.venue.withdraw}
                loading={withdraw.isPending}
                onPress={() => withdraw.mutate()}
              />
            ) : (
              <Button
                tight
                size="sm"
                testID="table-lobby"
                label={tr.venue.openLobby}
                onPress={() => setSheet('lobby')}
              />
            )}
          </View>
          <View className="flex-1">
            <Button
              tight
              size="sm"
              variant="secondary"
              testID="table-invite"
              label={tr.venue.invite}
              onPress={() => setSheet('invite')}
            />
          </View>
        </View>
      ) : null}
      <Segmented<'games' | 'chat'>
        fill
        value={tab}
        onChange={setTab}
        accessibilityLabel={tr.rooms.tabsLabel}
        options={[
          { value: 'games', label: tr.table.tabGames(TABLE_GAMES.length), testID: 'tab-games' },
          { value: 'chat', label: tr.table.tabChat(messages.length), testID: 'tab-chat' },
        ]}
      />
      {(withdraw.error ?? end.error) ? (
        <Text variant="fine" tone="danger">
          {errorMessage(withdraw.error ?? end.error)}
        </Text>
      ) : null}
    </View>
  );

  const sheets = (
    <>
      <PeopleSheet
        visible={sheet === 'people'}
        onClose={() => setSheet(null)}
        roomId={id}
        people={people.data ?? []}
        me={sessionId}
        owner={owner ? { name: r.name ?? '', rerolls: r.name_rerolls } : null}
        profiles={profiles}
      />
      <ConfirmSheet
        visible={sheet === 'end'}
        onClose={() => setSheet(null)}
        title={tr.table.endTitle}
        body={tr.table.endBody}
        confirm={tr.table.endConfirm}
        testID="table-end-confirm"
        pending={end.isPending}
        error={end.error}
        onConfirm={() => end.mutate()}
        extra={
          r.phones > 1 ? (
            <Button
              size="lg"
              variant="secondary"
              testID="table-owner-leave"
              label={tr.table.leave}
              loading={leave.isPending}
              onPress={() => leave.mutate()}
            />
          ) : null
        }
      />
      <ConfirmSheet
        visible={sheet === 'leave'}
        onClose={() => setSheet(null)}
        title={tr.table.leaveTitle}
        body={tr.table.leaveBody}
        confirm={tr.table.leave}
        testID="table-leave-confirm"
        pending={leave.isPending}
        error={leave.error}
        onConfirm={() => leave.mutate()}
      />
      {sheet === 'lobby' ? (
        <OpenLobbySheet
          onClose={() => setSheet(null)}
          onOpened={() => undefined}
          roomId={id}
          venueId={r.venue_id}
        />
      ) : null}
      <InviteSheet
        visible={sheet === 'invite'}
        onClose={() => setSheet(null)}
        roomId={id}
        phones={r.phones}
      />
    </>
  );

  if (tab === 'chat') {
    return (
      <ChatScreen
        key="chat"
        top={top}
        composer={<RoomComposer chat={chat} />}
        newestKey={newest.key}
        newestMine={newest.mine}
        startAtEnd
      >
        <RoomMessages chat={chat} sessionId={sessionId} profiles={profiles} />
        {sheets}
      </ChatScreen>
    );
  }

  return (
    <ChatScreen key="games" top={top} composer={null}>
      <View className="gap-3 pt-2">
        {r.phones === 1 ? (
          <Card tone="note" testID="table-solo">
            <Text variant="bodyStrong">{tr.table.soloTitle}</Text>
            <Text variant="fine">{tr.table.soloBody}</Text>
          </Card>
        ) : null}
        <Chips<Category>
          bleed={shape.screenPadding}
          accessibilityLabel={tr.table.tabGames(TABLE_GAMES.length)}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: tr.table.allGames, count: TABLE_GAMES.length },
            ...GAME_CATEGORIES.map((c) => ({
              value: c.id,
              label: c.name,
              count: TABLE_GAMES.filter((g) => (g.categories as readonly string[]).includes(c.id))
                .length,
            })),
          ]}
        />
        <PosterGrid>
          {games.map((g) =>
            isTableGame(g.id) ? (
              // 4.5: every game waits for its step (4.6); a "Yakında" poster is not pressed.
              <PosterCard
                key={g.id}
                poster={g.poster}
                name={g.name}
                tagline={tr.table.taglines[g.id] ?? ''}
                minPlayers={g.minPlayers}
                soon={!g.available}
                testID={`poster-${g.id}`}
              />
            ) : null,
          )}
        </PosterGrid>
      </View>
      {sheets}
    </ChatScreen>
  );
}

// "Masayı bitir" and "Masadan ayrıl" (v46 data-csheet): what it does, the button and "Vazgeç".
function ConfirmSheet({
  visible,
  onClose,
  title,
  body,
  confirm,
  testID,
  pending,
  error,
  onConfirm,
  extra,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirm: string;
  testID: string;
  pending: boolean;
  error: unknown;
  onConfirm: () => void;
  extra?: ReactNode;
}) {
  return (
    // skall tuvali (MasaBitir): the title, the note, then the red soft action, the other choice and
    // "Vazgeç", all large.
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Text variant="fine">{body}</Text>
      {error ? (
        <Text variant="fine" tone="danger">
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button
        size="lg"
        variant="danger"
        testID={testID}
        label={confirm}
        loading={pending}
        onPress={onConfirm}
      />
      {extra}
      <Button size="lg" variant="neutral" label={tr.common.cancel} onPress={onClose} />
      <View style={{ height: SPACING[1] }} />
    </Sheet>
  );
}
