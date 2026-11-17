import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tableGameAvailability } from '@shared/gameFrame.ts';
import { seatsAnonymously } from '@shared/gender.ts';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { type MenuAnchor, measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { unreadCount, useRoomChatSeen } from '@/features/chat/roomChatSeen';
import { useMessages } from '@/features/chat/useMessages';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { KinshiGame, kinshiMode } from '@/features/games/kinshi/KinshiGame';
import { KauphollGame, kauphollMode } from '@/features/games/kaupholl/KauphollGame';
import { AbandonedNotice } from '@/features/games/kaupholl/KauphollParts';
import { kauphollAbandoned } from '@/features/games/kaupholl/kauphollView';
import { KibritGame, kibritMode } from '@/features/games/kibrit/KibritGame';
import { KrotGame, krotMode } from '@/features/games/sahtekar/KrotGame';
import { SignumGame, signumMode } from '@/features/games/signum/SignumGame';
import { SprengjaGame, sprengjaMode } from '@/features/games/sprengja/SprengjaGame';
import { gameNoOf, VampirGame, vampirMode } from '@/features/games/vampir/VampirGame';
import { useVampirHidden } from '@/features/games/vampir/vampirHidden';
import { useGameAwake } from '@/lib/gameAwake';
import { conceptOf, GAME_CARDS, GameCard, PosterGrid } from '@/features/rooms/PosterCard';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { IncomingRequest, useMarkTableScreen } from '@/features/rooms/IncomingRequest';
import { TableScene } from '@/features/rooms/TableScene';
import { TestBots } from '@/features/rooms/TestBots';
import { TableIconSheet } from '@/features/rooms/TableIconSheet';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import {
  roomKeys,
  useCurrentRoom,
  useRoom,
  useTablePeople,
  useTableVotes,
} from '@/features/rooms/queries';
import { PeopleSheet } from '@/features/rooms/RoomPeople';
import { TableEnd } from '@/features/rooms/TableEnd';
import { useTableEndStore } from '@/features/rooms/tableEndStore';
import { tableScreenView } from '@/features/rooms/tableScreen';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { confirm, runDialogAction, useDialogRun, useOverlayOpenId } from '@/lib/overlayStore';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { ROOM } from '@/theme/room';
import { SPACING } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';
import { AuraBackground, AuraBand, useGroundSize } from '@/aura/AuraBackground';
import { Btn, Glass, Round, T } from '@/aura/kit';
import { FxMoves } from '@/components/FxSvg';

// The table (yeni arayüz tuvali, Masa, MasaSecenek; docs/SPEC_V4.md §4.E, §4.F): the bar (back,
// the table's name with its seats and lobby state, the chat, the ⋮ menu: Masadakiler, the owner's
// "Masanın adını değiştir" and "Masayı bitir", a participant's "Masadan ayrıl"), the table's card
// (its picture, its people, the owner's "Lobiye aç" or "Lobiden çek" and "Davet et"), then the
// games. The table's end is Masa bitti; a participant who leaves sees "Masadan ayrıldın".
// The accessories move here (the owner's call, 7 Kasım; components/FxSvg.tsx → FxMoves).
type Row = Parameters<typeof vampirMode>[0];

// The game that has the table, if one does (its page, its play or its end), and the key one sent
// back to the table is remembered by.
function gameModeOf(r: Row) {
  return (
    vampirMode(r) ??
    kinshiMode(r) ??
    krotMode(r) ??
    signumMode(r) ??
    kibritMode(r) ??
    sprengjaMode(r) ??
    kauphollMode(r)
  );
}
const gameKeyOf = (r: Row) => `${gameModeOf(r)}:${gameNoOf(r.game_state)}`;

export default function TableScreen() {
  return (
    <FxMoves>
      <TableScreenBody />
    </FxMoves>
  );
}

function TableScreenBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  // The ground's height, not the window's (the band at the foot lines up with it; 3 Kasım, 2.1).
  const { height } = useGroundSize();
  // The head stays put over the games and nothing in it folds (the owner's call, 29 Ekim): the
  // games start under its height and scroll under it.
  const [headHeight, setHeadHeight] = useState(0);
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
  const [sheet, setSheet] = useState<'people' | 'lobby' | 'icon' | null>(null);
  // The ⋮ menu (MasaSecenek), grown out of its button (iskelet.md → 3.5).
  const [menu, setMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const moreRef = useRef<View>(null);
  useMarkTableScreen();
  const hiddenGame = useVampirHidden((s) => s.hidden[id]);
  // The votes are on the table's posters only: while a game has the screen they are not read (each
  // move of the game changes the table's row and asked for them again; A-24). Back at the table
  // the read made stale meanwhile runs at once.
  const now = room.data;
  const inGame = !!now && !!gameModeOf(now) && hiddenGame !== gameKeyOf(now);
  const votes = useTableVotes(id, open && !inGame);
  const hideGame = useVampirHidden((s) => s.hide);
  const showGame = useVampirHidden((s) => s.show);

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
  const current = useCurrentRoom(checkIn.data).data;
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
  // Oyun Seç (docs/SPEC_V4.md §4.F): the owner opens a playable game's page; the others vote, a
  // second press takes the vote back.
  const openGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (concept: string) => roomsApi.openGame(id, concept),
    onSettled: settle,
  });
  const vote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (concept: string | null) => roomsApi.vote(id, concept),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.votes(id) }),
  });

  const sessionId = checkIn.data?.id;
  const r = room.data;
  useGameAwake(
    !!r &&
      r.status !== 'closed' &&
      (vampirMode(r) ??
        kinshiMode(r) ??
        krotMode(r) ??
        signumMode(r) ??
        kibritMode(r) ??
        sprengjaMode(r) ??
        kauphollMode(r)) === 'play',
  );
  // A Kaupholl game this screen saw running and that was left half way: "Oyun yarıda kaldı" over
  // the table, once (KaupholYarida; no end screen).
  const kauphollRunning = r && kauphollMode(r) === 'play' ? gameNoOf(r.game_state) : null;
  const [kauphollSeen, setKauphollSeen] = useState<number | null>(null);
  if (kauphollRunning !== null && kauphollRunning !== kauphollSeen) {
    setKauphollSeen(kauphollRunning);
  }
  const kauphollHalted = r ? kauphollAbandoned(r.game_state) : null;
  const [haltedShown, setHaltedShown] = useState<number | null>(null);
  const showHalted =
    kauphollHalted !== null && kauphollHalted === kauphollSeen && haltedShown !== kauphollHalted;
  const backToVenue = () => {
    forget(id);
    router.replace('/venue');
  };
  // Closed, or no longer readable (the person left or was taken off): Masa bitti from what this
  // person last saw, or Mekan when it never sat here. A first read that failed is an error.
  const view = tableScreenView({
    roomPending: room.isPending,
    roomError: room.isError,
    roomFetching: room.isFetching,
    hasRoom: !!r,
    closed: r?.status === 'closed',
    checkInPending: checkIn.isPending,
    checkInError: checkIn.isError,
    hasCheckIn: !!sessionId,
    movedTo: !!movedTo,
    peopleRead: people.isSuccess,
    seated: !!people.data?.some((p) => p.sessionId === sessionId),
    seen: !!seen,
  });
  // Masa bitti after the owner took this person off (K-88): "Masadan çıkarıldın". A block reads as
  // the table ending, as before (rule 5). Read once the table is out of reach.
  const removed = useQuery({
    queryKey: ['roomExitRemoved', id],
    enabled: view === 'end' && !!seen && !seen.left,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('room_exit_removed', { target_room_id: id });
      if (error) throw error;
      return data;
    },
  });
  // Its title waits for the answer (a failed read leaves Masa bitti).
  if (view === 'loading' || (view === 'end' && !!seen && !seen.left && removed.isPending)) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  if (view === 'error') {
    return (
      <Screen>
        <View className="mt-16">
          <EmptyState
            kind="error"
            body={errorMessage(room.error ?? checkIn.error)}
            action={{
              label: tr.common.retry,
              onPress: () => {
                void room.refetch();
                void checkIn.refetch();
              },
            }}
          />
        </View>
      </Screen>
    );
  }
  if (view === 'end' && seen) {
    return (
      <TableEnd
        roomId={id}
        left={seen.left}
        removed={removed.data === true}
        tableName={seen.name}
        phones={seen.phones}
        profiled={seen.profiled}
        anonymous={!!checkIn.data && seatsAnonymously(checkIn.data.identity.mode, ownPhoto.gender)}
        onClose={backToVenue}
      />
    );
  }
  if (view !== 'table' || !r || !sessionId) return <Redirect href="/venue" />;

  const owner = r.owner_session_id === sessionId;
  // Vampir Köylü's page, game or end takes the screen (docs/SPEC_V4.md §4.F "Adım 4.6.6"); one sent
  // back to the table stays back until a new page comes.
  // Kinshi's (Aura v85, "Kinshi (tabu düzeni)"), Krot's (Aura v86), Signum's (Aura v87) and
  // Kibrit's (Aura v90), Sprengja's (Aura v99) and Kaupholl's (Aura v89) the same way.
  const vampir = vampirMode(r);
  const kinshi = kinshiMode(r);
  const krot = krotMode(r);
  const signum = signumMode(r);
  const kibrit = kibritMode(r);
  const sprengja = sprengjaMode(r);
  const gameMode = gameModeOf(r);
  const gameKey = gameKeyOf(r);
  if (gameMode && hiddenGame !== gameKey) {
    const Game = vampir
      ? VampirGame
      : kinshi
        ? KinshiGame
        : krot
          ? KrotGame
          : signum
            ? SignumGame
            : kibrit
              ? KibritGame
              : sprengja
                ? SprengjaGame
                : KauphollGame;
    return (
      <Game
        room={r}
        me={sessionId}
        people={people.data ?? []}
        profiles={profiles}
        onHide={() => hideGame(id, gameKey)}
      />
    );
  }
  const gameText = vampir
    ? tr.vampir
    : kinshi
      ? tr.kinshi
      : krot
        ? tr.krot
        : signum
          ? tr.signum
          : kibrit
            ? tr.kibrit
            : sprengja
              ? tr.sprengja
              : tr.kaupholl;
  // "Masayı bitir" is the owner's for everyone (cannot be undone: danger); "Masadan ayrıl" can be
  // joined again. Both are centred dialogs (lib/overlayStore → confirm), a failed try stays open.
  const openEnd = () => {
    confirm({
      title: tr.table.endTitle,
      note: tr.table.endBody,
      icon: 'close',
      tone: 'danger',
      confirmLabel: tr.table.endConfirm,
      confirmIcon: 'close',
      cancelLabel: tr.common.cancel,
      testID: 'table-end-confirm',
      onConfirm: async () => {
        await end.mutateAsync();
      },
      children: r.phones > 1 ? <OwnerLeave leave={() => leave.mutateAsync()} /> : undefined,
    });
  };
  const openLeave = () => {
    confirm({
      title: tr.table.leaveTitle,
      note: tr.table.leaveBody,
      icon: 'logout',
      tone: 'plain',
      confirmLabel: tr.table.leave,
      confirmIcon: 'logout',
      cancelLabel: tr.common.cancel,
      testID: 'table-leave-confirm',
      onConfirm: async () => {
        await leave.mutateAsync();
      },
    });
  };

  const inLobby = r.visibility === 'open';
  const unread = unreadCount(messages, seenAt, sessionId);
  const full = r.phones >= MAX_TABLE_PHONES;
  const seats = tr.table.seats(r.phones, MAX_TABLE_PHONES);
  const openMenu = () =>
    measureMenuAnchor(moreRef.current, (at) => {
      setMenuAnchor(at);
      setMenu(true);
    });

  // The bar (yeni arayüz tuvali, Masa `.mtop`): back at the left, the table's pill (its name and
  // "7/12 · Lobide açık"; the owner changes the table's card and name from it, the owner's call, 29
  // Ekim), the chat with its unread count (its own screen, the owner's call, 28 Ekim) and the ⋮
  // menu (MasaSecenek).
  const bar = (
    <View
      testID="table-top"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: ROOM.bar.gap,
        paddingHorizontal: ROOM.bar.side,
        paddingTop: ROOM.bar.top,
      }}
    >
      <Round
        icon="back"
        label={tr.table.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/venue'))}
      />
      <Pressable
        testID="table-icon"
        accessibilityRole={owner ? 'button' : undefined}
        accessibilityLabel={owner ? tr.createTable.iconChange : undefined}
        disabled={!owner}
        onPress={() => setSheet('icon')}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Glass
          radius={ROOM.bar.pill / 2}
          face={VENUE[scheme].card}
          style={{
            minHeight: ROOM.bar.pill,
            paddingHorizontal: ROOM.bar.pillPadX,
            justifyContent: 'center',
          }}
        >
          <T v="roomBarName" ink lines={1} fit testID="table-title">
            {r.name ?? ''}
          </T>
          <T v="roomBarLine" lines={1} fit>
            {tr.table.status(seats, inLobby ? tr.venue.lobbyOpen : tr.venue.lobbyOff)}
          </T>
        </Glass>
      </Pressable>
      <Round
        icon="chat"
        label={tr.table.chatOpen(unread)}
        badge={unread}
        testID="table-chat"
        onPress={() => router.push({ pathname: '/room-chat/[id]', params: { id } })}
      />
      <View ref={moreRef} collapsable={false}>
        <Round icon="moreV" label={tr.table.menu} testID="table-menu" onPress={openMenu} />
      </View>
    </View>
  );

  // The owner's buttons on the card (`.tb2`): "Lobiye aç" opens its sheet, "Lobiden çek" takes the
  // table out; "Davet et" opens Masana davet et, off once the table is full.
  const actions = owner ? (
    <>
      <Btn
        sm
        variant="glassy"
        icon={inLobby ? 'close' : 'list'}
        testID={inLobby ? 'table-withdraw' : 'table-lobby'}
        label={inLobby ? tr.venue.withdraw : tr.venue.openLobby}
        loading={withdraw.isPending}
        onPress={() => (inLobby ? withdraw.mutate() : setSheet('lobby'))}
        style={EQUAL}
      />
      <Btn
        sm
        variant="glassy"
        icon="invite"
        testID="table-invite"
        label={tr.venue.invite}
        disabled={full}
        onPress={() => router.push({ pathname: '/room-invite/[id]', params: { id } })}
        style={EQUAL}
      />
    </>
  ) : null;

  const failed =
    (withdraw.error ?? end.error ?? openGame.error ?? vote.error) ? (
      <T v="fine" color={KIT.danger}>
        {errorMessage(withdraw.error ?? end.error ?? openGame.error ?? vote.error)}
      </T>
    ) : null;

  // A game sent away runs on (or its page waits): a card to look in again.
  const rejoin =
    gameMode === 'play' || gameMode === 'pregame' ? (
      <Glass
        pad="pad"
        testID="table-game-running"
        style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}
      >
        <T v="h3" style={{ flex: 1 }}>
          {gameMode === 'play' ? gameText.running : gameText.runningPage}
        </T>
        <Btn
          sm
          label={gameMode === 'play' ? tr.vampir.rejoin : tr.vampir.rejoinPage}
          onPress={() => showGame(id)}
        />
      </Glass>
    ) : null;

  const poster = (card: (typeof GAME_CARDS)[number]['id']) => {
    // The poster's game on the server (Kinshi is `tabu`, Krot `sahtekar`).
    const gameId = conceptOf(card);
    const state = tableGameAvailability(gameId, r.phones);
    if (state.state === 'soon') return { tag: tr.table.soon };
    const count = votes.data?.counts[gameId] ?? 0;
    const mine = votes.data?.mine === gameId;
    // While a game or its page is open the table cannot vote or open another.
    const busy =
      openGame.isPending || vote.isPending || gameMode === 'play' || gameMode === 'pregame';
    const canOpen = owner && state.state === 'open';
    // The corner says what a press does (or how many it needs), the votes lie at the bottom right
    // (MasaOyunSec, MasaOyunOyla).
    return {
      dim: state.state === 'needs_players',
      lit: mine,
      ok: canOpen,
      tag:
        state.state === 'needs_players'
          ? tr.table.posterNeeds(state.minPlayers)
          : owner
            ? tr.table.posterOpen
            : tr.table.posterVote,
      votes: count > 0 ? tr.table.posterVotes(count, mine) : undefined,
      onPress: busy
        ? undefined
        : canOpen
          ? () => openGame.mutate(gameId)
          : () => vote.mutate(mine ? null : gameId),
    };
  };

  const sheets = (
    <>
      <PeopleSheet
        visible={sheet === 'people'}
        onClose={() => setSheet(null)}
        roomId={id}
        tableName={r.name ?? ''}
        phones={r.phones}
        people={people.data ?? []}
        me={sessionId}
        profiles={profiles}
      />
      {menuAnchor ? (
        <Menu anchor={menuAnchor} visible={menu} onClose={() => setMenu(false)}>
          <MenuItem
            cap="people"
            testID="table-menu-people"
            label={tr.table.peopleTitle}
            onPress={() => setSheet('people')}
          />
          {owner ? (
            <MenuItem
              cap="edit"
              testID="table-menu-rename"
              label={tr.table.rename}
              onPress={() => setSheet('icon')}
            />
          ) : null}
          <MenuItem
            cap={owner ? 'close' : 'logout'}
            negative
            testID={owner ? 'table-end-open' : 'table-leave-open'}
            label={owner ? tr.table.endConfirm : tr.table.leave}
            onPress={owner ? openEnd : openLeave}
          />
        </Menu>
      ) : null}
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
    </>
  );

  // The head stays (the bar and the table's card); only the requests, the note and the games
  // scroll, under it (the owner's call, 29 Ekim).
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        // Shown once the head is measured: the games start under it, not behind it.
        style={{ flex: 1, opacity: headHeight > 0 ? 1 : 0 }}
        contentContainerStyle={{
          paddingHorizontal: KIT.size.side,
          paddingTop: headHeight,
          paddingBottom: insets.bottom + SPACING[8],
          gap: KIT.size.venueGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        {owner ? (
          <IncomingRequest roomId={id} ownerSessionId={sessionId} phones={r.phones} />
        ) : null}
        {r.phones === 1 ? (
          <Glass pad="lg" testID="table-solo" style={{ gap: SOLO_GAP }}>
            <T v="secLg">{tr.table.soloTitle}</T>
            <T v="note">{tr.table.soloBody}</T>
          </Glass>
        ) : null}
        {owner ? <TestBots roomId={id} phones={r.phones} /> : null}
        {rejoin}
        {failed}
        <View>
          {/* "Oyunlar" and how many (`.gh`). */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: ROOM.games.gap,
              marginTop: ROOM.games.top - KIT.size.venueGap,
              marginBottom: ROOM.games.bottom,
              marginHorizontal: ROOM.games.x,
            }}
          >
            <T v="roomSection" ink accessibilityRole="header">
              {tr.table.games}
            </T>
            <T v="roomCount" color={colors.muted}>
              {tr.table.gamesCount(GAME_CARDS.length)}
            </T>
          </View>
          <PosterGrid>
            {GAME_CARDS.map((g) => (
              <GameCard
                key={g.id}
                id={g.id}
                art={g.art}
                testID={`poster-${g.id}`}
                {...poster(g.id)}
              />
            ))}
          </PosterGrid>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <TableScene
          people={people.data ?? []}
          profiles={profiles}
          me={sessionId}
          icon={r.icon}
          phones={r.phones}
          inset={insets.top}
          onPeople={() => setSheet('people')}
          onRestHeight={(h) => setHeadHeight((prev) => (prev === h ? prev : h))}
          actions={actions}
        >
          {bar}
        </TableScene>
      </View>
      {/* U22 (`.fadebot`): the games fade into the canvas over the bottom 90. */}
      <AuraBand
        top={height - KIT.table.fade * (1 - KIT.table.fadeSolid)}
        height={KIT.table.fade * (1 - KIT.table.fadeSolid)}
        fade={KIT.table.fade * KIT.table.fadeSolid}
        direction="up"
      />
      {sheets}
      {showHalted ? <AbandonedNotice onDone={() => setHaltedShown(kauphollHalted)} /> : null}
    </View>
  );
}

const SOLO_GAP = 6;
// The owner's two buttons share the card's row equally.
const EQUAL = { flex: 1 };

// The owner's other way out in "Masayı bitir"'s dialog: the table goes on for the others. It runs
// as one of the dialog's ways (`runDialogAction`): neither runs while the other is on its way, and
// a failed try is written in the dialog's own error line.
function OwnerLeave({ leave }: { leave: () => Promise<unknown> }) {
  const id = useOverlayOpenId();
  const pending = useDialogRun((s) => s.id === id && s.running === 'other');
  const press = () => {
    if (id) void runDialogAction(id, 'other', leave);
  };
  return (
    <View className="gap-2.5">
      <Btn
        block
        variant="glassy"
        icon="logout"
        testID="table-owner-leave"
        label={tr.table.leave}
        loading={pending}
        onPress={press}
      />
      <T v="fine" center>
        {tr.table.leaveNote}
      </T>
    </View>
  );
}
