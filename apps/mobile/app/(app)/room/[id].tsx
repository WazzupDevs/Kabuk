import { CONCEPTS, type Concept } from '@shared/rooms.ts';
import { showsTableEnd } from '@shared/tableEnd.ts';
import { parseGameState } from '@shared/tabu.ts';
import { roomSeat, type RoomSeat, sideHeadcount } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatScreen, ChatScroll } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { RoomComposer, RoomMessages, useRoomChat } from '@/features/chat/ChatPanel';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { useOtherTableOnline } from '@/features/chat/usePresence';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import {
  GameArea,
  isGameRunning,
  isLocalGame,
  type LocalGame,
  useEndGame,
} from '@/features/games/GameArea';
import { useFirstGameIntro } from '@/features/games/introSeen';
import { FirstGameIntro } from '@/features/games/FirstGameIntro';
import { useGameSignals } from '@/features/games/gameSignals';
import { GameStage } from '@/features/games/GameStage';
import { TimeUpOverlay } from '@/features/games/TimeUpOverlay';
import { useTableHistory } from '@/features/friends/queries';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { useOpenedTables } from '@/features/rooms/openedTables';
import { type RoomPhone, roomKeys, useRoom, useRoomPhones } from '@/features/rooms/queries';
import { PeopleSheet, PeopleStrip, PickPersonSheet } from '@/features/rooms/RoomPeople';
import { TableEnd } from '@/features/rooms/TableEnd';
import { type EndPerson, useRememberTable, useTableEndStore } from '@/features/rooms/tableEnd';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track, trackOnce } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { useKeepAwakeWhile } from '@/lib/keepAwake';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

export default function RoomScreen() {
  // `start`: the game picked on the table screen, which made this one-table room for it (K-36).
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const room = useRoom(id);
  const chat = useRoomChat(id);
  // A one-table game (Tabu, Sahtekar) runs on this phone; it starts in GameArea and keeps its place
  // when the room's concept turns to it, so the deck is not dealt twice.
  const [localGame, setLocalGame] = useState<LocalGame | null>(() =>
    isLocalGame(start) ? start : null,
  );
  // Sohbet kartları picked on the table screen whose first card did not come (useCreateSolo): the
  // game area asks for it once more.
  const [askFirstCard] = useState(() => start === 'sohbet');
  // Started once: a later visit to this screen opens on the games.
  useEffect(() => {
    if (start) router.setParams({ start: undefined });
  }, [start]);
  const endGame = useEndGame(id, () => setLocalGame(null));
  const [chatOpen, setChatOpen] = useState(false);
  // Messages from the other table seen so far; the rest count as unread on the game's chat button.
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  const roomConcept = room.data?.concept;
  const gameRunning =
    !!room.data &&
    isGameRunning(
      (CONCEPTS as readonly unknown[]).includes(roomConcept) ? (roomConcept as Concept) : null,
      room.data.guest_session_id !== null,
      localGame,
    );
  const ownSession = table.data?.id;
  const loaded = chat.messages.data;
  // Each game counts unread messages from its own start: what came before (chat between games)
  // is seen. The chat panel closes when the game ends. Adjusted while rendering (React's "storing
  // information from previous renders"), not in an effect.
  const [wasRunning, setWasRunning] = useState(gameRunning);
  if (wasRunning !== gameRunning) {
    setWasRunning(gameRunning);
    setSeen(null);
    setChatOpen(false);
  } else if (gameRunning && seen === null && loaded) {
    setSeen(new Set(loaded.filter((m) => m.session_id !== ownSession).map((m) => m.id)));
  }

  // While a game runs the screen stays on; "Süre bitti!" comes from the game (docs/SPEC_V3.md
  // §19.2).
  useKeepAwakeWhile(gameRunning);
  const timeUp = useGameSignals((s) => s.timeUp);
  const localProgress = useGameSignals((s) => s.local);
  // Sesli Tabu's intro, once per device, on the first two-table game.
  const intro = useFirstGameIntro();
  const loadIntro = intro.load;
  useEffect(() => loadIntro(), [loadIntro]);

  // The room's phones and this phone's place in it (docs/SPEC_V3.md §22.B): a leader is on the room
  // row, a member only in room_phones.
  const phones = useRoomPhones(id, !!room.data && room.data.status !== 'closed');
  const people = (phones.data ?? []).map((p) => p.sessionId).join(',');
  const profiles = useRoomMemberProfiles(id, people).data;
  const seat = room.data && ownSession ? roomSeat(room.data, phones.data, ownSession) : null;
  // The merged table (docs/SPEC_V3.md §23.F): what this phone sees of the other side is kept for the
  // table's end (§23.G), and the venue card's "Kabul edildi …" line ends once it is opened (§23.E).
  const twoSided =
    !!room.data && room.data.status === 'active' && room.data.guest_session_id !== null;
  const otherSideAlias =
    seat && room.data
      ? seat.side === 'owner'
        ? room.data.guest_alias
        : room.data.owner_alias
      : null;
  useRememberTable(id, twoSided ? otherSideAlias : null, phones.data, seat?.side, profiles);
  const markOpened = useOpenedTables((s) => s.markOpened);
  useEffect(() => {
    if (twoSided) markOpened(id);
  }, [twoSided, id, markOpened]);
  const seenTable = useTableEndStore((s) => s.tables[id]);
  const markLeft = useTableEndStore((s) => s.markLeft);
  const forgetTable = useTableEndStore((s) => s.forget);
  // Oyun Seç or Masa Sohbeti, and the other side's messages already seen: the rest put a dot on
  // Masa Sohbeti (canvas: Faz 3 · 23.3).
  const [tab, setTab] = useState<'games' | 'chat'>('games');
  const [chatSeen, setChatSeen] = useState<ReadonlySet<string> | null>(null);
  const [stripPeople, setStripPeople] = useState(false);
  // A member who becomes the leader (the leader left, docs/SPEC_V3.md §22.D) sees one note at the
  // top of the chat with the name of the leader who left (canvas: Liderlik devri notu). Adjusted
  // while rendering, like `seen` above.
  const myLeaderAlias =
    seat && room.data
      ? seat.side === 'owner'
        ? room.data.owner_alias
        : room.data.guest_alias
      : null;
  const [lastSeat, setLastSeat] = useState<{ leader: boolean; alias: string | null } | null>(null);
  const [handover, setHandover] = useState<string | null>(null);
  if (seat && (lastSeat?.leader !== seat.leader || lastSeat.alias !== myLeaderAlias)) {
    if (lastSeat && !lastSeat.leader && seat.leader && lastSeat.alias) setHandover(lastSeat.alias);
    setLastSeat({ leader: seat.leader, alias: myLeaderAlias });
  }

  // "Masayı bitir": a leader's (docs/SPEC_V3.md §22.D).
  const exit = useMutation({
    meta: FEEL_ERROR,
    mutationFn: roomsApi.end,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(id) });
    },
  });
  // "Masadan çık": a member leaves, a leader hands its side to the oldest member.
  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leave(id),
    onSuccess: () => {
      // Left on its own: the table's end shows only with a record (@shared/tableEnd.ts).
      markLeft(id);
      track('team_left', {});
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(id) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.phones(id) });
    },
  });

  if (room.isPending || table.isPending) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }

  const sessionId = table.data?.id;
  const r = room.data;
  if (!sessionId) return <Redirect href="/venue" />;
  const closeEnd = () => {
    forgetTable(id);
    router.replace('/venue');
  };
  if (!r || r.status === 'closed') {
    // A table closed while Tabu ran: the game was stopped (§19.1).
    const stopped = r ? parseGameState(r.game_state) : null;
    if (r && stopped?.concept === 'tabu' && stopped.phase === 'playing') {
      trackOnce(`game_abandoned:${r.id}:${stopped.gameNo}`, 'game_abandoned', {
        concept: 'tabu',
        turn_no: stopped.turnNo,
        total_turns: stopped.totalTurns,
      });
    }
    // A merged table this phone sat at ends on its table's end (docs/SPEC_V3.md §23.G); any other
    // room goes back to the venue.
    if (seenTable) return <TableEndGate roomId={id} seen={seenTable} onClose={closeEnd} />;
    // An unreadable row being read again is waited for: one left in the cache from an earlier visit
    // (a phone back in a room it left, docs/SPEC_V3.md §22.B) would send it to the venue, and the
    // venue straight back here.
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
  if (!seat) {
    // A member is known once room_phones is read; a phone no longer in it (it left, or its leader
    // took it out) sees its table's end, or goes back to the venue.
    if (phones.isPending) {
      return (
        <Screen>
          <View className="mt-16 items-center">
            <Loader />
          </View>
        </Screen>
      );
    }
    if (seenTable) return <TableEndGate roomId={id} seen={seenTable} onClose={closeEnd} />;
    return <Redirect href="/venue" />;
  }

  const side = seat.side;
  const isOwner = side === 'owner';
  // Room-level events count once, from the owner side's leader.
  const reportsRoom = isOwner && seat.leader;
  const mySide = sideHeadcount(
    isOwner ? (r.owner_headcount ?? 1) : (r.guest_headcount ?? 0),
    isOwner ? r.owner_phones : (r.guest_phones ?? 0),
  );
  const roomHeadcount =
    sideHeadcount(r.owner_headcount ?? 1, r.owner_phones) +
    (r.guest_headcount !== null ? sideHeadcount(r.guest_headcount, r.guest_phones ?? 0) : 0);
  // The running game; null is chat (docs/SPEC_V3.md §5.1).
  const concept: Concept | null = (CONCEPTS as readonly unknown[]).includes(r.concept)
    ? (r.concept as Concept)
    : null;
  const hasOtherTable = r.guest_session_id !== null;

  // Each phone that came by a request counts once per room: "Katıl" (the guest's leader) and "Bu
  // masadayım" (a member of either side; docs/SPEC_V3.md §22.L).
  if (!reportsRoom) {
    trackOnce(`join_accepted:${r.id}`, 'join_accepted', { as_member: !(seat.leader && !isOwner) });
  }
  if (handover) trackOnce(`leader_transferred:${r.id}`, 'leader_transferred', {});

  // A two-sided room is named for the other side's leader ("Kibar Badem ile"), its phones under the
  // name (docs/SPEC_V3.md §22.G, decision 9); a one-sided room keeps the room's own name.
  const otherAlias = isOwner ? r.guest_alias : r.owner_alias;
  const otherPhones = (isOwner ? r.guest_phones : r.owner_phones) ?? 1;
  // From step 4.5 the table's name (docs/SPEC_V4.md §4.H); today's screen until the app's 4.5b.
  const ownerAlias = r.owner_alias ?? '';
  const title = r.guest_alias && otherAlias ? tr.rooms.withOther(otherAlias) : ownerAlias;
  const myAlias = table.data?.alias || ownerAlias;
  const roomPhones = phones.data ?? [];
  // The member a leader's "Masadan çık" hands the side to: the oldest one (docs/SPEC_V3.md §22.D).
  const nextLeader =
    roomPhones
      .filter((p) => p.side === side && !p.leader)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0]?.alias ?? null;
  // The venue is the home screen (docs/SPEC_V3.md §23.C): the back arrow returns there, also when the
  // room was opened from a notification.
  const backToVenue = () => (router.canGoBack() ? router.back() : router.replace('/venue'));
  const topBar = (subtitle: string, onClose?: () => void) => (
    <RoomTopBar
      roomId={r.id}
      title={title}
      subtitle={subtitle}
      aliases={hasOtherTable && otherAlias ? [myAlias, otherAlias] : [ownerAlias]}
      me={{ ...seat, sessionId }}
      phones={roomPhones}
      profiles={profiles}
      nextLeader={nextLeader}
      onEnd={() => exit.mutate()}
      ending={exit.isPending}
      onLeave={() => leave.mutate()}
      leaving={leave.isPending}
      leaveError={leave.error}
      waiting={r.status === 'waiting' && r.visibility === 'open'}
      onBack={onClose ?? backToVenue}
    />
  );
  const gameArea = (
    <GameArea
      roomId={r.id}
      sessionId={sessionId}
      concept={concept}
      gameState={r.game_state}
      hasGuest={hasOtherTable}
      side={side}
      reportsRoom={reportsRoom}
      leader={seat.leader}
      leaderAlias={(isOwner ? r.owner_alias : r.guest_alias) ?? ownerAlias}
      sidePhones={(isOwner ? r.owner_phones : r.guest_phones) ?? 1}
      roomPhones={r.owner_phones + (r.guest_phones ?? 0)}
      aliasOf={(s) => roomPhones.find((p) => p.sessionId === s)?.alias}
      aliases={{ owner: ownerAlias, guest: r.guest_alias ?? '' }}
      headcount={mySide}
      roomHeadcount={roomHeadcount}
      localGame={localGame}
      onLocalGame={setLocalGame}
      askFirstCard={askFirstCard}
    />
  );

  // The newest message, for following it (ChatScroll): one on its way, else the newest read.
  const newestOut = chat.outbox[chat.outbox.length - 1];
  const newestIn = (chat.messages.data ?? []).at(-1);
  const newest = {
    key: newestOut?.localId ?? newestIn?.id,
    mine: newestOut ? true : newestIn?.session_id === sessionId,
  };

  // A running game takes the whole screen; the chat folds into a button (canvas: Aşama 6 · Oyunlar).
  if (isGameRunning(concept, hasOtherTable, localGame)) {
    const others = (chat.messages.data ?? []).filter((m) => m.session_id !== sessionId);
    const unread = chatOpen || !seen ? 0 : others.filter((m) => !seen.has(m.id)).length;
    const toggleChat = (open: boolean) => {
      setChatOpen(open);
      setSeen(new Set(others.map((m) => m.id)));
    };
    const gameName = tr.concepts[concept ?? localGame ?? 'tabu'];
    return (
      <GameStage
        title={gameName}
        unread={unread}
        chatOpen={chatOpen}
        onChat={toggleChat}
        onEndGame={() => {
          // A one-table game stopped before its end (§19.1); a two-table one is counted from
          // lastGame in GameArea.
          if (localGame === 'tabu' && localProgress && !localProgress.finished) {
            track('game_abandoned', {
              concept: 'tabu',
              turn_no: localProgress.turnNo,
              total_turns: localProgress.totalTurns,
            });
          }
          endGame.mutate();
        }}
        overlay={
          <TimeUpOverlay
            visible={timeUp !== null}
            detail={timeUp?.detail}
            brand={tr.games.gameBrand(gameName)}
          />
        }
        ending={endGame.isPending}
        endError={endGame.error}
        solo={!hasOtherTable}
        banner={hasOtherTable ? <OtherTableStatus roomId={r.id} isOwner={isOwner} slim /> : null}
        chat={
          <>
            {/* Only the game's name under the title: "· yüz yüze" split over two lines at 320 dp. */}
            {topBar(gameName, () => toggleChat(false))}
            <ChatScroll
              startAtEnd
              newestKey={newest.key}
              newestMine={newest.mine}
              contentContainerStyle={{ padding: SPACING[4], gap: SPACING[2] }}
            >
              <RoomMessages chat={chat} sessionId={sessionId} profiles={profiles} />
            </ChatScroll>
            <RoomComposer chat={chat} />
          </>
        }
      >
        {exit.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(exit.error)}
          </Text>
        ) : null}
        {gameArea}
        <FirstGameIntro
          visible={concept === 'tabu' && hasOtherTable && intro.seen === false}
          onClose={intro.markSeen}
        />
      </GameStage>
    );
  }

  const notes = (
    <>
      {handover ? (
        <Card tone="note" className="mt-4" testID="leader-note">
          <Text variant="fine" tone="text">
            {tr.rooms.newLeader(handover)}
          </Text>
        </Card>
      ) : null}
      {exit.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(exit.error)}
        </Text>
      ) : null}
    </>
  );

  // The merged table (docs/SPEC_V3.md §23.F; canvas: Faz 3 · 23.3): the people at the table on a
  // strip, then two tabs, Oyun Seç (today's games) and Masa Sohbeti (today's room chat). A message
  // from the other phones while Oyun Seç is open puts a dot on Masa Sohbeti. A one-sided room (the
  // lobby's waiting room, "Masanla oyna") keeps its games over its chat.
  if (hasOtherTable) {
    const others = (chat.messages.data ?? []).filter((m) => m.session_id !== sessionId);
    // What was there when the table opened is seen; on Masa Sohbeti everything is (adjusted while
    // rendering, like `seen` above).
    if (
      loaded &&
      (chatSeen === null || (tab === 'chat' && others.some((m) => !chatSeen.has(m.id))))
    ) {
      setChatSeen(new Set(others.map((m) => m.id)));
    }
    const unreadChat = tab === 'games' && !!chatSeen && others.some((m) => !chatSeen.has(m.id));
    const head = (
      <>
        {topBar(tr.rooms.phones(otherPhones))}
        <PeopleSheet
          visible={stripPeople}
          onClose={() => setStripPeople(false)}
          phones={roomPhones}
          me={{ ...seat, sessionId }}
          profiles={profiles}
        />
      </>
    );
    // Under the title bar the page scrolls, the strip and the tabs with it (canvas: 320 dp ·
    // birleşik masa): on a small screen a fixed strip left half the screen to the games.
    const tableTop = (
      <View className="gap-3 pb-2">
        <PeopleStrip
          phones={roomPhones}
          me={{ ...seat, sessionId }}
          profiles={profiles}
          onAll={() => setStripPeople(true)}
        />
        <Segmented<'games' | 'chat'>
          value={tab}
          onChange={setTab}
          accessibilityLabel={tr.rooms.tabsLabel}
          options={[
            { value: 'games', label: tr.rooms.tabGames, testID: 'tab-games' },
            {
              value: 'chat',
              label: tr.rooms.tabChat,
              testID: 'tab-chat',
              dot: unreadChat,
              dotLabel: tr.rooms.unreadChat,
            },
          ]}
        />
      </View>
    );
    // A tab is its own stream (key): Masa Sohbeti opens at its newest message every time.
    return tab === 'games' ? (
      <ChatScreen key="games" top={head} composer={null}>
        {tableTop}
        {notes}
        {gameArea}
        <OtherTableStatus roomId={r.id} isOwner={isOwner} />
      </ChatScreen>
    ) : (
      <ChatScreen
        key="chat"
        top={head}
        composer={<RoomComposer chat={chat} />}
        newestKey={newest.key}
        newestMine={newest.mine}
        startAtEnd
      >
        {tableTop}
        <RoomMessages chat={chat} sessionId={sessionId} profiles={profiles} />
      </ChatScreen>
    );
  }

  return (
    <ChatScreen
      top={topBar(tr.rooms.roomEyebrow(concept))}
      composer={<RoomComposer chat={chat} />}
      newestKey={newest.key}
      newestMine={newest.mine}
      // At the newest message once there is one (CLAUDE.md → Ekran davranışı); an empty room opens
      // on its games.
      startAtEnd={newest.key !== undefined}
    >
      {notes}
      {/* Over the games, not under them: below the grid it sat under the message bar. */}
      {r.status === 'waiting' && r.visibility === 'open' ? (
        <Card tone="note" className="mt-4" testID="room-waiting-note">
          <Text variant="fine">{tr.rooms.waitingForGuest}</Text>
        </Card>
      ) : null}
      <View className={r.status === 'waiting' && r.visibility === 'open' ? 'mt-1' : 'mt-4'}>
        {gameArea}
      </View>

      <RoomMessages chat={chat} sessionId={sessionId} profiles={profiles} />
    </ChatScreen>
  );
}

// The end of a merged table this phone sat at (@shared/tableEnd.ts): its records decide, once read,
// whether there is anything to show; otherwise the venue.
function TableEndGate({
  roomId,
  seen,
  onClose,
}: {
  roomId: string;
  seen: { otherAlias: string; people: EndPerson[]; left: boolean };
  onClose: () => void;
}) {
  const records = useTableHistory(roomId, true);
  if (records.isPending) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  const show =
    records.isError ||
    showsTableEnd({
      hadOtherSide: seen.people.length > 0,
      leftOnItsOwn: seen.left,
      records: records.data.length,
    });
  if (!show) return <Redirect href="/venue" />;
  return (
    <TableEnd roomId={roomId} otherAlias={seen.otherAlias} people={seen.people} onClose={onClose} />
  );
}

// The room's top bar (canvas: Aşama 4 · Yenileme; Faz 2 · 22.5; Faz 3 · 23.1): the back arrow, the
// faces, the name with the other side's phones under it, the red button (a leader's "Masayı
// bitir", in the lobby's waiting room "Lobiden çek"; a member's "Masadan çık") and the menu. The
// name opens "Masadakiler". Only one of the bar's sheets is open at a time. On a narrow screen the
// faces go and the red button is an icon, so the name fits its two lines.
function RoomTopBar({
  roomId,
  title,
  subtitle,
  aliases,
  me,
  phones,
  profiles,
  nextLeader,
  onEnd,
  ending,
  onLeave,
  leaving,
  leaveError,
  waiting,
  onBack,
}: {
  roomId: string;
  title: string;
  subtitle: string;
  aliases: readonly string[];
  me: RoomSeat & { sessionId: string };
  phones: readonly RoomPhone[];
  profiles: ReadonlyMap<string, string> | undefined;
  // The member a leader's "Masadan çık" hands the side to; null: no one else on the side.
  nextLeader: string | null;
  onEnd: () => void;
  ending: boolean;
  onLeave: () => void;
  leaving: boolean;
  leaveError: unknown;
  // The table's waiting room in the lobby (docs/SPEC_V3.md §23.C): ending it is "Lobiden çek".
  waiting: boolean;
  // The back arrow: back to the venue, the home screen; in the game's chat panel it closes the panel.
  onBack: () => void;
}) {
  const [sheet, setSheet] = useState<'menu' | 'people' | 'block' | 'report' | 'leave' | null>(null);
  const safety = useRoomSafety(roomId);
  const close = () => setSheet(null);
  const hasOthers = phones.some((p) => p.sessionId !== me.sessionId);
  // A leader alone on its side has no "Masadan çık": leaving would end the room, as "Masayı bitir".
  const canLeave = !me.leader || nextLeader !== null;
  // On a narrow screen the red button is an icon: the label left the names a letter.
  const { width, fontScale } = useWindowDimensions();
  const narrow = width < NARROW_SCREEN * Math.max(1, fontScale);
  return (
    <>
      <ChatTopBar
        onBack={onBack}
        title={title}
        titleLines={2}
        subtitle={subtitle}
        leading={narrow ? undefined : <TableFaces aliases={aliases} />}
        onPressTitle={phones.length > 0 ? () => setSheet('people') : undefined}
        titleAccessibilityLabel={tr.rooms.viewPeople}
        actions={
          <>
            {me.leader ? (
              <Button
                variant="danger"
                size="sm"
                testID="end-room"
                label={waiting ? tr.venue.withdraw : tr.rooms.end}
                icon={narrow ? 'exit-outline' : undefined}
                iconOnly={narrow}
                onPress={onEnd}
                disabled={ending}
              />
            ) : (
              <Button
                variant="danger"
                size="sm"
                testID="leave-room"
                label={tr.rooms.leave}
                icon={narrow ? 'exit-outline' : undefined}
                iconOnly={narrow}
                onPress={() => setSheet('leave')}
                disabled={leaving}
              />
            )}
            <IconButton
              icon="ellipsis-horizontal"
              label={tr.friends.more}
              onPress={() => setSheet('menu')}
            />
          </>
        }
      />
      <Sheet visible={sheet === 'menu'} onClose={close} title={tr.friends.more}>
        {me.leader && hasOthers ? <Text variant="fine">{tr.rooms.endHint}</Text> : null}
        {canLeave ? (
          <Button
            variant="neutral"
            testID="menu-leave"
            label={tr.rooms.leave}
            onPress={() => setSheet('leave')}
          />
        ) : null}
        {me.leader && nextLeader ? (
          <Text variant="fine">{tr.rooms.leaveHandover(nextLeader)}</Text>
        ) : null}
        {hasOthers ? (
          <>
            <Button
              variant="neutral"
              testID="menu-report"
              label={tr.safety.report}
              onPress={() => setSheet('report')}
            />
            <Button
              variant="neutral"
              testID="menu-block"
              label={tr.safety.block}
              onPress={() => {
                safety.resetBlock();
                setSheet('block');
              }}
            />
          </>
        ) : null}
      </Sheet>
      <Sheet
        visible={sheet === 'leave'}
        onClose={close}
        title={tr.rooms.leaveConfirmTitle}
        icon="exit-outline"
      >
        <Text variant="fine" tone="text">
          {me.leader && nextLeader
            ? tr.rooms.leaveConfirmLeader(nextLeader)
            : tr.rooms.leaveConfirmMember}
        </Text>
        {leaveError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(leaveError)}
          </Text>
        ) : null}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Button variant="neutral" label={tr.common.cancel} onPress={close} />
          </View>
          <View className="flex-1">
            <Button
              variant="danger"
              testID="leave-confirm"
              label={tr.rooms.leave}
              onPress={onLeave}
              loading={leaving}
            />
          </View>
        </View>
      </Sheet>
      <PeopleSheet
        visible={sheet === 'people'}
        onClose={close}
        phones={phones}
        me={me}
        profiles={profiles}
      />
      <PickPersonSheet
        mode="block"
        visible={sheet === 'block'}
        onClose={close}
        phones={phones}
        me={me}
        profiles={profiles}
        pending={safety.blocking}
        error={safety.blockError}
        onPick={(sessionId) => safety.block(sessionId, close)}
      />
      <PickPersonSheet
        mode="report"
        visible={sheet === 'report'}
        onClose={close}
        phones={phones}
        me={me}
        profiles={profiles}
        pending={false}
        error={null}
        onPick={(sessionId) => {
          close();
          safety.startReport(sessionId);
        }}
      />
      {safety.reportForm}
    </>
  );
}

// The tables in the room, the second a little over the first.
function TableFaces({ aliases }: { aliases: readonly string[] }) {
  const { colors, shape } = useTheme();
  return (
    <View className="flex-row">
      {aliases.map((alias, i) => (
        <View
          key={`${i}:${alias}`}
          style={
            i > 0
              ? {
                  marginLeft: -SPACING[4],
                  borderRadius: shape.radius.pill,
                  borderWidth: shape.stroke.feature,
                  borderColor: colors.canvas,
                  margin: -shape.stroke.feature,
                }
              : undefined
          }
        >
          <Avatar kind="table" alias={alias} size="md" />
        </View>
      ))}
    </View>
  );
}

// "Diğer masanın bağlantısı koptu." In a running game it is a slim strip under the top row
// (GameStage → banner), never over the game's buttons.
function OtherTableStatus({
  roomId,
  isOwner,
  slim,
}: {
  roomId: string;
  isOwner: boolean;
  slim?: boolean;
}) {
  const { colors, shape } = useTheme();
  const online = useOtherTableOnline(roomId, isOwner ? 'owner' : 'guest', true);
  if (online) return null;
  const text = (
    <Text variant="fine" tone="text" accessibilityLiveRegion="polite">
      {tr.safety.otherOffline}
    </Text>
  );
  return slim ? (
    <View
      testID="other-offline"
      style={{
        paddingHorizontal: SPACING[3],
        paddingVertical: SPACING[1.5],
        borderRadius: shape.radius.md,
        backgroundColor: colors.surface2,
      }}
    >
      {text}
    </View>
  ) : (
    <Card tone="note" className="mt-1" testID="other-offline">
      {text}
    </Card>
  );
}
