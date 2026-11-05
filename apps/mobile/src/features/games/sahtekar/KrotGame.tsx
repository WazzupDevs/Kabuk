import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readPregame } from '@shared/gameFrame.ts';
import {
  impostorCount,
  readSahtekarResult,
  readSahtekarState,
  SAHTEKAR_GAME,
  type SahtekarGameResult,
  type SahtekarGamePhase,
  type SahtekarGameState,
  type SahtekarView,
} from '@shared/sahtekarGame.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Round, T, Tag, useKit } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { StageFit } from '@/features/games/GameStage';
import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi, sahtekarApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { KROT as KR, KROT_TYPE as KTY, krotTimer } from '@/theme/krot';
import { RISO as R, RISO_PANEL_WIDTH, risoDeck } from '@/theme/riso';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import {
  Buddy,
  ChatRound,
  Deck,
  Face,
  type Faces,
  FaceStack,
  GameTopBar,
  nameOf,
  PeekPair,
  TimeStrip,
} from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { krotArt } from './krotArt';
import {
  announceRole,
  Eyebrow,
  ImpostorCard,
  Lineup,
  type LineupSeat,
  NextRow,
  PhasePill,
  ReadyChip,
  RoleFace,
  WordRow,
} from './KrotParts';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Krot the table shows now: its Kimler oynuyor page, the running game, or the end of the
// last one (until the person goes back to the table). Null: none of them.
export type KrotMode = 'pregame' | 'play' | 'end' | null;

export function krotMode(room: Room): KrotMode {
  if (room.concept === 'sahtekar' && readSahtekarState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'sahtekar') return 'pregame';
  if (readSahtekarResult(room.game_state)) return 'end';
  return null;
}

// Which buddies peek on which screen (the panels as drawn).
const NEAR: readonly [RisoBuddy, RisoBuddy] = ['1a80a9', '9c96bd'];
const FAR: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', 'f280a5'];
const RESULT: readonly [RisoBuddy, RisoBuddy] = ['1a80a9', 'f280a5'];
const GUESS: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', '9c96bd'];

// Each phase's whole time (the capsule's stage).
const PHASE_SECONDS: Record<SahtekarGamePhase, number> = {
  role: SAHTEKAR_GAME.roleSeconds,
  clue: SAHTEKAR_GAME.clueSeconds,
  vote: SAHTEKAR_GAME.voteSeconds,
  result: SAHTEKAR_GAME.resultSeconds,
  guess: SAHTEKAR_GAME.guessSeconds,
};

// Krot at the table (Aura v86, "Krot (gizli kart ve şüpheli sırası)"; docs/SPEC_V4.md §4.F "Adım
// 4.6.3"): Kimler oynuyor, the role card, the clues, the vote, Sonuç, Son şans and the end. It opens
// in the dark (the canvas's pure black, flat #121614 glass), the light when the person chose it. A
// watcher or someone out of it may go back to the table (`onHide`).
export function KrotGame({
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
      <KrotScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function KrotScreens({
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
  const mode = krotMode(room);
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
    const result = readSahtekarResult(room.game_state);
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
  const state = readSahtekarState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = state.seats.includes(me) && !state.gone.includes(me);
  const sheet = owner
    ? { title: tr.krot.endTitle, body: tr.krot.endBody, confirm: tr.krot.endGame }
    : playing
      ? { title: tr.krot.leaveTitle, body: tr.krot.leaveBody, confirm: tr.krot.exit }
      : { title: tr.krot.watchTitle, body: tr.krot.watchBody, confirm: tr.krot.backToTable };
  const pending = endGame.isPending || leaveGame.isPending;
  return (
    <View style={{ flex: 1 }}>
      <Play
        roomId={room.id}
        state={state}
        faces={faces}
        owner={owner}
        onExit={() => setExit(true)}
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
          testID="krot-exit-confirm"
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
function Page({ children, testID }: { children: ReactNode; testID: string }) {
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
        {children}
      </View>
    </View>
  );
}

// The server's clock: when the phase's time is up any phone moves it on (sahtekar/advance,
// idempotent; its failure is not felt); while the phase stays, again every few seconds.
function useAdvance(roomId: string, state: SahtekarGameState) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ask = () =>
      void sahtekarApi
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

// What only this phone may know of its role (sahtekar/view, rule 3), kept for the game: a player's
// word, an impostor's category, a watcher's word and impostors; nothing for one who left.
function useView(roomId: string, gameNo: number) {
  return useQuery({
    queryKey: ['sahtekarView', roomId, gameNo],
    queryFn: () => sahtekarApi.view(roomId),
    staleTime: Infinity,
  });
}

type Shared = {
  roomId: string;
  state: SahtekarGameState;
  faces: Faces;
  top: ReactNode;
  view: SahtekarView | undefined;
  viewError: string | null;
  // The phase's time: the capsule's stage, the number and what screen readers hear.
  clock: { stage: 'full' | 'half' | 'low'; text: string; label: string; late: boolean };
  // "Rolüm" held: the role card in place of the line-up.
  peeking: boolean;
};

function Play({
  roomId,
  state,
  faces,
  owner,
  onExit,
}: {
  roomId: string;
  state: SahtekarGameState;
  faces: Faces;
  owner: boolean;
  onExit: () => void;
}) {
  useAdvance(roomId, state);
  const me = faces.me;
  const view = useView(roomId, state.gameNo);
  // The vote's time running out is felt once, on every phone (hapticMoments → timeUp).
  const wasVote = useRef(state.phase === 'vote');
  useEffect(() => {
    if (wasVote.current && state.phase === 'result') haptic('timeUp');
    wasVote.current = state.phase === 'vote';
  }, [state.phase]);
  const [peeking, setPeeking] = useState(false);
  const peek = (on: boolean) => {
    setPeeking(on);
    if (on) {
      haptic('selection');
      announceRole(view.data);
    }
  };

  const guessing = state.phase === 'guess' && state.caught.includes(me);
  const label =
    state.phase === 'role'
      ? tr.krot.phase.role
      : state.phase === 'clue'
        ? tr.krot.phase.clue(state.round, SAHTEKAR_GAME.clueRounds)
        : tr.krot.phase[state.phase];
  // Rolüm at the right, held to see the card; none on the role card's own screen and Son şans.
  const right =
    state.phase === 'role' || guessing ? null : (
      <Round icon="eye" label={tr.krot.myRole} onHold={peek} testID="krot-my-role" />
    );
  const top = (
    <GameTopBar
      close={{
        label: owner ? tr.krot.endGame : tr.krot.exit,
        onPress: onExit,
        testID: 'krot-exit',
      }}
      middle={<PhasePill label={label} />}
      right={right}
    />
  );
  const left = useSecondsLeft(Date.parse(state.endsAt));
  const bare = state.phase === 'role' || state.phase === 'result';
  const clock = {
    stage: krotTimer(left, PHASE_SECONDS[state.phase]),
    text: bare ? String(left) : tr.games.clock(left),
    label: tr.games.clockLabel(left),
    late: left <= R.lowSeconds,
  };
  const shared: Shared = {
    roomId,
    state,
    faces,
    top,
    view: view.data,
    viewError: view.isError ? errorMessage(view.error) : null,
    clock,
    peeking,
  };
  if (state.phase === 'role') return <RoleScreen key={state.step} {...shared} />;
  if (state.phase === 'clue') return <ClueScreen {...shared} />;
  if (state.phase === 'vote') return <VoteScreen key={state.step} {...shared} />;
  if (guessing) return <GuessScreen key={state.step} {...shared} />;
  return <ResultScreen {...shared} />;
}

function Strip({
  clock,
  title,
  line,
}: {
  clock: Shared['clock'];
  title?: string;
  line: ReactNode;
}) {
  return (
    <TimeStrip
      stage={clock.stage}
      clock={clock.text}
      clockLabel={clock.label}
      late={clock.late}
      title={title}
      line={line}
    />
  );
}

// The deck with the role card on top: held, it turns to its face. Over the line-up while "Rolüm"
// is held, without its "Basılı tut".
function RoleDeck({
  open,
  shared,
  pill,
  onHold,
}: {
  open: boolean;
  shared: Shared;
  pill: boolean;
  onHold?: (on: boolean) => void;
}) {
  const impostor = shared.view?.role === 'impostor';
  const deck = (
    <Deck
      back={krotArt.back}
      peek={open && impostor ? FAR : NEAR}
      top={
        <RoleFace
          open={open}
          view={shared.view}
          failed={shared.viewError}
          pill={pill}
          faces={shared.faces}
        />
      }
    />
  );
  return onHold ? (
    <Pressable
      testID="krot-card"
      accessibilityRole="button"
      accessibilityLabel={tr.krot.holdLabel}
      onPressIn={() => onHold(true)}
      onPressOut={() => onHold(false)}
      style={{ alignSelf: 'center' }}
    >
      {deck}
    </Pressable>
  ) : (
    deck
  );
}

// Rolünü gör (KrotRolKapali, KrotKelime, KrotSahtekar, KrotGozlemci): the card held to see one's
// role, then Hazırım beside who is ready. The card is seen before Hazırım (the old Krot's "Gördüm").
// A watcher has no Hazırım.
function RoleScreen(shared: Shared) {
  const { roomId, state, faces, top, clock, view } = shared;
  const queryClient = useQueryClient();
  const me = faces.me;
  const open = state.seats.filter((s) => !state.gone.includes(s));
  const playing = open.includes(me);
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);
  const ready = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sahtekarApi.ready(roomId, state.step),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const mine = state.ready.includes(me);
  const hold = (on: boolean) => {
    setHolding(on);
    if (on) {
      setSeen(true);
      haptic('selection');
      announceRole(view);
    }
  };
  return (
    <Page testID="krot-role">
      <StageFit
        status={
          <>
            {top}
            <Strip clock={clock} line={<T v="fine">{tr.krot.holdNote}</T>} />
          </>
        }
        actions={
          playing ? (
            <>
              {ready.error ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(ready.error)}
                </T>
              ) : null}
              <View style={{ flexDirection: 'row', gap: R.footGap }}>
                <ReadyChip label={tr.krot.readyCount(state.ready.length, open.length)} />
                <Btn
                  testID="krot-ready"
                  label={tr.krot.ready}
                  disabled={!seen || mine}
                  loading={ready.isPending}
                  onPress={() => ready.mutate()}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : undefined
        }
      >
        <RoleDeck open={holding} shared={shared} pill onHold={hold} />
      </StageFit>
    </Page>
  );
}

// The line-up's seats in the clue order with their numbers.
function seatsOf(
  state: SahtekarGameState,
  faces: Faces,
  seat: (sid: string, i: number) => Partial<LineupSeat>,
): LineupSeat[] {
  return state.seats.map((sid, i) => ({
    sid,
    mark: 'normal',
    dim: false,
    self: false,
    voted: false,
    plate: String(i + 1),
    label: nameOf(faces, sid),
    ...seat(sid, i),
  }));
}

// The line-up, or the role card while "Rolüm" is held; the rows go under it.
function Middle({
  shared,
  seats,
  peek,
  children,
}: {
  shared: Shared;
  seats: LineupSeat[];
  peek: readonly [RisoBuddy, RisoBuddy];
  children?: ReactNode;
}) {
  if (shared.peeking) return <RoleDeck open shared={shared} pill={false} />;
  return (
    <>
      <Lineup faces={shared.faces} seats={seats} peek={peek} />
      {children ? (
        <View style={{ marginTop: KR.row.below - SPACING[2], gap: KR.countBelow - SPACING[2] }}>
          {children}
        </View>
      ) : null}
    </>
  );
}

// İpucu turu (KrotIpucu, KrotSiraSende): who speaks, ringed in --signal, the others dimmed; who is
// next under the line-up; the speaker's Söyledim.
function ClueScreen(shared: Shared) {
  const { roomId, state, faces, top, clock } = shared;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const me = faces.me;
  const speaker = state.speaker;
  const mine = speaker === me;
  const said = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sahtekarApi.said(roomId, state.step),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const seats = seatsOf(state, faces, (sid) =>
    sid === speaker ? { mark: 'speak' } : { dim: true },
  );
  return (
    <Page testID={mine ? 'krot-clue-mine' : 'krot-clue'}>
      <StageFit
        status={
          <>
            {top}
            <Strip
              clock={clock}
              title={
                mine ? tr.krot.yourTurn : speaker ? tr.krot.speaking(nameOf(faces, speaker)) : ''
              }
              line={<T v="fine">{mine ? tr.krot.sayOne : tr.krot.listen}</T>}
            />
          </>
        }
        actions={
          mine ? (
            <>
              {said.error ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(said.error)}
                </T>
              ) : null}
              <Btn
                block
                icon="check"
                testID="krot-said"
                label={tr.krot.said}
                fill={colors.signal}
                tint={colors.onSignal}
                loading={said.isPending}
                onPress={() => said.mutate()}
              />
            </>
          ) : undefined
        }
      >
        <Middle shared={shared} seats={seats} peek={mine ? FAR : NEAR}>
          {state.next ? <NextRow faces={faces} sid={state.next} /> : null}
        </Middle>
      </StageFit>
    </Page>
  );
}

// Oylama (Krot, KrotOylamaAcik): the secret vote; the chosen ringed in --buzz, who voted ticked,
// the caller's own seat dashed and off; the category and one's word under the line-up.
function VoteScreen(shared: Shared) {
  const { roomId, state, faces, top, clock, view } = shared;
  const queryClient = useQueryClient();
  const me = faces.me;
  const open = state.seats.filter((s) => !state.gone.includes(s));
  const playing = open.includes(me);
  const voted = state.voted.includes(me);
  const [sel, setSel] = useState<string[]>([]);
  const vote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (targets: string[]) => sahtekarApi.vote(roomId, state.step, targets),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const choose = (sid: string) => {
    setSel((now) =>
      now.includes(sid)
        ? now.filter((s) => s !== sid)
        : state.impostors === 1
          ? [sid]
          : [...now, sid].slice(-state.impostors),
    );
    haptic('selection');
  };
  const canChoose = playing && !voted && !vote.isPending;
  const seats = seatsOf(state, faces, (sid) => {
    const gone = state.gone.includes(sid);
    return {
      mark: sel.includes(sid) ? 'sel' : 'normal',
      dim: gone,
      self: sid === me,
      voted: state.voted.includes(sid),
      label: sid === me ? tr.krot.selfSeat : nameOf(faces, sid),
      onPress: canChoose && sid !== me && !gone ? () => choose(sid) : undefined,
    };
  });
  const full = sel.length === state.impostors;
  const word =
    view?.role === 'player' || view?.role === 'watcher' ? (
      <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
        <Eyebrow>{view.role === 'player' ? tr.krot.yourWord : tr.krot.word}</Eyebrow>
        <T v="h3">{upperTr(view.word)}</T>
      </View>
    ) : null;
  return (
    <Page testID="krot-vote">
      <StageFit
        status={
          <>
            {top}
            <Strip
              clock={clock}
              title={tr.krot.whoIs}
              line={<T v="fine">{tr.krot.secretVote}</T>}
            />
          </>
        }
        actions={
          playing ? (
            <>
              {vote.error ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(vote.error)}
                </T>
              ) : null}
              <Btn
                block
                icon={full ? 'check' : undefined}
                testID="krot-vote-submit"
                label={
                  full ? tr.krot.voteFor(sel.map((s) => nameOf(faces, s))) : tr.sahtekar.pickSeat
                }
                disabled={!full || voted}
                loading={vote.isPending}
                onPress={() => vote.mutate(sel)}
              />
            </>
          ) : undefined
        }
      >
        <Middle shared={shared} seats={seats} peek={NEAR}>
          <WordRow category={state.category} word={word} />
          <T v="fine" center>
            {tr.krot.votedCount(state.voted.length, open.length)}
          </T>
        </Middle>
      </StageFit>
    </Page>
  );
}

// Sonuç (KrotSonuc), and Son şans for everyone but the caught: the votes each got on the plates,
// "Yakalandı" over the caught, the impostors under the line-up.
function ResultScreen(shared: Shared) {
  const { state, faces, top, clock } = shared;
  const caught = state.caught.length > 0;
  const seats = seatsOf(state, faces, (sid) => {
    const isCaught = state.caught.includes(sid);
    return {
      mark: isCaught ? 'caught' : 'normal',
      dim: !isCaught,
      plate: String(state.tally[sid] ?? 0),
      stamp: isCaught ? tr.krot.caught : undefined,
    };
  });
  return (
    <Page testID="krot-result">
      <StageFit
        status={
          <>
            {top}
            <Strip
              clock={clock}
              title={caught ? tr.krot.lastChance : tr.krot.impostorWon}
              line={caught ? <T v="fine">{tr.krot.guessingNow}</T> : null}
            />
          </>
        }
      >
        <Middle shared={shared} seats={seats} peek={RESULT}>
          <ImpostorCard faces={faces} caught={state.caught} escaped={state.escaped} />
        </Middle>
      </StageFit>
    </Page>
  );
}

// Son şans (KrotSonSans): the caught impostor writes the word; the category in a chip, the field
// and Tahmini gönder in a glass panel over the keyboard.
function GuessScreen(shared: Shared) {
  const { roomId, state, top, clock } = shared;
  const { colors } = useTheme();
  const { c } = useKit();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const d = risoDeck(width);
  const [text, setText] = useState('');
  const guess = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sahtekarApi.guess(roomId, state.step, text.trim()),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const send = () => {
    if (text.trim() && !guess.isPending) guess.mutate();
  };
  const G = KR.guess;
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Page testID="krot-guess">
        <StageFit
          status={
            <>
              {top}
              <Strip
                clock={clock}
                title={tr.krot.guessTitle}
                line={<SmallChip label={tr.krot.category(state.category)} />}
              />
            </>
          }
        >
          <View style={{ paddingTop: G.panelTop - G.peekTop }}>
            <PeekPair
              peek={GUESS}
              height={d.peek.height}
              inset={(G.peekInset - KIT.size.side) * d.scale}
              rightDrop={d.peek.rightDrop}
            />
            <Glass radius={G.radius} style={{ padding: G.pad, gap: G.gap }}>
              <Eyebrow>{tr.krot.word}</Eyebrow>
              <TextInput
                testID="krot-guess-field"
                accessibilityLabel={tr.krot.word}
                value={text}
                onChangeText={setText}
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={GUESS_MAX}
                returnKeyType="send"
                onSubmitEditing={send}
                maxFontSizeMultiplier={1.3}
                selectionColor={colors.accent}
                style={[
                  KTY.field,
                  {
                    height: G.field.height,
                    borderRadius: G.field.radius,
                    borderWidth: G.field.edge,
                    borderColor: colors.accent,
                    backgroundColor: colors.surface2,
                    paddingHorizontal: G.field.padX,
                    paddingVertical: 0,
                    color: c.ink,
                  },
                ]}
              />
              {guess.error ? (
                <T v="fine" color={KIT.danger} center>
                  {errorMessage(guess.error)}
                </T>
              ) : null}
              <Btn
                block
                testID="krot-guess-send"
                label={tr.krot.guessSend}
                disabled={!text.trim()}
                loading={guess.isPending}
                onPress={send}
              />
            </Glass>
          </View>
        </StageFit>
      </Page>
    </KeyboardAvoidingView>
  );
}
// The server takes at most this many characters (functions/sahtekar → guess).
const GUESS_MAX = 60;

// A small chip in the strip's line (`.chip.sm`: 28 high, 13).
function SmallChip({ label }: { label: string }) {
  const { c } = useKit();
  return (
    <View
      style={{
        height: SMALL_CHIP,
        paddingHorizontal: KIT.size.chipPadX,
        borderRadius: SMALL_CHIP / 2,
        backgroundColor: c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
        justifyContent: 'center',
      }}
    >
      <T v="chip" ink>
        {label}
      </T>
    </View>
  );
}
const SMALL_CHIP = 28;

// Kimler oynuyor (KrotKimler): the poster, the rules, the players, the watchers with "Gözlemci
// ol", how it plays; a buddy at the foot; the owner's Oyunu başlat once three play.
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
  const { colors } = useTheme();
  const { c } = useKit();
  const insets = useSafeAreaInsets();
  const picks = readPregame(state)?.picks ?? {};
  const everyone = [...faces.people.keys()];
  const watchers = everyone.filter((s) => picks[s] === 'obs');
  const players = everyone.filter((s) => picks[s] !== 'obs');
  const watching = picks[faces.me] === 'obs';
  const enough = players.length >= SAHTEKAR_GAME.minPlayers;
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.pick(roomId, watching ? null : 'obs'),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sahtekarApi.start(roomId),
    onSettled: reread,
  });
  const failed = pick.error ?? start.error ?? closeError;
  const people = (sids: string[]) =>
    sids.length > 0 ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {sids.map((s) => (
          <View
            key={s}
            style={{
              height: R.person.height,
              paddingLeft: R.person.padLeft,
              paddingRight: R.person.padRight,
              borderRadius: R.person.height / 2,
              backgroundColor: c.raised,
              borderWidth: KIT.size.edge,
              borderColor: s === faces.me ? colors.accent : c.raisedEdge,
              flexDirection: 'row',
              alignItems: 'center',
              gap: R.person.gap,
            }}
          >
            <Face faces={faces} sid={s} size={R.person.face} />
            <T v="fine" strong ink>
              {nameOf(faces, s)}
            </T>
          </View>
        ))}
      </View>
    ) : null;
  const P = KR.pregame;
  return (
    <View testID="krot-pregame" style={{ flex: 1 }}>
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
          gap: R.gap,
        }}
      >
        <GameTopBar
          close={{
            label: owner ? tr.krot.endGame : tr.krot.backToTable,
            onPress: onClose,
            loading: closing,
            testID: 'krot-pregame-close',
          }}
          right={<ChatRound onPress={onChat} />}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: R.poster.gap,
            marginTop: P.posterTop - R.barBottom - R.gap,
          }}
        >
          <Image
            source={krotArt.poster}
            style={{
              width: R.poster.width,
              height: R.poster.height,
              borderRadius: R.poster.radius,
            }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1 }}>
            <T v="title">{tr.krot.name}</T>
            <T v="fine">{tr.krot.whoPlays}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tr.krot
            .rules(impostorCount(Math.max(players.length, SAHTEKAR_GAME.minPlayers)))
            .map((r) => (
              <Chip key={r} label={r} />
            ))}
        </View>
        <Glass radius={R.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.box.gap }}>
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.krot.players}</T>
            </View>
            <T v="fine">{tr.krot.count(players.length)}</T>
          </View>
          {people(players)}
        </Glass>
        <Glass radius={R.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.box.gap }}>
            <CapIcon name="eye" color={c.ink} />
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.krot.watchers}</T>
              <T v="fine">{tr.krot.watchersNote}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="krot-watch"
              label={watching ? tr.krot.play : tr.krot.watch}
              loading={pick.isPending}
              onPress={() => pick.mutate()}
            />
          </View>
          {people(watchers)}
        </Glass>
        <Glass radius={R.box.radius} style={boxStyle}>
          <T v="fine" ink>
            {tr.krot.how}
          </T>
          <T v="fine">{tr.krot.twoImpostors}</T>
        </Glass>
        <View style={{ flexGrow: 1, minHeight: P.buddy.height - P.buddy.below }}>
          <Buddy
            buddy={P.buddy.buddy}
            height={P.buddy.height}
            style={{
              right: P.buddy.right,
              bottom: -P.buddy.below,
              transform: [{ rotate: P.buddy.turn }],
            }}
          />
        </View>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: KIT.size.side,
          paddingTop: SPACING[2],
          paddingBottom: insets.bottom + R.footBottom,
          gap: R.gap,
        }}
      >
        {failed ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(failed)}
          </T>
        ) : null}
        <T v="fine" center>
          {!owner
            ? tr.krot.hintGuest
            : enough
              ? tr.krot.hintOwner
              : tr.krot.needs(SAHTEKAR_GAME.minPlayers)}
        </T>
        {owner ? (
          <Btn
            block
            testID="krot-start"
            label={tr.krot.start}
            disabled={!enough}
            loading={start.isPending}
            onPress={() => start.mutate()}
          />
        ) : null}
      </View>
    </View>
  );
}
const boxStyle = {
  paddingVertical: R.box.padY,
  paddingHorizontal: R.box.padX,
  gap: R.box.gap,
} as const;

// Oyun sonu (KrotOyunSonu): the scene on the wall (confetti, the impostor ringed in --buzz under
// "Sahtekar", two buddies), "Oyun bitti", who won and why, the impostor and the word, "Doğru oy
// verenler", Masaya dön and the owner's Yeniden oyna. An impostor who left keeps their role hidden
// (impostorSeats has them not): "Sahtekar oyundan çıktı".
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  result: SahtekarGameResult;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { c } = useKit();
  const { width } = useWindowDimensions();
  // The scene scales across as a whole on a narrower screen (as Kinshi's, kinshi-320dp.md).
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'sahtekar', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const E = KR.end;
  const L = KR.lineup;
  const impostors = result.impostorSeats;
  const won =
    result.winner === 'table'
      ? tr.krot.tableWon
      : result.winner === 'impostors'
        ? tr.krot.impostorWon
        : tr.krot.impostorLeft;
  const sceneTop = insets.top - R.statusBar;
  return (
    <View testID="krot-end" style={{ flex: 1 }}>
      <AuraBackground />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: E.height + sceneTop,
          overflow: 'hidden',
          borderBottomLeftRadius: E.radius,
          borderBottomRightRadius: E.radius,
        }}
      >
        <Image
          source={krotArt.lineup}
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
              top: b.top + sceneTop,
              width: E.bar.width,
              height: E.bar.height,
              borderRadius: E.bar.radius,
              backgroundColor: b.color,
              transform: [{ rotate: b.turn }],
            }}
          />
        ))}
        {impostors.length > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: E.heroTop + sceneTop,
              alignItems: 'center',
            }}
          >
            <View style={{ transform: [{ rotate: L.stamp.turn }], marginBottom: E.stampGap }}>
              <Tag label={tr.krot.impostor} colors={{ bg: colors.buzz, fg: colors.onBuzz }} />
            </View>
            <View style={{ flexDirection: 'row', gap: E.stampGap * 2 }}>
              {impostors.map((sid) => (
                <View
                  key={sid}
                  style={{
                    borderRadius: E.face,
                    borderWidth: L.ring,
                    borderColor: colors.buzz,
                    outlineColor: L.haloBuzz,
                    outlineWidth: L.halo,
                    outlineStyle: 'solid',
                    boxShadow: L.bigShadow,
                  }}
                >
                  <Face faces={faces} sid={sid} size={E.face} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {E.buddies.map((p) => (
          <Buddy
            key={p.buddy}
            buddy={p.buddy}
            height={p.height * k}
            style={{
              bottom: -p.below * k,
              ...('left' in p ? { left: p.left * k } : { right: p.right * k }),
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
          paddingBottom: insets.bottom + R.footBottom,
          gap: R.gap,
        }}
      >
        <GameTopBar
          close={{ label: tr.krot.exit, onPress: onBack, testID: 'krot-end-close' }}
          right={<ChatRound onPress={onChat} />}
        />
        <View style={{ height: E.contentTop - R.barBottom - 2 * R.gap }} />
        <View style={{ alignItems: 'center' }}>
          <T v="fine" center>
            {tr.krot.over}
          </T>
          <T v="display" center accessibilityRole="header">
            {won}
          </T>
          {result.winner === 'table' ? (
            <T v="fine" ink center>
              {tr.krot.caughtMissed}
            </T>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: E.cardGap }}>
          {impostors.length > 0 ? (
            <Glass radius={R.box.radius} style={[boxStyle, endCard]}>
              <Eyebrow>{tr.krot.impostor}</Eyebrow>
              {impostors.map((sid) => (
                <View key={sid} style={{ alignItems: 'center', gap: END_CARD_GAP }}>
                  <Face faces={faces} sid={sid} size={E.cardFace} />
                  <T v="h3" center>
                    {nameOf(faces, sid)}
                  </T>
                </View>
              ))}
            </Glass>
          ) : null}
          <Glass radius={R.box.radius} style={[boxStyle, endCard, { justifyContent: 'center' }]}>
            <Eyebrow>{tr.krot.word}</Eyebrow>
            <T v="title" center>
              {upperTr(result.word)}
            </T>
            <T v="fine" center>
              {upperTr(result.category)}
            </T>
          </Glass>
        </View>
        {result.rightVoters.length > 0 ? (
          <Glass
            radius={R.box.radius}
            style={[boxStyle, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <Text style={{ flex: 1 }} maxFontSizeMultiplier={1.3}>
              <T v="fine" color={c.ink}>
                {tr.krot.rightVoters}
              </T>
            </Text>
            <FaceStack faces={faces} sids={result.rightVoters} />
          </Glass>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {again.error ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(again.error)}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: R.footGap }}>
          <Btn
            variant="glassy"
            testID="krot-back"
            label={tr.krot.backToTable}
            onPress={onBack}
            style={{ flex: 1 }}
          />
          {owner ? (
            <Btn
              testID="krot-again"
              label={tr.krot.again}
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
const endCard = { flex: 1, alignItems: 'center', gap: 6 } as const;
const END_CARD_GAP = 6;
