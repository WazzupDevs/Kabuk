import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seatsAnonymously } from '@shared/gender.ts';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type IconName } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { unreadCount, useRoomChatSeen } from '@/features/chat/roomChatSeen';
import { useMessages } from '@/features/chat/useMessages';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { GAME_CARDS, GameCard, PosterGrid } from '@/features/rooms/PosterCard';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { IncomingRequest, useMarkTableScreen } from '@/features/rooms/IncomingRequest';
import { InviteSheet } from '@/features/rooms/InviteSheet';
import { TableScene } from '@/features/rooms/TableScene';
import { TableIconSheet } from '@/features/rooms/TableIconSheet';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { roomKeys, useCurrentRoom, useRoom, useTablePeople } from '@/features/rooms/queries';
import { PeopleSheet } from '@/features/rooms/RoomPeople';
import { TableEnd } from '@/features/rooms/TableEnd';
import { useTableEndStore } from '@/features/rooms/tableEnd';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useCollapseOnScroll } from '@/lib/useCollapseOnScroll';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, Glass, Round, T, Tag } from '@/aura/kit';

// The table (v46 "masa"; docs/SPEC_V4.md §4.E, §4.F): the top line (back, the table's icon and name
// with "N kişi", which open Masadakiler; the owner's "Bitir", a participant's "Ayrıl"), the owner's
// bar ("Lobiye aç" or "Lobiden çek", "Davet et"), then Oyun Seç and Masa Sohbeti. Until a game's
// step (4.6) every poster is "Yakında". The table's end is Masa bitti; a participant who leaves sees
// "Masadan ayrıldın".
export default function TableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // The head folds to the faces while the games scroll on (the owner's call, 29 Ekim).
  const collapse = useCollapseOnScroll();
  const queryClient = useQueryClient();
  const checkIn = useActiveTable();
  const ownPhoto = useOwnPhoto();
  const room = useRoom(id);
  // The chat's count for the bar's button; the chat itself is its own screen (room-chat).
  const messages = useMessages(id).data ?? [];
  const seenAt = useRoomChatSeen((s) => s.seen[id]);
  const open = !!room.data && room.data.status !== 'closed';
  const people = useTablePeople(id, open);
  const profiles = useRoomMemberProfiles(
    id,
    (people.data ?? []).map((p) => p.sessionId).join(','),
  ).data;
  const [sheet, setSheet] = useState<
    'people' | 'end' | 'leave' | 'lobby' | 'invite' | 'icon' | null
  >(null);
  useMarkTableScreen();

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
  const unread = unreadCount(messages, seenAt, sessionId);

  const endInk = scheme === 'dark' ? KIT.endInkDark : KIT.endInk;
  // The bar (docs/design/aura → Masa): back at the left; at the right the chat with its unread
  // count (its own screen, the owner's call, 28 Ekim), the owner's "Davet et" and "Bitir", a
  // participant's "Ayrıl".
  const bar = (
    <View
      testID="table-top"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: KIT.size.side,
        paddingTop: BAR_TOP,
      }}
    >
      <Round
        icon="back"
        label={tr.table.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/venue'))}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipsGap }}>
        <Round
          icon="chat"
          label={tr.table.chatOpen(unread)}
          badge={unread}
          testID="table-chat"
          onPress={() => router.push({ pathname: '/room-chat/[id]', params: { id } })}
        />
        {owner ? (
          <Round
            icon="invite"
            label={tr.venue.invite}
            testID="table-invite"
            onPress={() => setSheet('invite')}
          />
        ) : null}
        <Btn
          sm
          bar
          variant="glassy"
          tint={endInk}
          testID={owner ? 'table-end-open' : 'table-leave-open'}
          label={owner ? tr.table.end : tr.table.leaveShort}
          onPress={() => setSheet(owner ? 'end' : 'leave')}
        />
      </View>
    </View>
  );

  // The table's name, its people and lobby state; "Masadakiler" opens the list.
  const title = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: KIT.size.rowGap,
        paddingHorizontal: KIT.size.secPadX,
      }}
    >
      <View style={{ flex: 1 }}>
        {/* The owner changes the table's picture and name from its name (the picture left the
            scene, the owner's call, 29 Ekim). */}
        <Pressable
          testID="table-icon"
          accessibilityRole={owner ? 'button' : undefined}
          accessibilityLabel={owner ? tr.createTable.iconChange : undefined}
          disabled={!owner}
          onPress={() => setSheet('icon')}
          className="self-start"
        >
          <T v="title" style={KIT_TYPE.tableTitle} testID="table-title">
            {r.name ?? ''}
          </T>
        </Pressable>
        <T v="fine">
          {tr.table.status(
            tr.venue.people(r.phones),
            inLobby ? tr.venue.lobbyOpen : tr.venue.lobbyOff,
          )}
        </T>
      </View>
      <Pressable
        testID="table-who"
        accessibilityRole="button"
        accessibilityLabel={tr.table.whoLabel(r.phones)}
        onPress={() => setSheet('people')}
        hitSlop={KIT.size.chipsGap}
      >
        <Tag tone="purple" label={tr.table.peopleTag} height={PEOPLE_TAG} />
      </Pressable>
    </View>
  );

  // The owner's lobby action, on the head under the name.
  const lobbyButton = owner ? (
    <View style={{ flexDirection: 'row' }}>
      {inLobby ? (
        <Btn
          sm
          variant="glassy"
          icon="close"
          testID="table-withdraw"
          label={tr.venue.withdraw}
          loading={withdraw.isPending}
          onPress={() => withdraw.mutate()}
        />
      ) : (
        <Btn
          sm
          icon="list"
          testID="table-lobby"
          label={tr.venue.openLobby}
          onPress={() => setSheet('lobby')}
        />
      )}
    </View>
  ) : null;

  const failed =
    (withdraw.error ?? end.error) ? (
      <T v="fine" color={KIT.danger}>
        {errorMessage(withdraw.error ?? end.error)}
      </T>
    ) : null;

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

  // The head stays (the people, the name and the owner's lobby button on a low scene); only the
  // requests, the note and the game cards scroll, under it (the owner's call, 29 Ekim).
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <TableScene
        fold={collapse.progress}
        people={people.data ?? []}
        profiles={profiles}
        me={sessionId}
        inset={insets.top}
        onPress={() => setSheet('people')}
        footer={
          <>
            {title}
            {lobbyButton}
          </>
        }
      >
        {bar}
      </TableScene>
      <Reanimated.ScrollView
        onScroll={collapse.onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: KIT.size.side,
          paddingTop: KIT.size.rowGap,
          paddingBottom: insets.bottom + SPACING[8],
          gap: KIT.size.rowGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        {owner ? (
          <IncomingRequest roomId={id} ownerSessionId={sessionId} phones={r.phones} />
        ) : null}
        {r.phones === 1 ? (
          <Glass pad="pad" testID="table-solo" style={{ gap: SOLO_GAP }}>
            <T v="h3">{tr.table.soloTitle}</T>
            <T v="fine">{tr.table.soloBody}</T>
          </Glass>
        ) : null}
        {failed}
        <PosterGrid>
          {GAME_CARDS.map((g) => (
            <GameCard key={g.id} id={g.id} art={g.art} testID={`poster-${g.id}`} />
          ))}
        </PosterGrid>
      </Reanimated.ScrollView>
      {sheets}
    </View>
  );
}

// The bar sits this far under the status bar (the board: 60 from the top).
const BAR_TOP = 16;
const PEOPLE_TAG = 30;
const SOLO_GAP = 4;

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
