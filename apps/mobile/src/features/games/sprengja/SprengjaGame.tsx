import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readPregame } from '@shared/gameFrame.ts';
import {
  activePlayers,
  canTakeOver,
  nextActive,
  pollEveryMs,
  readSprengjaResult,
  readSprengjaState,
  roundsFor,
  SPRENGJA,
  type SprengjaResult,
  type SprengjaState,
} from '@shared/sprengja.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Btn, Glass, T, Tag, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, probeConnection, roomsApi, sprengjaApi } from '@/lib/api';
import { noteSuccess, useConnection } from '@/lib/connection';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { RISO as R } from '@/theme/riso';
import { SPRENGJA as S, SPRENGJA_TYPE as ST, sprengjaRing } from '@/theme/sprengja';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { useAdvanceClock } from '@/features/games/useAdvanceClock';

import { ChatRound, Deck, Face, type Faces, GameTopBar, nameOf } from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { PhasePill, ReadyChip } from '../sahtekar/KrotParts';
import {
  CardFace,
  EndDecor,
  ErrorCover,
  HeroFaces,
  LetterPanel,
  MidNote,
  PlayPage,
  Ring,
  RulesSheet,
  Scene,
  ScenePage,
  ScoreTable,
} from './SprengjaParts';
import {
  GameLobby,
  LobbyActions,
  LobbyCard,
  type LobbyPerson,
  LobbyPeople,
  LobbyRules,
  LobbyWatchers,
} from '../GameLobby';
import { sprengjaArt } from './sprengjaArt';
import {
  blastBuzz,
  endWords,
  mostHit,
  ringSeats,
  scoreRows,
  type Seen,
  throwsUntil,
} from './sprengjaView';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Sprengja the table shows now: its Oyuncular page, the running game, or the end of the
// last one (until the person goes back to the table). Null: none of them.
export type SprengjaMode = 'pregame' | 'play' | 'end' | null;

export function sprengjaMode(room: Room): SprengjaMode {
  if (room.concept === 'sprengja' && readSprengjaState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'sprengja') return 'pregame';
  if (readSprengjaResult(room.game_state)) return 'end';
  return null;
}

// Which buddies peek over the deck (the panels as drawn): the starter's closed card, the waiting
// and the taking over, the starter's open card.
const OPEN_MINE: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', 'f280a5'];
const WAIT: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', '9c96bd'];
const LETTERS_MINE: readonly [RisoBuddy, RisoBuddy] = ['1a80a9', '9c96bd'];

// The keys of blasts already felt on this phone (`${room}:${gameNo}:${round}`), across the game's
// screens being drawn again.
const BUZZED = new Set<string>();

// Sprengja at the table (Aura v99, "Sprengja (elden ele bomba)"; docs/SPEC_V4.md §4.F "Adım
// 4.6.8", K-85): Oyuncular, the card, the letter group, the ring while the fuse burns, Patladı, Tur
// sonu, Oyun durdu and the end. No time shows anywhere. It opens in the dark, the light when the
// person chose it. A watcher or someone out of it may go back to the table (`onHide`).
export function SprengjaGame({
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
      <SprengjaScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function SprengjaScreens({
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
  const mode = sprengjaMode(room);
  const [sheet, setSheet] = useState<'exit' | 'rules' | null>(null);
  const queryClient = useQueryClient();
  const reread = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(room.id) });
  };
  const endGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.endGame(room.id),
    onSuccess: () => setSheet(null),
    onSettled: reread,
  });
  const leaveGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leaveGame(room.id),
    onSuccess: () => {
      setSheet(null);
      onHide();
    },
    onSettled: reread,
  });
  const chat = () => router.push({ pathname: '/room-chat/[id]', params: { id: room.id } });
  const rules = <RulesSheet visible={sheet === 'rules'} onClose={() => setSheet(null)} />;

  if (mode === 'pregame') {
    return (
      <>
        <Pregame
          roomId={room.id}
          state={room.game_state}
          faces={faces}
          owner={owner}
          onClose={() => (owner ? endGame.mutate() : onHide())}
          closing={endGame.isPending}
          closeError={endGame.error}
          onChat={chat}
          onRules={() => setSheet('rules')}
        />
        {rules}
      </>
    );
  }
  if (mode === 'end') {
    const result = readSprengjaResult(room.game_state);
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
  const state = readSprengjaState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = activePlayers(state).includes(me);
  const exit = owner
    ? { title: tr.sprengja.endTitle, body: tr.sprengja.endBody, confirm: tr.sprengja.endGame }
    : playing
      ? { title: tr.sprengja.leaveTitle, body: tr.sprengja.leaveBody, confirm: tr.sprengja.exit }
      : {
          title: tr.sprengja.watchTitle,
          body: tr.sprengja.watchBody,
          confirm: tr.sprengja.backToTable,
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
        onExit={() => setSheet('exit')}
        onChat={chat}
        onRules={() => setSheet('rules')}
      />
      {rules}
      <Sheet
        visible={sheet === 'exit'}
        onClose={() => (pending ? undefined : setSheet(null))}
        title={exit.title}
      >
        <T v="fine">{exit.body}</T>
        {(endGame.error ?? leaveGame.error) ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(endGame.error ?? leaveGame.error)}
          </T>
        ) : null}
        <Btn
          block
          variant={owner || playing ? 'danger' : 'primary'}
          icon="logout"
          testID="sprengja-exit-confirm"
          label={exit.confirm}
          loading={pending}
          onPress={() =>
            owner ? endGame.mutate() : playing ? leaveGame.mutate() : (setSheet(null), onHide())
          }
        />
        <Btn
          block
          variant="glassy"
          label={tr.common.cancel}
          disabled={pending}
          onPress={() => setSheet(null)}
        />
        <View style={{ height: SPACING[1] }} />
      </Sheet>
    </View>
  );
}

// ------------------------------------------------------------------ the server's clock

// While the fuse burns the phones ask the server whether it ran out (sprengja/poll), as often as
// the state says for this phone (pollEveryMs: 0 is never); the answer is always the same and its
// failure is not felt. Nothing on the phone guesses the moment.
function usePoll(roomId: string, state: SprengjaState, me: string) {
  const every = pollEveryMs(state, me);
  const round = state.round;
  useEffect(() => {
    if (every <= 0) return undefined;
    const timer = setInterval(
      () => void sprengjaApi.poll(roomId, round).catch(() => undefined),
      every,
    );
    return () => clearInterval(timer);
  }, [roomId, round, every]);
}

// Tur sonu's time: when it is up any phone moves it on (sprengja/advance, idempotent; its failure
// is not felt); while it stays, again every few seconds.
function useAdvance(roomId: string, state: SprengjaState) {
  useAdvanceClock(roomId, state.phase === 'summary' ? state.endsAt : null, state.step, () =>
    sprengjaApi.advance(roomId),
  );
}

// Whether the server's `at` has come (the starter's 30 idle seconds, never shown): false until
// then, true from that moment. The server checks again (too_soon).
function useReached(at: string | null): boolean {
  const [reached, setReached] = useState<string | null>(null);
  useEffect(() => {
    if (!at) return undefined;
    const timer = setTimeout(() => setReached(at), Math.max(0, Date.parse(at) - Date.now()));
    return () => clearTimeout(timer);
  }, [at]);
  return at !== null && reached === at;
}

// The one strong touch: only on the phone of the one the bomb went off with, once the server's
// state says so (sprengjaView → blastBuzz), at most once a game and round.
function useBlastBuzz(roomId: string, state: SprengjaState, me: string) {
  const before = useRef<Seen | null>(null);
  useEffect(() => {
    const done = new Set(
      [...BUZZED].filter((k) => k.startsWith(`${roomId}:`)).map((k) => k.slice(roomId.length + 1)),
    );
    const key = blastBuzz(done, before.current, state, me);
    if (key) {
      BUZZED.add(`${roomId}:${key}`);
      haptic('blast');
    }
    before.current = { gameNo: state.gameNo, round: state.round, phase: state.phase };
  }, [roomId, state, me]);
}

// ------------------------------------------------------------------ the running game

type Shared = {
  roomId: string;
  state: SprengjaState;
  faces: Faces;
  top: ReactNode;
  playing: boolean;
  offline: boolean;
  cover: ReactNode;
  onRules: () => void;
};

function Play({
  roomId,
  state,
  faces,
  owner,
  loading,
  onExit,
  onChat,
  onRules,
}: {
  roomId: string;
  state: SprengjaState;
  faces: Faces;
  owner: boolean;
  loading: boolean;
  onExit: () => void;
  onChat: () => void;
  onRules: () => void;
}) {
  const me = faces.me;
  usePoll(roomId, state, me);
  useAdvance(roomId, state);
  useBlastBuzz(roomId, state, me);
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
  const playing = activePlayers(state).includes(me);
  const watcher = !state.order.includes(me);
  // The bar: the round, or "İzliyorsun" for a watcher; none over Tur sonu's scene.
  const scene = state.phase === 'summary' && !blastMine(state, me);
  const top = (
    <GameTopBar
      close={{
        label: owner ? tr.sprengja.endGame : tr.sprengja.exit,
        onPress: onExit,
        testID: 'sprengja-exit',
      }}
      middle={
        scene ? undefined : (
          <PhasePill
            label={watcher ? tr.sprengja.watching : tr.games.turn(state.round, state.rounds)}
          />
        )
      }
      right={<ChatRound onPress={onChat} />}
    />
  );
  if (loading) {
    // The table's people are on their way (VampirYukleniyor): the bar, the loader in the middle.
    return (
      <PlayPage testID="sprengja-loading" top={top}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Loader kind="seesaw" label={tr.common.loading} />
        </View>
      </PlayPage>
    );
  }
  const shared: Shared = {
    roomId,
    state,
    faces,
    top,
    playing,
    offline,
    cover: offline ? <ErrorCover retrying={retrying} onRetry={retry} /> : null,
    onRules,
  };
  if (state.phase === 'card' || state.phase === 'letters') return <StartScreen {...shared} />;
  if (state.phase === 'lit') return <LitScreen {...shared} />;
  if (state.phase === 'summary') {
    return blastMine(state, me) ? <BlastScreen {...shared} /> : <SummaryScreen {...shared} />;
  }
  return <HaltedScreen {...shared} />;
}

// The round's bomb went off in this person's hands (and they are still in the game).
function blastMine(state: SprengjaState, me: string): boolean {
  const b = state.lastBlast;
  return !!b && b.round === state.round && b.holder === me && !b.gone;
}

function useSettle(roomId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
}

function FootError({ error }: { error: unknown }) {
  return error ? (
    <T v="fine" color={KIT.danger} center>
      {errorMessage(error)}
    </T>
  ) : null;
}

// Tur başı (SprengjaKartKapali, SprengjaBekle, SprengjaDevral, SprengjaHarfGrubu,
// SprengjaDevralFitil): the starter opens the card and lights the fuse; the others wait, and once
// the starter has been idle past startBy may take the start over (the order stays).
function StartScreen({ roomId, state, faces, top, playing, offline, cover }: Shared) {
  const me = faces.me;
  const settle = useSettle(roomId);
  const reveal = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.reveal(roomId, state.round),
    onSettled: settle,
  });
  const light = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.light(roomId, state.round),
    onSettled: settle,
  });
  const takeOver = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.takeOver(roomId, state.round, state.step),
    onSettled: settle,
  });
  const reached = useReached(state.startBy);
  const open = state.phase === 'letters' && !!state.letters;
  const letters = upperTr(state.letters ?? '');
  const mine = state.starter === me;
  const starter = state.starter ? nameOf(faces, state.starter) : '';
  const idle =
    playing &&
    state.startBy !== null &&
    canTakeOver(state, me, reached ? Date.parse(state.startBy) : 0);
  let title: string;
  let note: string;
  let line: string | null = null;
  let peek = WAIT;
  let foot: ReactNode = null;
  if (mine) {
    peek = open ? LETTERS_MINE : OPEN_MINE;
    title = open ? tr.sprengja.groupTitle(letters) : tr.sprengja.openTitle;
    note = open ? tr.sprengja.groupNote : tr.sprengja.openNote;
    line = open ? tr.sprengja.groupMine : null;
    const act = open ? light : reveal;
    foot = (
      <>
        <FootError error={act.error} />
        <Btn
          block
          testID={open ? 'sprengja-light' : 'sprengja-open'}
          label={open ? tr.sprengja.light : tr.sprengja.open}
          icon={open ? 'bomb' : undefined}
          disabled={offline}
          loading={act.isPending}
          onPress={() => act.mutate()}
        />
      </>
    );
  } else if (idle) {
    title = open ? tr.sprengja.idleFuse : tr.sprengja.idleCard;
    note = tr.sprengja.idleNote;
    foot = (
      <>
        <FootError error={takeOver.error} />
        <Btn
          block
          variant="glassy"
          testID="sprengja-take-over"
          label={tr.sprengja.takeOver}
          disabled={offline}
          loading={takeOver.isPending}
          onPress={() => takeOver.mutate()}
        />
      </>
    );
  } else {
    title = open ? tr.sprengja.willLight(starter) : tr.sprengja.willOpen(starter);
    note = open ? tr.sprengja.willLightNote(starter) : tr.sprengja.willOpenNote(starter);
    line = open || !state.starter ? null : tr.sprengja.firstWith(starter);
    if (!state.order.includes(me)) note = tr.sprengja.watcherNote;
  }
  return (
    <PlayPage
      testID={open ? 'sprengja-letters' : 'sprengja-card'}
      top={top}
      title={title}
      note={note}
      foot={foot}
      cover={cover}
    >
      <View
        accessible={!open}
        accessibilityRole={open ? undefined : 'image'}
        accessibilityLabel={open ? undefined : tr.sprengja.cardClosed}
      >
        <Deck
          back={sprengjaArt.back}
          peek={peek}
          top={open ? <CardFace letters={state.letters ?? ''} /> : undefined}
        />
      </View>
      {line ? <MidNote gap={S.deckNoteGap}>{line}</MidNote> : null}
    </PlayPage>
  );
}

// The fuse burns (SprengjaSende, SprengjaBaskasinda, SprengjaGozlemci, SprengjaHalka3/8,
// SprengjaDar8): the ring with the bomb and the throw's arc, the letter-group panel; the holder's
// "<Ad>'a at". No time shows (K-85).
function LitScreen({ roomId, state, faces, top, offline, cover, onRules }: Shared) {
  const me = faces.me;
  const { width } = useWindowDimensions();
  const ring = sprengjaRing(width, state.order.length);
  const settle = useSettle(roomId);
  const pass = useMutation({
    meta: FEEL_ERROR,
    // A late throw: the bomb already went off in this person's hands. The state says so; the
    // answer is not an error to show.
    mutationFn: () =>
      sprengjaApi.pass(roomId, state.round, state.step).catch((err: unknown) => {
        if (err instanceof ApiError && err.code === 'turn_over') return { ok: true as const };
        throw err;
      }),
    onSettled: settle,
  });
  const holder = state.holder;
  const mine = holder === me;
  const next = holder ? nextActive(state.order, state.gone, holder) : null;
  // A watcher, or one who left the game and stays at the table: they watch.
  const watcher = !state.order.includes(me) || state.gone.includes(me);
  const letters = upperTr(state.letters ?? '');
  const seats = ringSeats(state.order, state.gone, me);
  const holderName = holder ? nameOf(faces, holder) : '';
  // The last who left and is still at the table (so it has a name).
  const lastGone = state.gone.filter((s) => faces.people.has(s)).at(-1);
  const until = throwsUntil(state, me);
  const title = mine ? tr.sprengja.withYou : tr.sprengja.withOther(holderName);
  const note = mine
    ? tr.sprengja.withYouNote(letters)
    : watcher
      ? tr.sprengja.watcherNote
      : lastGone
        ? tr.sprengja.skips(nameOf(faces, lastGone))
        : until !== null
          ? tr.sprengja.comesIn(until)
          : tr.sprengja.watcherNote;
  const foot =
    mine && next ? (
      <>
        <FootError error={pass.error} />
        <Btn
          block
          testID="sprengja-pass"
          label={tr.sprengja.throwTo(nameOf(faces, next))}
          icon="bomb"
          disabled={offline}
          loading={pass.isPending}
          onPress={() => pass.mutate()}
        />
      </>
    ) : null;
  return (
    <PlayPage
      testID={mine ? 'sprengja-mine' : 'sprengja-lit'}
      top={top}
      title={title}
      note={note}
      foot={foot}
      cover={cover}
    >
      <Ring faces={faces} seats={seats} ring={ring} holder={holder} next={next} mine={mine} />
      <View style={{ height: ring.panelGap }} />
      <LetterPanel letters={state.letters ?? ''} passes={state.passes} onRules={onRules} />
      {!mine && !watcher && until !== null ? (
        <MidNote gap={S.ringNoteGap}>{tr.sprengja.whenYours}</MidNote>
      ) : null}
    </PlayPage>
  );
}

// Hazırım, or on the last round Sonuçları gör (the same `ready`), beside who is ready.
function ReadyFoot({ roomId, state, faces, playing, offline }: Shared) {
  const settle = useSettle(roomId);
  const ready = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.ready(roomId, state.step),
    onSettled: settle,
  });
  const active = activePlayers(state);
  const mine = state.ready.includes(faces.me);
  const last = state.round >= state.rounds;
  return (
    <>
      <FootError error={ready.error} />
      <View style={{ flexDirection: 'row', gap: R.footGap }}>
        <ReadyChip label={tr.sprengja.readyCount(state.ready.length, active.length)} />
        {playing ? (
          <Btn
            testID="sprengja-ready"
            label={last ? tr.sprengja.results : tr.sprengja.ready}
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

// Patladı (SprengjaPatladi): the bomb went off in this person's hands. The pink flash, the
// explosion, "−1 puan"; no new motion (the owner's decision, 5 Kasım).
function BlastScreen(shared: Shared) {
  const { state, top, cover } = shared;
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const side = Math.min(S.wide.side, width - 2 * KIT.size.side);
  const B = S.boom;
  return (
    <PlayPage
      testID="sprengja-blast"
      top={top}
      under={
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, gradientStyle(S.flash)]} />
      }
      foot={<ReadyFoot {...shared} />}
      cover={cover}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={tr.sprengja.blastLabel}
        style={{
          marginTop: B.top - R.gap,
          width: side,
          height: side,
          alignSelf: 'center',
          borderRadius: B.radius,
          boxShadow: S.ring.shadow,
        }}
      >
        <Image
          source={sprengjaArt.explosion}
          style={[StyleSheet.absoluteFill, { borderRadius: B.radius }]}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={{ marginTop: B.below, alignItems: 'center', gap: B.gap }}>
        <View style={{ transform: [{ rotate: S.stampTurn }] }}>
          <Tag label={tr.sprengja.minusOne} colors={{ bg: colors.buzz, fg: colors.onBuzz }} />
        </View>
        <T v="display" center accessibilityRole="header">
          {tr.sprengja.blastYou}
        </T>
        <T v="fine" center>
          {tr.sprengja.blastLine(upperTr(state.letters ?? ''), state.passes)}
        </T>
      </View>
    </PlayPage>
  );
}

// Tur sonu (SprengjaTurSonu, SprengjaSonTur): the explosion's scene, where the bomb went off, the
// scores with "Bu tur"; Hazırım, on the last round Sonuçları gör.
function SummaryScreen(shared: Shared) {
  const { state, faces, top, cover } = shared;
  const blast = state.lastBlast?.round === state.round ? state.lastBlast : null;
  const rows = scoreRows(state);
  const lost = blast && !blast.gone ? blast.holder : null;
  return (
    <ScenePage
      testID="sprengja-summary"
      scene={<Scene source={sprengjaArt.explosion} height={S.scene.summary} />}
      content={S.scene.summaryContent}
      top={top}
      foot={<ReadyFoot {...shared} />}
      cover={cover}
    >
      <View style={{ alignItems: 'center' }}>
        <T v="fine" center>
          {tr.sprengja.roundOver(state.round, state.rounds, state.passes)}
        </T>
        <T v="display" center accessibilityRole="header">
          {blast && !blast.gone
            ? tr.sprengja.blastAt(nameOf(faces, blast.holder))
            : tr.sprengja.blastLeft}
        </T>
      </View>
      <ScoreTable faces={faces} rows={rows} lose={new Set(lost ? [lost] : [])} thisRound={lost} />
    </ScenePage>
  );
}

// Oyun durdu (SprengjaDurdu): fewer than three left; the ring with those who left greyed, the
// scores kept and no winner; Sonuçları gör ends it (sprengja/advance).
function HaltedScreen({ roomId, state, faces, top, offline, cover }: Shared) {
  const { width } = useWindowDimensions();
  const { c } = useKit();
  const ring = sprengjaRing(width, state.order.length);
  const settle = useSettle(roomId);
  const finish = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.advance(roomId),
    onSettled: settle,
  });
  const H = S.halted;
  return (
    <PlayPage
      testID="sprengja-halted"
      top={top}
      title={tr.sprengja.haltedTitle}
      note={tr.sprengja.haltedNote(activePlayers(state).length)}
      cover={cover}
      foot={
        <>
          <FootError error={finish.error} />
          <Btn
            block
            testID="sprengja-finish"
            label={tr.sprengja.results}
            disabled={offline}
            loading={finish.isPending}
            onPress={() => finish.mutate()}
          />
        </>
      }
    >
      <Ring
        faces={faces}
        seats={ringSeats(state.order, state.gone, faces.me)}
        ring={ring}
        holder={null}
        next={null}
        mine={false}
      />
      <View style={{ height: ring.panelGap }} />
      <Glass radius={H.radius} style={{ paddingVertical: H.padY, paddingHorizontal: H.padX }}>
        <Text maxFontSizeMultiplier={1.3} style={[ST.note, { color: c.ink }]}>
          {tr.sprengja.haltedKeep}
        </Text>
      </Glass>
    </PlayPage>
  );
}

// ------------------------------------------------------------------ Oyuncular

// Oyuncular (SprengjaOyuncular): GameLobby's frame; the throwing order (the owner shuffles it),
// Kelime kuralları, the watchers with "Gözlemci ol", how it plays; the owner's Oyunu başlat for 3
// to 8 players.
function Pregame({
  roomId,
  state,
  faces,
  owner,
  onClose,
  closing,
  closeError,
  onChat,
  onRules,
}: {
  roomId: string;
  state: unknown;
  faces: Faces;
  owner: boolean;
  onClose: () => void;
  closing: boolean;
  closeError: unknown;
  onChat: () => void;
  onRules: () => void;
}) {
  const queryClient = useQueryClient();
  const picks = readPregame(state)?.picks ?? {};
  const everyone = [...faces.people.keys()];
  const watchers = everyone.filter((s) => picks[s] === 'obs');
  const playing = everyone.filter((s) => picks[s] !== 'obs');
  // The page's order: the owner's shuffle, then the rest as they came.
  const shuffled = pregameOrder(state).filter((s) => playing.includes(s));
  const players = [...shuffled, ...playing.filter((s) => !shuffled.includes(s))];
  const watching = picks[faces.me] === 'obs';
  const enough = players.length >= SPRENGJA.minPlayers;
  const fits = players.length <= SPRENGJA.maxPlayers;
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.pick(roomId, watching ? null : 'obs'),
    onSettled: reread,
  });
  const shuffle = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.shuffle(roomId),
    onSuccess: () => haptic('selection'),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => sprengjaApi.start(roomId),
    onSettled: reread,
  });
  const person = (s: string, i?: number): LobbyPerson => ({
    key: s,
    face: <Face faces={faces} sid={s} size={R.person.face} />,
    name: nameOf(faces, s),
    me: s === faces.me,
    mark: i === undefined ? undefined : String(i + 1),
  });
  return (
    <GameLobby
      testID="sprengja-pregame"
      game="sprengja"
      poster={sprengjaArt.poster}
      name={tr.sprengja.name}
      close={{
        label: owner ? tr.sprengja.endGame : tr.sprengja.backToTable,
        onPress: onClose,
        loading: closing,
        testID: 'sprengja-pregame-close',
      }}
      onChat={onChat}
      chips={[
        tr.sprengja.rounds(roundsFor(Math.max(SPRENGJA.minPlayers, players.length))),
        tr.sprengja.hiddenTime,
        tr.sprengja.clockwise,
      ]}
      foot={{
        owner,
        warning: !enough
          ? tr.sprengja.needs(SPRENGJA.minPlayers)
          : !fits
            ? tr.sprengja.tooMany(SPRENGJA.maxPlayers)
            : null,
        error: pick.error ?? shuffle.error ?? start.error ?? closeError,
        start: {
          label: tr.sprengja.start,
          testID: 'sprengja-start',
          loading: start.isPending,
          onPress: () => start.mutate(),
        },
      }}
    >
      <LobbyCard
        title={tr.sprengja.order}
        count={tr.sprengja.orderCount(players.length, watchers.length)}
      >
        <LobbyPeople people={players.map((s, i) => person(s, i))} />
      </LobbyCard>
      <LobbyActions>
        {owner ? (
          <Btn
            sm
            variant="glassy"
            icon="shuffle"
            testID="sprengja-shuffle"
            label={tr.sprengja.shuffle}
            loading={shuffle.isPending}
            onPress={() => shuffle.mutate()}
            style={{ flex: 1 }}
          />
        ) : null}
        <Btn
          sm
          variant="glassy"
          icon="info"
          testID="sprengja-pregame-rules"
          label={tr.sprengja.rules}
          onPress={onRules}
          style={{ flex: 1 }}
        />
      </LobbyActions>
      <LobbyWatchers
        note={tr.sprengja.watchersNote}
        watching={watching}
        loading={pick.isPending}
        onPress={() => pick.mutate()}
        testID="sprengja-watch"
        people={watchers.map((s) => person(s))}
      />
      <LobbyRules text={tr.sprengja.how} />
    </GameLobby>
  );
}

// The owner's shuffled order on the pre-game page (game_state.pregame.order), if any.
function pregameOrder(state: unknown): string[] {
  if (typeof state !== 'object' || state === null) return [];
  const pregame = (state as { pregame?: unknown }).pregame;
  if (typeof pregame !== 'object' || pregame === null) return [];
  const order = (pregame as { order?: unknown }).order;
  return Array.isArray(order) ? order.filter((s): s is string => typeof s === 'string') : [];
}

// ------------------------------------------------------------------ Oyun sonu

// Oyun sonu (SprengjaOyunSonu, SprengjaOrtak2, SprengjaOrtak3, SprengjaEsit) and the abandoned
// game (SprengjaYarida): the table's scene with the winners (or those left), who won and why, the
// scores; Masaya dön, and the owner's Yeniden oyna after a finished game.
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  result: SprengjaResult;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'sprengja', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const me = faces.me;
  const words = endWords(result, me);
  const rows = scoreRows(result);
  const active = result.order.filter((s) => !result.gone.includes(s));
  const winners = result.order.filter((s) => result.winners.includes(s));
  const H = S.hero;
  const name = (sid: string) => (sid === me ? tr.sprengja.you : nameOf(faces, sid));
  let title: string;
  let note: string;
  let tag: string | null;
  let heroes: string[];
  let size: number;
  let overlap: number = H.overlap;
  switch (words.kind) {
    case 'abandoned':
      title = tr.sprengja.abandoned;
      note = tr.sprengja.abandonedNote;
      tag = null;
      heroes = active;
      size = H.many;
      break;
    case 'all':
      title = tr.sprengja.wonAll;
      note = tr.sprengja.noteAll(words.hits);
      tag = tr.sprengja.allEqual;
      heroes = winners;
      size = H.all;
      overlap = H.overlapAll;
      break;
    case 'one':
      title = words.you ? tr.sprengja.wonYou : tr.sprengja.wonOne(nameOf(faces, words.sid));
      note = words.you
        ? tr.sprengja.noteYou(words.hits)
        : tr.sprengja.noteOne(nameOf(faces, words.sid), words.hits);
      tag = tr.sprengja.winner;
      heroes = winners;
      size = H.one;
      break;
    case 'two': {
      const [a, b] = words.others.map((s) => nameOf(faces, s));
      title = words.you ? tr.sprengja.wonTwoYou(a ?? '') : tr.sprengja.wonTwo(a ?? '', b ?? '');
      note = words.you ? tr.sprengja.noteTwoYou(words.hits) : tr.sprengja.noteTwo(words.hits);
      tag = tr.sprengja.winnersTag;
      heroes = winners;
      size = H.two;
      break;
    }
    case 'many': {
      title = tr.sprengja.wonMany(words.winners.length);
      const names = words.winners.map(name);
      note = capitalFirst(tr.sprengja.noteMany(names, words.you));
      tag = tr.sprengja.winnersTag;
      heroes = winners;
      size = H.many;
      break;
    }
  }
  const finished = words.kind !== 'abandoned';
  const scene = (
    <Scene source={sprengjaArt.table} height={S.scene.end}>
      <EndDecor confetti={finished && words.kind !== 'all'} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: H.top, alignItems: 'center' }}>
        {tag ? (
          <View style={{ transform: [{ rotate: S.stampTurn }], marginBottom: H.tagGap }}>
            <Tag label={tag} colors={{ bg: colors.signal, fg: colors.onSignal }} />
          </View>
        ) : null}
        <HeroFaces
          faces={faces}
          sids={heroes}
          size={size}
          overlap={overlap}
          lead={words.kind === 'one'}
        />
      </View>
    </Scene>
  );
  return (
    <ScenePage
      testID="sprengja-end"
      scene={scene}
      content={S.scene.endContent}
      top={
        <GameTopBar
          close={{ label: tr.sprengja.exit, onPress: onBack, testID: 'sprengja-end-close' }}
          right={<ChatRound onPress={onChat} />}
        />
      }
      foot={
        <>
          <FootError error={again.error} />
          <View style={{ flexDirection: 'row', gap: R.footGap }}>
            <Btn
              variant={finished ? 'glassy' : 'primary'}
              testID="sprengja-back"
              label={tr.sprengja.backToTable}
              onPress={onBack}
              style={{ flex: 1 }}
            />
            {owner && finished ? (
              <Btn
                testID="sprengja-again"
                label={tr.sprengja.again}
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
          {finished
            ? tr.sprengja.over(result.rounds)
            : tr.sprengja.abandonedLine(result.round, result.rounds)}
        </T>
        <T v="display" center accessibilityRole="header">
          {title}
        </T>
        <T v="fine" ink center>
          {note}
        </T>
      </View>
      <ScoreTable faces={faces} rows={rows} lose={finished ? mostHit(rows) : new Set()} />
    </ScenePage>
  );
}

// "sen, Deniz ve Ece eşitsiniz": a sentence starts in capitals.
function capitalFirst(s: string): string {
  return s.length > 0 ? upperTr(s.charAt(0)) + s.slice(1) : s;
}
