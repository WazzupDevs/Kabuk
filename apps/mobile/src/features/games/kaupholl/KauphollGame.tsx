import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readPregame } from '@shared/gameFrame.ts';
import {
  activeSeats,
  fewQuestions,
  formatTrNumber,
  isPlayer,
  KAUPHOLL,
  type KauphollAnswer,
  type KauphollCoins,
  type KauphollPhase,
  type KauphollView,
} from '@shared/kaupholl.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, T, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { StageFit } from '@/features/games/GameStage';
import { useTimeUp } from '@/features/games/useSecondsLeft';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, kauphollApi, probeConnection, roomsApi } from '@/lib/api';
import { noteSuccess, useConnection } from '@/lib/connection';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { FIELD_SIZE, fieldType, KAUPHOLL as K } from '@/theme/kaupholl';
import { KROT } from '@/theme/krot';
import { RISO as R, RISO_PANEL_WIDTH } from '@/theme/riso';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { useAdvanceClock } from '@/features/games/useAdvanceClock';

import {
  Buddy,
  ChatRound,
  Deck,
  Face,
  type Faces,
  GameTopBar,
  nameOf,
  type StageClock,
  TimeStrip,
  useStageClock,
} from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { PhasePill, ReadyChip } from '../sahtekar/KrotParts';
import { PlayPage, Scene, ScenePage } from '../sprengja/SprengjaParts';
import {
  GameLobby,
  LobbyCard,
  type LobbyPerson,
  LobbyPeople,
  LobbyRules,
  LobbyWatchers,
} from '../GameLobby';
import { kauphollArt } from './kauphollArt';
import {
  AnswerBox,
  Board,
  type BoardLook,
  BoardRows,
  BoardSkeleton,
  CardFace,
  ChipsRow,
  ErrorBox,
  FieldBox,
  GuessPanel,
  GuessRow,
  HeroWinners,
  OneLineStrip,
  QuestionStrip,
  ScoreTable,
  useFontScale,
  WaitPill,
  Wallet,
} from './KauphollParts';
import {
  boardRows,
  chipCounts,
  coinsLeft,
  compactBoard,
  editGuess,
  endWords,
  fieldFontSize,
  formatGuess,
  guessValue,
  type KauphollTable,
  type Lane,
  laneSettle,
  laneStart,
  laneSubmit,
  type LaneSend,
  pressPreview,
  rawOf,
  readKauphollResult,
  readKauphollState,
  scoreRows,
  stakesOn,
  summaryWords,
  tapSlot,
} from './kauphollView';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Kaupholl the table shows now: its Oyuncular page, the running game, or the end of the
// last finished one (until the person goes back to the table). A game left half way has no end:
// the table tells it (kauphollAbandoned, KaupholYarida). Null: none of them.
export type KauphollMode = 'pregame' | 'play' | 'end' | null;

export function kauphollMode(room: Room): KauphollMode {
  if (room.concept === 'kaupholl' && readKauphollState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'kaupholl') return 'pregame';
  if (readKauphollResult(room.game_state)) return 'end';
  return null;
}

// Which buddies peek over the deck (the panels as drawn): the closed card; the open one has none
// (KaupholSoruAcildi).
const CLOSED: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', 'f280a5'];

// Each phase's whole time (the capsule's stage).
const PHASE_SECONDS: Record<KauphollPhase, number> = {
  card: KAUPHOLL.cardSeconds,
  guess: KAUPHOLL.guessSeconds,
  board: KAUPHOLL.betSeconds,
  answer: KAUPHOLL.pauseSeconds,
  summary: KAUPHOLL.pauseSeconds,
  over: 1,
};

// The caller's own guess (kaupholl/view, rule 3): only this phone's, kept per step.
const viewsOf = (roomId: string) => ['kaupholl-view', roomId] as const;
const viewKey = (roomId: string, step: number, me: string) =>
  [...viewsOf(roomId), step, me] as const;
type ViewAnswer = { room: unknown; view: KauphollView };

// Kaupholl at the table (Aura v89 "Kaupholl (en yakına yatır)" and the §6 panels of
// docs/decisions/kaupholl.md; docs/SPEC_V4.md §4.F "Adım 4.6.10", K-87): Oyuncular, the closed
// card, the question, the guess, the board, the answer, the end of a question and the end. It
// opens in the dark, the light when the person chose it. A watcher or someone out of it may go back
// to the table (`onHide`).
export function KauphollGame({
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
      <KauphollScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function KauphollScreens({
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
  const faces: Faces = {
    me,
    people: new Map(people.map((p) => [p.sessionId, p])),
    profiles,
  };
  const mode = kauphollMode(room);
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
      // Out of the game: its guess is no longer this phone's (rule 3).
      queryClient.removeQueries({ queryKey: viewsOf(room.id) });
      setExit(false);
      onHide();
    },
    onSettled: reread,
  });
  const chat = () => router.push({ pathname: '/room-chat/[id]', params: { id: room.id } });
  // No game running: nothing of it kept on the phone.
  useEffect(() => {
    if (mode !== 'play') queryClient.removeQueries({ queryKey: viewsOf(room.id) });
  }, [mode, room.id, queryClient]);

  if (mode === 'pregame') {
    return (
      <Pregame
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
    const result = readKauphollResult(room.game_state);
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
  const state = readKauphollState(room.game_state);
  if (mode !== 'play' || !state) return null;
  if (state.phase === 'over') {
    return (
      <End
        roomId={room.id}
        result={state}
        faces={faces}
        owner={owner}
        onBack={onHide}
        onChat={chat}
      />
    );
  }
  const playing = isPlayer(state, me);
  const sheet = owner
    ? { title: tr.kaupholl.endTitle, body: tr.kaupholl.endBody, confirm: tr.kaupholl.endGame }
    : playing
      ? { title: tr.kaupholl.leaveTitle, body: tr.kaupholl.leaveBody, confirm: tr.kaupholl.exit }
      : {
          title: tr.kaupholl.watchTitle,
          body: tr.kaupholl.watchBody,
          confirm: tr.kaupholl.backToTable,
        };
  const pending = endGame.isPending || leaveGame.isPending;
  return (
    <View style={{ flex: 1 }}>
      <Play
        roomId={room.id}
        state={state}
        faces={faces}
        owner={owner}
        loading={people.length === 0}
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
          testID="kaupholl-exit-confirm"
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

// ------------------------------------------------------------------ the server's clock

// When the phase's time is up any phone moves it on (kaupholl/advance, idempotent; its failure is
// not felt); while the phase stays (an early advance answers `unchanged`), again every few seconds.
// A time pulled back (the last one waited for left) starts it again (E-5).
function useAdvance(roomId: string, state: KauphollTable) {
  useAdvanceClock(roomId, state.endsAt, state.step, () => kauphollApi.advance(roomId, state.step));
}

// One scope's sending (kauphollView → Lane): at most one request on its way, the last change
// waiting behind it. A press waits for the answer of the request that carries it. `seq_conflict`
// is not an error: the phone asks the server's state (`recover`) and goes on from its seq. A reset
// (the connection came back) drops what waits; an answer to a request from before it is ignored.
function useLane<T>({
  send,
  seqOf,
  recover,
}: {
  send: (s: LaneSend<T>) => Promise<KauphollAnswer>;
  seqOf: (answer: KauphollAnswer) => number;
  recover: () => Promise<number>;
}) {
  const lane = useRef<Lane<T>>(laneStart<T>(0));
  const waiters = useRef<Waiter[]>([]);
  const gen = useRef(0);
  const [busy, setBusy] = useState(false);
  const run = (s: LaneSend<T>, ws: Waiter[]) => {
    const g = gen.current;
    setBusy(true);
    send(s).then(
      (answer) => {
        if (g !== gen.current) return;
        ws.forEach((w) => w.resolve(answer));
        settle(seqOf(answer));
      },
      (err: unknown) => {
        if (g !== gen.current) return;
        if (err instanceof ApiError && err.code === 'seq_conflict') {
          void recover()
            .catch(() => 0)
            .then((seq) => {
              if (g !== gen.current) return;
              ws.forEach((w) => w.resolve(null));
              settle(seq);
            });
          return;
        }
        ws.forEach((w) => w.reject(err));
        settle(0);
      },
    );
  };
  const settle = (serverSeq: number) => {
    const r = laneSettle(lane.current, serverSeq);
    lane.current = r.lane;
    if (r.send) {
      const ws = waiters.current;
      waiters.current = [];
      run(r.send, ws);
    } else {
      setBusy(false);
    }
  };
  const submit = (payload: T, lock: boolean) =>
    new Promise<KauphollAnswer | null>((resolve, reject) => {
      const r = laneSubmit(lane.current, payload, lock);
      lane.current = r.lane;
      if (r.send) run(r.send, [{ resolve, reject }]);
      else if (r.lane.busy) waiters.current.push({ resolve, reject });
      else resolve(null);
    });
  // The server's seq as the phone last read it, while nothing is on its way.
  const sync = (seq: number) => {
    if (!lane.current.busy && seq > lane.current.seq) lane.current = { ...lane.current, seq };
  };
  const reset = (seq: number) => {
    gen.current += 1;
    lane.current = laneStart<T>(seq);
    waiters.current.forEach((w) => w.resolve(null));
    waiters.current = [];
    setBusy(false);
  };
  const idle = () => !lane.current.busy;
  return { submit, sync, reset, idle, busy };
}
type Waiter = {
  resolve: (answer: KauphollAnswer | null) => void;
  reject: (err: unknown) => void;
};

// The connection came back (or the screen was opened again): what was waiting is dropped and the
// phone goes on from the server's state.
function useBackOnline(onBack: () => void) {
  const offline = useConnection((s) => s.offline);
  const was = useRef(offline);
  useEffect(() => {
    if (was.current && !offline) onBack();
    was.current = offline;
  }, [offline, onBack]);
  return offline;
}

// ------------------------------------------------------------------ the running game

type Shared = {
  roomId: string;
  state: KauphollTable;
  faces: Faces;
  top: ReactNode;
  playing: boolean;
  offline: boolean;
  cover: ReactNode;
  clock: StageClock;
  timeUp: boolean;
  // This phone's guess locked by time's end (the board's "Kesinleşti").
  autoLocked: boolean;
};

function Play({
  roomId,
  state,
  faces,
  owner,
  loading,
  onExit,
  onChat,
}: {
  roomId: string;
  state: KauphollTable;
  faces: Faces;
  owner: boolean;
  loading: boolean;
  onExit: () => void;
  onChat: () => void;
}) {
  useAdvance(roomId, state);
  const me = faces.me;
  const queryClient = useQueryClient();
  const offline = useConnection((s) => s.offline);
  const [retrying, setRetrying] = useState(false);
  const retry = () => {
    setRetrying(true);
    void probeConnection()
      .then((ok) => {
        if (ok) noteSuccess();
        return queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      })
      .finally(() => setRetrying(false));
  };
  // The guess's and the board's time running out is felt once, on every phone (timeUp); a guess
  // written but not locked when the guess's time ran out is "Kesinleşti" on the board.
  const was = useRef({ phase: state.phase, endsAt: state.endsAt, chip: state.chips[me] });
  const [autoStep, setAutoStep] = useState<number | null>(null);
  useEffect(() => {
    const before = was.current;
    if (
      before.phase !== state.phase &&
      (before.phase === 'guess' || before.phase === 'board') &&
      Date.now() >= Date.parse(before.endsAt)
    ) {
      haptic('timeUp');
    }
    if (before.phase === 'guess' && state.phase === 'board' && before.chip === 'written') {
      setAutoStep(state.step);
    }
    was.current = { phase: state.phase, endsAt: state.endsAt, chip: state.chips[me] };
  }, [state.phase, state.endsAt, state.step, state.chips, me]);

  const endsAt = Date.parse(state.endsAt);
  const timeUp = useTimeUp(endsAt);
  const clock: StageClock = {
    endsAt,
    total: PHASE_SECONDS[state.phase],
    bare: true,
    upLabel: tr.kaupholl.timeUp,
  };
  const scene = state.phase === 'summary';
  const top = (
    <GameTopBar
      close={{
        label: owner ? tr.kaupholl.endGame : tr.kaupholl.exit,
        onPress: onExit,
        testID: 'kaupholl-exit',
      }}
      middle={
        scene ? undefined : (
          <PhasePill label={tr.kaupholl.question(state.round + 1, state.rounds)} />
        )
      }
      right={<ChatRound onPress={onChat} />}
    />
  );
  const shared: Shared = {
    roomId,
    state,
    faces,
    top,
    playing: isPlayer(state, me),
    offline,
    cover: offline ? <ErrorBox retrying={retrying} onRetry={retry} /> : null,
    clock,
    timeUp,
    autoLocked: autoStep === state.step,
  };
  if (loading) return <CardLoading {...shared} />;
  if (state.phase === 'card') return <CardScreen {...shared} />;
  if (state.phase === 'guess') return <GuessScreen key={state.step} {...shared} />;
  if (state.phase === 'board') return <BoardScreen key={state.step} {...shared} />;
  if (state.phase === 'answer') return <AnswerScreen {...shared} />;
  return <SummaryScreen {...shared} />;
}

// The page of a timed screen: the bar and the strip on top, what lies between scrolling only when
// it does not fit, the foot over the navigation bar (34 from the panel's bottom); the connection
// error over it but the bar.
function Page({
  testID,
  status,
  children,
  actions,
  cover,
}: {
  testID: string;
  status: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  cover?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + R.footBottom,
          paddingHorizontal: KIT.size.side,
        }}
      >
        <StageFit status={status} actions={actions}>
          {children}
        </StageFit>
      </View>
      {cover}
    </View>
  );
}

function OneLine({ clock: phase, title }: { clock: StageClock; title: string }) {
  const clock = useStageClock(phase);
  return (
    <OneLineStrip
      stage={clock.stage}
      clock={clock.text}
      clockLabel={clock.label}
      late={clock.late}
      title={title}
    />
  );
}

function Strip({ clock: phase, title, line }: { clock: StageClock; title: string; line: string }) {
  const clock = useStageClock(phase);
  return (
    <TimeStrip
      stage={clock.stage}
      clock={clock.text}
      clockLabel={clock.label}
      late={clock.late}
      title={title}
      line={<T v="fine">{line}</T>}
    />
  );
}

function FootError({ error }: { error: unknown }) {
  return error ? (
    <T v="fine" color={KIT.danger} center>
      {errorMessage(error)}
    </T>
  ) : null;
}

// The table as the phone knows it now, and its own placement.
function useSettle(roomId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
}

// ------------------------------------------------------------------ the card

// The table's people or the caller's guess on their way (KaupholYukleniyor): the bar, the deck
// with the spinner on its card, "Kartı aç" off.
function CardLoading({ top }: Shared) {
  const { c } = useKit();
  return (
    <PlayPage
      testID="kaupholl-loading"
      top={top}
      foot={<Btn block label={tr.kaupholl.open} disabled />}
    >
      <Deck
        back={kauphollArt.back}
        peek={CLOSED}
        top={
          <View
            style={{
              flex: 1,
              borderRadius: R.card.radius,
              backgroundColor: c.raised,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader kind="seesaw" label={tr.common.loading} />
          </View>
        }
      />
    </PlayPage>
  );
}

// Soru kartı kapalı (KaupholHata's left, without the error): any player opens the card; nobody in
// 10 seconds, the server opens it (advance).
function CardScreen({ roomId, state, top, playing, offline, cover }: Shared) {
  const settle = useSettle(roomId);
  const reveal = useMutation({
    mutationFn: () => kauphollApi.reveal(roomId, state.step),
    onSettled: settle,
  });
  return (
    <PlayPage
      testID="kaupholl-card"
      top={top}
      title={tr.kaupholl.openTitle}
      note={playing ? tr.kaupholl.openNote : tr.kaupholl.watcherNote}
      cover={cover}
      foot={
        playing ? (
          <>
            <FootError error={reveal.error} />
            <Btn
              block
              testID="kaupholl-open"
              label={tr.kaupholl.open}
              disabled={offline}
              loading={reveal.isPending}
              onPress={() => reveal.mutate()}
            />
          </>
        ) : null
      }
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={tr.kaupholl.cardClosed}
        style={{ opacity: offline ? K.board.dim : 1 }}
      >
        <Deck back={kauphollArt.back} peek={CLOSED} />
      </View>
    </PlayPage>
  );
}

// ------------------------------------------------------------------ the guess

// The guess (KaupholTahminYaz, KaupholGonderildi, KaupholKesin, KaupholOtoKesin, KaupholSureDoldu):
// the open card first with "Tahmin yaz"; the field with the keyboard open; once sent the number,
// who has written, "Tahmini değiştir" and "Kesinleştir"; once locked "Herkes bekleniyor". The
// guess goes one request at a time (useLane); only "Kesinleştir" is felt when it fails.
function GuessScreen(shared: Shared) {
  const { roomId, state, faces, playing, offline } = shared;
  const me = faces.me;
  const queryClient = useQueryClient();
  const key = viewKey(roomId, state.step, me);
  const view = useQuery({
    queryKey: key,
    queryFn: () => kauphollApi.view(roomId),
    staleTime: Infinity,
    enabled: playing,
  });
  const mine = view.data?.view.role === 'player' ? view.data.view.guess : null;
  const keep = (answer: KauphollAnswer) => {
    queryClient.setQueryData<ViewAnswer>(key, { room: answer.room, view: answer.view });
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  };
  const lane = useLane<number>({
    send: (s) =>
      kauphollApi.guess(roomId, state.step, s.seq, s.payload, s.lock).then((answer) => {
        keep(answer);
        return answer;
      }),
    seqOf: (answer) => (answer.view.role === 'player' ? (answer.view.guess?.seq ?? 0) : 0),
    recover: () =>
      view
        .refetch()
        .then((r) => (r.data?.view.role === 'player' ? (r.data.view.guess?.seq ?? 0) : 0)),
  });
  const serverSeq = mine?.seq ?? 0;
  useEffect(() => lane.sync(serverSeq), [lane, serverSeq]);
  useBackOnline(() => {
    lane.reset(0);
    void view.refetch();
  });

  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const [tooLong, setTooLong] = useState(false);
  const send = useMutation({
    mutationFn: (value: number) => lane.submit(value, false),
    onSuccess: (answer) => {
      if (answer?.view.role === 'player' && answer.view.guess) setEditing(false);
    },
  });
  const lock = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (value: number) => lane.submit(value, true),
  });
  const timeUp = shared.timeUp;
  const card = state.card;
  const decimals = card?.decimals ?? 0;

  if (!playing) return <GuessWatch {...shared} />;
  if (view.isPending) return <CardLoading {...shared} />;
  if (view.isError) {
    return (
      <QuestionPage {...shared} title={tr.kaupholl.writeTitle} line={tr.kaupholl.writeLine}>
        <FootError error={view.error} />
        <Btn block variant="glassy" label={tr.common.retry} onPress={() => void view.refetch()} />
      </QuestionPage>
    );
  }
  if (!mine && !editing && !timeUp) {
    return (
      <PlayCard
        {...shared}
        foot={
          <Btn
            block
            testID="kaupholl-write"
            label={tr.kaupholl.write}
            onPress={() => {
              setRaw('');
              setEditing(true);
            }}
          />
        }
      />
    );
  }
  if (editing || !mine) {
    const value = guessValue(raw);
    const submit = () => {
      if (value !== null && !send.isPending && !timeUp) send.mutate(value);
    };
    return (
      <WriteScreen
        {...shared}
        raw={timeUp && mine ? rawOf(mine.value) : raw}
        decimals={decimals}
        tooLong={tooLong}
        off={timeUp}
        note={timeUp ? (mine ? tr.kaupholl.timeUpGuess : tr.kaupholl.timeUpNoGuess) : null}
        onChange={(text) => {
          const next = editGuess(raw, text, decimals);
          setRaw(next.raw);
          setTooLong(next.tooLong);
        }}
        onSubmit={submit}
        send={
          timeUp ? (
            <WaitPill />
          ) : (
            <>
              <FootError error={send.error} />
              <Btn
                block
                testID="kaupholl-send"
                label={tr.kaupholl.send}
                disabled={value === null || offline}
                loading={send.isPending}
                onPress={submit}
              />
            </>
          )
        }
      />
    );
  }
  const locked = mine.locked || timeUp;
  return (
    <SentScreen
      {...shared}
      value={formatTrNumber(mine.value)}
      locked={locked}
      foot={
        locked ? (
          <WaitPill />
        ) : (
          <>
            <FootError error={lock.error} />
            <View style={{ flexDirection: 'row', gap: R.footGap }}>
              <Btn
                variant="glassy"
                testID="kaupholl-change"
                label={tr.kaupholl.change}
                disabled={lock.isPending}
                onPress={() => {
                  setRaw(rawOf(mine.value));
                  setTooLong(false);
                  setEditing(true);
                }}
                style={{ flex: 1 }}
              />
              <Btn
                testID="kaupholl-lock"
                label={tr.kaupholl.lock}
                disabled={offline}
                loading={lock.isPending}
                onPress={() => lock.mutate(mine.value)}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )
      }
    />
  );
}

// The strip of the guess: the time, the title and its line; "Süre doldu" once it is up.
function guessStrip(shared: Shared, title: string, line: string): ReactNode {
  const timeUp = shared.timeUp;
  return (
    <>
      {shared.top}
      <Strip clock={shared.clock} title={timeUp ? tr.kaupholl.timeUp : title} line={line} />
    </>
  );
}

// The question on the strip's paper, under the bar and the time.
function QuestionPage({
  title,
  line,
  children,
  ...shared
}: Shared & { title: string; line: string; children: ReactNode }) {
  const { state } = shared;
  return (
    <Page testID="kaupholl-question" status={guessStrip(shared, title, line)} cover={shared.cover}>
      <QuestionStrip
        eyebrow={tr.kaupholl.question(state.round + 1, state.rounds)}
        question={state.card?.text ?? ''}
      />
      {children}
    </Page>
  );
}

// Soru açıldı (KaupholSoruAcildi): the open card on the deck (the question and "Cevap: <birim>"),
// the time begun; the player's "Tahmin yaz" under it.
function PlayCard({ foot, ...shared }: Shared & { foot: ReactNode }) {
  const { state } = shared;
  return (
    <Page
      testID="kaupholl-open-card"
      status={guessStrip(shared, tr.kaupholl.openedTitle, tr.kaupholl.openedLine)}
      actions={foot}
      cover={shared.cover}
    >
      <View style={{ opacity: shared.offline ? K.board.dim : 1 }}>
        <Deck
          back={kauphollArt.back}
          top={<CardFace question={state.card?.text ?? ''} unit={state.card?.unit ?? ''} />}
        />
      </View>
    </Page>
  );
}

// A watcher's guess phase: the open card and who has written; nothing to press (E-3).
function GuessWatch(shared: Shared) {
  const { state, faces } = shared;
  const n = chipCounts(state);
  return (
    <Page
      testID="kaupholl-watch"
      status={guessStrip(
        shared,
        tr.kaupholl.writeTitle,
        tr.kaupholl.wrote(n.written, n.players, n.locked),
      )}
      actions={
        <T v="fine" center>
          {tr.kaupholl.watcherNote}
        </T>
      }
      cover={shared.cover}
    >
      <QuestionStrip
        eyebrow={tr.kaupholl.question(state.round + 1, state.rounds)}
        question={state.card?.text ?? ''}
      />
      <ChipsRow faces={faces} sids={activeSeats(state)} chips={state.chips} />
    </Page>
  );
}

// Tahmin yaz (KaupholTahminYaz, KaupholTahminYaz320, KaupholSureDoldu): the question, the field with
// its unit, "En çok 6 hane" and "Tahmini gönder" right under it, with the system's number keyboard
// open. Dots are drawn between thousands; a whole-number question's keyboard has no comma (T-1). A
// number too wide for the field shrinks, never "…". At 320 or above 1× text (`tight`) the time
// is on one line and the question has no eyebrow; at 320 the sides are 16 and the field 56 high.
// Once the time is up the field is off and the recorded guess stands.
function WriteScreen({
  raw,
  decimals,
  tooLong,
  off,
  note,
  onChange,
  onSubmit,
  send,
  ...shared
}: Shared & {
  raw: string;
  decimals: 0 | 1;
  tooLong: boolean;
  off: boolean;
  note: string | null;
  onChange: (text: string) => void;
  onSubmit: () => void;
  send: ReactNode;
}) {
  const { state } = shared;
  const { colors } = useTheme();
  const { c } = useKit();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fs = useFontScale();
  const narrow = width < K.narrowBelow;
  const tight = narrow || fs > 1;
  const A = narrow ? K.ansNarrow : K.ans;
  const [fieldWidth, setFieldWidth] = useState(0);
  const fieldText = formatGuess(raw);
  const fieldSize = fieldFontSize(fieldText, fieldWidth, FIELD_SIZE, fs);
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View testID="kaupholl-write-screen" style={{ flex: 1 }}>
        <AuraBackground />
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + SPACING[2],
            paddingHorizontal: narrow ? K.narrowSide : KIT.size.side,
          }}
        >
          <View style={{ gap: SPACING[2.5] }}>
            {shared.top}
            {tight && !note ? (
              <OneLine
                clock={shared.clock}
                title={off ? tr.kaupholl.timeUp : tr.kaupholl.writeTitle}
              />
            ) : (
              <Strip
                clock={shared.clock}
                title={off ? tr.kaupholl.timeUp : tr.kaupholl.writeTitle}
                line={note ?? tr.kaupholl.writeLine}
              />
            )}
          </View>
          <ScrollView
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ marginHorizontal: -SPACING[1] }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SPACING[1],
              paddingTop: K.belowStrip,
              paddingBottom: SPACING[1],
            }}
          >
            <QuestionStrip
              eyebrow={tr.kaupholl.question(state.round + 1, state.rounds)}
              question={state.card?.text ?? ''}
              tight={tight}
            />
            <View style={{ marginTop: K.belowQuestion.field }}>
              <GuessRow
                unit={state.card?.unit ?? ''}
                narrow={narrow}
                field={
                  <FieldBox off={off} narrow={narrow} onWidth={setFieldWidth}>
                    <TextInput
                      testID="kaupholl-field"
                      accessibilityLabel={tr.kaupholl.fieldLabel}
                      value={fieldText}
                      onChangeText={onChange}
                      editable={!off && !shared.offline}
                      autoFocus={!off}
                      keyboardType={decimals === 1 ? 'decimal-pad' : 'number-pad'}
                      returnKeyType="send"
                      onSubmitEditing={onSubmit}
                      maxFontSizeMultiplier={1.3}
                      cursorColor={colors.accent}
                      selectionColor={colors.accent}
                      style={[fieldType(fieldSize), { color: off ? c.muted : c.ink, padding: 0 }]}
                    />
                  </FieldBox>
                }
              />
            </View>
            {off ? null : (
              <View style={{ marginTop: A.hintGap, paddingHorizontal: SPACING[1] }}>
                <T v="fine" color={tooLong ? KIT.danger : undefined}>
                  {tr.kaupholl.maxDigits}
                </T>
              </View>
            )}
            <View style={{ marginTop: A.sendGap, gap: SPACING[2] }}>{send}</View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Gönderildi, kesinleşti (KaupholGonderildi, KaupholKesin, KaupholOtoKesin): the question, the
// number sent, who has written (none, written, locked; never their number) and the foot.
function SentScreen({
  value,
  locked,
  foot,
  ...shared
}: Shared & { value: string; locked: boolean; foot: ReactNode }) {
  const { state, faces } = shared;
  const n = chipCounts(state);
  const timeUp = shared.timeUp;
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const B = K.buddy.sent;
  return (
    <Page
      testID={locked ? 'kaupholl-locked' : 'kaupholl-sent'}
      status={guessStrip(
        shared,
        locked ? tr.kaupholl.lockedTitle : tr.kaupholl.sentTitle,
        timeUp ? tr.kaupholl.lockedTag : tr.kaupholl.wrote(n.written, n.players, n.locked),
      )}
      actions={foot}
      cover={shared.cover}
    >
      <QuestionStrip
        eyebrow={tr.kaupholl.question(state.round + 1, state.rounds)}
        question={state.card?.text ?? ''}
      />
      <GuessPanel value={value} unit={state.card?.unit ?? ''} locked={locked} />
      <ChipsRow faces={faces} sids={activeSeats(state)} chips={state.chips} />
      {locked ? null : (
        <T v="fine" center>
          {tr.kaupholl.toBoard}
        </T>
      )}
      <View style={{ height: B.height * k }}>
        <Buddy
          buddy="9c96bd"
          height={B.height * k}
          style={{ left: B.side * k, transform: [{ rotate: B.turn }] }}
        />
      </View>
    </Page>
  );
}

// ------------------------------------------------------------------ the board

// The board's measures for this screen and these slices (§5).
function useBoardLook(slices: number, locked: boolean): BoardLook {
  const { width } = useWindowDimensions();
  const fs = useFontScale();
  return { compact: compactBoard(slices, fs), narrow: width < K.narrowBelow, locked };
}

// Tahta (KaupholTahta, KaupholTahtaSiki, KaupholTahta320, KaupholYatirdim, KaupholSureDoldu's
// right): the slices from "Hepsinden küçük" up, everyone's coins live; a press puts a coin on a
// slice (kauphollView → tapSlot). Each change goes on its own, one request at a time (useLane);
// "Yatırdım" locks the placement, 0 or 1 coin too, and only it is felt when it fails. The board
// scrolls inside when it does not fit; the time, the wallet and "Yatırdım" stay.
function BoardScreen(shared: Shared) {
  const { roomId, state, faces, playing, offline, clock } = shared;
  const me = faces.me;
  const settle = useSettle(roomId);
  const server = state.bets[me]?.step === state.step ? state.bets[me] : undefined;
  // The placement the latest answer returned: the room's state may come a moment later.
  const [answered, setAnswered] = useState<{
    coins: KauphollCoins;
    seq: number;
    locked: boolean;
  } | null>(null);
  const known =
    answered && (!server || answered.seq >= server.seq)
      ? answered
      : server
        ? { coins: server.coins, seq: server.seq, locked: server.locked }
        : null;
  const [local, setLocal] = useState<KauphollCoins | null>(null);
  // The slice under the finger (KaupholJetonKoy): its coin about to land, the wallet's first leaving.
  const [pressing, setPressing] = useState<number | null>(null);
  const lane = useLane<KauphollCoins>({
    send: (s) =>
      kauphollApi.bet(roomId, state.step, s.seq, s.payload, s.lock).then((answer) => {
        const b = answer.room.bets[me];
        if (b && b.step === state.step) {
          setAnswered({ coins: [b.coins[0], b.coins[1]], seq: b.seq, locked: b.locked });
        }
        settle();
        return answer;
      }),
    seqOf: (answer) => {
      const b = answer.room.bets[me];
      return b && b.step === state.step ? b.seq : 0;
    },
    recover: () => {
      settle();
      return kauphollApi.view(roomId).then((r) => {
        const b = r.room.bets[me];
        return b && b.step === state.step ? b.seq : 0;
      });
    },
  });
  const serverSeq = known?.seq ?? 0;
  useEffect(() => lane.sync(serverSeq), [lane, serverSeq]);
  useBackOnline(() => {
    lane.reset(0);
    setLocal(null);
    settle();
  });
  const done = () => {
    if (lane.idle()) setLocal(null);
  };
  const place = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (coins: KauphollCoins) => lane.submit(coins, true),
    onSettled: done,
  });
  const coins: KauphollCoins = local ?? known?.coins ?? [null, null];
  const timeUp = shared.timeUp;
  const locked = !!known?.locked || timeUp || place.isSuccess;
  const board = state.board;
  const look = useBoardLook(board?.length ?? 0, locked);
  const myGuess = board?.find((s) => s.authors.includes(me))?.pos ?? null;
  const tap = (pos: number) => {
    const next = tapSlot(coins, pos);
    setLocal(next);
    haptic('selection');
    void lane.submit(next, false).then(done, done);
  };
  const preview = pressing !== null && playing && !locked ? pressPreview(coins, pressing) : null;
  const title = timeUp ? tr.kaupholl.timeUp : tr.kaupholl.betTitle;
  const line = timeUp ? tr.kaupholl.timeUpBet : locked ? tr.kaupholl.waiting : tr.kaupholl.rule;
  const status = (
    <>
      {shared.top}
      {look.compact ? (
        <OneLine clock={clock} title={title} />
      ) : (
        <Strip clock={clock} title={title} line={line} />
      )}
    </>
  );
  const foot = playing ? (
    <>
      <FootError error={place.error} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.footGap }}>
        <Wallet left={coinsLeft(coins)} locked={locked} leaving={preview?.leaving} />
        <Btn
          testID="kaupholl-bet-done"
          label={tr.kaupholl.betDone}
          disabled={locked || offline}
          loading={place.isPending}
          onPress={() => place.mutate(coins)}
          style={{ flex: 1 }}
        />
      </View>
    </>
  ) : (
    <T v="fine" center>
      {tr.kaupholl.watcherNote}
    </T>
  );
  const insets = useSafeAreaInsets();
  return (
    <View testID="kaupholl-board" style={{ flex: 1 }}>
      <AuraBackground />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + R.footBottom,
          paddingHorizontal: look.narrow ? K.narrowSide : KIT.size.side,
          gap: SPACING[2.5],
        }}
      >
        {status}
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          {board ? (
            <Board look={look} dim={offline}>
              <BoardRows
                faces={faces}
                rows={boardRows(board, null, false)}
                stakesOf={(pos) => stakesOn(pos, state.bets, state.seats, { sid: me, coins })}
                look={look}
                mineOf={(pos) => coins.includes(pos)}
                myGuessPos={myGuess}
                tagOf={(pos) =>
                  pos === myGuess && shared.autoLocked && coinsLeft(coins) === KAUPHOLL.coins
                    ? tr.kaupholl.lockedTag
                    : undefined
                }
                onTap={playing ? tap : undefined}
                press={
                  playing
                    ? {
                        pos: locked || offline ? null : pressing,
                        ghost: preview?.ghost ? me : undefined,
                        onChange: setPressing,
                      }
                    : undefined
                }
                disabled={locked || offline}
                answerText=""
              />
            </Board>
          ) : (
            <BoardSkeleton look={look} />
          )}
        </View>
        <View style={{ gap: SPACING[2] }}>{foot}</View>
      </View>
      {shared.cover}
    </View>
  );
}

// ------------------------------------------------------------------ the answer

// Hazırım beside who is ready (`.chip.hz`); a watcher sees only the count.
function ReadyFoot({ roomId, state, faces, playing, offline }: Shared) {
  const settle = useSettle(roomId);
  const ready = useMutation({
    mutationFn: () => kauphollApi.ready(roomId, state.step),
    onSettled: settle,
  });
  const active = activeSeats(state);
  const mine = state.ready.includes(faces.me);
  return (
    <>
      <FootError error={ready.error} />
      <View style={{ flexDirection: 'row', gap: R.footGap }}>
        <ReadyChip label={tr.kaupholl.readyCount(state.ready.length, active.length)} />
        {playing ? (
          <Btn
            testID="kaupholl-ready"
            label={tr.kaupholl.ready}
            disabled={mine || offline}
            loading={ready.isPending}
            onPress={() => ready.mutate()}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </>
  );
}

// Cevap (KaupholCevap, KaupholHepsindenKucuk, KaupholKimseYazmadi): the answer, its note, the
// board with "Kazandı" on the winner, the answer's line under it and those past it dimmed; with no
// guess the question and "Kimse tahmin yazmadı".
function AnswerScreen(shared: Shared) {
  const { state, faces } = shared;
  const me = faces.me;
  const answer = state.answer;
  const answerText = answer ? formatTrNumber(answer.value, answer.decimals) : '';
  const board = state.board;
  const look = useBoardLook(board?.length ?? 0, false);
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const insets = useSafeAreaInsets();
  const head = (
    <>
      <AnswerBox value={answerText} unit={answer?.unit ?? ''} />
      {answer?.note ? (
        <T v="fine" ink>
          {answer.note}
        </T>
      ) : null}
    </>
  );
  if (state.noGuesses || !board) {
    return (
      <Page
        testID="kaupholl-answer-none"
        status={shared.top}
        actions={<ReadyFoot {...shared} />}
        cover={shared.cover}
      >
        {head}
        <QuestionStrip
          eyebrow={tr.kaupholl.question(state.round + 1, state.rounds)}
          question={state.card?.text ?? ''}
        />
        <View style={{ alignItems: 'center', gap: SPACING[2] }}>
          <View
            style={{
              height: K.buddy.none.height * k,
              width: K.buddy.none.height * k * R.buddyRatio,
            }}
          >
            <Buddy
              buddy="f280a5"
              height={K.buddy.none.height * k}
              style={{ transform: [{ rotate: K.buddy.none.turn }] }}
            />
          </View>
          <T v="title" center>
            {tr.kaupholl.noGuesses}
          </T>
        </View>
      </Page>
    );
  }
  return (
    <View testID="kaupholl-answer" style={{ flex: 1 }}>
      <AuraBackground />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + R.footBottom,
          paddingHorizontal: look.narrow ? K.narrowSide : KIT.size.side,
          gap: SPACING[2.5],
        }}
      >
        {shared.top}
        {head}
        <View style={{ flex: 1 }}>
          <Board look={look} dim={shared.offline}>
            <BoardRows
              faces={faces}
              rows={boardRows(board, state.winner, true)}
              stakesOf={(pos) => stakesOn(pos, state.bets, state.seats)}
              look={look}
              mineOf={() => false}
              myGuessPos={board.find((s) => s.authors.includes(me))?.pos ?? null}
              tagOf={(_, mark) => (mark === 'win' ? tr.kaupholl.won : undefined)}
              answerText={answerText}
            />
          </Board>
        </View>
        <ReadyFoot {...shared} />
      </View>
      {shared.cover}
    </View>
  );
}

// ------------------------------------------------------------------ the end of a question

// Soru sonu (KaupholSoruSonu, KaupholHepsindenKucuk's right): the chest, "Soru 3/5 bitti", who wrote
// the winning guess (or "Hepsinden küçük kazandı"), the answer, the scores with this question's
// gain and "+3 tahmin"; Hazırım.
function SummaryScreen(shared: Shared) {
  const { state, faces } = shared;
  const answer = state.answer;
  const answerText = answer ? formatTrNumber(answer.value, answer.decimals) : '';
  const words = summaryWords(state);
  const name = (sid: string) => nameOf(faces, sid);
  let title: string;
  let line: string;
  switch (words.kind) {
    case 'none':
      title = tr.kaupholl.noGuesses;
      line = tr.kaupholl.noneLine(answerText);
      break;
    case 'smaller':
      title = tr.kaupholl.smallerWon;
      line = tr.kaupholl.smallerLine(answerText);
      break;
    case 'guess': {
      const a = words.authors;
      const who =
        a.kind === 'one'
          ? name(a.sid)
          : a.kind === 'two'
            ? tr.kaupholl.twoNames(name(a.sids[0]), name(a.sids[1]))
            : a.kind === 'many'
              ? tr.kaupholl.people(a.sids.length)
              : '';
      title = tr.kaupholl.winGuess(who);
      line = tr.kaupholl.winLine(formatTrNumber(words.value), answer?.unit ?? '', answerText);
      break;
    }
  }
  return (
    <ScenePage
      testID="kaupholl-summary"
      scene={<Scene source={kauphollArt.chest} height={K.scene.summary} />}
      content={K.scene.summaryContent}
      top={shared.top}
      foot={<ReadyFoot {...shared} />}
      cover={shared.cover}
    >
      <View style={{ alignItems: 'center' }}>
        <T v="fine" center>
          {tr.kaupholl.roundOver(state.round + 1, state.rounds)}
        </T>
        <T v="display" center accessibilityRole="header">
          {title}
        </T>
        <T v="fine" ink center>
          {line}
        </T>
      </View>
      <ScoreTable faces={faces} rows={scoreRows(state)} />
    </ScenePage>
  );
}

// ------------------------------------------------------------------ Oyuncular

// Oyuncular (KaupholOyuncular, KaupholAzSoru, KaupholSoruKalmadi): GameLobby's frame with the
// game's chips, the players, the watchers with "Gözlemci ol", how it plays; the owner's
// few-questions warning (the number never shown) and "Oyunu başlat" for 3 to 6 players. A start
// refused for want of questions keeps the page open and says so (felt).
function Pregame({
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
  const watchers = everyone.filter((s) => picks[s] === 'obs');
  const players = everyone.filter((s) => picks[s] !== 'obs');
  const watching = picks[faces.me] === 'obs';
  const enough = players.length >= KAUPHOLL.minPlayers;
  const fits = players.length <= KAUPHOLL.maxPlayers;
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pool = useQuery({
    queryKey: ['kaupholl-pool', roomId],
    queryFn: () => kauphollApi.pool(roomId),
    enabled: owner,
    staleTime: Infinity,
  });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.pick(roomId, watching ? null : 'obs'),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kauphollApi.start(roomId),
    onSettled: () => {
      reread();
      void queryClient.invalidateQueries({ queryKey: ['kaupholl-pool', roomId] });
    },
  });
  const startCode = start.error instanceof ApiError ? start.error.code : null;
  const failed =
    pick.error ?? (startCode === 'questions_exhausted' ? null : start.error) ?? closeError;
  const tooMany = !fits || startCode === 'too_many_players';
  const person = (s: string): LobbyPerson => ({
    key: s,
    face: <Face faces={faces} sid={s} size={R.person.face} />,
    name: nameOf(faces, s),
    me: s === faces.me,
  });
  return (
    <GameLobby
      testID="kaupholl-pregame"
      game="kaupholl"
      poster={kauphollArt.poster}
      name={tr.kaupholl.name}
      close={{
        label: owner ? tr.kaupholl.endGame : tr.kaupholl.backToTable,
        onPress: onClose,
        loading: closing,
        testID: 'kaupholl-pregame-close',
      }}
      onChat={onChat}
      chips={[
        tr.kaupholl.questions(KAUPHOLL.questions),
        tr.kaupholl.guessTime(KAUPHOLL.guessSeconds),
        tr.kaupholl.betTime(KAUPHOLL.betSeconds),
      ]}
      foot={{
        owner,
        warning: !enough
          ? tr.kaupholl.needs(KAUPHOLL.minPlayers)
          : tooMany
            ? tr.kaupholl.tooMany(KAUPHOLL.maxPlayers)
            : owner && startCode === 'questions_exhausted'
              ? tr.errors.questions_exhausted
              : owner && pool.data && fewQuestions(pool.data.unused)
                ? tr.kaupholl.fewQuestions
                : null,
        // A few questions left only warns; the others hold the start back.
        canStart: enough && fits,
        error: failed && !tooMany ? failed : null,
        start: {
          label: tr.kaupholl.start,
          testID: 'kaupholl-start',
          loading: start.isPending,
          onPress: () => start.mutate(),
        },
      }}
    >
      <LobbyCard title={tr.games.players} count={tr.games.count(players.length)}>
        <LobbyPeople people={players.map(person)} />
      </LobbyCard>
      <LobbyWatchers
        note={tr.kaupholl.watchersNote}
        watching={watching}
        loading={pick.isPending}
        onPress={() => pick.mutate()}
        testID="kaupholl-watch"
        people={watchers.map(person)}
      />
      <LobbyRules text={tr.kaupholl.how} />
    </GameLobby>
  );
}

// ------------------------------------------------------------------ Oyun sonu

// The end's confetti (Krot's, as drawn on KaupholOyunSonu), scaled across with the screen.
function Confetti() {
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const E = KROT.end;
  return (
    <>
      {E.confetti.map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: b.left * k,
            top: b.top,
            width: E.bar.width,
            height: E.bar.height,
            borderRadius: E.bar.radius,
            backgroundColor: b.color,
            transform: [{ rotate: b.turn }],
          }}
        />
      ))}
    </>
  );
}

// "Can, sen ve Ece": a sentence starts in capitals.
function capitalFirst(s: string): string {
  return s.length > 0 ? upperTr(s.charAt(0)) + s.slice(1) : s;
}

// Oyun sonu (KaupholOyunSonu, KaupholOyunSonuOrtak): the chest with the winners (two or three
// sharing), "Oyun bitti · 5 soru", who won and their points, the scores; Masaya dön, and the
// owner's Yeniden oyna. When nobody scored there is no winner (T-2): "Kazanan yok" under the
// chest alone (KaupholKazananYok): no faces, no line, everyone's 0 below.
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  result: KauphollTable;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'kaupholl', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const me = faces.me;
  const words = endWords(result, me);
  const named = (sid: string) => (sid === me ? tr.kaupholl.you : nameOf(faces, sid));
  let title: string;
  let note: string | null;
  let heroes: string[] = [];
  switch (words.kind) {
    case 'nobody':
      title = tr.kaupholl.nobody;
      note = null;
      break;
    case 'one':
      title = words.you ? tr.kaupholl.wonYou : tr.kaupholl.wonOne(nameOf(faces, words.sid));
      note = tr.kaupholl.pointsLine(words.points);
      heroes = [words.sid];
      break;
    case 'two': {
      const others = words.sids.filter((s) => s !== me);
      title = words.you
        ? tr.kaupholl.wonTwoYou(nameOf(faces, others[0] ?? ''))
        : tr.kaupholl.wonTwo(nameOf(faces, words.sids[0]), nameOf(faces, words.sids[1]));
      note = words.you ? tr.kaupholl.twoYouLine(words.points) : tr.kaupholl.twoLine(words.points);
      heroes = words.sids;
      break;
    }
    case 'many':
      title = tr.kaupholl.wonMany(words.sids.length);
      note = capitalFirst(tr.kaupholl.manyLine(words.sids.map(named), words.you));
      heroes = words.sids;
      break;
  }
  const winners = new Set(result.winners ?? []);
  const rows = scoreRows(result).map((r) => ({
    sid: r.sid,
    total: r.total,
    lead: winners.has(r.sid),
  }));
  const scene = (
    <Scene source={kauphollArt.chest} height={K.scene.end}>
      {heroes.length > 0 ? <Confetti /> : null}
      <HeroWinners faces={faces} sids={heroes} />
    </Scene>
  );
  return (
    <ScenePage
      testID="kaupholl-end"
      scene={scene}
      content={K.scene.endContent}
      top={
        <GameTopBar
          close={{ label: tr.kaupholl.exit, onPress: onBack, testID: 'kaupholl-end-close' }}
          right={<ChatRound onPress={onChat} />}
        />
      }
      foot={
        <>
          <FootError error={again.error} />
          <View style={{ flexDirection: 'row', gap: R.footGap }}>
            <Btn
              variant="glassy"
              testID="kaupholl-back"
              label={tr.kaupholl.backToTable}
              onPress={onBack}
              style={{ flex: 1 }}
            />
            {owner ? (
              <Btn
                testID="kaupholl-again"
                label={tr.kaupholl.again}
                loading={again.isPending}
                onPress={() => again.mutate()}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </>
      }
    >
      <View style={{ alignItems: 'center' }}>
        <T v="fine" center>
          {tr.kaupholl.over(result.rounds)}
        </T>
        <T v="display" center accessibilityRole="header">
          {title}
        </T>
        {note ? (
          <T v="fine" ink center>
            {note}
          </T>
        ) : null}
      </View>
      <ScoreTable faces={faces} rows={rows} />
    </ScenePage>
  );
}
