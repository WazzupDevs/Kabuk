import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TEAM_MIN_PLAYERS } from '@shared/gameFrame.ts';
import {
  otherTeam,
  SIGNUM as RULES,
  type SignumAnswer,
  type SignumKind,
  type SignumState,
  type SignumTeam,
  type SignumView,
} from '@shared/signum.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, T, Tag, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { StageFit } from '@/features/games/GameStage';
import {
  Buddy,
  Deck,
  Face,
  type Faces,
  nameOf,
  TeamBar,
  TeamTag,
  TimeStrip,
  useKinshiDeck,
  useTeamTone,
} from '@/features/games/kinshi/KinshiParts';
import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { useBroadcast } from '@/features/rooms/useBroadcast';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi, signumApi, tabuApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import {
  captainOf,
  endedByClock,
  guessersOf,
  lastSignum,
  newlyOpened,
  nextSeq,
  openedOf,
  pointersByTile,
  readSignumPage,
  readSignumState,
  seatOf,
  signumMode,
  teamTotal,
  tilesLeftOf,
  timerStage,
  uuidV4,
} from '@/lib/signumGame';
import { KIT } from '@/theme/auraKit';
import { KINSHI as K, kinshiScene } from '@/theme/kinshi';
import { SIGNUM as S, SIGNUM_PEEK_PAIRS as PEEK_PAIRS } from '@/theme/signum';
import { gradientStyle } from '@/theme/gradient';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { signumArt } from './signumArt';
import {
  BlackTag,
  Board,
  CluePanel,
  ClueInput,
  Eyebrow,
  KeyMini,
  PeekBoard,
  ReadyChip,
  RoleBack,
  RoleFront,
  SeatMark,
  TopBar,
} from './SignumParts';

export { signumMode };

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// Signum at the table (Aura v87, "Signum (kelime ızgarası ve kaptan)"; docs/SPEC_V4.md §4.F "Adım
// 4.6.7"): Takımlar with the captains, the role cards, the clues and guesses on the word board,
// and the end. It opens in the dark, as Kinshi; a watcher or someone out of it may go back to the
// table (`onHide`).
export function SignumGame({
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
      <SignumScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function SignumScreens({
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
  const faces: Faces = { me, people: new Map(people.map((p) => [p.sessionId, p])), profiles };
  const mode = signumMode(room);
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
    const over = lastSignum(room.game_state);
    if (!over) return null;
    return (
      <End
        roomId={room.id}
        state={over}
        faces={faces}
        owner={owner}
        onBack={onHide}
        onChat={chat}
      />
    );
  }
  const state = readSignumState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = !!seatOf(state, me);
  const sheet = owner
    ? { title: tr.kinshi.endTitle, body: tr.kinshi.endBody, confirm: tr.signum.endGame }
    : playing
      ? { title: tr.kinshi.leaveTitle, body: tr.kinshi.leaveBody, confirm: tr.signum.exit }
      : { title: tr.kinshi.watchTitle, body: tr.kinshi.watchBody, confirm: tr.signum.backToTable };
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
          testID="signum-exit-confirm"
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

// The page of every game screen (Kinshi's): the canvas's 20 sides, the top bar under the status
// bar, the foot 34 over the navigation bar; it rises with the keyboard (İpucu ver).
function Page({ children, testID }: { children: ReactNode; testID: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + K.footBottom,
            paddingHorizontal: KIT.size.side,
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const viewKey = (roomId: string, gameNo: number, step: number) =>
  ['signum-view', roomId, gameNo, step] as const;

// The caller's own view (signum/view, rule 3): a captain's key and their team's marks, a guesser's
// team marks and own seq, nothing for a watcher (who then never asks). Read again when the step
// moves and whenever the team's channel says its marks changed (game_team:{id}, data-free).
function useSignumView(roomId: string, state: SignumState, seated: boolean) {
  const queryClient = useQueryClient();
  const view = useQuery({
    queryKey: viewKey(roomId, state.gameNo, state.step),
    queryFn: () => signumApi.view(roomId),
    enabled: seated,
    placeholderData: keepPreviousData,
    select: (answer) => answer.view,
  });
  const channel = view.data && view.data.role !== 'observer' ? view.data.channel : null;
  useBroadcast(channel ? `game_team:${channel}` : null, 'points', () => {
    void queryClient.invalidateQueries({ queryKey: ['signum-view', roomId] });
  });
  return view;
}

// The server's clock: when the phase's time is up any phone moves it on (signum/advance,
// idempotent); while the phase stays, again every few seconds.
function useAdvance(roomId: string, state: SignumState) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!state.endsAt || state.phase === 'over') return undefined;
    const ask = () =>
      void signumApi
        .advance(roomId, state.step)
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
  }, [roomId, state.step, state.endsAt, state.phase, queryClient]);
}
const ADVANCE_AGAIN_MS = 2500;

// A game action's answer: the caller's new view goes into its place; the table is read again
// either way. `applied: false` (stale step, phase ran out, an older mark, busy) is not an error.
function useAnswer(roomId: string) {
  const queryClient = useQueryClient();
  return {
    onSuccess: (answer: SignumAnswer) => {
      queryClient.setQueryData(viewKey(roomId, answer.room.gameNo, answer.room.step), {
        room: answer.room,
        view: answer.view,
      });
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  };
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
  state: SignumState;
  faces: Faces;
  owner: boolean;
  onExit: () => void;
  onChat: () => void;
}) {
  const me = faces.me;
  const seat = seatOf(state, me);
  useAdvance(roomId, state);
  const view = useSignumView(roomId, state, !!seat);

  // A clue or guess whose time ran out is felt once on every phone (hapticMoments → timeUp).
  const was = useRef({ step: state.step, phase: state.phase, endsAt: state.endsAt });
  // The tile that opened last, kept for the step it opened in (Doğru, devam).
  const board = useRef(state.board);
  const [lastOpen, setLastOpen] = useState<{ tile: number; step: number } | null>(null);
  useEffect(() => {
    const prev = was.current;
    if (prev.step !== state.step) {
      if (
        (prev.phase === 'clue' || prev.phase === 'guess') &&
        endedByClock(prev.endsAt, Date.now())
      ) {
        haptic('timeUp');
      }
      const opened = newlyOpened(board.current, state.board);
      if (opened !== null) setLastOpen({ tile: opened, step: state.step });
    }
    was.current = { step: state.step, phase: state.phase, endsAt: state.endsAt };
    board.current = state.board;
  }, [state.step, state.phase, state.endsAt, state.board]);

  const close = {
    label: owner ? tr.signum.endGame : tr.signum.exit,
    onPress: onExit,
    testID: 'signum-exit',
  };
  const my = view.data;
  // A player's screen waits for their own view (a captain's key, the team's marks); a watcher's
  // needs none.
  if (seat && !my) {
    return (
      <Page testID="signum-loading">
        <TopBar close={close} middle={null} right={{ chat: onChat }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING[3] }}>
          {view.isError ? (
            <>
              <T v="fine" center>
                {errorMessage(view.error)}
              </T>
              <Btn
                sm
                label={tr.common.retry}
                loading={view.isFetching}
                onPress={() => void view.refetch()}
              />
            </>
          ) : (
            <Loader kind="seesaw" label={tr.common.loading} />
          )}
        </View>
      </Page>
    );
  }
  const mine: SignumView = my ?? { role: 'observer' };
  if (state.phase === 'role') {
    return <RoleScreen roomId={roomId} state={state} faces={faces} view={mine} close={close} />;
  }
  if (state.phase === 'clue' && mine.role === 'captain' && mine.team === state.turn) {
    return <ClueScreen roomId={roomId} state={state} faces={faces} view={mine} close={close} />;
  }
  return (
    <BoardScreen
      roomId={roomId}
      state={state}
      faces={faces}
      view={mine}
      close={close}
      onChat={onChat}
      lastOpen={lastOpen && lastOpen.step === state.step ? lastOpen.tile : null}
    />
  );
}

type Close = { label: string; onPress: () => void; testID: string };

function useClock(state: SignumState) {
  const left = useSecondsLeft(state.endsAt ? Date.parse(state.endsAt) : 0);
  const stage = timerStage(state.phase, left);
  return {
    left,
    stage,
    late: state.phase !== 'role' && stage === 'low',
    clock: state.phase === 'role' ? String(left) : tr.games.clock(left),
    label: tr.games.clockLabel(left),
  };
}

const scoreOf = (state: SignumState) => ({
  score: { a: tilesLeftOf(state, 'a'), b: tilesLeftOf(state, 'b') },
});

// Rolünü gör (SignumRolKapali, SignumKaptan, SignumTahminci): the phase pill, the time, the 3D deck
// whose card shows its front only while held, Hazır: n/m and Hazırım (once the card was seen). A
// watcher sees the back, nothing to hold.
function RoleScreen({
  roomId,
  state,
  faces,
  view,
  close,
}: {
  roomId: string;
  state: SignumState;
  faces: Faces;
  view: SignumView;
  close: Close;
}) {
  const clock = useClock(state);
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);
  const answer = useAnswer(roomId);
  const ready = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => signumApi.ready(roomId, state.step),
    ...answer,
  });
  const me = faces.me;
  const amReady = state.ready.includes(me);
  const player = view.role !== 'observer';
  const captain = view.role !== 'observer' ? captainOf(state, view.team) : null;
  const face = (
    <View style={StyleSheet.absoluteFill}>
      {player && holding ? (
        <RoleFront
          role={view.role}
          team={view.team}
          captainName={captain ? nameOf(faces, captain) : tr.kinshi.left}
          keyMap={view.role === 'captain' ? view.key : null}
        />
      ) : (
        <RoleBack hold={player} />
      )}
    </View>
  );
  const deck = (
    <Deck
      face={{ kind: 'node', node: face, key: holding ? 'front' : 'back' }}
      peek={holding && view.role === 'guesser' ? PEEK_PAIRS.near : PEEK_PAIRS.far}
      back={signumArt.back}
    />
  );
  return (
    <Page testID={`signum-role-${view.role}`}>
      <StageFit
        status={
          <>
            <TopBar close={close} middle={{ phase: tr.signum.seeRole }} right={null} />
            <TimeStrip
              stage={clock.stage}
              clock={clock.clock}
              clockLabel={clock.label}
              late={false}
              title={player ? '' : tr.signum.watching}
              line={<T v="fine">{player ? tr.signum.holdHint : tr.signum.watchingNote}</T>}
            />
          </>
        }
        actions={
          <>
            {player && holding && view.role === 'captain' ? (
              <T v="fine" center>
                {tr.signum.keyNote}
              </T>
            ) : null}
            {ready.error ? (
              <T v="fine" color={KIT.danger} center>
                {errorMessage(ready.error)}
              </T>
            ) : null}
            <View style={{ flexDirection: 'row', gap: K.footGap }}>
              <ReadyChip n={state.ready.length} of={state.seats.length} />
              {player ? (
                <Btn
                  testID="signum-ready"
                  label={amReady ? tr.signum.waitingOthers : tr.signum.ready}
                  disabled={amReady || !seen}
                  loading={ready.isPending}
                  onPress={() => ready.mutate()}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </>
        }
      >
        {player ? (
          <Pressable
            testID="signum-role-card"
            accessibilityRole="button"
            accessibilityLabel={tr.signum.holdLabel}
            onPressIn={() => {
              setHolding(true);
              setSeen(true);
              haptic('selection');
            }}
            onPressOut={() => setHolding(false)}
          >
            {deck}
          </Pressable>
        ) : (
          deck
        )}
      </StageFit>
    </Page>
  );
}

// İpucu ver (SignumIpucu, SignumIpucuAcik): the captain's board in the key's colours, no buddies;
// the word, the number and the legend; İpucunu ver. The key held at the top right shows the
// captain's role card over the board.
function ClueScreen({
  roomId,
  state,
  faces,
  view,
  close,
}: {
  roomId: string;
  state: SignumState;
  faces: Faces;
  view: Extract<SignumView, { role: 'captain' }>;
  close: Close;
}) {
  const clock = useClock(state);
  const [word, setWord] = useState('');
  const [n, setN] = useState<number | null>(null);
  const [keyHeld, setKeyHeld] = useState(false);
  const answer = useAnswer(roomId);
  const clue = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (v: { word: string; n: number; actionId: string }) =>
      signumApi.clue(roomId, state.step, v.word, v.n, v.actionId),
    ...answer,
  });
  const pointers = pointersByTile(view.marks);
  const trimmed = word.trim();
  const d = useKinshiDeck();
  return (
    <Page testID="signum-clue">
      <StageFit
        status={
          <>
            <TopBar close={close} middle={scoreOf(state)} right={{ key: setKeyHeld }} />
            <TimeStrip
              stage={clock.stage}
              clock={clock.clock}
              clockLabel={clock.label}
              late={clock.late}
              title={tr.signum.giveClue}
              line={<T v="fine">{tr.signum.clueHint}</T>}
            />
          </>
        }
        actions={
          <>
            {clue.error ? (
              <T v="fine" color={KIT.danger} center>
                {errorMessage(clue.error)}
              </T>
            ) : null}
            <Btn
              block
              icon="check"
              testID="signum-clue-send"
              label={tr.signum.sendClue}
              disabled={!trimmed || n === null}
              loading={clue.isPending}
              onPress={() =>
                n !== null ? clue.mutate({ word: trimmed, n, actionId: uuidV4() }) : undefined
              }
            />
          </>
        }
      >
        <Board state={state} keyMap={view.key} pointers={pointers} mine={null} faces={faces} />
        <ClueInput
          word={word}
          onWord={setWord}
          n={n}
          onN={setN}
          state={state}
          keyMap={view.key}
          disabled={clue.isPending}
        />
      </StageFit>
      {keyHeld ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
        >
          <View
            style={{
              width: d.card.width,
              height: d.card.height,
              borderRadius: d.card.radius,
              overflow: 'hidden',
            }}
          >
            <RoleFront role="captain" team={view.team} captainName="" keyMap={view.key} />
          </View>
        </View>
      ) : null}
    </Page>
  );
}

// The board's screens: Bekle (SignumBekle: a clue is on its way), Tahmin (SignumTahmin,
// SignumTahminAcik: the guessers of the turn mark a tile, open it with the second press, or end the
// turn), Doğru, devam (SignumDogru), the other team's guess (SignumRakip) and a watcher's.
function BoardScreen({
  roomId,
  state,
  faces,
  view,
  close,
  onChat,
  lastOpen,
}: {
  roomId: string;
  state: SignumState;
  faces: Faces;
  view: SignumView;
  close: Close;
  onChat: () => void;
  lastOpen: number | null;
}) {
  const clock = useClock(state);
  const me = faces.me;
  const turn = state.turn;
  const answer = useAnswer(roomId);
  const queryClient = useQueryClient();
  const seq = useRef(0);
  const point = useMutation({
    mutationFn: (tile: number) => {
      const server = view.role === 'guesser' ? view.mySeq : 0;
      seq.current = nextSeq(seq.current, server);
      return signumApi.point(roomId, state.step, tile, seq.current);
    },
    ...answer,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['signum-view', roomId] }),
  });
  const reveal = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (v: { tile: number; actionId: string }) =>
      signumApi.reveal(roomId, state.step, v.tile, v.actionId),
    ...answer,
  });
  const endTurn = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (actionId: string) => signumApi.endTurn(roomId, state.step, actionId),
    ...answer,
  });
  const guessing = state.phase === 'guess' && view.role === 'guesser' && view.team === turn;
  const marks = view.role !== 'observer' ? view.marks : {};
  const pointers = pointersByTile(marks);
  const markedTile = marks[me] ?? null;
  const mine = point.isPending ? point.variables : markedTile;
  const pendingOpen = reveal.isPending || endTurn.isPending;
  const captain = captainOf(state, turn);
  const captainName = captain ? nameOf(faces, captain) : tr.kinshi.left;
  const keyMap = view.role === 'captain' ? view.key : null;
  const opened = lastOpen !== null ? state.board[lastOpen] : null;
  const correct =
    guessing && opened && opened.open === turn ? { word: upperTr(opened.word), team: turn } : null;
  const onTeam = view.role !== 'observer' && view.team === turn;

  const title =
    state.phase === 'clue'
      ? tr.signum.thinking(captainName)
      : guessing
        ? correct
          ? tr.signum.correct
          : tr.signum.guess
        : tr.signum.guessing[turn];
  const line =
    state.phase === 'clue' ? (
      <TurnTag team={turn} label={tr.signum.turnOf[turn]} />
    ) : guessing ? (
      correct ? (
        <TurnTag team={turn} label={tr.signum.openedTag(correct.word, tr.signum.kinds[turn])} />
      ) : (
        <T v="fine">{tr.signum.guessHint}</T>
      )
    ) : onTeam ? (
      <TeamTag team={turn} />
    ) : (
      <T v="fine">{tr.signum.rivalHint}</T>
    );
  const failed = reveal.error ?? endTurn.error;
  const pickedWord = mine !== null ? upperTr(state.board[mine]?.word ?? '') : null;

  return (
    <Page testID={`signum-board-${guessing ? 'guess' : state.phase === 'clue' ? 'wait' : 'watch'}`}>
      <StageFit
        status={
          <>
            <TopBar close={close} middle={scoreOf(state)} right={{ chat: onChat }} />
            <TimeStrip
              stage={clock.stage}
              clock={clock.clock}
              clockLabel={clock.label}
              late={clock.late}
              title={title}
              line={line}
            />
          </>
        }
        actions={
          guessing || failed ? (
            <>
              {failed ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(failed)}
                </T>
              ) : null}
              {guessing ? (
                <View style={{ flexDirection: 'row', gap: K.footGap }}>
                  <Btn
                    variant="glassy"
                    testID="signum-end-turn"
                    label={tr.signum.endTurn}
                    loading={endTurn.isPending}
                    disabled={reveal.isPending}
                    onPress={() => endTurn.mutate(uuidV4())}
                    style={{ flex: 1 }}
                  />
                  <Btn
                    testID="signum-reveal"
                    label={pickedWord ? tr.signum.open(pickedWord) : tr.signum.pick}
                    disabled={markedTile === null || point.isPending || endTurn.isPending}
                    loading={reveal.isPending}
                    onPress={() =>
                      markedTile !== null
                        ? reveal.mutate({ tile: markedTile, actionId: uuidV4() })
                        : undefined
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : null}
            </>
          ) : undefined
        }
      >
        <PeekBoard peek={guessing ? PEEK_PAIRS.near : PEEK_PAIRS.far}>
          <Board
            state={state}
            keyMap={keyMap}
            pointers={pointers}
            mine={guessing ? mine : null}
            faces={faces}
            busy={pendingOpen}
            onTile={
              guessing
                ? (tile) => {
                    if (tile === mine) return;
                    haptic('selection');
                    point.mutate(tile);
                  }
                : undefined
            }
          />
        </PeekBoard>
        {state.phase === 'guess' && state.clue ? (
          <CluePanel
            faces={faces}
            captain={captain}
            team={turn}
            clue={state.clue}
            guessesLeft={state.guessesLeft}
          />
        ) : null}
        {state.phase === 'clue' && onTeam && view.role === 'guesser' ? (
          <T v="fine" center>
            {tr.signum.waitHint}
          </T>
        ) : null}
      </StageFit>
    </Page>
  );
}

// A label in the team's tag colours (`.tag.m`, `.tag.p`) with its own words.
function TurnTag({ team, label }: { team: SignumTeam; label: string }) {
  const tone = useTeamTone(team);
  return <Tag label={label} colors={{ bg: tone.tagBg, fg: tone.tagInk }} />;
}

// Takımlar (SignumTakimlar): the poster, the rules, Mor and Pembe with their people (Kaptan, Aday,
// Önerildi beside the names) and "Katıl", the watchers, those yet to choose; the owner's Karıştır
// and Kaptanları seç, a player's Kaptan olurum, an offer to answer; the rules; Oyunu başlat once
// each team has two and an approved captain.
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
  const [captainsOpen, setCaptainsOpen] = useState(false);
  const { picks, page } = readSignumPage(state);
  const everyone = [...faces.people.keys()];
  const of = (p: 'a' | 'b' | 'obs') => everyone.filter((s) => picks[s] === p);
  const a = of('a');
  const b = of('b');
  const watchers = of('obs');
  const unpicked = everyone.filter((s) => !picks[s]);
  const mine = picks[faces.me] ?? null;
  const myTeam = mine === 'a' || mine === 'b' ? mine : null;
  const enough =
    a.length >= TEAM_MIN_PLAYERS &&
    b.length >= TEAM_MIN_PLAYERS &&
    a.length + b.length >= RULES.minPlayers;
  const captains = !!page.captains.a && !!page.captains.b;
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
    mutationFn: () => signumApi.start(roomId),
    onSettled: reread,
  });
  const volunteer = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (on: boolean) => signumApi.volunteer(roomId, on),
    onSettled: reread,
  });
  const answerOffer = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (accept: boolean) => signumApi.answerOffer(roomId, accept),
    onSettled: reread,
  });
  const failed =
    pick.error ??
    shuffle.error ??
    start.error ??
    volunteer.error ??
    answerOffer.error ??
    closeError;
  const busy = pick.isPending;
  const markOf = (s: string): ReactNode => {
    const team = picks[s];
    if (team !== 'a' && team !== 'b') return null;
    if (page.captains[team] === s) return <SeatMark label={tr.signum.captain} strong />;
    if (page.candidates[team].includes(s)) return <SeatMark label={tr.signum.candidate} />;
    if (page.offers[team] === s) return <SeatMark label={tr.signum.offered} />;
    return null;
  };
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
            {markOf(s)}
          </View>
        ))}
      </View>
    ) : null;
  const teamBox = (team: SignumTeam, sids: string[]) => (
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
  const offered = myTeam && page.offers[myTeam] === faces.me ? myTeam : null;
  const candidate = myTeam ? page.candidates[myTeam].includes(faces.me) : false;
  const isCaptain = myTeam ? page.captains[myTeam] === faces.me : false;
  return (
    <View testID="signum-teams" style={{ flex: 1 }}>
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
            label: owner ? tr.signum.endGame : tr.signum.backToTable,
            onPress: onClose,
            loading: closing,
            testID: 'signum-teams-close',
          }}
          middle={null}
          right={{ chat: onChat }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.poster.gap }}>
          <Image
            source={signumArt.poster}
            style={{
              width: K.poster.width,
              height: K.poster.height,
              borderRadius: K.poster.radius,
            }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1 }}>
            <T v="title">{tr.signum.name}</T>
            <T v="fine">{tr.signum.teams}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tr.signum.rules.map((r) => (
            <Chip key={r} label={r} />
          ))}
        </View>
        {teamBox('a', a)}
        {teamBox('b', b)}
        {offered ? (
          <Glass radius={K.box.radius} style={boxStyle} testID="signum-offer">
            <View>
              <T v="h3">{tr.signum.offerTitle}</T>
              <T v="fine">{tr.signum.offerBody[offered]}</T>
            </View>
            <View style={{ flexDirection: 'row', gap: K.footGap }}>
              <Btn
                sm
                variant="glassy"
                testID="signum-offer-decline"
                label={tr.signum.decline}
                disabled={answerOffer.isPending}
                loading={answerOffer.isPending && answerOffer.variables === false}
                onPress={() => answerOffer.mutate(false)}
                style={{ flex: 1 }}
              />
              <Btn
                sm
                testID="signum-offer-accept"
                label={tr.signum.accept}
                disabled={answerOffer.isPending}
                loading={answerOffer.isPending && answerOffer.variables === true}
                onPress={() => answerOffer.mutate(true)}
                style={{ flex: 1 }}
              />
            </View>
          </Glass>
        ) : null}
        <View style={{ flexDirection: 'row', gap: K.footGap }}>
          {owner ? (
            <>
              <Btn
                sm
                variant="glassy"
                icon="shuffle"
                testID="signum-shuffle"
                label={tr.signum.shuffle}
                loading={shuffle.isPending}
                disabled={start.isPending}
                onPress={() => shuffle.mutate()}
                style={{ flex: 1 }}
              />
              <Btn
                sm
                variant="glassy"
                icon="flag"
                testID="signum-captains"
                label={tr.signum.chooseCaptains}
                onPress={() => setCaptainsOpen(true)}
                style={{ flex: 1 }}
              />
            </>
          ) : myTeam && !isCaptain ? (
            <Btn
              sm
              variant="glassy"
              icon="flag"
              testID="signum-volunteer"
              label={candidate ? tr.signum.unvolunteer : tr.signum.volunteer}
              loading={volunteer.isPending}
              onPress={() => volunteer.mutate(!candidate)}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
        <Glass radius={K.box.radius} style={boxStyle}>
          <T v="fine" ink>
            {tr.signum.how}
          </T>
        </Glass>
        <Glass radius={K.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.box.gap }}>
            <CapIcon name="eye" color={c.ink} />
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.signum.watchers}</T>
              <T v="fine">{tr.signum.watchersNote}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="signum-watch"
              label={tr.signum.watch}
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
              <T v="h3">{tr.signum.unpicked}</T>
              <T v="fine">{tr.signum.unpickedNote}</T>
            </View>
            {people(unpicked)}
          </Glass>
        ) : null}
        <View style={{ flexGrow: 1, minHeight: TEAMS_BUDDY.height }}>
          <Buddy
            buddy={PEEK_PAIRS.near[0]}
            height={TEAMS_BUDDY.height}
            style={{
              right: TEAMS_BUDDY.right,
              bottom: -TEAMS_BUDDY.below,
              transform: [{ rotate: TEAMS_BUDDY.turn }],
            }}
          />
        </View>
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
        {!enough || !captains ? (
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
                {!enough ? tr.signum.needs(TEAM_MIN_PLAYERS) : tr.signum.needsCaptains}
              </T>
            </View>
          </View>
        ) : null}
        {owner ? (
          <>
            <T v="fine" center>
              {tr.signum.hintOwner}
            </T>
            <Btn
              block
              testID="signum-start"
              label={tr.signum.start}
              disabled={!enough || !captains || shuffle.isPending}
              loading={start.isPending}
              onPress={() => start.mutate()}
            />
          </>
        ) : (
          <T v="fine" center>
            {tr.signum.hintGuest}
          </T>
        )}
      </View>
      {owner ? (
        <CaptainsSheet
          visible={captainsOpen}
          onClose={() => setCaptainsOpen(false)}
          roomId={roomId}
          faces={faces}
          teams={{ a, b }}
          page={page}
        />
      ) : null}
    </View>
  );
}
const boxStyle = {
  paddingVertical: K.box.padY,
  paddingHorizontal: K.box.padX,
  gap: K.box.gap,
} as const;
// Takımlar's buddy (`right:16px;bottom:-14px;height:96px;rotate(6deg)`).
const TEAMS_BUDDY = { height: 96, right: 16, below: 14, turn: '6deg' } as const;

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
  team: SignumTeam;
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
          <T v="h3">{tr.signum.team[team]}</T>
        </View>
        <T v="fine">{tr.signum.count(count)}</T>
        <Btn
          sm
          testID={`signum-join-${team}`}
          label={tr.signum.join}
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

// Kaptanları seç (the owner's): each team's people with Onayla for a volunteer, Öner for the
// others, Rastgele seç for the team; the owner's own "Kaptan ol". Only the owner makes a captain.
function CaptainsSheet({
  visible,
  onClose,
  roomId,
  faces,
  teams,
  page,
}: {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  faces: Faces;
  teams: Record<SignumTeam, string[]>;
  page: ReturnType<typeof readSignumPage>['page'];
}) {
  const queryClient = useQueryClient();
  const { c } = useKit();
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const act = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async (
      v:
        | { kind: 'approve'; team: SignumTeam; sid: string }
        | { kind: 'offer'; sid: string }
        | { kind: 'random'; team: SignumTeam }
        | { kind: 'self'; team: SignumTeam },
    ) => {
      if (v.kind === 'approve') return signumApi.approveCaptain(roomId, v.team, v.sid);
      if (v.kind === 'offer') return signumApi.offerCaptain(roomId, v.sid);
      if (v.kind === 'random') return signumApi.randomOffer(roomId, v.team);
      await signumApi.volunteer(roomId, true);
      return signumApi.approveCaptain(roomId, v.team, faces.me);
    },
    onSettled: reread,
  });
  const waiting = (key: string) =>
    act.isPending &&
    !!act.variables &&
    ('sid' in act.variables ? act.variables.sid : act.variables.team) === key;
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.signum.chooseCaptains}>
      <T v="fine">{tr.signum.captainsNote}</T>
      {(['a', 'b'] as const).map((team) => (
        <View key={team} style={{ gap: K.box.gap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.box.gap }}>
            <TeamBar team={team} />
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.signum.team[team]}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              icon="shuffle"
              testID={`signum-random-${team}`}
              label={tr.signum.random}
              disabled={act.isPending || teams[team].length === 0}
              loading={waiting(team) && act.variables?.kind === 'random'}
              onPress={() => act.mutate({ kind: 'random', team })}
            />
          </View>
          {teams[team].map((sid) => {
            const captain = page.captains[team] === sid;
            const candidate = page.candidates[team].includes(sid);
            const offered = page.offers[team] === sid;
            return (
              <View
                key={sid}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: K.box.gap,
                  paddingVertical: SPACING[1],
                  borderTopWidth: 1,
                  borderTopColor: c.hair,
                }}
              >
                <Face faces={faces} sid={sid} size={K.person.face} />
                <View
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <T v="fine" strong ink>
                    {nameOf(faces, sid)}
                  </T>
                  {captain ? (
                    <SeatMark label={tr.signum.captain} strong />
                  ) : candidate ? (
                    <SeatMark label={tr.signum.candidate} />
                  ) : offered ? (
                    <SeatMark label={tr.signum.offered} />
                  ) : null}
                </View>
                {captain ? null : candidate ? (
                  <Btn
                    sm
                    testID={`signum-approve-${sid}`}
                    label={tr.signum.approve}
                    disabled={act.isPending}
                    loading={waiting(sid)}
                    onPress={() => act.mutate({ kind: 'approve', team, sid })}
                  />
                ) : sid === faces.me ? (
                  <Btn
                    sm
                    testID="signum-self-captain"
                    label={tr.signum.becomeCaptain}
                    disabled={act.isPending}
                    loading={waiting(team) && act.variables?.kind === 'self'}
                    onPress={() => act.mutate({ kind: 'self', team })}
                  />
                ) : offered ? null : (
                  <Btn
                    sm
                    variant="glassy"
                    testID={`signum-offer-${sid}`}
                    label={tr.signum.offer}
                    disabled={act.isPending}
                    loading={waiting(sid)}
                    onPress={() => act.mutate({ kind: 'offer', sid })}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
      {act.error ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(act.error)}
        </T>
      ) : null}
      <View style={{ height: SPACING[1] }} />
    </Sheet>
  );
}

// The end (docs/SPEC_V4.md: the key opens to the table, A-7). A black card first shows Kara kart
// açıldı (SignumKara); then Oyun sonu (SignumOyunSonu).
function End({
  roomId,
  state,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  state: SignumState;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const [result, setResult] = useState(state.reason !== 'black');
  if (!result) {
    return (
      <BlackEnd
        state={state}
        faces={faces}
        onBack={onBack}
        onChat={onChat}
        onNext={() => setResult(true)}
      />
    );
  }
  return (
    <Over
      roomId={roomId}
      state={state}
      faces={faces}
      owner={owner}
      onBack={onBack}
      onChat={onChat}
    />
  );
}

// Kara kart açıldı (SignumKara): the pink glow, no capsule and no time, which team opened which
// word (the open state does not say who: only the team), the board, the winner.
function BlackEnd({
  state,
  faces,
  onBack,
  onChat,
  onNext,
}: {
  state: SignumState;
  faces: Faces;
  onBack: () => void;
  onChat: () => void;
  onNext: () => void;
}) {
  const winner = state.winner;
  const loser = winner ? otherTeam(winner) : null;
  const black = state.board.findIndex((t) => t.open === 'x');
  const word = upperTr(state.board[black]?.word ?? '');
  return (
    <View style={{ flex: 1 }} testID="signum-black">
      <Page testID="signum-black-page">
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, gradientStyle(S.flash)]} />
        <StageFit
          status={
            <>
              <TopBar
                close={{ label: tr.signum.exit, onPress: onBack, testID: 'signum-black-close' }}
                middle={scoreOf(state)}
                right={{ chat: onChat }}
              />
              <TimeStrip
                stage={null}
                clock=""
                clockLabel=""
                late={false}
                title={tr.signum.blackOpened}
                line={
                  <T v="fine">{loser ? tr.signum.blackBy(tr.signum.team[loser], word) : word}</T>
                }
              />
            </>
          }
          actions={
            <Btn block testID="signum-see-result" label={tr.signum.seeResult} onPress={onNext} />
          }
        >
          <Board state={state} keyMap={null} pointers={new Map()} mine={null} faces={faces} />
          {winner && loser ? (
            <Glass
              radius={S.winner.radius}
              style={{ padding: S.winner.pad, gap: S.winner.gap, alignItems: 'center' }}
            >
              <EyebrowLine label={tr.signum.winner} />
              <T v="title" center>
                {tr.signum.team[winner]}
              </T>
              <BlackTag label={tr.signum.blackTag(tr.signum.team[loser])} />
            </Glass>
          ) : null}
        </StageFit>
      </Page>
    </View>
  );
}

function EyebrowLine({ label }: { label: string }) {
  return <Eyebrow>{label}</Eyebrow>;
}

// Oyun sonu (SignumOyunSonu): the cloth scene with confetti, the "Kazanan" stamp over the winners'
// faces, two buddies; "Oyun bitti", who won and why; each team's opened cards; the key (Aç shows
// the board in its colours); Masaya dön and the owner's Yeniden oyna.
function Over({
  roomId,
  state,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  state: SignumState;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [keyOpen, setKeyOpen] = useState(false);
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'signum', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const E = S.end;
  const k = kinshiScene(width).scale;
  const winner = state.winner;
  const tone = useTeamTone(winner ?? 'a');
  const winners = winner ? state.seats.filter((s) => s.team === winner).map((s) => s.sid) : [];
  const short = (['a', 'b'] as const).find((t) =>
    state.reason === 'captain_left' ? !captainOf(state, t) : guessersOf(state, t).length === 0,
  );
  const why = winner
    ? state.reason === 'black'
      ? tr.signum.wonBlack(tr.signum.team[otherTeam(winner)])
      : tr.signum.wonCards(tr.signum.team[winner])
    : short
      ? state.reason === 'captain_left'
        ? tr.signum.captainLeft[short]
        : tr.signum.teamEmpty[short]
      : '';
  const key: SignumKind[] | null = state.key;
  return (
    <View testID="signum-end" style={{ flex: 1 }}>
      <AuraBackground />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: E.height - K.statusBar + insets.top,
          overflow: 'hidden',
          borderBottomLeftRadius: E.radius,
          borderBottomRightRadius: E.radius,
        }}
      >
        <Image
          source={signumArt.board}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
          accessibilityIgnoresInvertColors
        />
        {E.confetti.map((b, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: b.left * k,
              top: b.top - K.statusBar + insets.top,
              width: K.endScene.bar.width,
              height: K.endScene.bar.height,
              borderRadius: K.endScene.bar.radius,
              backgroundColor: b.color,
              transform: [{ rotate: b.turn }],
            }}
          />
        ))}
        {winner ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: E.heroTop - K.statusBar + insets.top,
              alignItems: 'center',
            }}
          >
            <View style={{ transform: [{ rotate: E.stampTurn }], marginBottom: E.stampGap }}>
              <Tag label={tr.signum.winner} colors={{ bg: tone.tagBg, fg: tone.tagInk }} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              {winners.map((s, i) => (
                <View
                  key={s}
                  style={{
                    marginLeft: i === 0 ? 0 : -E.faceOverlap,
                    borderRadius: E.face,
                    borderWidth: E.faceRing,
                    borderColor: E.faceRingColor,
                  }}
                >
                  <Face faces={faces} sid={s} size={E.face} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <Buddy
          buddy={PEEK_PAIRS.far[0]}
          height={E.buddies.height * k}
          style={{ left: E.buddies.side * k, bottom: -E.buddies.below * k }}
        />
        <Buddy
          buddy={PEEK_PAIRS.far[1]}
          height={E.buddies.height * k}
          style={{ right: E.buddies.side * k, bottom: -E.buddies.below * k }}
        />
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
          close={{ label: tr.signum.exit, onPress: onBack, testID: 'signum-end-close' }}
          middle={null}
          right={{ chat: onChat }}
        />
        <View style={{ height: E.spacer }} />
        <View>
          <T v="fine" center>
            {tr.signum.over}
          </T>
          <T v="display" center>
            {winner ? tr.signum.won(tr.signum.team[winner]) : tr.signum.noResult}
          </T>
          {why ? (
            <T v="fine" ink center>
              {why}
            </T>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: E.gap }}>
          {(['a', 'b'] as const).map((t) => (
            <Glass
              key={t}
              radius={K.box.radius}
              style={{ ...boxStyle, flex: 1, alignItems: 'center', gap: END_BOX_GAP }}
            >
              <EyebrowLine label={tr.signum.teamShort[t]} />
              <T v="title" center>
                {tr.signum.opened(openedOf(state, t), teamTotal(state, t))}
              </T>
              <T v="fine" center>
                {tr.signum.openedNote}
              </T>
            </Glass>
          ))}
        </View>
        {key ? (
          <Glass
            radius={K.box.radius}
            style={{ ...boxStyle, flexDirection: 'row', alignItems: 'center' }}
          >
            <KeyMini keyMap={key} opened={state.board.map((t) => t.open !== null)} sm />
            <View style={{ flex: 1 }}>
              <T v="fine" ink>
                {tr.signum.keyCard}
              </T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="signum-key-open"
              label={tr.signum.openKey}
              onPress={() => setKeyOpen(true)}
            />
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
            testID="signum-back"
            label={tr.signum.backToTable}
            onPress={onBack}
            style={{ flex: 1 }}
          />
          {owner ? (
            <Btn
              testID="signum-again"
              label={tr.signum.again}
              loading={again.isPending}
              onPress={() => again.mutate()}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </ScrollView>
      <Sheet visible={keyOpen} onClose={() => setKeyOpen(false)} title={tr.signum.keyCard}>
        {key ? (
          <Board state={state} keyMap={key} pointers={new Map()} mine={null} faces={faces} />
        ) : null}
        <View style={{ height: SPACING[1] }} />
      </Sheet>
    </View>
  );
}
const END_BOX_GAP = 4;
