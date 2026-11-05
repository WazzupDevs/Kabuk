import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GAME_FLOW_REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { readPregame } from '@shared/gameFrame.ts';
import {
  activeSeats,
  KIBRIT,
  type KibritOutcome,
  type KibritPhase,
  type KibritState,
  type KibritView,
  readKibritResult,
  readKibritState,
  roundLimit,
  showsCounts,
} from '@shared/kibrit.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
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
import { Btn, Chip, Glass, T, Tag, useKit } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { ReportModal } from '@/features/chat/ReportModal';
import { StageFit } from '@/features/games/GameStage';
import { useSecondsLeft } from '@/features/games/useSecondsLeft';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, kibritApi, roomsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { KIBRIT as KB, KIBRIT_TYPE as KT, kibritPaperType } from '@/theme/kibrit';
import { krotTimer } from '@/theme/krot';
import { RISO as R, RISO_PANEL_WIDTH } from '@/theme/riso';
import { DarkGameScope, useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import {
  Buddy,
  ChatRound,
  Deck,
  Face,
  type Faces,
  GameTopBar,
  nameOf,
  TimeStrip,
  useRisoDeck,
} from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { Eyebrow, PhasePill, ReadyChip } from '../sahtekar/KrotParts';
import { kibritArt } from './kibritArt';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Kibrit the table shows now: its Oyuncular page, the running game, or the end of the last
// one (until the person goes back to the table). Null: none of them.
export type KibritMode = 'pregame' | 'play' | 'end' | null;

export function kibritMode(room: Room): KibritMode {
  if (room.concept === 'kibrit' && readKibritState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'kibrit') return 'pregame';
  if (readKibritResult(room.game_state)) return 'end';
  return null;
}

// Which buddies peek on which screen (the panels as drawn): the closed deck, the drawn paper.
const NEAR: readonly [RisoBuddy, RisoBuddy] = ['1a80a9', '9c96bd'];
const FAR: readonly [RisoBuddy, RisoBuddy] = ['d2fbb5', 'f280a5'];

// Each phase's whole time (the capsule's stage).
const PHASE_SECONDS: Record<KibritPhase, number> = {
  write: KIBRIT.writeSeconds,
  jar: KIBRIT.jarSeconds,
  draw: KIBRIT.drawSeconds,
  open: KIBRIT.openSeconds,
  vote: KIBRIT.voteSeconds,
  result: KIBRIT.resultSeconds,
};

// What only this phone may know (kibrit/view, rule 3): its own paper while the table writes, its
// own vote while it votes. Kept per step; every answer of write and vote replaces it.
const viewsOf = (roomId: string) => ['kibrit-view', roomId] as const;
const viewKey = (roomId: string, step: number, me: string) =>
  [...viewsOf(roomId), step, me] as const;

// Kibrit at the table (Aura v90, "Kibrit (gizli soru, gizli oy)"; docs/SPEC_V4.md §4.F "Adım
// 4.6.9", K-86): Oyuncular, Soru yaz, the jar, Kâğıt çek, the drawn paper, Gizli oy, Oy verildi,
// Oylar açıldı and the night's papers. It opens in the dark (the canvas's pure black, flat #121614
// glass), the light when the person chose it. A watcher or someone out of it may go back to the
// table (`onHide`).
export function KibritGame({
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
      <KibritScreens room={room} me={me} people={people} profiles={profiles} onHide={onHide} />
    </DarkGameScope>
  );
}

function KibritScreens({
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
  const mode = kibritMode(room);
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
      // Out of the game: its paper and vote are no longer this phone's (rule 3).
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
    const result = readKibritResult(room.game_state);
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
  const state = readKibritState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = activeSeats(state).includes(me);
  const sheet = owner
    ? { title: tr.kibrit.endTitle, body: tr.kibrit.endBody, confirm: tr.kibrit.endGame }
    : playing
      ? { title: tr.kibrit.leaveTitle, body: tr.kibrit.leaveBody, confirm: tr.kibrit.exit }
      : { title: tr.kibrit.watchTitle, body: tr.kibrit.watchBody, confirm: tr.kibrit.backToTable };
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
          testID="kibrit-exit-confirm"
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

// The page of every running screen: the canvas's 20 sides, the top bar under the status bar, the
// foot over the navigation bar (34 from the panel's bottom).
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

// The server's clock: when the phase's time is up any phone moves it on (kibrit/advance,
// idempotent; its failure is not felt); while the phase stays, again every few seconds.
function useAdvance(roomId: string, state: KibritState) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ask = () =>
      void kibritApi
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

// This phone's own paper and vote in the step (kibrit/view), only while it writes or votes and is
// still in the game. `rev` continues from the server's (paperRev, voteRev): the app reopened or
// another phone signed in counts on from there.
function useView(roomId: string, state: KibritState, me: string) {
  const queryClient = useQueryClient();
  const asks =
    (state.phase === 'write' || state.phase === 'vote') && activeSeats(state).includes(me);
  const key = viewKey(roomId, state.step, me);
  const query = useQuery({
    queryKey: key,
    queryFn: () => kibritApi.view(roomId),
    staleTime: Infinity,
    enabled: asks,
  });
  const revs = useRef({ paper: 0, vote: 0 });
  const nextRev = (kind: 'paper' | 'vote') => {
    const kept = kind === 'paper' ? (query.data?.paperRev ?? 0) : (query.data?.voteRev ?? 0);
    const rev = Math.max(revs.current[kind], kept) + 1;
    revs.current[kind] = rev;
    return rev;
  };
  const keep = (view: KibritView) => queryClient.setQueryData(key, view);
  return {
    data: asks ? query.data : undefined,
    ready: asks && query.isSuccess,
    error: asks && query.isError ? query.error : null,
    retry: () => void query.refetch(),
    nextRev,
    keep,
  };
}
type ViewHandle = ReturnType<typeof useView>;

type Shared = {
  roomId: string;
  state: KibritState;
  faces: Faces;
  owner: boolean;
  top: ReactNode;
  active: string[];
  playing: boolean;
  view: ViewHandle;
  // The phase's time: the capsule's stage, the number and what screen readers hear.
  clock: { stage: 'full' | 'half' | 'low'; text: string; label: string; late: boolean };
  // The round on the bar: the one being played, or the one whose result shows.
  round: number;
};

function Play({
  roomId,
  state,
  faces,
  owner,
  onExit,
  onChat,
}: {
  roomId: string;
  state: KibritState;
  faces: Faces;
  owner: boolean;
  onExit: () => void;
  onChat: () => void;
}) {
  useAdvance(roomId, state);
  const me = faces.me;
  const view = useView(roomId, state, me);
  const active = activeSeats(state);
  // The writing's and the vote's time running out is felt once, on every phone (timeUp).
  const was = useRef({ phase: state.phase, endsAt: state.endsAt });
  useEffect(() => {
    const before = was.current;
    if (
      before.phase !== state.phase &&
      (before.phase === 'write' || before.phase === 'vote') &&
      Date.now() >= Date.parse(before.endsAt)
    ) {
      haptic('timeUp');
    }
    was.current = { phase: state.phase, endsAt: state.endsAt };
  }, [state.phase, state.endsAt]);

  const round = state.phase === 'result' ? state.done : state.done + 1;
  const label =
    state.phase === 'write' || state.phase === 'jar'
      ? tr.kibrit.phasePapers
      : tr.games.turn(round, state.rounds);
  const top = (
    <GameTopBar
      close={{
        label: owner ? tr.kibrit.endGame : tr.kibrit.exit,
        onPress: onExit,
        testID: 'kibrit-exit',
      }}
      middle={<PhasePill label={label} />}
      right={<ChatRound onPress={onChat} />}
    />
  );
  const left = useSecondsLeft(Date.parse(state.endsAt));
  const clock = {
    stage: krotTimer(left, PHASE_SECONDS[state.phase]),
    text: String(left),
    label: tr.games.clockLabel(left),
    late: left <= R.lowSeconds,
  };
  const shared: Shared = {
    roomId,
    state,
    faces,
    owner,
    top,
    active,
    playing: active.includes(me),
    view,
    clock,
    round,
  };
  if (state.phase === 'write') return <WriteScreen key={state.step} {...shared} />;
  if (state.phase === 'jar') return <JarScreen {...shared} />;
  if (state.phase === 'draw') return <DrawScreen {...shared} />;
  if (state.phase === 'open') return <OpenScreen {...shared} />;
  if (state.phase === 'vote') return <VoteScreen key={state.step} {...shared} />;
  return <ResultScreen {...shared} />;
}

function Strip({ clock, title, line }: { clock: Shared['clock']; title: string; line: ReactNode }) {
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

function Failed({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={{ gap: SPACING[2] }}>
      <T v="fine" color={KIT.danger} center>
        {error instanceof ApiError && error.code === 'message_invalid'
          ? tr.kibrit.length
          : errorMessage(error)}
      </T>
      {onRetry ? <Btn block variant="glassy" label={tr.common.retry} onPress={onRetry} /> : null}
    </View>
  );
}

// The paper picture as a texture (`background: url(b-kagit) 50% y / 150% auto`): 150 % of the box's
// width, centred across, `y` of the way down what is left over.
function PaperTexture({ y }: { y: number }) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const width = (box?.width ?? 0) * KB.note.textureScale;
  const height = width * KB.paperRatio;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      {box ? (
        <Image
          source={kibritArt.paper}
          style={{
            position: 'absolute',
            width,
            height,
            left: (box.width - width) / 2,
            top: (box.height - height) * y,
          }}
          contentFit="fill"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ Soru yaz

// Soru yaz (KibritSoruYaz, KibritSoruYazAcik): the paper with the question being written, its
// count, "Kâğıdı kavanoza at" right under it and the hint. With the keyboard open the time, the
// field and the button stay on screen; the field grows with the words. Once thrown the jar shows
// (KibritKavanoz), "Kâğıdı değiştir" opens the paper again while the time runs.
function WriteScreen(shared: Shared) {
  const { roomId, state, top, clock, playing, view } = shared;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const write = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (value: string) =>
      kibritApi.write(roomId, state.step, view.nextRev('paper'), value),
    onSuccess: (next) => {
      view.keep(next);
      setEditing(false);
    },
  });
  const written = view.data?.paper ?? null;
  if (!playing || (written !== null && !editing)) {
    return (
      <JarScreen
        {...shared}
        onChange={
          playing
            ? () => {
                setText(written ?? '');
                setEditing(true);
              }
            : undefined
        }
      />
    );
  }
  const send = () => {
    const value = text.trim().replace(/\s+/g, ' ');
    if (value && !write.isPending) write.mutate(value);
  };
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Page testID="kibrit-write">
        <View style={{ gap: SPACING[2.5] }}>
          {top}
          <Strip
            clock={clock}
            title={tr.kibrit.writeTitle}
            line={<T v="fine">{tr.kibrit.writeLine}</T>}
          />
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
            paddingTop: KB.belowStrip,
            paddingBottom: SPACING[1],
          }}
        >
          <NoteField value={text} onChange={setText} onSubmit={send} disabled={!view.ready} />
          <View style={{ marginTop: KB.note.buttonGap, gap: SPACING[2] }}>
            {view.error ? <Failed error={view.error} onRetry={view.retry} /> : null}
            {write.error ? <Failed error={write.error} /> : null}
            <Btn
              block
              testID="kibrit-throw"
              label={tr.kibrit.throw}
              disabled={!view.ready || !text.trim()}
              loading={write.isPending}
              onPress={send}
            />
          </View>
          <View style={{ marginTop: KB.note.hintGap }}>
            <T v="fine" center>
              {tr.kibrit.writeHint}
            </T>
          </View>
        </ScrollView>
      </Page>
    </KeyboardAvoidingView>
  );
}

function NoteField({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const N = KB.note;
  const letters = [...value].length;
  return (
    <View style={{ borderRadius: N.radius, boxShadow: N.shadow }}>
      <View
        style={{
          minHeight: N.minHeight,
          borderRadius: N.radius,
          overflow: 'hidden',
          paddingTop: N.padTop,
          paddingHorizontal: N.padX,
          paddingBottom: N.padBottom,
          gap: N.eyebrowGap,
        }}
      >
        <PaperTexture y={N.textureY} />
        <PaperEyebrow>{tr.kibrit.yourPaper}</PaperEyebrow>
        <TextInput
          testID="kibrit-field"
          accessibilityLabel={tr.kibrit.fieldLabel}
          value={value}
          onChangeText={(v) => onChange(v.replace(/\n/g, ' '))}
          editable={!disabled}
          autoFocus
          multiline
          maxLength={KIBRIT.maxLength}
          returnKeyType="send"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={onSubmit}
          maxFontSizeMultiplier={1.3}
          cursorColor={KB.ink}
          selectionColor={colors.accent}
          style={[KT.field, { color: KB.ink, padding: 0, textAlignVertical: 'top' }]}
        />
        <Text
          accessibilityLabel={tr.kibrit.lettersLabel(letters)}
          maxFontSizeMultiplier={1.3}
          style={[
            KT.count,
            {
              position: 'absolute',
              right: N.countRight,
              bottom: N.countBottom,
              color: KB.inkSoft,
            },
          ]}
        >
          {tr.kibrit.letters(letters)}
        </Text>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: N.radius, borderWidth: N.edge, borderColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

// The paper's own eyebrow: in the paper's ink, faded (`.note .eb`, `.qc .eb`).
function PaperEyebrow({ children, fade = 0.62 }: { children: string; fade?: number }) {
  return (
    <Text maxFontSizeMultiplier={1.3} style={[KT.eyebrow, { color: KB.ink, opacity: fade }]}>
      {upperTr(children)}
    </Text>
  );
}

// ------------------------------------------------------------------ the jar

// Kâğıtlar kavanozda (KibritKavanoz): the jar with how many papers are in it, how many wrote (no
// one's tick, K-86), and "Kâğıdı değiştir" while the time runs. Also the jar's own 3 seconds and a
// watcher's writing time.
function JarScreen({ state, top, clock, active, onChange }: Shared & { onChange?: () => void }) {
  const { width } = useWindowDimensions();
  const J = KB.jar;
  const boxWidth = Math.min(J.width, width - 2 * KIT.size.side);
  const boxHeight = (boxWidth * J.height) / J.width;
  const writing = state.phase === 'write';
  return (
    <Page testID="kibrit-jar">
      <StageFit
        status={
          <>
            {top}
            <Strip
              clock={clock}
              title={writing && onChange ? tr.kibrit.inJar : tr.kibrit.papersInJar}
              line={
                <T v="fine">
                  {writing && onChange
                    ? tr.kibrit.inJarLine
                    : tr.kibrit.wrote(state.written, active.length)}
                </T>
              }
            />
          </>
        }
        actions={
          writing && onChange ? (
            <Btn
              block
              variant="glassy"
              testID="kibrit-change"
              label={tr.kibrit.change}
              onPress={onChange}
            />
          ) : undefined
        }
      >
        <View
          accessible
          accessibilityLabel={tr.kibrit.jarLabel}
          style={{
            width: boxWidth,
            height: boxHeight,
            alignSelf: 'center',
            borderRadius: J.radius,
            boxShadow: J.shadow,
          }}
        >
          <Image
            source={kibritArt.jar}
            style={[StyleSheet.absoluteFill, { borderRadius: J.radius }]}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <DarkPill
            label={tr.kibrit.jarCount(state.written, active.length)}
            height={J.pill.height}
            style={{ position: 'absolute', left: J.pill.inset, top: J.pill.inset }}
            type={KT.jarCount}
            padX={J.pill.padX}
          />
        </View>
        <View style={{ marginTop: J.below - SPACING[2], gap: J.lineGap, alignItems: 'center' }}>
          <T v="fine" ink center>
            {tr.kibrit.wrote(state.written, active.length)}
          </T>
          <T v="fine" center>
            {tr.kibrit.nobodyKnows}
          </T>
        </View>
      </StageFit>
    </Page>
  );
}

// A dark pill over a picture (`.cntb`, `.u span`): rgba(20,16,22,.86), white words.
function DarkPill({
  label,
  height,
  padX,
  type,
  style,
}: {
  label: string;
  height: number;
  padX: number;
  type: object;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          height,
          paddingHorizontal: padX,
          borderRadius: height / 2,
          backgroundColor: KB.pill,
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text maxFontSizeMultiplier={1.3} style={[type, { color: KB.onPill }]}>
        {label}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------ the deck

// The heading over the deck (`.hd` at 110): the title and its line.
function Heading({ title, line }: { title: string; line: string }) {
  return (
    <View style={{ marginTop: KB.belowBar - SPACING[2.5], gap: KB.heading.gap }}>
      <T v="title" accessibilityRole="header">
        {title}
      </T>
      <T v="fine">{line}</T>
    </View>
  );
}

// Kâğıt çek (KibritKagitCek): the closed deck; "Kâğıt çek" only on the drawer's phone, the server
// opens the next paper (or, when the time is up, itself).
function DrawScreen({ roomId, state, faces, top }: Shared) {
  const queryClient = useQueryClient();
  const me = faces.me;
  const mine = state.drawer === me;
  const draw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.draw(roomId, state.step),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const line = mine
    ? tr.kibrit.drawYou(state.papers)
    : tr.kibrit.drawOther(state.papers, state.drawer ? nameOf(faces, state.drawer) : '');
  return (
    <Page testID={mine ? 'kibrit-draw-mine' : 'kibrit-draw'}>
      <StageFit
        status={
          <>
            {top}
            <Heading title={tr.kibrit.shuffled} line={line} />
          </>
        }
        actions={
          mine ? (
            <>
              {draw.error ? <Failed error={draw.error} /> : null}
              <Btn
                block
                testID="kibrit-draw-button"
                label={tr.kibrit.draw}
                loading={draw.isPending}
                onPress={() => draw.mutate()}
              />
            </>
          ) : undefined
        }
      >
        <View accessible accessibilityLabel={tr.kibrit.deckLabel}>
          <Deck back={kibritArt.back} peek={NEAR} />
        </View>
      </StageFit>
    </Page>
  );
}

// The drawn paper's face (`.card.kagit`): the question in the paper's ink, "Yazan: gizli".
function PaperFace({ text }: { text: string }) {
  const d = useRisoDeck();
  const s = d.scale;
  const P = KB.paper;
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: d.card.radius, overflow: 'hidden' }]}>
      <Image
        source={kibritArt.paper}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: P.left * s,
          right: P.right * s,
          top: P.top * s,
          height: P.height * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          testID="kibrit-question"
          accessibilityRole="header"
          numberOfLines={PAPER_LINES}
          adjustsFontSizeToFit
          minimumFontScale={PAPER_MIN_SCALE}
          maxFontSizeMultiplier={1}
          style={[kibritPaperType(s), { color: KB.ink, textAlign: 'center' }]}
        >
          {text}
        </Text>
      </View>
      <DarkPill
        label={tr.kibrit.author}
        height={P.tag.height * s}
        padX={P.tag.padX * s}
        type={KT.paperTag}
        style={{ position: 'absolute', left: P.tag.inset * s, bottom: P.tag.inset * s }}
      />
    </View>
  );
}
// The 146 high box holds five lines of 29; a longer question shrinks into it.
const PAPER_LINES = 5;
const PAPER_MIN_SCALE = 0.6;

// "Bildir" (everyone, every opened paper) and the owner's "Atla" (before the votes open), K-86.
function useReport(roomId: string) {
  const [paper, setPaper] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      safetyApi.reportKibritPaper(roomId, id, reason),
    onSuccess: () => {
      setPaper(null);
      setSent(true);
    },
  });
  const modal = (
    <ReportModal
      visible={paper !== null}
      reasons={REPORT_REASONS}
      pending={report.isPending}
      error={report.error}
      onReport={(reason) => paper && report.mutate({ id: paper, reason })}
      onClose={() => setPaper(null)}
    />
  );
  return { open: (id: string) => setPaper(id), sent, modal };
}
// A paper is no person: "Yanlış cinsiyet beyanı" does not apply.
const REPORT_REASONS = GAME_FLOW_REPORT_REASONS.filter(
  (r): r is ReportReason => r !== 'wrong_gender',
);

function SafetyRow({
  paperId,
  report,
  skip,
}: {
  paperId: string;
  report: ReturnType<typeof useReport>;
  skip?: { onPress: () => void; loading: boolean };
}) {
  return (
    <>
      {report.sent ? (
        <T v="fine" center>
          {tr.safety.reportSent}
        </T>
      ) : null}
      <View style={{ flexDirection: 'row', gap: R.footGap }}>
        <Btn
          sm
          variant="glassy"
          icon="report"
          testID="kibrit-report"
          label={tr.kibrit.report}
          disabled={report.sent}
          onPress={() => report.open(paperId)}
          style={{ flex: 1 }}
        />
        {skip ? (
          <Btn
            sm
            variant="glassy"
            testID="kibrit-skip"
            label={tr.kibrit.skip}
            loading={skip.loading}
            onPress={skip.onPress}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </>
  );
}

// Kâğıt açıldı (KibritKagit): the question on the paper, "Yazan: gizli"; the drawer or the owner
// opens the vote; "Bildir" for everyone, "Atla" for the owner.
function OpenScreen({ roomId, state, faces, owner, top }: Shared) {
  const queryClient = useQueryClient();
  const settle = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const toVote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.toVote(roomId, state.step),
    onSettled: settle,
  });
  const skip = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.skip(roomId, state.step),
    onSettled: settle,
  });
  const report = useReport(roomId);
  const paper = state.paper;
  const opens = owner || state.drawer === faces.me;
  return (
    <Page testID="kibrit-open">
      <StageFit
        status={
          <>
            {top}
            <Heading title={tr.kibrit.drawn} line={tr.kibrit.drawnNote} />
          </>
        }
        actions={
          <>
            {(toVote.error ?? skip.error) ? <Failed error={toVote.error ?? skip.error} /> : null}
            {paper ? (
              <SafetyRow
                paperId={paper.id}
                report={report}
                skip={owner ? { onPress: () => skip.mutate(), loading: skip.isPending } : undefined}
              />
            ) : null}
            {opens ? (
              <Btn
                block
                testID="kibrit-to-vote"
                label={tr.kibrit.toVote}
                loading={toVote.isPending}
                disabled={skip.isPending}
                onPress={() => toVote.mutate()}
              />
            ) : null}
          </>
        }
      >
        <Deck back={kibritArt.back} peek={FAR} top={<PaperFace text={paper?.text ?? ''} />} />
      </StageFit>
      {report.modal}
    </Page>
  );
}

// ------------------------------------------------------------------ the vote

// The question strip over the vote (`.qc`): the paper's texture, "TUR 2/5" and the question.
function QuestionStrip({ round, rounds, text }: { round: number; rounds: number; text: string }) {
  const Q = KB.strip;
  return (
    <View style={{ borderRadius: Q.radius, boxShadow: Q.shadow }}>
      <View
        style={{
          borderRadius: Q.radius,
          overflow: 'hidden',
          paddingVertical: Q.padY,
          paddingHorizontal: Q.padX,
          gap: Q.gap,
        }}
      >
        <PaperTexture y={Q.textureY} />
        <PaperEyebrow fade={KB.inkEyebrow}>{tr.games.turn(round, rounds)}</PaperEyebrow>
        <Text maxFontSizeMultiplier={1.3} style={[KT.stripQuestion, { color: KB.ink }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

// A face ringed in --buzz (`.vt.sel svg`, `.my svg`).
function Ringed({
  faces,
  sid,
  size,
  ring,
  shadow,
}: {
  faces: Faces;
  sid: string;
  size: number;
  ring: number;
  shadow?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: size,
        boxShadow: shadow,
        outlineColor: ring > 0 ? colors.buzz : undefined,
        outlineWidth: ring,
        outlineStyle: 'solid',
      }}
    >
      <Face faces={faces} sid={sid} size={size} />
    </View>
  );
}

// The vote grid (`.vg`): 3 columns of glass tiles, the capsule over the name; the chosen one with
// the --buzz edge, halo, ring and tick.
function VoteGrid({
  faces,
  seats,
  chosen,
  onChoose,
}: {
  faces: Faces;
  seats: string[];
  chosen: string | null;
  onChoose?: (sid: string) => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const V = KB.vote;
  const tileWidth = (width - 2 * KIT.size.side - (V.columns - 1) * V.gap) / V.columns;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: V.gap }}>
      {seats.map((sid) => {
        const on = sid === chosen;
        const name = nameOf(faces, sid);
        return (
          <Pressable
            key={sid}
            testID={`kibrit-vote-${sid}`}
            accessibilityRole="button"
            accessibilityLabel={tr.kibrit.voteFor(name)}
            accessibilityState={{ selected: on, disabled: !onChoose }}
            disabled={!onChoose}
            onPress={() => onChoose?.(sid)}
            style={{ width: tileWidth }}
          >
            <Glass
              radius={V.tile.radius}
              style={{
                minHeight: V.tile.minHeight,
                paddingVertical: V.tile.padY,
                paddingHorizontal: V.tile.padX,
                alignItems: 'center',
                justifyContent: 'center',
                gap: V.tile.gap,
              }}
            >
              <Ringed
                faces={faces}
                sid={sid}
                size={V.face}
                ring={on ? V.ring : 0}
                shadow={on ? undefined : V.faceShadow}
              />
              <Text
                maxFontSizeMultiplier={1.3}
                style={[KT.tileName, { color: colors.text, textAlign: 'center' }]}
              >
                {name}
              </Text>
            </Glass>
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: V.tile.radius,
                  borderWidth: V.tile.edge,
                  borderColor: on ? colors.buzz : 'transparent',
                  outlineColor: on ? V.haloColor : undefined,
                  outlineWidth: on ? V.halo : 0,
                  outlineStyle: 'solid',
                },
              ]}
            />
            {on ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: V.tick.inset,
                  top: V.tick.inset,
                  width: V.tick.size,
                  height: V.tick.size,
                  borderRadius: V.tick.size / 2,
                  backgroundColor: colors.buzz,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CapIcon name="check" size={V.tick.icon} color={colors.onBuzz} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// Gizli oy (KibritOy, KibritOyAcik) and Oy verildi (KibritOyVerildi): one vote among those still in
// the game, oneself too; the vote can change while the time runs. Only the total shows (K-86). A
// vote for someone who left no longer counts: the grid comes back to choose again.
function VoteScreen(shared: Shared) {
  const { roomId, state, faces, top, clock, active, playing, view, round } = shared;
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const mine = view.data?.vote ?? null;
  const lost = mine !== null && !active.includes(mine);
  const [changing, setChanging] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const vote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (target: string) =>
      kibritApi.vote(roomId, state.step, view.nextRev('vote'), target),
    onSuccess: (next) => {
      view.keep(next);
      setChanging(false);
    },
  });
  const report = useReport(roomId);
  const paper = state.paper;
  const question = <QuestionStrip round={round} rounds={state.rounds} text={paper?.text ?? ''} />;
  const count = tr.kibrit.voted(state.voted, active.length);
  const safety = paper ? <SafetyRow paperId={paper.id} report={report} /> : null;
  if (playing && mine !== null && !lost && !changing) {
    return (
      <Page testID="kibrit-voted">
        <StageFit
          status={
            <>
              {top}
              <Strip clock={clock} title={tr.kibrit.sentTitle} line={<T v="fine">{count}</T>} />
            </>
          }
          actions={
            <>
              {safety}
              <Btn
                block
                variant="glassy"
                testID="kibrit-change-vote"
                label={tr.kibrit.changeVote}
                onPress={() => {
                  setSel(mine);
                  setChanging(true);
                }}
              />
            </>
          }
        >
          <View style={{ flexGrow: 1, gap: KB.mine.below - SPACING[2] }}>
            {question}
            <Glass
              radius={KB.mine.radius}
              style={{
                width: Math.min(KB.mine.width, width - 2 * KIT.size.side),
                alignSelf: 'center',
                padding: KB.mine.pad,
                gap: KB.mine.gap,
                alignItems: 'center',
              }}
            >
              <Eyebrow>{tr.kibrit.yourVote}</Eyebrow>
              <Ringed faces={faces} sid={mine} size={KB.mine.face} ring={KB.mine.ring} />
              <MyName>{nameOf(faces, mine)}</MyName>
              <T v="fine" center>
                {tr.kibrit.onlyYou}
              </T>
            </Glass>
            <T v="fine" center>
              {tr.kibrit.opensAtEnd}
            </T>
            <View style={{ flexGrow: 1, minHeight: KB.corner * k }}>
              <Buddy
                buddy={NEAR[0]}
                height={KB.corner * k}
                style={{
                  left: KB.votedBuddy.left - KIT.size.side,
                  bottom: 0,
                  transform: [{ rotate: KB.votedBuddy.turn }],
                }}
              />
            </View>
          </View>
        </StageFit>
        {report.modal}
      </Page>
    );
  }
  const chosen = sel ?? (lost ? null : mine);
  const canChoose = playing && view.ready && !vote.isPending;
  return (
    <Page testID="kibrit-vote">
      <StageFit
        status={
          <>
            {top}
            <Strip
              clock={clock}
              title={tr.kibrit.voteTitle}
              line={<T v="fine">{playing ? tr.kibrit.voteLine : count}</T>}
            />
          </>
        }
        actions={
          <>
            {view.error ? <Failed error={view.error} onRetry={view.retry} /> : null}
            {vote.error ? <Failed error={vote.error} /> : null}
            {safety}
            {playing ? (
              <Btn
                block
                testID="kibrit-vote-submit"
                label={tr.kibrit.give}
                disabled={!chosen || !view.ready || (chosen === mine && !lost)}
                loading={vote.isPending}
                onPress={() => chosen && vote.mutate(chosen)}
              />
            ) : null}
          </>
        }
      >
        <View style={{ flexGrow: 1, gap: KB.vote.below - SPACING[2] }}>
          {question}
          {lost ? (
            <T v="fine" color={KIT.danger} center>
              {tr.kibrit.targetGone}
            </T>
          ) : null}
          <VoteGrid
            faces={faces}
            seats={active}
            chosen={chosen}
            onChoose={
              canChoose
                ? (sid) => {
                    setSel(sid);
                    haptic('selection');
                  }
                : undefined
            }
          />
          <View style={{ flexGrow: 1, minHeight: KB.corner * k }}>
            <Buddy
              buddy={NEAR[1]}
              height={KB.corner * k}
              style={{
                right: KB.voteBuddy.right - KIT.size.side,
                top: 0,
                transform: [{ rotate: KB.voteBuddy.turn }],
              }}
            />
          </View>
        </View>
      </StageFit>
      {report.modal}
    </Page>
  );
}

function MyName({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <Text maxFontSizeMultiplier={1.3} style={[KT.myName, { color: c.ink, textAlign: 'center' }]}>
      {children}
    </Text>
  );
}

// ------------------------------------------------------------------ the result

// The scene over the result and the end (`.scene.ki`, `.scene.kv`): the picture, its top shaded.
function Scene({
  source,
  height,
  y = 0.5,
  children,
}: {
  source: number;
  height: number;
  y?: number;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const sceneTop = insets.top - R.statusBar;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height + sceneTop,
        overflow: 'hidden',
        borderBottomLeftRadius: KB.scene.radius,
        borderBottomRightRadius: KB.scene.radius,
      }}
    >
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ top: `${y * 100}%`, left: '50%' }}
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: KB.scene.shade + sceneTop,
          ...gradientStyle(`linear-gradient(180deg, ${KB.scene.shadeFrom}, transparent)`),
        }}
      />
      {children ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: sceneTop }}>{children}</View>
      ) : null}
    </View>
  );
}

// The page under a scene: the top bar, then the content `content` under the bar's top (the panel's
// `.k-content` with its 12 gaps), the foot at the end.
function ScenePage({
  testID,
  scene,
  content,
  top,
  children,
  foot,
}: {
  testID: string;
  scene: ReactNode;
  content: number;
  top: ReactNode;
  children: ReactNode;
  foot: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      {scene}
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
        {top}
        <View style={{ height: R.barTop + R.statusBar + content - R.barBottom - R.gap }} />
        {children}
        <View style={{ flexGrow: 1 }} />
        {foot}
      </ScrollView>
    </View>
  );
}

// Oylar açıldı (KibritSonuc): the light with who got the most, the round's question, and from five
// players every count with a stick per vote; below five only who got the most (K-86). No one's vote
// shows. Hazır, and the owner's "Sonraki kâğıt"; nothing moves on by itself.
function ResultScreen({ roomId, state, faces, owner, top, active, playing, round }: Shared) {
  const queryClient = useQueryClient();
  const settle = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const ready = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.ready(roomId, state.step),
    onSettled: settle,
  });
  const next = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.next(roomId, state.step),
    onSettled: settle,
  });
  const report = useReport(roomId);
  const result = state.result;
  const topSids = result?.top ?? [];
  const counts = result?.counts;
  const most = counts && topSids[0] ? (counts[topSids[0]] ?? 0) : null;
  const names = topSids.map((s) => nameOf(faces, s));
  const H = KB.hero;
  const scene = (
    <Scene source={kibritArt.light} height={KB.scene.result}>
      {topSids.length > 0 ? (
        <View style={{ marginTop: H.top, alignItems: 'center' }}>
          <View style={{ transform: [{ rotate: H.stampTurn }], marginBottom: H.stampGap }}>
            <BuzzTag label={tr.kibrit.mostVotes} />
          </View>
          <View style={{ flexDirection: 'row', gap: H.apart }}>
            {topSids.map((sid) => (
              <HeroFace key={sid} faces={faces} sid={sid} />
            ))}
          </View>
        </View>
      ) : null}
    </Scene>
  );
  const mineReady = state.ready.includes(faces.me);
  const failed = ready.error ?? next.error;
  return (
    <>
      <ScenePage
        testID="kibrit-result"
        scene={scene}
        content={KB.scene.resultContent}
        top={top}
        foot={
          <>
            {failed ? <Failed error={failed} /> : null}
            {result ? <SafetyRow paperId={result.paperId} report={report} /> : null}
            <View style={{ flexDirection: 'row', gap: R.footGap }}>
              <ReadyChip label={tr.kibrit.readyCount(state.ready.length, active.length)} />
              {owner ? (
                <Btn
                  testID="kibrit-next"
                  label={tr.kibrit.next}
                  loading={next.isPending}
                  onPress={() => next.mutate()}
                  style={{ flex: 1 }}
                />
              ) : playing ? (
                <Btn
                  testID="kibrit-ready"
                  label={tr.kibrit.ready}
                  disabled={mineReady}
                  loading={ready.isPending}
                  onPress={() => ready.mutate()}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </>
        }
      >
        <View style={{ alignItems: 'center' }}>
          <T v="fine" center>
            {tr.kibrit.roundQuestion(round, state.rounds, result?.text ?? '')}
          </T>
          <T v="display" center accessibilityRole="header">
            {names.length > 0 ? tr.kibrit.top(names, most) : tr.kibrit.noVotes}
          </T>
        </View>
        {counts ? <CountTable faces={faces} seats={active} counts={counts} /> : null}
        <View style={{ gap: SPACING[1] }}>
          {result ? (
            <T v="fine" center>
              {tr.kibrit.turnout(result.voters, result.players)}
            </T>
          ) : null}
          <T v="fine" center>
            {tr.kibrit.hidden}
          </T>
        </View>
      </ScenePage>
      {report.modal}
    </>
  );
}

function BuzzTag({ label }: { label: string }) {
  const { colors } = useTheme();
  return <Tag label={label} colors={{ bg: colors.buzz, fg: colors.onBuzz }} />;
}

function HeroFace({ faces, sid }: { faces: Faces; sid: string }) {
  const { colors } = useTheme();
  const H = KB.hero;
  return (
    <View
      style={{
        borderRadius: H.face,
        borderWidth: H.ring,
        borderColor: colors.buzz,
        outlineColor: H.haloColor,
        outlineWidth: H.halo,
        outlineStyle: 'solid',
        boxShadow: H.shadow,
      }}
    >
      <Face faces={faces} sid={sid} size={H.face} />
    </View>
  );
}

// The counts (`.tbl`): every player still in the game, most votes first, a stick per vote; the
// leaders' counts in --buzz.
function CountTable({
  faces,
  seats,
  counts,
}: {
  faces: Faces;
  seats: string[];
  counts: Record<string, number>;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const T_ = KB.table;
  const rows = [...seats].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
  const most = Math.max(0, ...rows.map((s) => counts[s] ?? 0));
  return (
    <Glass radius={T_.radius} style={{ paddingVertical: T_.padY, paddingHorizontal: T_.padX }}>
      {rows.map((sid, i) => {
        const n = counts[sid] ?? 0;
        return (
          <View
            key={sid}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: T_.rowGap,
              paddingVertical: T_.rowPadY,
              borderTopWidth: i === 0 ? 0 : KIT.size.hair,
              borderTopColor: c.hair,
            }}
          >
            <Face faces={faces} sid={sid} size={T_.face} />
            <Text
              maxFontSizeMultiplier={1.3}
              style={[KT.row, { color: c.ink, flex: 1, flexShrink: 1 }]}
            >
              {nameOf(faces, sid)}
            </Text>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                maxWidth: T_.stick.maxWidth,
              }}
            >
              {Array.from({ length: n }, (_, j) => (
                <Image
                  key={j}
                  source={kibritArt.stick}
                  style={{
                    width: T_.stick.width,
                    height: T_.stick.height,
                    marginLeft: -T_.stick.overlap,
                  }}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
              ))}
            </View>
            <Text
              accessibilityLabel={tr.kibrit.votesLabel(n)}
              maxFontSizeMultiplier={1.3}
              style={[
                KT.rowCount,
                {
                  minWidth: T_.countWidth,
                  textAlign: 'right',
                  color: most > 0 && n === most ? colors.buzz : c.ink,
                },
              ]}
            >
              {n}
            </Text>
          </View>
        );
      })}
    </Glass>
  );
}

// ------------------------------------------------------------------ Oyuncular

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
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const picks = readPregame(state)?.picks ?? {};
  const everyone = [...faces.people.keys()];
  const watchers = everyone.filter((s) => picks[s] === 'obs');
  const players = everyone.filter((s) => picks[s] !== 'obs');
  const watching = picks[faces.me] === 'obs';
  const enough = players.length >= KIBRIT.minPlayers;
  // The round chip: min(5, players) unless the owner chose; never more than the players.
  const [chosen, setChosen] = useState<number | null>(null);
  const rounds = roundLimit(players.length, chosen);
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.pick(roomId, watching ? null : 'obs'),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => kibritApi.start(roomId, rounds),
    onSettled: reread,
  });
  const failed = pick.error ?? start.error ?? closeError;
  const people = (sids: string[], numbered: boolean) =>
    sids.length > 0 ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {sids.map((s, i) => (
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
            {numbered ? (
              <Text
                maxFontSizeMultiplier={1.3}
                style={[KT.seatNo, { color: c.ink, minWidth: SEAT_NO, textAlign: 'center' }]}
              >
                {i + 1}
              </Text>
            ) : null}
            <Face faces={faces} sid={s} size={R.person.face} />
            <T v="fine" strong ink>
              {nameOf(faces, s)}
            </T>
          </View>
        ))}
      </View>
    ) : null;
  const B = KB.pregameBuddy;
  return (
    <View testID="kibrit-pregame" style={{ flex: 1 }}>
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
            label: owner ? tr.kibrit.endGame : tr.kibrit.backToTable,
            onPress: onClose,
            loading: closing,
            testID: 'kibrit-pregame-close',
          }}
          right={<ChatRound onPress={onChat} />}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.poster.gap }}>
          <Image
            source={kibritArt.poster}
            style={{
              width: R.poster.width,
              height: R.poster.height,
              borderRadius: R.poster.radius,
            }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1 }}>
            <T v="title">{tr.kibrit.name}</T>
            <T v="fine">{tr.kibrit.players}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip
            testID="kibrit-rounds"
            label={tr.kibrit.rounds(rounds)}
            accessibilityLabel={
              owner ? tr.kibrit.roundsLabel(rounds, Math.max(1, players.length)) : undefined
            }
            onPress={
              owner && players.length > 1
                ? () => {
                    setChosen(rounds >= players.length ? 1 : rounds + 1);
                    haptic('selection');
                  }
                : undefined
            }
          />
          <Chip label={tr.kibrit.writeChip} />
          <Chip label={tr.kibrit.voteChip} />
        </View>
        <Glass radius={R.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.box.gap }}>
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.kibrit.players}</T>
            </View>
            <T v="fine">{tr.kibrit.count(players.length)}</T>
          </View>
          {people(players, true)}
        </Glass>
        <Glass radius={R.box.radius} style={boxStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.box.gap }}>
            <CapIcon name="eye" color={c.ink} />
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.kibrit.watchers}</T>
              <T v="fine">{tr.kibrit.watchersNote}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="kibrit-watch"
              label={watching ? tr.kibrit.play : tr.kibrit.watch}
              loading={pick.isPending}
              onPress={() => pick.mutate()}
            />
          </View>
          {people(watchers, false)}
        </Glass>
        <Glass radius={R.box.radius} style={boxStyle}>
          <T v="fine" ink>
            {tr.kibrit.how}
          </T>
        </Glass>
        <View style={{ flexGrow: 1, minHeight: KB.corner * k - B.below }}>
          <Buddy
            buddy={FAR[0]}
            height={KB.corner * k}
            style={{ right: B.right, bottom: -B.below, transform: [{ rotate: B.turn }] }}
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
            ? tr.kibrit.hintGuest
            : enough
              ? tr.kibrit.hintOwner
              : tr.kibrit.needs(KIBRIT.minPlayers)}
        </T>
        {owner ? (
          <Btn
            block
            testID="kibrit-start"
            label={tr.kibrit.start}
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
const SEAT_NO = 14;

// ------------------------------------------------------------------ Oyun sonu

// Oyun sonu (KibritOyunSonu): the jar, "Gecenin kâğıtları" with each finished round's question and
// who got the most (from five players with the count). No points, no winner; Masaya dön for
// everyone, Yeniden oyna for the owner.
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
  onChat,
}: {
  roomId: string;
  result: KibritOutcome;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const { c } = useKit();
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'kibrit', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const T_ = KB.table;
  const counted = showsCounts(result.players);
  return (
    <ScenePage
      testID="kibrit-end"
      scene={<Scene source={kibritArt.jar} height={KB.scene.end} y={KB.scene.endY} />}
      content={KB.scene.endContent}
      top={
        <GameTopBar
          close={{ label: tr.kibrit.exit, onPress: onBack, testID: 'kibrit-end-close' }}
          right={<ChatRound onPress={onChat} />}
        />
      }
      foot={
        <>
          {again.error ? (
            <T v="fine" color={KIT.danger} center>
              {errorMessage(again.error)}
            </T>
          ) : null}
          <View style={{ flexDirection: 'row', gap: R.footGap }}>
            <Btn
              variant="glassy"
              testID="kibrit-back"
              label={tr.kibrit.backToTable}
              onPress={onBack}
              style={{ flex: 1 }}
            />
            {owner ? (
              <Btn
                testID="kibrit-again"
                label={tr.kibrit.again}
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
          {result.notEnough ? tr.kibrit.notEnoughNote : tr.kibrit.over(result.past.length)}
        </T>
        <T v="display" center accessibilityRole="header">
          {result.notEnough ? tr.kibrit.notEnough : tr.kibrit.night}
        </T>
      </View>
      {result.past.length > 0 ? (
        <Glass radius={T_.radius} style={{ paddingVertical: T_.padY, paddingHorizontal: T_.padX }}>
          {result.past.map((p, i) => (
            <View
              key={p.paperId || i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: T_.rowGap,
                paddingVertical: T_.pastPadY,
                borderTopWidth: i === 0 ? 0 : KIT.size.hair,
                borderTopColor: c.hair,
              }}
            >
              <Text
                maxFontSizeMultiplier={1.3}
                style={[KT.pastQuestion, { color: c.ink, flex: 1, minWidth: 0 }]}
              >
                {p.text}
              </Text>
              {p.top.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: T_.pastGap }}>
                  {p.top.map((sid) => (
                    <Face key={sid} faces={faces} sid={sid} size={T_.pastFace} />
                  ))}
                  <Text maxFontSizeMultiplier={1.3} style={[KT.pastWho, { color: c.ink }]}>
                    {tr.kibrit.pastWho(
                      p.top.map((s) => nameOf(faces, s)),
                      counted ? p.votes : null,
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </Glass>
      ) : null}
    </ScenePage>
  );
}
