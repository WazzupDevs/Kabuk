import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readPregame, TEAM_MIN_PLAYERS } from '@shared/gameFrame.ts';
import {
  describerOf,
  readTabuResult,
  readTabuState,
  TABU_GAME,
  type TabuMark,
  type TabuResult,
  type TabuState,
  type TabuTeam,
  teamMembers,
  teamOfTurn,
} from '@shared/tabuGame.ts';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { Reveal } from '@/aura/Reveal';
import { confirmGameExit } from '@/features/games/gameExit';
import { StageFit } from '@/features/games/GameStage';
import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi, tabuApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { MOTION } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import {
  KINSHI as K,
  KINSHI_TYPE as KT,
  kinshiScene,
  PEEK_PAIRS,
  SUMMARY_BUDDIES,
} from '@/theme/kinshi';
import { LOBBY } from '@/theme/lobby';
import { DarkGameScope } from '@/theme/ThemeProvider';
import { useAdvanceClock } from '@/features/games/useAdvanceClock';

import {
  GameLobby,
  LobbyCard,
  type LobbyPerson,
  LobbyPeople,
  LobbyTeam,
  LobbyTeams,
  LobbyWatchers,
} from '../GameLobby';
import { kinshiArt, type KinshiTimer } from './kinshiArt';
import {
  Buddy,
  Buzzer,
  type CardFace,
  Deck,
  Face,
  type Faces,
  FaceStack,
  MarkTag,
  nameOf,
  PlayedRow,
  Pop,
  Stats,
  teamKey,
  TeamTag,
  TimeStrip,
  TopBar,
  useKinshiDeck,
  useTeamTone,
} from './KinshiParts';
import {
  CountTags,
  EndHeading,
  EndRow,
  EndSection,
  PlayBar,
  PlayTimer,
  ScoreChip,
  ScoreChips,
  WordCard,
  type WordFace,
} from './KinshiBoard';
import { KINSHI_PLAY as P } from '@/theme/kinshiPlay';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Kinshi the table shows now: its Takımlar page, the running game, or the end of the last
// one (until the person goes back to the table). Null: none of them.
export type KinshiMode = 'pregame' | 'play' | 'end' | null;

function lastTabu(state: unknown): TabuResult | null {
  if (typeof state !== 'object' || state === null || !('lastGame' in state)) return null;
  const last = (state as { lastGame: unknown }).lastGame;
  if (typeof last !== 'object' || last === null) return null;
  const l = last as { concept?: unknown; abandoned?: unknown };
  if (l.concept !== 'tabu' || l.abandoned === true) return null;
  return readTabuResult(last);
}

export function kinshiMode(room: Room): KinshiMode {
  if (room.concept === 'tabu' && readTabuState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'tabu') return 'pregame';
  if (lastTabu(room.game_state)) return 'end';
  return null;
}

// A role in the running turn (docs/SPEC_V4.md §4.F "Adım 4.6.1"): the describer, their team's
// guessers, the other team's rivals, the watchers; one who left the game sees what a guesser sees.
type Role = 'describer' | 'guesser' | 'rival' | 'watcher' | 'out';

function roleOf(state: TabuState, me: string): Role {
  if (state.gone.includes(me)) return 'out';
  if (state.describer === me) return 'describer';
  const mine: TabuTeam | null = state.teams.a.includes(me)
    ? 'a'
    : state.teams.b.includes(me)
      ? 'b'
      : null;
  if (!mine) return 'watcher';
  return mine === teamOfTurn(state.turnNo) ? 'guesser' : 'rival';
}

// Kinshi at the table (Aura v85, "Kinshi (tabu düzeni)"): Takımlar, the turns and the end. It
// opens in the dark (the canvas's pure black, flat #121614 glass), the light when the person chose
// it. A watcher or someone out of it may go back to the table (`onHide`).
export function KinshiGame({
  room,
  me,
  people,
  profiles,
  onHide,
}: {
  room: Room;
  me: string;
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  onHide: () => void;
}) {
  return (
    <DarkGameScope>
      <KinshiScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function KinshiScreens({
  room,
  me,
  people,
  profiles,
  onHide,
}: {
  room: Room;
  me: string;
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  onHide: () => void;
}) {
  const owner = room.owner_session_id === me;
  const faces = useMemo<Faces>(
    () => ({ me, people: new Map(people.map((p) => [p.sessionId, p])), profiles }),
    [me, people, profiles],
  );
  const mode = kinshiMode(room);
  const queryClient = useQueryClient();
  const reread = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(room.id) });
  };
  const endGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.endGame(room.id),
    onSettled: reread,
  });
  const leaveGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leaveGame(room.id),
    onSuccess: () => {
      onHide();
    },
    onSettled: reread,
  });
  const chat = () => router.push({ pathname: '/room-chat/[id]', params: { id: room.id } });

  if (mode === 'pregame') {
    return (
      <Teams
        roomId={room.id}
        state={room.game_state}
        faces={faces}
        owner={owner}
        onClose={() => (owner ? endGame.mutate() : onHide())}
        closing={endGame.isPending}
        closeError={endGame.error}
        onChat={chat}
      />
    );
  }
  if (mode === 'end') {
    const result = lastTabu(room.game_state);
    if (!result) return null;
    return (
      <End
        roomId={room.id}
        result={result}
        faces={faces}
        owner={owner}
        onBack={onHide}
        onChat={chat}
      />
    );
  }
  const state = readTabuState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = state.seats.includes(me) && !state.gone.includes(me);
  const sheet = owner
    ? { title: tr.kinshi.endTitle, body: tr.kinshi.endBody, confirm: tr.kinshi.endGame }
    : playing
      ? { title: tr.kinshi.leaveTitle, body: tr.kinshi.leaveBody, confirm: tr.kinshi.exit }
      : {
          title: tr.kinshi.watchTitle,
          body: tr.kinshi.watchBody,
          confirm: tr.kinshi.backToTable,
        };
  const exitGame = () =>
    confirmGameExit({
      copy: sheet,
      danger: owner || playing,
      testID: 'kinshi-exit-confirm',
      run: () => (owner ? endGame.mutateAsync() : playing ? leaveGame.mutateAsync() : onHide()),
    });
  return (
    <View style={{ flex: 1 }}>
      <Play
        roomId={room.id}
        state={state}
        faces={faces}
        owner={owner}
        onExit={exitGame}
        onChat={chat}
      />
    </View>
  );
}

// The page of every screen: the canvas's 20 sides, the top bar under the status bar, the foot
// over the navigation bar (34 from the panel's bottom).
function Page({
  children,
  testID,
  bottom = K.footBottom,
}: {
  children: ReactNode;
  testID: string;
  bottom?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + bottom,
          paddingHorizontal: KIT.size.side,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// The server's clock: when the phase's time is up any phone moves it on (tabu/advance,
// idempotent); while the phase stays, again every few seconds. Nothing on the screen counts here.
function useAdvance(roomId: string, state: TabuState) {
  useAdvanceClock(roomId, state.endsAt, state.step, () => tabuApi.advance(roomId));
}

// The running turn's card list, only on the phones that may see it (rule 3: the describer, the
// other team, the watchers); kept for the turn.
function useTurnCards(roomId: string, state: TabuState, enabled: boolean) {
  return useQuery({
    queryKey: ['tabu-cards', roomId, state.gameNo, state.turnNo],
    queryFn: () => tabuApi.turnCards(roomId),
    enabled,
    staleTime: Infinity,
  });
}

function Play({
  roomId,
  state,
  faces,
  owner,
  onExit,
  onChat,
}: {
  roomId: string;
  state: TabuState;
  faces: Faces;
  owner: boolean;
  onExit: () => void;
  onChat: () => void;
}) {
  useAdvance(roomId, state);
  // The turn's time running out is felt once, on every phone (hapticMoments → timeUp).
  const wasTurn = useRef(state.phase === 'turn');
  useEffect(() => {
    if (wasTurn.current && state.phase === 'summary') haptic('timeUp');
    wasTurn.current = state.phase === 'turn';
  }, [state.phase]);

  const startsAt = state.startsAt ? Date.parse(state.startsAt) : 0;
  const toStart = useSecondsLeft(startsAt);
  const close = {
    label: owner ? tr.kinshi.endGame : tr.kinshi.exit,
    onPress: onExit,
    testID: 'kinshi-exit',
  };
  const top = (
    <TopBar
      close={close}
      score={{
        a: state.scores.a,
        b: state.scores.b,
        turn: tr.games.turn(state.turnNo, state.totalTurns),
      }}
      onChat={onChat}
    />
  );
  if (state.phase === 'summary') {
    return <Summary roomId={roomId} state={state} faces={faces} owner={owner} top={top} />;
  }
  if (state.phase === 'turn' && toStart > 0) {
    return <Countdown state={state} faces={faces} left={toStart} top={top} />;
  }
  return (
    <CardScreen
      roomId={roomId}
      state={state}
      faces={faces}
      top={top}
      close={close}
      onChat={onChat}
    />
  );
}

// The card screens (KinshiTurOncesi, KinshiBekle, Kinshi, KinshiTahminci, KinshiRakip,
// KinshiGozlemci): the top bar, the time strip, the deck with its buddies, the counters and each
// role's action.
function CardScreen({
  roomId,
  state,
  faces,
  top,
  close,
  onChat,
}: {
  roomId: string;
  state: TabuState;
  faces: Faces;
  top: ReactNode;
  close: { label: string; onPress: () => void; testID?: string };
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const me = faces.me;
  const role = roleOf(state, me);
  const ready = state.phase === 'ready';
  const team = teamOfTurn(state.turnNo);
  const describer = state.describer;
  const describerName = describer ? nameOf(faces, describer) : tr.kinshi.left;
  const seesCard = !ready && (role === 'describer' || role === 'rival' || role === 'watcher');
  const cards = useTurnCards(roomId, state, seesCard);
  const left = useSecondsLeft(Date.parse(state.endsAt));
  const late = !ready && left <= K.lowSeconds;
  const stage: KinshiTimer = ready ? 'full' : late ? 'low' : 'half';
  const clock = ready ? String(left) : tr.games.clock(left);

  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const begin = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => tabuApi.beginTurn(roomId, state.step),
    onSettled: reread,
  });
  const mark = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (result: TabuMark) => tabuApi.mark(roomId, state.step, state.cardIndex, result),
    onSettled: reread,
  });
  const failed = begin.error ?? mark.error;

  const guessers = teamMembers(state.teams, state.gone, team).filter((s) => s !== describer);
  const title = ready
    ? role === 'describer'
      ? tr.kinshi.describing
      : tr.games.turnReadyWaiting(describerName)
    : role === 'describer'
      ? tr.kinshi.describing
      : role === 'guesser'
        ? tr.kinshi.guessing
        : role === 'rival'
          ? tr.kinshi.rival
          : tr.kinshi.watching;
  const line =
    role === 'describer' ? (
      <>
        <TeamTag team={team} />
        <FaceStack faces={faces} sids={guessers} />
        <T v="fine">{tr.kinshi.guessesNow}</T>
      </>
    ) : ready ? (
      <TeamTag team={team} />
    ) : role === 'watcher' || role === 'out' ? (
      <>
        {describer ? <Face faces={faces} sid={describer} /> : null}
        <T v="fine">{tr.kinshi.describesFor(describerName, tr.kinshi.team[team])}</T>
      </>
    ) : (
      <>
        {describer ? <Face faces={faces} sid={describer} /> : null}
        <T v="fine">{tr.kinshi.describes(describerName)}</T>
        <TeamTag team={team} />
      </>
    );

  const card = cards.data?.cards[state.cardIndex];
  const face: CardFace = !seesCard
    ? { kind: 'back' }
    : cards.isError
      ? { kind: 'error', message: errorMessage(cards.error) }
      : card
        ? { kind: 'front', card, key: `${state.turnNo}:${state.cardIndex}` }
        : { kind: 'loading' };
  const near = ready
    ? role === 'describer'
      ? PEEK_PAIRS.near
      : PEEK_PAIRS.far
    : role === 'rival'
      ? PEEK_PAIRS.far
      : PEEK_PAIRS.near;
  const rival = !ready && role === 'rival';
  const deck = useKinshiDeck();
  // The panel's measured bottom: on a narrow screen or in the largest text it can reach below the
  // card, and the counters then go under it rather than behind it.
  const [panelBottom, setPanelBottom] = useState(0);
  const panel =
    !ready && (role === 'guesser' || role === 'out') ? (
      <GuesserPanel state={state} onBottom={setPanelBottom} />
    ) : null;
  const passesLeft = Math.max(0, state.maxPasses - state.passesUsed);

  const foot =
    ready && role === 'describer' ? (
      <Btn
        block
        testID="kinshi-begin"
        icon="forward"
        label={tr.games.turnReadyStart}
        accessibilityLabel={tr.games.turnReadyStartLabel}
        loading={begin.isPending}
        onPress={() => begin.mutate()}
      />
    ) : !ready && role === 'describer' ? (
      <View style={{ flexDirection: 'row', gap: K.footGap }}>
        <Btn
          variant="glassy"
          tall
          testID="kinshi-pass"
          label={tr.kinshi.pass}
          accessibilityLabel={tr.kinshi.passLabel(passesLeft)}
          trail={<PassCount n={passesLeft} />}
          disabled={passesLeft === 0 || mark.isPending}
          loading={mark.isPending && mark.variables === 'pass'}
          onPress={() => mark.mutate('pass')}
          style={{ flex: 1 }}
        />
        <Btn
          tall
          testID="kinshi-correct"
          label={tr.kinshi.correct}
          disabled={mark.isPending && mark.variables !== 'correct'}
          loading={mark.isPending && mark.variables === 'correct'}
          onPress={() => mark.mutate('correct')}
          style={{ flex: 1 }}
        />
      </View>
    ) : rival ? (
      <Buzzer onPress={() => mark.mutate('taboo')} loading={mark.isPending} disabled={!card} />
    ) : null;

  if (!ready && role === 'describer') {
    // The describer's turn as the board draws it (KinshiAnlatici): the card is the describer's
    // alone here (rule 3, as before); the same turn's other roles keep the deck.
    const wordFace: WordFace = cards.isError
      ? { kind: 'error', message: errorMessage(cards.error) }
      : card
        ? { kind: 'front', card }
        : { kind: 'loading' };
    return (
      <Page testID="kinshi-describer">
        <StageFit
          status={
            <>
              <PlayBar
                close={close}
                title={tr.kinshi.describing}
                line={tr.kinshi.turnLine(
                  tr.games.turn(state.turnNo, state.totalTurns),
                  tr.kinshi.team[team],
                )}
                timer={<PlayTimer clock={clock} label={tr.games.clockLabel(left)} late={late} />}
                onChat={onChat}
              />
              <ScoreChips a={state.scores.a} b={state.scores.b} />
            </>
          }
          actions={
            <>
              {failed ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(failed)}
                </T>
              ) : null}
              {foot}
            </>
          }
        >
          <WordCard key={`${state.turnNo}:${state.cardIndex}`} face={wordFace} />
          <CountTags counts={state.counts} />
        </StageFit>
      </Page>
    );
  }

  return (
    <Page
      testID={`kinshi-${ready ? 'ready' : role}`}
      bottom={rival ? K.buzzer.bottom : K.footBottom}
    >
      <StageFit
        status={
          <>
            {top}
            <TimeStrip
              stage={stage}
              clock={clock}
              clockLabel={tr.games.clockLabel(left)}
              late={late}
              title={title}
              line={line}
            />
          </>
        }
        actions={
          foot || failed || ready ? (
            <>
              {failed ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(failed)}
                </T>
              ) : null}
              {ready ? (
                <T v="fine" center>
                  {role === 'describer'
                    ? tr.games.turnReadySeconds(left)
                    : tr.games.turnReadyWaitingHint}
                </T>
              ) : null}
              {foot}
            </>
          ) : undefined
        }
      >
        <Deck face={face} peek={near} reach={panel ? panelBottom : 0}>
          {panel}
        </Deck>
        {!ready ? (
          <View
            style={{ marginTop: (rival ? K.statsBelowRival : K.statsBelow) - deck.shadow.below }}
          >
            <Stats counts={state.counts} />
          </View>
        ) : null}
      </StageFit>
    </Page>
  );
}

// The count after "Pas" (`.btn .n`: "· 2" at 70 %).
function PassCount({ n }: { n: number }) {
  const { c } = useKit();
  return (
    <Text maxFontSizeMultiplier={1.3} style={[KIT_TYPE.btn, { color: c.ink, opacity: PASS_DIM }]}>
      {tr.kinshi.passLeft(n)}
    </Text>
  );
}
const PASS_DIM = 0.7;

// The guesser's glass panel over the card's back (KinshiTahminci): the turn's Doğru, "Cevabı
// yüksek sesle söyle." and the last three closed cards with their marks.
function GuesserPanel({
  state,
  onBottom,
}: {
  state: TabuState;
  onBottom: (bottom: number) => void;
}) {
  const last = state.words.slice(-LAST_WORDS).reverse();
  const d = useKinshiDeck();
  return (
    <View
      onLayout={(e) => onBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      style={{
        position: 'absolute',
        top: d.peek.above + d.panel.top,
        left: (d.card.width - d.panel.width) / 2,
        width: d.panel.width,
      }}
    >
      <Glass
        radius={K.panel.radius}
        style={{
          paddingTop: K.panel.padTop,
          paddingHorizontal: K.panel.padX,
          paddingBottom: K.panel.padBottom,
          alignItems: 'stretch',
        }}
      >
        <HeroCount n={state.counts.correct} />
        <T v="h3" center>
          {tr.kinshi.correctWord}
        </T>
        <T v="fine" center style={{ marginTop: 4, marginBottom: 10 }}>
          {tr.kinshi.sayIt}
        </T>
        {last.map((w, i) => (
          <PlayedRow
            key={`${state.words.length - i}`}
            word={w.word}
            mark={w.result}
            first={i === 0}
          />
        ))}
      </Glass>
    </View>
  );
}
const LAST_WORDS = 3;

function HeroCount({ n }: { n: number }) {
  const { c } = useKit();
  return (
    <Text maxFontSizeMultiplier={1} style={[KT.hero, { color: c.ink, textAlign: 'center' }]}>
      {n}
    </Text>
  );
}

// The 3-2-1 (KinshiGeriSayim): a 220 glass round with the number popping in, who describes for
// which team under it, three buddies at the foot.
function Countdown({
  state,
  faces,
  left,
  top,
}: {
  state: TabuState;
  faces: Faces;
  left: number;
  top: ReactNode;
}) {
  const { c } = useKit();
  const team = teamOfTurn(state.turnNo);
  const d = state.describer;
  const B = kinshiScene(useWindowDimensions().width).countdownBuddies;
  return (
    <View testID="kinshi-countdown" style={{ flex: 1 }}>
      <Page testID="kinshi-countdown-page">
        {top}
        <View style={{ alignItems: 'center', marginTop: K.countdown.top - K.barBottom }}>
          <Glass
            radius={K.countdown.size / 2}
            style={{
              width: K.countdown.size,
              height: K.countdown.size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pop key={left}>
              <Text
                accessibilityRole="timer"
                accessibilityLabel={String(left)}
                maxFontSizeMultiplier={1}
                style={[KT.big, { color: c.ink }]}
              >
                {left}
              </Text>
            </Pop>
          </Glass>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: K.countdown.lineGap,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {d ? <Face faces={faces} sid={d} /> : null}
            <T v="h3">{tr.kinshi.describes(d ? nameOf(faces, d) : tr.kinshi.left)}</T>
            <TeamTag team={team} />
          </View>
        </View>
      </Page>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: B.height }}
      >
        {B.places.map((p) => (
          <Buddy
            key={p.buddy}
            buddy={p.buddy}
            height={p.height}
            style={{
              top: p.top,
              ...('left' in p ? { left: p.left } : { right: p.right }),
            }}
          />
        ))}
      </View>
    </View>
  );
}

// Tur sonu (KinshiTurSonu): "Süre bitti", the team and what it scored, the turn's cards with their
// marks (one after another, 60 ms apart), two buddies, who is next, the owner's "Sonraki tura geç"
// with the 30 seconds counting down. After the last turn there is no next: the owner ends it.
function Summary({
  roomId,
  state,
  faces,
  owner,
  top,
}: {
  roomId: string;
  state: TabuState;
  faces: Faces;
  owner: boolean;
  top: ReactNode;
}) {
  const queryClient = useQueryClient();
  const left = useSecondsLeft(Date.parse(state.endsAt));
  const turn = state.lastTurn;
  const last = state.turnNo >= state.totalTurns;
  const nextTeam = teamOfTurn(state.turnNo + 1);
  const nextDescriber = describerOf(state.teams, state.gone, state.turnNo + 1);
  const nextTone = useTeamTone(nextTeam);
  const next = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => tabuApi.next(roomId, state.step),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const score = turn?.score ?? 0;
  return (
    <Page testID="kinshi-summary">
      <StageFit
        status={
          <>
            {top}
            <View style={{ alignItems: 'center', gap: 8 }}>
              <T v="display" center>
                {tr.kinshi.timeUp}
              </T>
              {turn ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TeamTag team={turn.team} />
                  <MarkTag
                    mark={score < 0 ? 'taboo' : 'correct'}
                    label={score < 0 ? tr.games.scoreDown(-score) : tr.games.scoreUp(score)}
                  />
                </View>
              ) : null}
            </View>
          </>
        }
        actions={
          <>
            {!last ? (
              <Glass
                radius={K.box.radius}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                {nextDescriber ? <Face faces={faces} sid={nextDescriber} /> : null}
                <Text style={{ flex: 1 }} maxFontSizeMultiplier={1.3}>
                  <T v="fine" ink>
                    {tr.kinshi.next}
                  </T>
                  <T v="fine" strong color={nextTone.tagInk}>
                    {tr.kinshi.team[nextTeam]}
                  </T>
                  <T v="fine" ink>
                    {tr.kinshi.nextDescribes(
                      nextDescriber ? nameOf(faces, nextDescriber) : tr.kinshi.left,
                    )}
                  </T>
                </Text>
              </Glass>
            ) : null}
            {next.error ? (
              <T v="fine" color={KIT.danger} center>
                {errorMessage(next.error)}
              </T>
            ) : null}
            {owner ? (
              <Btn
                block
                testID="kinshi-next"
                label={last ? tr.kinshi.endGame : tr.kinshi.nextTurn}
                loading={next.isPending}
                onPress={() => next.mutate()}
                trail={
                  <View
                    accessible
                    accessibilityRole="timer"
                    accessibilityLabel={tr.games.clockLabel(left)}
                    style={{
                      minWidth: K.countPill.size,
                      height: K.countPill.size,
                      paddingHorizontal: K.countPill.padX,
                      borderRadius: K.countPill.size / 2,
                      backgroundColor: K.countPill.fill,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text maxFontSizeMultiplier={1} style={[KT.count, { color: KIT.onPrimary }]}>
                      {left}
                    </Text>
                  </View>
                }
              />
            ) : (
              <ReadOnlyCount left={left} />
            )}
          </>
        }
      >
        {turn && turn.words.length > 0 ? (
          <Glass radius={K.box.radius} style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {turn.words.map((w, i) => (
              <Reveal key={`${i}-${w.word}`} index={i} step={MOTION.stagger.row}>
                <PlayedRow word={w.word} mark={w.result} first={i === 0} />
              </Reveal>
            ))}
          </Glass>
        ) : null}
        <View style={{ flexGrow: 1, minHeight: K.summary.minBuddies }}>
          <Buddy
            buddy={SUMMARY_BUDDIES[0]}
            height={K.summary.buddies}
            style={{ left: K.summary.buddySide, bottom: -K.summary.buddyBelow }}
          />
          <Buddy
            buddy={SUMMARY_BUDDIES[1]}
            height={K.summary.buddies}
            style={{ right: K.summary.buddySide, bottom: -K.summary.buddyBelow }}
          />
        </View>
      </StageFit>
    </Page>
  );
}

// The others' Tur sonu (KinshiTurSonuDiger): in place of the owner's button, the seconds left in
// a glass pill at the middle; it cannot be pressed.
function ReadOnlyCount({ left }: { left: number }) {
  const { c } = useKit();
  return (
    <View style={{ alignSelf: 'center' }}>
      <Glass
        radius={K.readOnlyCount.size / 2}
        style={{
          minWidth: K.readOnlyCount.size,
          height: K.readOnlyCount.size,
          paddingHorizontal: K.readOnlyCount.padX,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          testID="kinshi-next-count"
          accessibilityRole="timer"
          accessibilityLabel={tr.games.turnReadySeconds(left)}
          maxFontSizeMultiplier={1}
          style={[KT.readOnlyCount, { color: c.ink }]}
        >
          {left}
        </Text>
      </Glass>
    </View>
  );
}

// Takımlar (KinshiTakimlar, KinshiTakimlarAcik): the poster, the rules, Mor and Pembe with their
// people and "Katıl", the watchers with "Gözlemci ol", those yet to choose; the warning in its own
// line over the buttons; the owner's Karıştır and Oyunu başlat (off, without its icon, until each
// team has two).
function Teams({
  roomId,
  state,
  faces,
  owner,
  onClose,
  closing,
  closeError,
  onChat,
}: {
  roomId: string;
  state: unknown;
  faces: Faces;
  owner: boolean;
  onClose: () => void;
  closing: boolean;
  closeError: unknown;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const picks = readPregame(state)?.picks ?? {};
  const everyone = [...faces.people.keys()];
  const of = (p: 'a' | 'b' | 'obs') => everyone.filter((s) => picks[s] === p);
  const a = of('a');
  const b = of('b');
  const watchers = of('obs');
  const unpicked = everyone.filter((s) => !picks[s]);
  const mine = picks[faces.me] ?? null;
  const enough =
    a.length >= TEAM_MIN_PLAYERS &&
    b.length >= TEAM_MIN_PLAYERS &&
    a.length + b.length >= TABU_GAME.minPlayers;
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (p: 'a' | 'b' | 'obs' | null) => roomsApi.pick(roomId, p),
    onSettled: reread,
  });
  const shuffle = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => tabuApi.shuffle(roomId),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => tabuApi.start(roomId),
    onSettled: reread,
  });
  const failed = pick.error ?? shuffle.error ?? start.error ?? closeError;
  const busy = pick.isPending;
  const person = (s: string): LobbyPerson => ({
    key: s,
    face: <Face faces={faces} sid={s} size={LOBBY.people.smallFace} />,
    name: nameOf(faces, s),
    me: s === faces.me,
    owner: faces.people.get(s)?.owner,
  });
  const teamBox = (team: 'a' | 'b', sids: string[]) => (
    <LobbyTeam
      key={team}
      team={teamKey(team)}
      title={tr.kinshi.team[team]}
      count={String(sids.length)}
      joined={mine === team}
      join={{
        label: tr.kinshi.join,
        testID: `kinshi-join-${team}`,
        loading: pick.isPending && pick.variables === team,
        disabled: busy,
        onPress: () => pick.mutate(team),
      }}
    >
      <LobbyPeople people={sids.map(person)} single small />
    </LobbyTeam>
  );
  return (
    <GameLobby
      testID="kinshi-teams"
      game="tabu"
      poster={kinshiArt.poster}
      name={tr.kinshi.name}
      close={{
        label: owner ? tr.kinshi.endGame : tr.kinshi.backToTable,
        onPress: onClose,
        loading: closing,
        testID: 'kinshi-teams-close',
      }}
      onChat={onChat}
      chips={tr.kinshi.rules}
      foot={{
        owner,
        warning: enough ? null : tr.kinshi.needs(TEAM_MIN_PLAYERS),
        error: failed,
        start: {
          label: tr.kinshi.start,
          testID: 'kinshi-start',
          loading: start.isPending,
          busy: shuffle.isPending,
          onPress: () => start.mutate(),
        },
      }}
    >
      <LobbyTeams
        right={
          owner ? (
            <Btn
              sm
              variant="glassy"
              icon="shuffle"
              testID="kinshi-shuffle"
              label={tr.kinshi.shuffle}
              loading={shuffle.isPending}
              disabled={start.isPending}
              onPress={() => shuffle.mutate()}
            />
          ) : null
        }
      >
        {teamBox('a', a)}
        {teamBox('b', b)}
      </LobbyTeams>
      {unpicked.length > 0 ? (
        <LobbyCard
          title={tr.kinshi.unpicked}
          count={tr.kinshi.count(unpicked.length)}
          note={tr.kinshi.unpickedNote}
        >
          <LobbyPeople people={unpicked.map(person)} small />
        </LobbyCard>
      ) : null}
      <LobbyWatchers
        note={tr.kinshi.watchersNote}
        watching={false}
        disabled={busy || mine === 'obs'}
        loading={pick.isPending && pick.variables === 'obs'}
        onPress={() => pick.mutate('obs')}
        testID="kinshi-watch"
        people={watchers.map(person)}
      />
    </GameLobby>
  );
}

// Oyun sonu (KinshiSonuc): the bar ("Oyun bitti · 6 tur bitti"), the winner and the score, each
// team's score, "Öne çıkanlar" (the top describer and the taboo hunter), Masaya dön and the
// owner's Yeniden oyna.
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  result: TabuResult;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'tabu', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const turns = result.lastTurn?.turnNo ?? TABU_GAME.totalTurns;
  const w = result.winner;
  const awards = [
    result.topDescriber
      ? {
          award: result.topDescriber,
          label: tr.kinshi.topDescriber,
          count: tr.kinshi.wordsCount(result.topDescriber.count),
        }
      : null,
    result.tabooHunter
      ? {
          award: result.tabooHunter,
          label: tr.kinshi.tabooHunter,
          count: tr.kinshi.tabooCount(result.tabooHunter.count),
        }
      : null,
  ].filter((x) => x !== null);
  return (
    <Page testID="kinshi-end">
      <PlayBar
        close={{ label: tr.kinshi.exit, onPress: onBack, testID: 'kinshi-end-close' }}
        title={tr.kinshi.overTurns(turns)}
        line={tr.kinshi.name}
        onChat={onChat}
      />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, gap: P.end.gap, paddingTop: P.stage.top - P.bar.top }}
      >
        <EndHeading
          title={w ? tr.kinshi.won(tr.kinshi.team[w]) : tr.kinshi.draw}
          line={tr.kinshi.scoreLine(result.scores.a, result.scores.b)}
        />
        <View style={{ flexDirection: 'row', gap: P.score.between }}>
          <ScoreChip team="a" score={result.scores.a} />
          <ScoreChip team="b" score={result.scores.b} />
        </View>
        {awards.length > 0 ? (
          <View>
            <EndSection title={tr.kinshi.highlights} />
            {awards.map((x, i) => (
              <EndRow
                key={x.label}
                first={i === 0}
                face={<Face faces={faces} sid={x.award.sid} size={P.end.face} />}
                name={nameOf(faces, x.award.sid)}
                line={tr.kinshi.awardLine(x.label, x.count)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={{ gap: P.foot.gap }}>
        {again.error ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(again.error)}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: P.foot.gap }}>
          <Btn
            variant="glassy"
            tall
            testID="kinshi-back"
            label={tr.kinshi.backToTable}
            onPress={onBack}
            style={{ flex: 1 }}
          />
          {owner ? (
            <Btn
              tall
              testID="kinshi-again"
              label={tr.kinshi.again}
              loading={again.isPending}
              onPress={() => again.mutate()}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </View>
    </Page>
  );
}
