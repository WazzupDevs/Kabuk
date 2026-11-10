import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tableGameAvailability } from '@shared/gameFrame.ts';
import { seatsAnonymously } from '@shared/gender.ts';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
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
import { InviteSheet } from '@/features/rooms/InviteSheet';
import { TableScene, useDrawerScroll } from '@/features/rooms/TableScene';
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
import { useTableEndStore } from '@/features/rooms/tableEnd';
import { tableScreenView } from '@/features/rooms/tableScreen';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA } from '@/theme/aura';
import { useNarrow } from '@/lib/useNarrow';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { AuraBackground, AuraBand, useGroundSize } from '@/aura/AuraBackground';
import { type CapIconName } from '@/aura/CapIcon';
import { Btn, Glass, Round, T } from '@/aura/kit';
import { FxMoves } from '@/components/FxSvg';

// The table (docs/design/aura → Masa; docs/SPEC_V4.md §4.E, §4.F): the bar (back; the chat, the
// owner's "Davet et", Masadakiler, the owner's "Bitir" or a participant's "Ayrıl"), the table's card
// (its people, name, headcount and lobby state, the owner's "Lobiye aç" or "Lobiden çek"), then the
// games. The table's end is Masa bitti; a participant who leaves sees "Masadan ayrıldın".
// The accessories move here (the owner's call, 7 Kasım; components/FxSvg.tsx → FxMoves).
export default function TableScreen() {
  return (
    <FxMoves>
      <TableScreenBody />
    </FxMoves>
  );
}

function TableScreenBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // The ground's height, not the window's (the band at the foot lines up with it; 3 Kasım, 2.1).
  const { height } = useGroundSize();
  const narrow = useNarrow();
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
  const [sheet, setSheet] = useState<
    'people' | 'end' | 'leave' | 'lobby' | 'invite' | 'icon' | null
  >(null);
  useMarkTableScreen();
  // The people's drawer on the table's card (MasaCekmece): closed when the screen opens; back and
  // a scroll close it (CLAUDE.md → Ekran davranışı), a scroll under the finger (useDrawerScroll).
  const [drawer, setDrawer] = useState(false);
  const drawerScroll = useDrawerScroll(drawer, setDrawer);
  // The games move down as the drawer opens, so it does not lie over them (the owner's report, 10
  // Kasım). On the UI thread: a spacer as tall as the drawer's opening, no render per frame.
  const { progress: drawerProgress, travel: drawerTravel } = drawerScroll;
  const drawerSpace = useAnimatedStyle(() => ({
    height: Math.max(0, drawerTravel.get() * drawerProgress.get()),
  }));
  useEffect(() => {
    if (!drawer) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setDrawer(false);
      return true;
    });
    return () => sub.remove();
  }, [drawer]);
  const votes = useTableVotes(id, open);
  const hiddenGame = useVampirHidden((s) => s.hidden[id]);
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
  const gameMode = vampir ?? kinshi ?? krot ?? signum ?? kibrit ?? sprengja ?? kauphollMode(r);
  const gameKey = `${gameMode}:${gameNoOf(r.game_state)}`;
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
  const inLobby = r.visibility === 'open';
  const unread = unreadCount(messages, seenAt, sessionId);

  // U22: the bar's rounds and "Bitir" 44.
  const barSide = KIT.table.bar;
  // The bar (docs/design/aura → Masa): back at the left; at the right the chat with its unread
  // count (its own screen, the owner's call, 28 Ekim), the owner's "Davet et", Masadakiler and the
  // owner's "Bitir", a participant's "Ayrıl", both danger sm (U22).
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
        side={barSide}
        icon="back"
        label={tr.table.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/venue'))}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          // Aura v75 MasaDar: 6 apart when narrow, so the bar stays one line.
          gap: narrow ? NARROW_BAR_GAP : KIT.size.chipsGap,
        }}
      >
        <Round
          side={barSide}
          icon="chat"
          label={tr.table.chatOpen(unread)}
          badge={unread}
          testID="table-chat"
          onPress={() => router.push({ pathname: '/room-chat/[id]', params: { id } })}
        />
        {owner ? (
          <Round
            side={barSide}
            icon="invite"
            label={tr.venue.invite}
            testID="table-invite"
            onPress={() => setSheet('invite')}
          />
        ) : null}
        <Round
          side={barSide}
          icon="list"
          label={tr.table.peopleTitle}
          testID="table-people-open"
          onPress={() => setSheet('people')}
        />
        <Btn
          bar={barSide}
          variant="danger"
          testID={owner ? 'table-end-open' : 'table-leave-open'}
          label={owner ? tr.table.end : tr.table.leaveShort}
          onPress={() => setSheet(owner ? 'end' : 'leave')}
        />
      </View>
    </View>
  );

  // U22: the table's name and its line ("12 kişi · Lobide açık") at the left, the owner's lobby
  // button at the right ("Lobiye aç" opens its sheet, "Lobiden çek" takes the table out). The owner
  // changes the table's card and name from its name (the owner's call, 29 Ekim).
  const info = (
    // Narrow (Aura v75 MasaDar), the lobby button goes under the name when they do not fit, 10 apart.
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: narrow ? NARROW_INFO_GAP : KIT.size.chipsGap,
        flexWrap: narrow ? 'wrap' : 'nowrap',
      }}
    >
      <Pressable
        testID="table-icon"
        accessibilityRole={owner ? 'button' : undefined}
        accessibilityLabel={owner ? tr.createTable.iconChange : undefined}
        disabled={!owner}
        onPress={() => setSheet('icon')}
        style={
          narrow
            ? { flexGrow: 1, flexShrink: 1, gap: KIT.table.lineGap }
            : { flex: 1, gap: KIT.table.lineGap }
        }
      >
        <T v="title" testID="table-title">
          {r.name ?? ''}
        </T>
        <T v="fine">
          {tr.table.status(
            tr.venue.people(r.phones),
            inLobby ? tr.venue.lobbyOpen : tr.venue.lobbyOff,
          )}
        </T>
      </Pressable>
      {owner ? (
        <Btn
          sm
          variant={inLobby ? 'glassy' : 'primary'}
          icon={inLobby ? 'close' : undefined}
          testID={inLobby ? 'table-withdraw' : 'table-lobby'}
          label={inLobby ? tr.venue.withdraw : tr.venue.openLobby}
          loading={withdraw.isPending}
          onPress={() => (inLobby ? withdraw.mutate() : setSheet('lobby'))}
        />
      ) : null}
    </View>
  );

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
    return {
      dim: state.state === 'needs_players',
      lit: mine,
      ok: canOpen && count === 0,
      tag:
        state.state === 'needs_players'
          ? tr.table.posterNeeds(state.minPlayers)
          : count > 0
            ? tr.table.posterVotes(count, mine)
            : owner
              ? tr.table.posterOpen
              : tr.table.posterVote,
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
              <Btn
                block
                variant="glassy"
                icon="logout"
                testID="table-owner-leave"
                label={tr.table.leave}
                loading={leave.isPending}
                disabled={end.isPending}
                onPress={() => leave.mutate()}
              />
              <T v="fine">{tr.table.leaveNote}</T>
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
        icon="logout"
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

  // The head stays (the name, the owner's lobby button and the people's drawer); only the
  // requests, the note and the game cards scroll, under it (the owner's call, 29 Ekim).
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <Reanimated.ScrollView
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
        onScroll={drawerScroll.onScroll}
        scrollEventThrottle={16}
      >
        <Reanimated.View style={drawerSpace} />
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
      </Reanimated.ScrollView>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <TableScene
          people={people.data ?? []}
          profiles={profiles}
          me={sessionId}
          icon={r.icon}
          inset={insets.top}
          onPress={() => setSheet('people')}
          open={drawer}
          onToggle={() => setDrawer((v) => !v)}
          // The games move with the drawer on the UI thread (`drawerSpace`): following its height
          // on the JavaScript side rendered the screen each frame (6 Kasım, round 3).
          progress={drawerScroll.progress}
          travel={drawerScroll.travel}
          onRestHeight={(h) => setHeadHeight((prev) => (prev === h ? prev : h))}
          info={info}
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

// The bar sits this far under the status bar (the board: 60 from the top).
const BAR_TOP = 16;
const SOLO_GAP = 6;

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
  icon: CapIconName;
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
      <T v="fine">{body}</T>
      {error ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(error)}
        </T>
      ) : null}
      <Btn
        block
        variant="danger"
        icon={icon}
        testID={testID}
        label={confirm}
        loading={pending}
        disabled={!!busy}
        onPress={onConfirm}
      />
      {extra}
      <Btn block variant="glassy" label={tr.common.cancel} disabled={locked} onPress={close} />
      <View style={{ height: SPACING[1] }} />
    </Sheet>
  );
}

// Aura v75 MasaDar (320 dp, the largest text).
const NARROW_BAR_GAP = 6;
const NARROW_INFO_GAP = 10;
