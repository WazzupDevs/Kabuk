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
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, T, useKit } from '@/aura/kit';
import { Reveal } from '@/aura/Reveal';
import { Sheet } from '@/components/Sheet';
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
import { KINSHI as K, KINSHI_TYPE as KT, PEEK_PAIRS, SUMMARY_BUDDIES } from '@/theme/kinshi';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

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
  TeamBar,
  TeamTag,
  TimeStrip,
  TopBar,
  useKinshiDeck,
  useTeamTone,
} from './KinshiParts';

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
  const [exit, setExit] = useState(false);
  const queryClient = useQueryClient();
  const reread = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(room.id) });
  };
  const endGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.endGame(room.id),
    onSuccess: () => setExit(false),
    onSettled: reread,
  });
  const leaveGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leaveGame(room.id),
    onSuccess: () => {
      setExit(false);
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
  const pending = endGame.isPending || leaveGame.isPending;
  return (
    <View style={{ flex: 1 }}>
      <Play
        roomId={room.id}
        state={state}
        faces={faces}
        owner={owner}
        onExit={() => setExit(true)}
        onChat={chat}
      />
      <Sheet
        visible={exit}
        onClose={() => (pending ? undefined : setExit(false))}
        title={sheet.title}
      >
        <T v="fine">{sheet.body}</T>
        {(endGame.error ?? leaveGame.error) ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(endGame.error ?? leaveGame.error)}
          </T>
        ) : null}
        <Btn
          block
          variant={owner || playing ? 'danger' : 'primary'}
          icon="logout"
          testID="kinshi-exit-confirm"
          label={sheet.confirm}
          loading={pending}
          onPress={() =>
            owner ? endGame.mutate() : playing ? leaveGame.mutate() : (setExit(false), onHide())
          }
        />
        <Btn
          block
          variant="glassy"
          label={tr.common.cancel}
          disabled={pending}
          onPress={() => setExit(false)}
        />
        <View style={{ height: SPACING[1] }} />
      </Sheet>
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
  const queryClient = useQueryClient();
  useEffect(() => {
    const ask = () =>
      void tabuApi
        .advance(roomId)
        .catch(() => undefined)
        .finally(() => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }));
    let again: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(
      () => {
        ask();
        again = setInterval(ask, ADVANCE_AGAIN_MS);
      },
      Math.max(0, Date.parse(state.endsAt) - Date.now()),
    );
    return () => {
      clearTimeout(first);
      clearInterval(again);
    };
  }, [roomId, state.step, state.endsAt, queryClient]);
}
const ADVANCE_AGAIN_MS = 2500;

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
  const top = (
    <TopBar
      close={{
        label: owner ? tr.kinshi.endGame : tr.kinshi.exit,
        onPress: onExit,
        testID: 'kinshi-exit',
      }}
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
  return <CardScreen roomId={roomId} state={state} faces={faces} top={top} />;
}

// The card screens (KinshiTurOncesi, KinshiBekle, Kinshi, KinshiTahminci, KinshiRakip,
// KinshiGozlemci): the top bar, the time strip, the deck with its buddies, the counters and each
// role's action.
function CardScreen({
  roomId,
  state,
  faces,
  top,
}: {
  roomId: string;
  state: TabuState;
  faces: Faces;
  top: ReactNode;
}) {
  const { colors } = useTheme();
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
          icon="forward"
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
          icon="check"
          testID="kinshi-correct"
          label={tr.kinshi.correct}
          fill={colors.signal}
          tint={colors.onSignal}
          disabled={mark.isPending && mark.variables !== 'correct'}
          loading={mark.isPending && mark.variables === 'correct'}
          onPress={() => mark.mutate('correct')}
          style={{ flex: 1 }}
        />
      </View>
    ) : rival ? (
      <Buzzer onPress={() => mark.mutate('taboo')} loading={mark.isPending} disabled={!card} />
    ) : null;

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
  const B = K.countdownBuddies;
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
  const { colors } = useTheme();
  const { c } = useKit();
  const insets = useSafeAreaInsets();
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
  const people = (sids: string[]) =>
    sids.length > 0 ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {sids.map((s) => (
          <View
            key={s}
            style={{
              height: K.person.height,
              paddingLeft: K.person.padLeft,
              paddingRight: K.person.padRight,
              borderRadius: K.person.height / 2,
              backgroundColor: c.raised,
              borderWidth: KIT.size.edge,
              borderColor: s === faces.me ? colors.accent : c.raisedEdge,
              flexDirection: 'row',
              alignItems: 'center',
              gap: K.person.gap,
            }}
          >
            <Face faces={faces} sid={s} size={K.person.face} />
            <T v="fine" strong ink>
              {nameOf(faces, s)}
            </T>
          </View>
        ))}
      </View>
    ) : null;
  const teamBox = (team: 'a' | 'b', sids: string[]) => (
    <TeamBox
      key={team}
      team={team}
      count={sids.length}
      joined={mine === team}
      loading={pick.isPending && pick.variables === team}
      disabled={busy}
      onJoin={() => pick.mutate(team)}
    >
      {people(sids)}
    </TeamBox>
  );
  return (
    <View testID="kinshi-teams" style={{ flex: 1 }}>
      <AuraBackground />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingHorizontal: KIT.size.side,
          paddingBottom: SPACING[2],
          gap: K.summary.gap,
        }}
      >
        <TopBar
          close={{
            label: owner ? tr.kinshi.endGame : tr.kinshi.backToTable,
            onPress: onClose,
            loading: closing,
            testID: 'kinshi-teams-close',
          }}
          score={null}
          onChat={onChat}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.poster.gap }}>
          <Image
            source={kinshiArt.poster}
            style={{
              width: K.poster.width,
              height: K.poster.height,
              borderRadius: K.poster.radius,
            }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1 }}>
            <T v="title">{tr.kinshi.name}</T>
            <T v="fine">{tr.kinshi.pickTeam}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tr.kinshi.rules.map((r) => (
            <Chip key={r} label={r} />
          ))}
        </View>
        {teamBox('a', a)}
        {teamBox('b', b)}
        <Glass radius={K.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.box.gap }}>
            <CapIcon name="eye" color={c.ink} />
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.kinshi.watchers}</T>
              <T v="fine">{tr.kinshi.watchersNote}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="kinshi-watch"
              label={tr.kinshi.watch}
              disabled={busy || mine === 'obs'}
              loading={pick.isPending && pick.variables === 'obs'}
              onPress={() => pick.mutate('obs')}
            />
          </View>
          {people(watchers)}
        </Glass>
        {unpicked.length > 0 ? (
          <Glass radius={K.box.radius} style={boxStyle}>
            <View>
              <T v="h3">{tr.kinshi.unpicked}</T>
              <T v="fine">{tr.kinshi.unpickedNote}</T>
            </View>
            {people(unpicked)}
          </Glass>
        ) : null}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: KIT.size.side,
          paddingTop: SPACING[2],
          paddingBottom: insets.bottom + K.footBottom,
          gap: K.summary.gap,
        }}
      >
        {failed ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(failed)}
          </T>
        ) : null}
        {!enough ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: K.warn.gap,
              paddingVertical: K.warn.padY,
              paddingHorizontal: K.warn.padX,
              borderRadius: K.warn.radius,
              backgroundColor: colors.warnSoft,
            }}
          >
            <CapIcon name="warn" color={colors.onWarnSoft} />
            <View style={{ flex: 1 }}>
              <T v="fine" strong color={colors.onWarnSoft}>
                {tr.kinshi.needs(TEAM_MIN_PLAYERS)}
              </T>
            </View>
          </View>
        ) : null}
        {owner ? (
          <View style={{ flexDirection: 'row', gap: K.footGap }}>
            <Btn
              variant="glassy"
              icon="shuffle"
              testID="kinshi-shuffle"
              label={tr.kinshi.shuffle}
              loading={shuffle.isPending}
              disabled={start.isPending}
              onPress={() => shuffle.mutate()}
              style={{ flex: 1 }}
            />
            <Btn
              testID="kinshi-start"
              label={tr.kinshi.start}
              disabled={!enough || shuffle.isPending}
              loading={start.isPending}
              onPress={() => start.mutate()}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <T v="fine" center>
            {tr.kinshi.hintGuest}
          </T>
        )}
      </View>
    </View>
  );
}
const boxStyle = {
  paddingVertical: K.box.padY,
  paddingHorizontal: K.box.padX,
  gap: K.box.gap,
} as const;

// A team's box: its bar, name and headcount, "Katıl" in the team's colour, its people.
function TeamBox({
  team,
  count,
  joined,
  loading,
  disabled,
  onJoin,
  children,
}: {
  team: 'a' | 'b';
  count: number;
  joined: boolean;
  loading: boolean;
  disabled: boolean;
  onJoin: () => void;
  children: ReactNode;
}) {
  const tone = useTeamTone(team);
  return (
    <Glass radius={K.box.radius} style={boxStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.box.gap }}>
        <TeamBar team={team} />
        <View style={{ flex: 1 }}>
          <T v="h3">{tr.kinshi.team[team]}</T>
        </View>
        <T v="fine">{tr.kinshi.count(count)}</T>
        <Btn
          sm
          testID={`kinshi-join-${team}`}
          label={tr.kinshi.join}
          fill={tone.fill}
          tint={tone.onFill}
          disabled={disabled || joined}
          loading={loading}
          onPress={onJoin}
        />
      </View>
      {children}
    </Glass>
  );
}

// Oyun sonu (KinshiOyunSonu): the scene (confetti bars and three buddies), "Oyun bitti", the
// winner, the score, "En çok bildiren anlatıcı" and "Yasak avcısı", Masaya dön and the owner's
// Yeniden oyna.
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
  const insets = useSafeAreaInsets();
  const { c } = useKit();
  const { colors } = useTheme();
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'tabu', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const S = K.endScene;
  const turns = result.lastTurn?.turnNo ?? TABU_GAME.totalTurns;
  const w = result.winner;
  const awards = [
    result.topDescriber
      ? { award: result.topDescriber, label: tr.kinshi.topDescriber, mark: 'correct' as const }
      : null,
    result.tabooHunter
      ? { award: result.tabooHunter, label: tr.kinshi.tabooHunter, mark: 'taboo' as const }
      : null,
  ].filter((x) => x !== null);
  return (
    <View testID="kinshi-end" style={{ flex: 1 }}>
      <AuraBackground />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: S.height - K.statusBar + insets.top,
          overflow: 'hidden',
          borderBottomLeftRadius: S.radius,
          borderBottomRightRadius: S.radius,
          backgroundColor: colors.surface,
        }}
      >
        {S.confetti.map((b, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: b.left,
              top: b.top - K.statusBar + insets.top,
              width: S.bar.width,
              height: S.bar.height,
              borderRadius: S.bar.radius,
              backgroundColor: b.color,
              transform: [{ rotate: b.turn }],
            }}
          />
        ))}
        {S.buddies.map((p) => (
          <Buddy
            key={p.buddy}
            buddy={p.buddy}
            height={p.height}
            style={{
              bottom: -p.below,
              ...('left' in p ? { left: p.left } : { right: p.right }),
            }}
          />
        ))}
      </View>
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingHorizontal: KIT.size.side,
          paddingBottom: insets.bottom + K.footBottom,
          gap: K.summary.gap,
        }}
      >
        <TopBar
          close={{ label: tr.kinshi.exit, onPress: onBack, testID: 'kinshi-end-close' }}
          score={null}
          onChat={onChat}
        />
        <View style={{ height: S.contentTop - K.barBottom - 2 * K.summary.gap }} />
        <View>
          <T v="fine" center>
            {tr.kinshi.overTurns(turns)}
          </T>
          <T v="display" center>
            {w ? tr.kinshi.won(tr.kinshi.team[w]) : tr.kinshi.draw}
          </T>
        </View>
        <Glass
          radius={K.box.radius}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: S.scoreGap,
            paddingVertical: 14,
            paddingHorizontal: 20,
          }}
        >
          <TeamTag team="a" short />
          <Text
            maxFontSizeMultiplier={1}
            style={[KT.endScore, { color: w === 'b' ? c.muted : c.ink }]}
          >
            {result.scores.a}
          </Text>
          <View style={{ width: 1, height: S.scoreRule, backgroundColor: c.hair }} />
          <Text
            maxFontSizeMultiplier={1}
            style={[KT.endScore, { color: w === 'a' ? c.muted : c.ink }]}
          >
            {result.scores.b}
          </Text>
          <TeamTag team="b" short />
        </Glass>
        {awards.length > 0 ? (
          <Glass radius={K.box.radius} style={{ paddingVertical: 4 }}>
            {awards.map((x, i) => (
              <View
                key={x.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: c.hair,
                }}
              >
                <Face faces={faces} sid={x.award.sid} size={KIT.size.av.md} />
                <View style={{ flex: 1 }}>
                  <T v="h3">{nameOf(faces, x.award.sid)}</T>
                  <T v="fine">{x.label}</T>
                </View>
                <MarkTag mark={x.mark} label={String(x.award.count)} />
              </View>
            ))}
          </Glass>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {again.error ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(again.error)}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: K.footGap }}>
          <Btn
            variant="glassy"
            testID="kinshi-back"
            label={tr.kinshi.backToTable}
            onPress={onBack}
            style={{ flex: 1 }}
          />
          {owner ? (
            <Btn
              testID="kinshi-again"
              label={tr.kinshi.again}
              loading={again.isPending}
              onPress={() => again.mutate()}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
