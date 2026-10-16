import { CONCEPTS, type Concept } from '@shared/rooms.ts';
import { parseGameState } from '@shared/tabu.ts';
import { roomSeat, type RoomSeat, sideHeadcount } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatScreen, ChatScroll } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { RoomComposer, RoomMessages, useRoomChat } from '@/features/chat/ChatPanel';
import { useRoomSafety } from '@/features/chat/RoomSafety';
import { useOtherTableOnline } from '@/features/chat/usePresence';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { GameArea, isGameRunning, type LocalGame, useEndGame } from '@/features/games/GameArea';
import { useFirstGameIntro } from '@/features/games/introSeen';
import { FirstGameIntro } from '@/features/games/FirstGameIntro';
import { useGameSignals } from '@/features/games/gameSignals';
import { GameStage } from '@/features/games/GameStage';
import { TimeUpOverlay } from '@/features/games/TimeUpOverlay';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { Reveal } from '@/features/reveal/Reveal';
import { RevealPrompt } from '@/features/reveal/RevealPrompt';
import { type RoomPhone, roomKeys, useRoom, useRoomPhones } from '@/features/rooms/queries';
import { PeopleSheet, PickPersonSheet } from '@/features/rooms/RoomPeople';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track, trackOnce } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { useKeepAwakeWhile } from '@/lib/keepAwake';
import { useTheme } from '@/theme/ThemeProvider';
import { NARROW_SCREEN, SPACING } from '@/theme/tokens';

export default function RoomScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const room = useRoom(id);
  const chat = useRoomChat(id);
  // A one-table game (Tabu, Sahtekar) runs on this phone; it starts in GameArea and keeps its place
  // when the room's concept turns to it, so the deck is not dealt twice.
  const [localGame, setLocalGame] = useState<LocalGame | null>(null);
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
  // The reveal window this phone saw open: its result is read from reveal/matches even once the
  // room can no longer be read (a member's row closes with the room, docs/SPEC_V3.md §22.F).
  // Adjusted while rendering, like `seen` above.
  const [windowEndsAt, setWindowEndsAt] = useState<string | null>(null);
  const openWindow = room.data?.status === 'ending' ? room.data.reveal_ends_at : null;
  if (openWindow && openWindow !== windowEndsAt) setWindowEndsAt(openWindow);
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
    mutationFn: roomsApi.end,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(id) });
    },
  });
  // "Masadan çık": a member leaves, a leader hands its side to the oldest member.
  const leave = useMutation({
    mutationFn: () => roomsApi.leave(id),
    onSuccess: () => track('team_left', {}),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(id) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.phones(id) });
    },
  });

  if (room.isPending || table.isPending) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.muted} />
      </Screen>
    );
  }

  const sessionId = table.data?.id;
  const r = room.data;
  if (!sessionId) return <Redirect href="/venue" />;
  if (!r || r.status === 'closed') {
    // A room whose window this phone saw, or a leader's closed room with a result: each phone's
    // own result; otherwise back to the venue.
    const ended = windowEndsAt ?? (r && seat && r.reveal_result !== null ? r.reveal_ends_at : null);
    if (ended) return <Reveal roomId={id} sessionId={sessionId} revealEndsAt={ended} />;
    // An unreadable row being read again is waited for: one left in the cache from an earlier visit
    // (a phone back in a room it left, docs/SPEC_V3.md §22.B) would send it to the venue, and the
    // venue straight back here.
    if (!r && room.isFetching) {
      return (
        <Screen>
          <ActivityIndicator className="mt-16" color={colors.muted} />
        </Screen>
      );
    }
    return <Redirect href="/venue" />;
  }
  if (!seat) {
    // A member is known once room_phones is read; a phone not in it goes back to the venue.
    return phones.isPending ? (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.muted} />
      </Screen>
    ) : (
      <Redirect href="/venue" />
    );
  }

  const side = seat.side;
  const isOwner = side === 'owner';
  // Room-level events count once, from the owner side's leader.
  const reportsRoom = isOwner && seat.leader;
  const mySide = sideHeadcount(
    isOwner ? r.owner_headcount : (r.guest_headcount ?? 0),
    isOwner ? r.owner_phones : (r.guest_phones ?? 0),
  );
  const roomHeadcount =
    sideHeadcount(r.owner_headcount, r.owner_phones) +
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
  const title = r.guest_alias && otherAlias ? tr.rooms.withOther(otherAlias) : r.owner_alias;
  const myAlias = table.data?.alias ?? r.owner_alias;
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
      aliases={hasOtherTable && otherAlias ? [myAlias, otherAlias] : [r.owner_alias]}
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
      leaderAlias={(isOwner ? r.owner_alias : r.guest_alias) ?? r.owner_alias}
      sidePhones={(isOwner ? r.owner_phones : r.guest_phones) ?? 1}
      roomPhones={r.owner_phones + (r.guest_phones ?? 0)}
      aliasOf={(s) => roomPhones.find((p) => p.sessionId === s)?.alias}
      aliases={{ owner: r.owner_alias, guest: r.guest_alias ?? '' }}
      headcount={mySide}
      roomHeadcount={roomHeadcount}
      localGame={localGame}
      onLocalGame={setLocalGame}
    />
  );

  if (r.status === 'ending' && r.reveal_ends_at) {
    // A table left (or ended the room) while Tabu ran: the game was stopped (§19.1).
    const stopped = parseGameState(r.game_state);
    if (stopped?.concept === 'tabu' && stopped.phase === 'playing') {
      trackOnce(`game_abandoned:${r.id}:${stopped.gameNo}`, 'game_abandoned', {
        concept: 'tabu',
        turn_no: stopped.turnNo,
        total_turns: stopped.totalTurns,
      });
    }
    return (
      <Reveal
        roomId={r.id}
        sessionId={sessionId}
        revealEndsAt={r.reveal_ends_at}
        prompt={
          <Screen>
            <ScreenHeader
              eyebrow={tr.rooms.roomEyebrow(concept)}
              title={
                r.guest_alias ? tr.rooms.withGuest(r.owner_alias, r.guest_alias) : r.owner_alias
              }
            />
            <RevealPrompt roomId={r.id} revealEndsAt={r.reveal_ends_at} score={null} />
          </Screen>
        }
      />
    );
  }

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

  return (
    <ChatScreen
      top={topBar(hasOtherTable ? tr.rooms.phones(otherPhones) : tr.rooms.roomEyebrow(concept))}
      composer={<RoomComposer chat={chat} />}
      newestKey={newest.key}
      newestMine={newest.mine}
      // At the newest message once there is one (CLAUDE.md → Ekran davranışı); an empty room opens
      // on its games.
      startAtEnd={newest.key !== undefined}
    >
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
      {/* Over the games, not under them: below the grid it sat under the message bar. */}
      {r.status === 'waiting' && r.visibility === 'open' ? (
        <Card tone="note" className="mt-4" testID="room-waiting-note">
          <Text variant="fine">{tr.rooms.waitingForGuest}</Text>
        </Card>
      ) : null}
      <View className={r.status === 'waiting' && r.visibility === 'open' ? 'mt-1' : 'mt-4'}>
        {gameArea}
      </View>
      {hasOtherTable ? <OtherTableStatus roomId={r.id} isOwner={isOwner} /> : null}

      <RoomMessages chat={chat} sessionId={sessionId} profiles={profiles} />
    </ChatScreen>
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
