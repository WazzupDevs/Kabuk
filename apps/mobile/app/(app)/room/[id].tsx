import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seatsAnonymously } from '@shared/gender.ts';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button, type IconName } from '@/components/Button';
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
import { GAME_CARDS, GameCard, type GameCategory, PosterGrid } from '@/features/rooms/PosterCard';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { IncomingRequest, useMarkTableScreen } from '@/features/rooms/IncomingRequest';
import { InviteSheet } from '@/features/rooms/InviteSheet';
import { TableIconSheet } from '@/features/rooms/TableIconSheet';
import { GlyphDisc } from '@/components/GlyphDisc';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { roomKeys, useCurrentRoom, useRoom, useTablePeople } from '@/features/rooms/queries';
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

type Category = 'all' | GameCategory;
const CATEGORIES: readonly GameCategory[] = ['teams', 'multi'];

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
  const ownPhoto = useOwnPhoto();
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
  const [sheet, setSheet] = useState<
    'people' | 'end' | 'leave' | 'lobby' | 'invite' | 'icon' | null
  >(null);
  useMarkTableScreen();
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

  // The table joined another one (its owner's "Katıl", §4.E): it closed and the person sits at the
  // other table now, which opens in its place instead of Masa bitti (audit VEN-6).
  const current = useCurrentRoom(checkIn.data?.id).data;
  const movedTo =
    room.data?.status === 'closed' &&
    current &&
    current.id !== id &&
    (current.status === 'waiting' || current.status === 'active')
      ? current.id
      : null;
  useEffect(() => {
    if (movedTo) router.replace({ pathname: '/room/[id]', params: { id: movedTo } });
  }, [movedTo]);

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

  if (room.isPending || checkIn.isPending || movedTo) {
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
          anonymous={
            !!checkIn.data && seatsAnonymously(checkIn.data.identity.mode, ownPhoto.gender)
          }
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
  const games = GAME_CARDS.filter((g) => category === 'all' || g.category === category);
  const messages = chat.messages.data ?? [];
  const newestOut = chat.outbox[chat.outbox.length - 1];
  const newestIn = messages.at(-1);
  const newest = {
    key: newestOut?.localId ?? newestIn?.id,
    mine: newestOut ? true : newestIn?.session_id === sessionId,
  };

  const top = (
    <View
      className="gap-3 pb-2"
      testID="table-top"
      // The screen's sides, like every other screen (skall tuvali, Masa: 16).
      style={{ paddingHorizontal: shape.screenPadding, paddingTop: SPACING[1] }}
    >
      <View className="flex-row items-center gap-3">
        <IconButton
          round
          icon="chevron-back"
          label={tr.table.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/venue'))}
        />
        {/* The owner changes the icon from it (skall tuvali, MasaSimgeDegistir). */}
        <Pressable
          testID="table-icon"
          accessibilityRole={owner ? 'button' : undefined}
          accessibilityLabel={owner ? tr.createTable.iconChange : undefined}
          disabled={!owner}
          onPress={() => setSheet('icon')}
        >
          <TableIcon icon={r.icon} size="row" />
        </Pressable>
        <Pressable
          testID="table-who"
          accessibilityRole="button"
          accessibilityLabel={tr.table.whoLabel(r.phones)}
          onPress={() => setSheet('people')}
          className="flex-1 flex-row items-center gap-2.5"
          style={{ minHeight: TOUCH.min }}
        >
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
          label={owner ? tr.table.end : tr.table.leaveShort}
          icon={owner ? 'close' : 'exit-outline'}
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
                icon="eye-off-outline"
                testID="table-withdraw"
                label={tr.venue.withdraw}
                loading={withdraw.isPending}
                onPress={() => withdraw.mutate()}
              />
            ) : (
              <Button
                tight
                size="sm"
                icon="megaphone-outline"
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
              icon="add"
              iconTone="success"
              testID="table-invite"
              label={tr.venue.invite}
              onPress={() => setSheet('invite')}
            />
          </View>
        </View>
      ) : null}
      {owner ? <IncomingRequest roomId={id} ownerSessionId={sessionId} phones={r.phones} /> : null}
      <Segmented<'games' | 'chat'>
        fill
        value={tab}
        onChange={setTab}
        accessibilityLabel={tr.rooms.tabsLabel}
        options={[
          { value: 'games', label: tr.table.tabGames(GAME_CARDS.length), testID: 'tab-games' },
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
        profiles={profiles}
      />
      <ConfirmSheet
        visible={sheet === 'end'}
        onClose={() => setSheet(null)}
        title={tr.table.endTitle}
        body={tr.table.endBody}
        confirm={tr.table.endConfirm}
        icon="close"
        testID="table-end-confirm"
        pending={end.isPending}
        busy={leave.isPending}
        error={end.error ?? leave.error}
        onConfirm={() => end.mutate()}
        extra={
          r.phones > 1 ? (
            <View className="gap-2.5">
              <Button
                size="lg"
                variant="secondary"
                icon="exit-outline"
                testID="table-owner-leave"
                label={tr.table.leave}
                loading={leave.isPending}
                disabled={end.isPending}
                onPress={() => leave.mutate()}
              />
              <Text variant="fine">{tr.table.leaveNote}</Text>
            </View>
          ) : null
        }
      />
      <ConfirmSheet
        visible={sheet === 'leave'}
        onClose={() => setSheet(null)}
        title={tr.table.leaveTitle}
        body={tr.table.leaveBody}
        confirm={tr.table.leave}
        icon="exit-outline"
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
      <TableIconSheet
        visible={sheet === 'icon'}
        onClose={() => setSheet(null)}
        roomId={id}
        venueId={r.venue_id}
        icon={r.icon}
      />
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
        wall="masa"
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
    <ChatScreen key="games" top={top} composer={null} wall={null}>
      <View className="gap-3 pt-2">
        {r.phones === 1 ? (
          <Card tone="note" testID="table-solo">
            <View className="flex-row items-center gap-3">
              <GlyphDisc icon="person-outline" />
              <View className="flex-1 gap-0.5">
                <Text variant="heading">{tr.table.soloTitle}</Text>
                <Text variant="fine">{tr.table.soloBody}</Text>
              </View>
            </View>
          </Card>
        ) : null}
        <Chips<Category>
          bleed={shape.screenPadding}
          accessibilityLabel={tr.table.tabGames(GAME_CARDS.length)}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: tr.table.allGames, count: GAME_CARDS.length },
            ...CATEGORIES.map((c) => ({
              value: c,
              label: tr.table.gameCategories[c],
              count: GAME_CARDS.filter((g) => g.category === c).length,
            })),
          ]}
        />
        <PosterGrid>
          {games.map((g) => (
            <GameCard key={g.id} id={g.id} art={g.art} testID={`poster-${g.id}`} />
          ))}
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
  icon,
  testID,
  pending,
  busy,
  error,
  onConfirm,
  extra,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirm: string;
  icon: IconName;
  testID: string;
  pending: boolean;
  // The other action of the sheet (`extra`) is on its way: this one waits (audit VEN-9).
  busy?: boolean;
  error: unknown;
  onConfirm: () => void;
  extra?: ReactNode;
}) {
  // While either action is on its way the sheet stays, and neither can be pressed again.
  const locked = pending || !!busy;
  const close = () => {
    if (!locked) onClose();
  };
  return (
    // skall tuvali (MasaBitir): the title, the note, then the red soft action, the other choice and
    // "Vazgeç", all large.
    <Sheet visible={visible} onClose={close} title={title}>
      <Text variant="fine">{body}</Text>
      {error ? (
        <Text variant="fine" tone="danger">
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button
        size="lg"
        variant="danger"
        icon={icon}
        testID={testID}
        label={confirm}
        loading={pending}
        disabled={!!busy}
        onPress={onConfirm}
      />
      {extra}
      <Button
        size="lg"
        variant="neutral"
        label={tr.common.cancel}
        disabled={locked}
        onPress={close}
      />
      <View style={{ height: SPACING[1] }} />
    </Sheet>
  );
}
